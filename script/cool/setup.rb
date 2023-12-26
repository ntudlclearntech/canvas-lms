require "yaml"

RCE32BYTESSTRING = "shibadogisthecutestdogintheworld"

def setup(setup_type)
  case setup_type
  in "all"
    puts "\"all\" will run all the setup commands except \"feature_flags\""
    setup_postgres
    setup_cassandra
    setup_security
    setup_domain
    setup_external_tools
    setup_dev_keys
    setup_predoc
    setup_dynamic_settings
    setup_vault_contents
    setup_rce
    setup_mailcatcher
    setup_delayed_jobs
  in "postgres"
    setup_postgres
  in "cassandra"
    setup_cassandra
  in "security"
    setup_security
  in "domain"
    setup_domain
  in "external_tools"
    setup_external_tools
  in "dev_keys"
    setup_dev_keys
  in "predoc"
    setup_predoc
  in "dynamic_settings"
    setup_dynamic_settings
  in "vault_contents"
    setup_vault_contents
  in "rce"
    setup_rce
  in "mailcatcher"
    setup_mailcatcher
  in "delayed_jobs"
    setup_delayed_jobs
  in "feature_flags"
    setup_feature_flags
  else
    puts "available setup tasks:"
    puts "all -> execute all setup tasks"
    puts "postgres, cassandra, security, domain"
    puts "external_tools, dev_keys, predoc"
    puts "mailcatcher, delayed_jobs, feature_flags"
  end
end

private

def ask_bool(message, default_value: nil)
  answer_map = {
    "y" => true,
    "n" => false
  }
  value_hint = if default_value.nil?
                 "[y/n]"
               elsif default_value
                 "[Y/n]"
               else
                 "[y/N]"
               end
  puts "#{message} #{value_hint}"
  printf "-> "
  ans = nil
  loop do
    ans = answer_map[$stdin.gets.strip.downcase] || default_value
    break unless ans.nil?
  end
  ans
end

def ask_string(message, default_value: "")
  value_hint = if default_value.nil?
                 ""
               else
                 "[#{default_value}]"
               end
  puts "#{message} #{value_hint}"
  printf "-> "
  ans = $stdin.gets.strip.downcase
  ans.empty? ? default_value : ans
end

# backup specified config file and return the backup name
def backup_config(target_path)
  backup_path = target_path.sub(".yml", "-#{Time.now.strftime("%y%m%d%H%M")}.yml.backup")
  File.rename(target_path, backup_path)
  puts "The original file #{target_path} is backup to #{backup_path}"
  backup_path
end

def save_config(target_path, content)
  if File.exist?(target_path)
    puts "there's already an file called #{target_path}."
    overwrite_ans = ask_bool("continue? I'll make a backup of that.", default_value: true)
    if overwrite_ans
      backup_config(target_path)
      File.write(target_path, content)
    else
      puts "abort."
    end
  else
    File.write(target_path, content)
    puts "new config is written to #{target_path}."
  end
end

def load_env_config(env_path)
  File.read(env_path).split("\n").to_h do |line|
    first_equal = line.index("=")
    [line[...first_equal], line[first_equal + 1..]]
  end
end

def setup_postgres
  target_path = "config/database.yml"
  sample_path = "#{target_path}.example"
  db_config = YAML.load_file(sample_path)
  %w[development test].each do |env_name|
    env_config = db_config[env_name]
    env_config["timeout"] = 1000
    env_config.delete("secondary")
    env_config["username"] = "postgres"
    env_config["password"] = "secret"
    env_config["host"] = "postgres"
  end
  save_config(target_path, db_config.to_yaml)
end

def setup_cassandra
  target_path = "config/cassandra.yml"
  sample_path = "#{target_path}.example"
  data = File.readlines(sample_path)
  head_index = data.index { _1.start_with?("# development:") }
  cassandra_config = YAML.safe_load(data[head_index..].map { _1.sub("# ", "") }.join)
  cassandra_config["development"]["page_views"]["servers"] = ["cassandra:9160"]
  cassandra_config["development"]["auditors"]["servers"] = ["cassandra:9160"]
  cassandra_config.delete("test")
  save_config(target_path, cassandra_config.to_yaml)
end

def setup_security
  target_path = "config/security.yml"
  sample_path = "#{target_path}.example"
  security_config = YAML.load_file(sample_path)
  save_config(target_path, security_config.to_yaml)
end

def setup_domain
  target_path = "config/domain.yml"
  sample_path = "#{target_path}.example"
  domain_config = YAML.load_file(sample_path)
  domain_config["development"]["domain"] = ask_string("What will the domain be in your outgoing mail's link?", default_value: "localhost:3000")
  save_config(target_path, domain_config.to_yaml)
end

def setup_external_tools
  target_path = "config/external_tools.yml"
  sample_path = "#{target_path}.example"
  external_tools_config = YAML.load_file(sample_path)
  save_config(target_path, external_tools_config.to_yaml)
end

def setup_dev_keys
  target_path = "config/developer_keys.yml"
  sample_path = "#{target_path}.example"
  dev_keys_config = YAML.load_file(sample_path)
  save_config(target_path, dev_keys_config.to_yaml)
end

def setup_predoc
  target_path1 = "config/predoc.yml"
  sample_path1 = "#{target_path1}.example"
  predoc_config = YAML.load_file(sample_path1)
  dev_config = predoc_config["development"]
  dev_config["viewer_url"] = "localhost:3002"
  save_config(target_path1, predoc_config.to_yaml)

  target_path2 = "predoc/config/canvas.yml"
  sample_path2 = "#{target_path2}.example"
  predoc_canvas_config = YAML.load_file(sample_path2)
  predoc_canvas_config['development']['base_url'] = 'http://localhost:3000'
  save_config(target_path2, predoc_canvas_config.to_yaml)

  target_path3 = "predoc/config/initializers/predoc.rb"
  sample_path3 = "#{target_path3}.default"
  predoc_ruby_initializer = File.read(sample_path3)
  save_config(target_path3, predoc_ruby_initializer)
end

def setup_dynamic_settings
  target_path = "config/dynamic_settings.yml"
  sample_path = "#{target_path}.example"
  dynamic_settings_config = YAML.load_file(sample_path)
  # COOL TODO: rce key will be move to vault_contents.yml in later versions, remove these 2 lines after that
  dynamic_settings_config["development"]["config"]["canvas"]["canvas"]["encryption-secret"] = "shibadogisthecutestdogintheworld"
  dynamic_settings_config["development"]["config"]["canvas"]["canvas"]["signing-secret"] = "shibadogisthecutestdogintheworld"
  dynamic_settings_config["development"]["config"]["canvas"]["rich-content-service"]["app-host"] = "http://localhost:3001"
  save_config(target_path, dynamic_settings_config.to_yaml)
end

def setup_vault_contents
  target_path = "config/vault_contents.yml"
  sample_path = "#{target_path}.example"
  rce_api_config = YAML.load_file(sample_path)

  rce_api_config["development"]["app-canvas/data/secrets"] = {
    "data" => {
      "canvas_security" => {
        "encryption_secret" => RCE32BYTESSTRING,
        "signing_secret" => RCE32BYTESSTRING
      }
    }
  }

  save_config(target_path, rce_api_config.to_yaml)
end

def setup_rce
  target_path = "canvas-rce-api/.env"
  sample_path = "#{target_path}.example"
  rce_api_env = load_env_config(sample_path)
  rce_api_env["ECOSYSTEM_SECRET"] = RCE32BYTESSTRING
  rce_api_env["ECOSYSTEM_KEY"] = RCE32BYTESSTRING
  save_config(target_path, rce_api_env.map { _1.join("=") }.join("\n"))
end

def setup_mailcatcher
  target_path = "config/outgoing_mail.yml"
  sample_path = "#{target_path}.example"
  outgoing_mail_config = YAML.load_file(sample_path)
  dev_config = outgoing_mail_config["development"]
  dev_config["address"] = "mailcatcher"
  dev_config["port"] = "1025"
  dev_config["domain"] = "localhost"
  dev_config["outgoing_address"] = "canvas@localhost"
  dev_config["default_name"] = "My Local Canvas"
  save_config(target_path, outgoing_mail_config.to_yaml)
end

def setup_delayed_jobs
  target_path1 = "config/delayed_job_delay.yml"
  sample_path1 = "#{target_path1}.example"
  job_delay_config = YAML.load_file(sample_path1)
  save_config(target_path1, job_delay_config.to_yaml)

  target_path2 = "config/delayed_jobs.yml"
  sample_path2 = "#{target_path2}.example"
  jobs_config = YAML.load_file(sample_path2)
  save_config(target_path2, jobs_config.to_yaml)
end

def setup_feature_flags
  active_record_commands = [
    "Account.site_admin.set_feature_flag!(:allow_unconfirmed_users_in_user_list, Feature::STATE_ON)",
    "Account.site_admin.set_feature_flag!(:files_dnd, Feature::STATE_DEFAULT_ON)",
    "Account.site_admin.set_feature_flag!(:new_user_tutorial, Feature::STATE_ON)",
    "Account.site_admin.set_feature_flag!(:outcome_average_calculation, Feature::STATE_DEFAULT_ON)",
    "Account.site_admin.set_feature_flag!(:self_service_user_merge, Feature::STATE_ON)",
    "Account.site_admin.set_feature_flag!(:submission_feedback_indicators, Feature::STATE_DEFAULT_ON)",
    "Account.site_admin.set_feature_flag!(:final_grades_override, Feature::STATE_ON)",
    "Account.site_admin.set_feature_flag!(:quiz_log_auditing, Feature::STATE_DEFAULT_ON)",
    "Account.site_admin.set_feature_flag!(:disable_alert_timeouts, Feature::STATE_ON)",
    "Account.site_admin.set_feature_flag!(:open_todos_in_new_tab, Feature::STATE_DEFAULT_ON)",
    "Account.site_admin.set_feature_flag!(:filter_speed_grader_by_student_group, Feature::STATE_DEFAULT_ON)",
    "Account.site_admin.set_feature_flag!(:scheduled_page_publication, Feature::STATE_DEFAULT_ON)"
  ].join(";")
  `bundle exec rails runner "#{active_record_commands}"`
end

setup ARGV[0]
