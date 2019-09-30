#
# Copyright (C) 2013 - present Instructure, Inc.
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

module FeatureFlags
  def self.included(base)
    base.has_many :feature_flags, as: :context, dependent: :destroy
  end

  def feature_enabled?(feature)
    flag = lookup_feature_flag(feature)
    return flag.enabled? if flag
    false
  end

  def feature_allowed?(feature, exclude_enabled: false)
    flag = lookup_feature_flag(feature)
    return false unless flag
    exclude_enabled ? flag.allowed? : flag.enabled? || flag.allowed?
  end

  def set_feature_flag!(feature, state)
    feature = feature.to_s
    flag = self.feature_flags.where(feature: feature).first
    flag ||= self.feature_flags.build(feature: feature)
    flag.state = state
    @feature_flag_cache ||= {}
    @feature_flag_cache[feature] = flag
    flag.save!
  end

  def allow_feature!(feature)
    set_feature_flag!(feature, 'allowed')
  end

  def enable_feature!(feature)
    set_feature_flag!(feature, 'on')
  end

  def disable_feature!(feature)
    set_feature_flag!(feature, 'off')
  end

  def reset_feature!(feature)
    self.feature_flags.where(feature: feature.to_s).destroy_all
  end

  def feature_flag_cache_key(feature)
    ['feature_flag3', self.class.name, self.global_id, feature.to_s].cache_key
  end

  def feature_flag_cache
    Rails.cache
  end

  # return the feature flag for the given feature that is defined on this object, if any.
  # (helper method.  use lookup_feature_flag to test policy.)
  def feature_flag(feature, skip_cache: false)
    return nil unless self.id

    self.shard.activate do
      if self.feature_flags.loaded?
        self.feature_flags.detect{|ff| ff.feature == feature.to_s}
      elsif skip_cache
        self.feature_flags.where(feature: feature.to_s).first
      else
        result = RequestCache.cache("feature_flag", self, feature) do
          feature_flag_cache.fetch(feature_flag_cache_key(feature)) do
            # keep have the context association unloaded in case we can't marshal it
            FeatureFlag.where(feature: feature.to_s).polymorphic_where(:context => self).first
          end
        end
        result.context = self if result
        result
      end
    end
  end

  # each account that needs to be searched for a feature flag, in priority order,
  # starting with site admin
  def feature_flag_account_ids
    return [Account.site_admin.global_id] if is_a?(User)

    RequestCache.cache('feature_flag_account_ids', self) do
      shard.activate do
        Rails.cache.fetch(['feature_flag_account_ids', self].cache_key) do
          chain = account_chain(include_site_admin: true)
          chain.shift if is_a?(Account)
          chain.reverse.map(&:global_id)
        end
      end
    end
  end

  # find the feature flag setting that applies to this object
  # it may be defined on the object or inherited
  def lookup_feature_flag(feature, override_hidden: false, skip_cache: false)
    feature = feature.to_s
    feature_def = Feature.definitions[feature]
    raise "no such feature - #{feature}" unless feature_def
    return nil unless feature_def.applies_to_object(self)

    return nil if feature_def.visible_on.is_a?(Proc) && !feature_def.visible_on.call(self)
    return feature_def unless feature_def.allowed? || feature_def.hidden?

    is_root_account = self.is_a?(Account) && self.root_account?
    is_site_admin = self.is_a?(Account) && self.site_admin?

    # inherit the feature definition as a default unless it's a hidden feature
    retval = feature_def.clone_for_cache unless feature_def.hidden? && !is_site_admin && !override_hidden

    @feature_flag_cache ||= {}
    return @feature_flag_cache[feature] if @feature_flag_cache.key?(feature)

    # find the highest flag that doesn't allow override,
    # or the most specific flag otherwise
    accounts = feature_flag_account_ids.map do |id|
      account = Account.new
      account.id = id
      account.shard = Shard.shard_for(id, self.shard)
      account.readonly!
      account
    end
    (accounts + [self]).each do |context|
      flag = context.feature_flag(feature, skip_cache: skip_cache)
      next unless flag
      retval = flag
      break unless flag.allowed?
    end

    # if this feature requires root account opt-in, reject a default or site admin flag
    # if the context is beneath a root account
    if retval && (retval.allowed? || retval.hidden?) && feature_def.root_opt_in && !is_site_admin &&
        (retval.default? || retval.context_type == 'Account' && retval.context_id == Account.site_admin.id)
      if is_root_account
        # create a virtual feature flag in "off" state
        retval = self.feature_flags.temp_record feature: feature, state: 'off' unless retval.hidden?
      else
        # the feature doesn't exist beneath the root account until the root account opts in
        return @feature_flag_cache[feature] = nil
      end
    end

    @feature_flag_cache[feature] = retval
  end
end

