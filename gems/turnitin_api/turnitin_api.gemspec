# frozen_string_literal: true

require_relative 'lib/turnitin_api/version'

Gem::Specification.new do |spec|
  spec.name          = "turnitin_api"
  spec.version       = TurnitinApi::VERSION
  spec.authors       = ["Brad Horrocks"]
  spec.email         = ["bhorrocks@instructure.com"]
  spec.summary       = %q{Turnitin integration at your fingertips}
  spec.license       = "MIT"

  spec.files         = Dir['{lib}/**/*'] + ['LICENSE.txt', 'README.md', 'Changelog.txt']
  spec.bindir        = "exe"
  spec.executables   = spec.files.grep(%r{^exe/}) { |f| File.basename(f) }
  spec.require_paths = ["lib"]

  spec.add_dependency 'faraday', '~> 0.17.3'
  spec.add_dependency 'faraday_middleware', '~> 0.8'
  spec.add_dependency 'simple_oauth', '~> 0.3'

  spec.add_development_dependency "bundler", "~> 2.2"
  spec.add_development_dependency "rake", "~> 10.0"
  spec.add_development_dependency "rspec", "~> 3.5.0"
  spec.add_development_dependency 'webmock', '~> 3.0'
end
