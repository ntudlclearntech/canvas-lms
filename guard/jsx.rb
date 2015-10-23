require 'guard'
require 'guard/guard'

module Guard
  class JSX < Guard

    def initialize(watchers=[], options={})
      super([::Guard::Watcher.new(/(app\/jsx\/.*)/)], {})
    end

    def run_on_change(paths)
      # naive right now, will be better when we rework the front-end build
      run_all
    end

    def run_all
      ::Guard::UI.info "Compiling JSX"
      source = 'app/jsx'
      dest = 'public/javascripts/jsx'
      `node_modules/.bin/babel #{source} --out-dir #{dest} --source-maps inline`
    end

  end
end

