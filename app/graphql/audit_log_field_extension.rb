#
# Copyright (C) 2019 - present Instructure, Inc.
#
# This file is part of Canvas.
#
# Canvas is free software: you can redistribute it and/or modify it under
# the terms of the GNU Affero General Public License as published by the Free
# Software Foundation, version 3 of the License.
#
# Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
# details.
#
# You should have received a copy of the GNU Affero General Public License along
# with this program. If not, see <http://www.gnu.org/licenses/>.
#

class AuditLogFieldExtension < GraphQL::Schema::FieldExtension
  class Logger
    def initialize(mutation, context, arguments)
      @mutation = mutation
      @context = context
      @params = filter_arguments(arguments)

      @dynamo = Canvas::DynamoDB::DatabaseBuilder.from_config(:auditors)
      @sequence = 0
      @timestamp = Time.now.iso8601
      @ttl = 90.days.from_now.to_i
    end

    def log(entry, field_name)
      @dynamo.put_item(
        table_name: "graphql_mutations",
        item: {
          # TODO: this is where you redirect
          "object_id" => log_entry_id(entry, field_name),
          "mutation_id" => mutation_id,
          "expires" => @ttl,
          "mutation_name" => @mutation.graphql_name,
          "current_user_id" => @context[:current_user]&.global_id&.to_s,
          "real_current_user_id" => @context[:real_current_user]&.global_id&.to_s,
          "params" => @params,
        },
        return_consumed_capacity: "TOTAL"
      )
    rescue Aws::DynamoDB::Errors::ServiceError => e
      Rails.logger.error "Couldn't log mutation: #{e}"
    end

    def log_entry_id(entry, field_name)
      override_entry_method = :"#{field_name}_log_entry"
      entry = @mutation.send(override_entry_method, entry) if @mutation.respond_to?(override_entry_method)
      entry.global_asset_string
    end

    # TODO: i need the timestamp in this column for ordering, and
    # the request_id and sequence to guarantee uniqueness...
    # should i also break the request_id / timestamp out into
    # their own attributes?
    def mutation_id
      "#{@timestamp}-#{@context[:request_id]}-##{@sequence += 1}"
    end

    private

    def filter_arguments(arguments)
      ActionDispatch::Http::ParameterFilter.new(Rails.application.config.filter_parameters).filter(arguments[:input].to_h)
    end
  end

  def self.enabled?
    Canvas::DynamoDB::DatabaseBuilder.configured?(:auditors)
  end

  def resolve(object:, arguments:, context:, **rest)
    yield(object, arguments).tap do |value|
      next unless AuditLogFieldExtension.enabled?

      mutation = field.mutation

      logger = Logger.new(mutation, context, arguments)

      # TODO? I make a log entry all the fields of the mutation, but maybe I
      # should make them on the arguments too???
      mutation.fields.each do |_, return_field|
        next if return_field.original_name == :errors
        if entry = value[return_field.original_name]
          # technically we could be returning lists of lists but gosh dang i
          # hope we never do that
          if entry.respond_to?(:each)
            entry.each do |e|
              logger.log(e, return_field.original_name)
            end
          else
            logger.log(entry, return_field.original_name)
          end
        end
      end
    end
  end
end
