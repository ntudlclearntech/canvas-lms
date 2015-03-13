require 'live_events'
require 'thread'

RSpec.configure do |config|
  config.treat_symbols_as_metadata_keys_with_true_values = true
  config.run_all_when_everything_filtered = true
  config.filter_run :focus
  config.color = true
  config.order = 'random'
  config.mock_framework = :mocha
end

Thread.abort_on_exception = true

require 'mocha'
