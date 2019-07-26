#
# Copyright (C) 2018 - present Instructure, Inc.
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

require_relative "../../spec_helper"
require_relative "../graphql_spec_helper"

describe Types::MutationLogType do
  before do
    if !AuditLogFieldExtension.enabled?
      skip("AuditLog needs to be enabled by configuring dynamodb.yml")
    end
  end

  before(:once) do
    student_in_course(active_all: true)
    @assignment = @course.assignments.create! name: "asdf"
    account_admin_user
    @asset_string = @assignment.asset_string

    make_log_entry(current_user: @teacher)
    make_log_entry(current_user: @teacher, real_current_user: @admin)
  end

  def make_log_entry(ctx = {})
    ctx = {
      request_id: SecureRandom.uuid,
      current_user: @teacher,
    }.merge(ctx)

    CanvasSchema.execute(<<~MUTATION, context: ctx)
      mutation {
        updateAssignment(input: {id: "#{@assignment.id}"}) {
          assignment { name }
        }
      }
    MUTATION
  end

  def audit_log_query(variables, ctx = {})
    CanvasSchema.execute(<<~GQL, context: ctx.reverse_merge(domain_root_account: Account.default))
      query {
        auditLogs {
          mutationLogs(
            #{variables.map { |arg, val| "#{arg}: #{val.inspect}" }.join(", ") }
          ) {
            nodes {
              assetString
              mutationId
              user { _id }
              realUser { _id }
              params
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    GQL
  end

  it "requires permission" do
    expect(
      audit_log_query({assetString: @asset_string}, current_user: @teacher).
      dig("data", "auditLogs", "mutationLogs", "nodes")
    ).to be_nil
  end

  it "works" do
    result = audit_log_query({assetString: @asset_string}, current_user: @admin).
      dig("data", "auditLogs", "mutationLogs", "nodes", 0)
    expect(result["assetString"]).to eq @asset_string
    expect(result["user"]["_id"]).to eq @teacher.id.to_s
    expect(result["params"]).to eq("id" => @assignment.id.to_s)
  end

  it "logs the real user id when masquerading" do
    result = audit_log_query({assetString: @asset_string}, current_user: @admin).
      dig("data", "auditLogs", "mutationLogs", "nodes", 0)

    expect(result["user"]["_id"]).to eq @teacher.id.to_s
    expect(result["realUser"]["_id"]).to eq @admin.id.to_s
  end

  it "paginates" do
    result = audit_log_query({assetString: @asset_string, first: 1}, current_user: @admin).
      dig("data", "auditLogs", "mutationLogs")

    cursor = result.dig("pageInfo", "endCursor")
    expect(result.dig("pageInfo", "hasNextPage")).to eq true

    result = audit_log_query({assetString: @asset_string, after: cursor}, current_user: @admin).
      dig("data", "auditLogs", "mutationLogs")
    expect(result.dig("pageInfo", "hasNextPage")).to eq false
    expect(result.dig("nodes").size).to eq 1
  end
end
