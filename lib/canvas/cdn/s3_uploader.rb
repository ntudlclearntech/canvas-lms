require 'parallel'

module Canvas
  module Cdn
    class S3Uploader

      attr_accessor :bucket, :config

      def initialize(folder='dist')
        require 'aws-sdk'
        @folder = folder
        @config = Canvas::Cdn.config
        @s3 = AWS::S3.new(access_key_id: config.aws_access_key_id,
                          secret_access_key: config.aws_secret_access_key)
        @bucket = @s3.buckets[config.bucket]
      end

      def local_files
        Dir.chdir(Rails.public_path) { Dir["#{@folder}/**/**"]}
      end

      def upload!
        total_files = local_files.count
        uploaded_files = 0
        Parallel.each(local_files, :in_threads=>8) do |file|
          upload_file(file)
          uploaded_files += 1
          yield (100.0 * uploaded_files / total_files) if block_given?
        end
      end

      def fingerprinted?(path)
        /-[0-9a-fA-F]{10}$/.match(path.basename(path.extname).to_s)
      end

      def font?(path)
        %w{.ttf .ttc .otf .eot .woff .woff2}.include?(path.extname)
      end

      def mime_for(path)
        Mime::Type.lookup_by_extension(path.extname[1..-1])
      end

      def options_for(path)
        options = {acl: :public_read, content_type: mime_for(path)}
        if fingerprinted?(path)
          options.merge!({
            cache_control: "public, max-age=#{1.year}"
          })
        end

        # Set headers so font's work cross-orign. While you can also set a
        # CORSConfig when you set up your s3 bucket to do the same thing, this
        # will make sure it is always set for fonts.
        options['Access-Control-Allow-Origin'] = '*' if font?(path)
        options
      end

      def upload_file(remote_path)
        local_path = Pathname.new("#{Rails.public_path}/#{remote_path}")
        return if (local_path.extname == '.gz') || local_path.directory?
        s3_object = bucket.objects[remote_path]
        return log("skipping already existing #{remote_path}") if s3_object.exists?
        options = options_for(local_path)
        log "uploading #{remote_path} #{options[:content_encoding]}"
        s3_object.write(handle_compression(local_path, options), options)
      end

      def log(msg)
        Rails.logger.debug "#{self.class} - #{msg}"
      end

      def handle_compression(file, options)
        return file if file.size < 150 # gzipping small files is not worth it
        gzipped = (CANVAS_RAILS3 ? Canvas::Cdn::Gzip : ActiveSupport::Gzip).compress(file.read, Zlib::BEST_COMPRESSION)
        compression = 100 - (100.0 * gzipped.size / file.size).round
        # if we couldn't compress more than 5%, the gzip decoding cost to the
        # client makes it is not worth serving gzipped
        if compression > 5
          options[:content_encoding] = 'gzip'
          log "Using Gzipped #{file.basename}. was: #{file.size} now: #{gzipped.size} saved: #{compression}%"
          return gzipped
        else
          return file
        end
      end

    end
  end
end
