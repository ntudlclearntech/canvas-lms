#
# Copyright (C) 2014 - present Instructure, Inc.
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

require 'adheres_to_policy'

ActiveRecord::Base.singleton_class.include(AdheresToPolicy::ClassMethods)

module ShardAwarePermissionCacheKey
  # Override the adheres_to_policy permission_cache_key for to make it shard aware.
  def permission_cache_key(user, session, right)
    Shard.default.activate { super }
  end

  def clear_permissions_cache(user, session = nil)
    PartitionRedis.activate_per_cluster do
      super
    end
  end
end
AdheresToPolicy::InstanceMethods.prepend(ShardAwarePermissionCacheKey)

module PerClusterPolicyCaching
  def read(key, use_rails_cache: true)
    PartitionRedis.activate_per_cluster do
      super
    end
  end

  def write(key, value, use_rails_cache: true)
    PartitionRedis.activate_per_cluster do
      super
    end
  end
end
AdheresToPolicy::Cache.singleton_class.prepend(PerClusterPolicyCaching)

AdheresToPolicy.configure do |config|
  config.blacklist = -> {
    Setting.get('permissions_cache_blacklist', '').split(',').map(&:strip)
  }

  config.cache_related_permissions = -> {
    Canvas::Plugin.value_to_boolean(Setting.get('permissions_cache_related', 'true'))
  }

  config.cache_intermediate_permissions = -> {
    Canvas::Plugin.value_to_boolean(Setting.get('permissions_cache_intermediate', 'true'))
  }

  config.cache_permissions = -> {
    Canvas::Plugin.value_to_boolean(Setting.get('permissions_cache_enabled', 'true'))
  }
end
