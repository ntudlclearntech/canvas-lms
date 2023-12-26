# frozen_string_literal: true

if Rails.env.development?
  other_loggers = {}
  # use this formatter to print to stdout like default behavior
  original_formatter = Logger::Formatter.new
  Rails.logger.formatter = proc do |severity, datetime, progname, msg|
    # separate logs with [xxx] canvas customized tags into other files with same tag name
    logger = if log_tag = /(?<=\[)\w+(?=\])/.match(msg)
               other_loggers[log_tag] ||= Logger.new(Rails.root.join("log", "development.#{log_tag}-#{datetime.strftime('%Y-%m-%d')}.log"))
             # separate SQL syntax logs into sql log
             elsif msg.include?('SQL')
               other_loggers['SQL'] ||= Logger.new(Rails.root.join("log", "development.sql-#{datetime.strftime('%Y-%m-%d')}.log"))
             # other messages instead of request log go to misc
             elsif msg.exclude?('method=')
               other_loggers['misc'] ||= Logger.new(Rails.root.join("log", "development.misc-#{datetime.strftime('%Y-%m-%d')}.log"))
             end
    if logger
      logger.level = Rails.configuration.log_level
      logger.send(severity.downcase, msg)
      nil
    else
      # other important messages, print to stdout
      original_formatter.call(severity, datetime, progname, msg) unless logger
    end
  end
end
