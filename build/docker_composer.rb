require "yaml"
require "fileutils"
require "English"

Thread.abort_on_exception = true

ENV["RAILS_ENV"] = "test"
DEFAULT_COMPOSE_PROJECT_NAME = "canvas"
ENV["COMPOSE_PROJECT_NAME"] ||= DEFAULT_COMPOSE_PROJECT_NAME
ENV["PGVERSION"] ||= "9.5"
ENV["BASE_DOCKER_VOLUME_ARCHIVE"] ||= ""
# max of any build type
ENV["MASTER_RUNNERS"] = "6" if ENV["PUBLISH_DOCKER_ARTIFACTS"]
ENV["PREPARE_TEST_DATABASE"] ||= "1"

DOCKER_CACHE_S3_BUCKET = ENV.fetch("DOCKER_CACHE_S3_BUCKET")
DOCKER_CACHE_S3_REGION = ENV.fetch("DOCKER_CACHE_S3_REGION")

if ENV["VERBOSE"] != "1"
  $stderr = STDERR.clone
  STDOUT.reopen "/dev/null"
  STDERR.reopen "/dev/null"
end

class DockerComposer
  class << self
    # :cry: not the same as canvas docker-compose ... yet
    COMPOSE_DIR = File.dirname(__FILE__)
    RUNNER_IDS = ENV['MASTER_RUNNERS'].to_i.times.map { |i| i == 0 ? "" : i + 1 }
    KEYSPACES = YAML.load_file("config/cassandra.yml")["test"].keys
    SERVICES = YAML.load_file(COMPOSE_DIR + "/docker-compose.yml")["services"]

    def run
      nuke_old_crap
      pull_cached_images
      create_databases
      migrate if run_migrations?
      push_artifacts if push_artifacts?

      dump_structure if ENV["DUMP_STRUCTURE"]
    ensure
      nuke_old_crap if ENV["COMPOSE_PROJECT_NAME"] != DEFAULT_COMPOSE_PROJECT_NAME
    end

    def nuke_old_crap
      docker_compose "kill"
      docker_compose "rm -fv"
      docker "volume rm $(docker volume ls -q | grep #{ENV["COMPOSE_PROJECT_NAME"]}_) || :"
    end

    def pull_cached_images
      return if File.exist?("/tmp/.canvas_pulled_built_images")
      pull_simple_images
      pull_built_images
      FileUtils.touch "/tmp/.canvas_pulled_built_images"
    end

    def pull_simple_images
      puts "Pulling simple images..."
      simple_services.each do |key|
        docker "pull #{SERVICES[key]["image"]}"
      end
    end

    # port of dockerBase image caching
    def pull_built_images
      puts "Pulling built images..."
      built_services.each do |key|
        path = "s3://#{DOCKER_CACHE_S3_BUCKET}/canvas-lms/canvas_#{key}-ci.tar"
        system "aws s3 cp --only-show-errors --region #{DOCKER_CACHE_S3_REGION} #{path} - | docker load || :"
      end
    end

    # port of dockerBase image caching
    def push_built_images
      puts "Pushing built images..."
      built_services.each do |key|
        name = "canvas_#{key}"
        path = "s3://#{DOCKER_CACHE_S3_BUCKET}/canvas-lms/canvas_#{key}-ci.tar"
        system "docker save #{name} $(docker history -q #{name} | grep -v missing) | aws s3 cp --only-show-errors --region #{DOCKER_CACHE_S3_REGION} - #{path}"
      end
    end

    # e.g. postgres
    def built_services
      SERVICES.keys.select { |key| SERVICES[key]["build"] }
    end

    # e.g. redis
    def simple_services
      SERVICES.keys - built_services
    end

    def create_databases
      docker_compose "build"
      prepare_volumes
      start_services
      db_prepare unless using_snapshot? # already set up, just need to migrate
    end

    def dump_structure
      dump_file = "/tmp/#{ENV["COMPOSE_PROJECT_NAME"]}_structure.sql"
      File.delete dump_file if File.exist?(dump_file)
      FileUtils.touch dump_file
      docker "exec -i #{ENV["COMPOSE_PROJECT_NAME"]}_postgres_1 pg_dump -s -x -O -U postgres -n public canvas_test_ > #{dump_file}"
    end

    # data_loader will fetch postgres + cassandra volumes from s3, if
    # there are any (BASE_DOCKER_VOLUME_ARCHIVE), so that the db is all
    # migrated and ready to go
    def prepare_volumes
      docker_compose_up "data_loader"
      wait_for "data_loader"
    end

    def db_prepare
      # pg db setup happens in create-dbs.sh (when we docker-compose up),
      # but cassandra doesn't have a similar hook
      cassandra_setup
    end

    def cassandra_setup
      puts "Creating keyspaces..."
      docker "exec -i #{ENV["COMPOSE_PROJECT_NAME"]}_cassandra_1 /create-keyspaces #{KEYSPACES.join(" ")}"
    end

    # each service defines its own /wait-for-it
    def wait_for(service)
      docker "exec -i #{ENV["COMPOSE_PROJECT_NAME"]}_#{service}_1 /wait-for-it"
    end

    def docker_compose_up(services = nil)
      docker_compose "up -d #{services} && docker ps"
    end

    def wait_for_services
      %w[cassandra postgres].map { |service|
        Thread.new { wait_for service }
      }.each(&:join)
    end

    def stop_services
      docker_compose "stop postgres cassandra && docker ps"
    end

    def start_services
      puts "Starting all services..."
      docker_compose_up
      wait_for_services
    end

    def migrate
      puts "Running migrations..."

      tasks = []
      tasks << "ci:disable_structure_dump"
      tasks << "db:migrate"
      tasks << "ci:prepare_test_shards" if ENV["PREPARE_TEST_DATABASE"] == "1"
      tasks << "ci:discard_past_quiz_event_partitions"
      tasks << "canvas:quizzes:create_event_partitions"
      tasks << "ci:reset_database" if ENV["PREPARE_TEST_DATABASE"] == "1"
      tasks = tasks.join(" ")

      parallel_each(RUNNER_IDS) do |runner_id|
        result = `TEST_ENV_NUMBER=#{runner_id} bundle exec rake #{tasks} 2>&1`
        if $CHILD_STATUS != 0
          $stderr.puts "ERROR: Migrations failed!\n\nLast 1000 lines:"
          $stderr.puts result.lines.last(1000).join
          exit(1)
        end
      end
    end

    # push the docker volume archives for the worker nodes, and possibly
    # also push the built images and the path to the volume archives if
    # this is a post-merge build
    def push_artifacts
      puts "Pushing artifacts..."
      stop_services # shut it down cleanly before we commit
      archive_path = ENV["PUSH_DOCKER_VOLUME_ARCHIVE"]
      publish_vars_path = "s3://#{DOCKER_CACHE_S3_BUCKET}/canvas-lms/docker_vars/#{ENV["PGVERSION"]}/" + `git rev-parse HEAD` if publish_artifacts?
      docker "exec -i #{ENV["COMPOSE_PROJECT_NAME"]}_data_loader_1 /push-volumes #{archive_path} #{publish_vars_path}"
      push_built_images if publish_artifacts?
      start_services
    end

    # opt-in by default, worker nodes explicitly opt out (since we'll have
    # just done it on the master)
    def run_migrations?
      ENV["RUN_MIGRATIONS"] != "0"
    end

    # master does this so slave will be fast
    def push_artifacts?
      ENV["PUSH_DOCKER_VOLUME_ARCHIVE"]
    end

    # post-merge only
    def publish_artifacts?
      ENV["PUBLISH_DOCKER_ARTIFACTS"]
    end

    def using_snapshot?
      !ENV["BASE_DOCKER_VOLUME_ARCHIVE"].empty?
    end

    def parallel_each(items)
      items.map { |item| Thread.new { yield item } }.map(&:join)
    end

    def docker(args)
      system "docker #{args}" or raise("`docker #{args}` failed")
    end

    def docker_compose(args)
      system "cd #{COMPOSE_DIR} && docker-compose #{args}" or raise("`docker-compose #{args}` failed")
    end
  end
end

begin
  DockerComposer.run
rescue
  $stderr.puts "ERROR: #{$ERROR_INFO}"
  exit 1
end
