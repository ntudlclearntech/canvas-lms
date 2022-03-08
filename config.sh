#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
CACHE_STORE_FILE="${DIR}/config/cache_store.yml"
CASSANDRA_FILE="${DIR}/config/cassandra.yml"
DATABASE_FILE="${DIR}/config/database.yml"
DELAYED_JOBS_FILE="${DIR}/config/delayed_jobs.yml"
DOMAIN_FILE="${DIR}/config/domain.yml"
DYNAMIC_SETTINGS_FILE="${DIR}/config/dynamic_settings.yml"
FILE_STORE_FILE="${DIR}/config/file_store.yml"
OUTGOING_MAIL_FILE="${DIR}/config/outgoing_mail.yml"
PREDOC_FILE="${DIR}/config/predoc.yml"
REDIS_FILE="${DIR}/config/redis.yml"
SAML_FILE="${DIR}/config/saml.yml"
SECURITY_FILE="${DIR}/config/security.yml"
SESSION_STORE_FILE="${DIR}/config/session_store.yml"
PASSENGERFILE_FILE="${DIR}/Passengerfile.json"
PASSENGER_NGINX_CONFIGURATION_TEMPLATE_FILE="${DIR}/passenger_nginx_config.erb"
LOGGING_FILE="${DIR}/config/logging.yml"
DELAYED_JOB_DELAY_FILE="${DIR}/config/delayed_job_delay.yml"
DEVELOPER_KEYS_FILE="${DIR}/config/developer_keys.yml"

create_cache_store_config_file() {
  cat << EOF > "${CACHE_STORE_FILE}"
production:
  cache_store: "<%= ENV.fetch('CACHE_STORE_CACHE_STORE', 'redis_store') %>"
EOF
}

create_cassandra_config_file() {
  cat << EOF > "${CASSANDRA_FILE}"
production:
  page_views:
    servers:
    - "<%= ENV.fetch('CASSANDRA_SERVERS', '10.99.100.252:9160') %>"
    keyspace: "<%= ENV.fetch('CASSANDRA_PAGE_VIEWS_KEYSPACE', 'page_views') %>"
  auditors:
    servers:
    - "<%= ENV.fetch('CASSANDRA_SERVERS', '10.99.100.252:9160') %>"
    keyspace: "<%= ENV.fetch('CASSANDRA_AUDITORS_KEYSPACE', 'auditors') %>"
EOF
}

create_database_config_file() {
  cat << EOF > "${DATABASE_FILE}"
production:
  adapter: "<%= ENV.fetch('DATABASE_ADAPTER', 'postgresql') %>"
  encoding: "<%= ENV.fetch('DATABASE_ENCODING', 'utf8') %>"
  database: "<%= ENV.fetch('DATABASE_DATABASE', 'canvas_production') %>"
  timeout: "<%= ENV.fetch('DATABASE_TIMEOUT', '5000') %>"
  username: "<%= ENV.fetch('DATABASE_USERNAME', 'canvas1') %>"
  password: "<%= ENV.fetch('DATABASE_PASSWORD', 'canvas2') %>"
  host: "<%= ENV.fetch('DATABASE_HOST', 'localhost') %>"
EOF
}

create_delayed_jobs_config_file() {
  cat << EOF > "${DELAYED_JOBS_FILE}"
production:
  workers:
  - queue: canvas_queue
    workers: 2
    max_priority: 10
  - queue: canvas_queue
    workers: 4
  # if set, workers will process this many jobs and then die, causing the pool
  # to spawn another worker. this can help return memory to the OS.
  # worker_max_job_count: 20
  #
  # if set, workers will die and re-spawn of they exceed this memory usage
  # threshold. they will only die between jobs, not during a job.
  # worker_max_memory_usage: 1073741824
  #
  # disable periodic jobs auditor -- this isn't normally necessary
  # disable_periodic_jobs: true
  #
  # health_check: # see inst-jobs documentation for possible options
  #   type: consul
  #   service_name: canvas_jobs

default:
  workers:
  - queue: canvas_queue
EOF
}

create_domain_config_file() {
  cat << EOF > "${DOMAIN_FILE}"
production:
  domain: "<%= ENV.fetch('DOMAIN_DOMAIN', 'cool.ntu.edu.tw') %>"
  ssl: "<%= ENV.fetch('DOMAIN_SSL', 'true') %>"
EOF
}

create_dynamic_settings_config_file() {
  cat << EOF > "${DYNAMIC_SETTINGS_FILE}"
# this config file is useful if you don't want to run a consul
# cluster with canvas.  Just provide the config data you would
# like for the DynamicSettings class to find, and it will use
# it whenever a call for consul data is issued. Data should be
# shaped like the example below, one key for the related set of data,
# and a hash of key/value pairs (no nesting)
production:
  # tree
  config:
    # service
    canvas:
      # environment
      canvas:
        encryption-secret: "<%= ENV.fetch('DYNAMIC_SETTINGS_ENCRYPTION_SECRET', 'astringthatisactually32byteslong') %>"
        signing-secret: "<%= ENV.fetch('DYNAMIC_SETTINGS_SIGNING_SECRET', 'astringthatisactually32byteslong') %>"
      datadog-rum:
        application_id: "<%= ENV.fetch('DYNAMIC_SETTINGS_APPLICATION_ID', '27627d1e-8a4f-4645-b390-bb396fc83c81') %>"
        client_token: "<%= ENV.fetch('DYNAMIC_SETTINGS_CLIENT_TOKEN', 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r') %>"
        sample_rate_percentage: "<%= ENV.fetch('DYNAMIC_SETTINGS_SAMPLE_RATE_PERCENTAGE', '0.0') %>" # Between 0.0 and 100.0; 0.0 disables the feature.
      # live-events:
      #   aws_endpoint: "<%= ENV.fetch('DYNAMIC_SETTINGS_AWS_ENDPOINT', 'http://kinesis.canvaslms.docker') %>"
      #   kinesis_stream_name: "<%= ENV.fetch('DYNAMIC_SETTINGS_KINESIS_STREAM_NAME', 'live-events') %>"
      live-events-subscription-service:
        app-host: "<%= ENV.fetch('DYNAMIC_SETTINGS_LIVE_EVENTS_SUBSCRIPTION_SERVICE_HOST', 'http://les.docker') %>"
        sad-panda: "<%= ENV.fetch('DYNAMIC_SETTINGS_LIVE_EVENTS_SUBSCRIPTION_SERVICE_SAD_PANDA', 'null') %>"
      math-man:
        base_url: "<%= ENV.fetch('DYNAMIC_SETTINGS_MATH_MAN_BASE_URL', 'https://canvas-mathman-staging.dlc.ntu.edu.tw') %>"
        use_for_svg: "<%= ENV.fetch('DYNAMIC_SETTINGS_MATH_MAN_USE_FOR_SVG', 'true') %>"
        use_for_mml: "<%= ENV.fetch('DYNAMIC_SETTINGS_MATH_MAN_USE_FOR_MML', 'true') %>"
      rich-content-service:
        app-host: "<%= ENV.fetch('DYNAMIC_SETTINGS_RICH_CONTENT_SERVICE_HOST', 'canvas-rce-api-staging.dlc.ntu.edu.tw') %>"
      common_cartridge_viewer:
        base_url: "<%= ENV.fetch('DYNAMIC_SETTINGS_COMMON_CARTRIDGE_VIEWER_BASE_URL', 'http://localhost:3300') %>"
        url: "<%= ENV.fetch('DYNAMIC_SETTINGS_COMMON_CARTRIDGE_VIEWER_URL', 'http://localhost:3300') %>"
      fullstory:
        sampling_rate: "<%= ENV.fetch('DYNAMIC_SETTINGS_SAMPLING_RATE', '0.0') %>" # randomly inject this fraction of the time
        app_key: "<%= ENV.fetch('DYNAMIC_SETTINGS_APP_KEY', 'xyzzy') %>"
    # another service
    inst-fs:
      app-host: "<%= ENV.fetch('DYNAMIC_SETTINGS_INST_FS_HOST', 'http://api.instfs.docker') %>"
      # this is just "super-sekret-value", base64-encoded:
      secret: "<%= ENV.fetch('DYNAMIC_SETTINGS_INST_FS_SECRET', 'c3VwZXItc2VrcmV0LXZhbHVlCg==') %>"
    pandata:
      ios-pandata-key: "<%= ENV.fetch('DYNAMIC_SETTINGS_IOS_PANDATA_KEY', 'IOS_pandata_key') %>"
      ios-pandata-secret: "<%= ENV.fetch('DYNAMIC_SETTINGS_IOS_PANDATA_SECRET', 'teamrocketblastoffatthespeedoflight') %>"
      android-pandata-key: "<%= ENV.fetch('DYNAMIC_SETTINGS_ANDROID_PANDATA_KEY', 'ANDROID_pandata_key') %>"
      android-pandata-secret: "<%= ENV.fetch('DYNAMIC_SETTINGS_ANDROID_PANDATA_SECRET', 'surrendernoworpreparetofight') %>"

  private:
    canvas:
      # use a unique subdomain per attachment, so that browsers will enforce security
      # permissions (such as microphone/camera access) per-file. You must have wildcard
      # DNS set up for this to work.
      # attachment_specific_file_domain: true
      # ha_cache.yml: |
      #   cache_store: ha_store
      #   servers:
      #    - redis://localhost/2
      #   # keep stale data for up to 1 week in the cache
      #   race_condition_ttl: 604800
      #   # how long it might take to recompute a cache value
      #   # before the lock times out and another process is
      #   # allowed to write it
      #   lock_timeout: 5
      #   # how long before a cache entry is considered stale
      #   expires_in: 300
      #   # when deleting from the cache, trigger a consul event
      #   # you can use the example script/consume_consul_events
      #   # to delete from local nodes, but may need to tweak
      #   # slightly if your config doesn't match
      #   consul_event: "canvas/dev/invalidate_ha_cache"
      #   # if configured, trigger the event in multiple Consul
      #   # datacenters, rather than just the local one
      #   # if you use this you SHOULD still list the local
      #   # dc; it won't be added for you
      #   consul_datacenters:
      #   - dc1
      #   - dc2
      # clone_url_strand.yml: |
      #   lti1.instructure.com: lti1
      #   lti2.instructure.com: lti2
      # csp_logging.yml: |
      #   host: https://csplogging.inscloudgate.net/
      #   shared_secret: s00p3r_s3cr3t
  store:
    canvas:
      lti-keys:
        # these are all the same JWK but with different kid
        # to generate a new key, run the following in a Canvas console:
        #
        # key = OpenSSL::PKey::RSA.generate(2048)
        # key.public_key.to_jwk(kid: Time.now.utc.iso8601).to_json
        jwk-past.json: "<%= ENV.fetch('DYNAMIC_SETTINGS_JWK_PAST', '{\"kty\":\"RSA\",\"e\":\"AQAB\",\"n\":\"uX1MpfEMQCBUMcj0sBYI-iFaG5Nodp3C6OlN8uY60fa5zSBd83-iIL3n_qzZ8VCluuTLfB7rrV_tiX727XIEqQ\",\"kid\":\"2018-05-18T22:33:20Z\",\"d\":\"pYwR64x-LYFtA13iHIIeEvfPTws50ZutyGfpHN-kIZz3k-xVpun2Hgu0hVKZMxcZJ9DkG8UZPqD-zTDbCmCyLQ\",\"p\":\"6OQ2bi_oY5fE9KfQOcxkmNhxDnIKObKb6TVYqOOz2JM\",\"q\":\"y-UBef95njOrqMAxJH1QPds3ltYWr8QgGgccmcATH1M\",\"dp\":\"Ol_xkL7rZgNFt_lURRiJYpJmDDPjgkDVuafIeFTS4Ic\",\"dq\":\"RtzDY5wXr5TzrwWEztLCpYzfyAuF_PZj1cfs976apsM\",\"qi\":\"XA5wnwIrwe5MwXpaBijZsGhKJoypZProt47aVCtWtPE\"}') %>"
        jwk-present.json: "<%= ENV.fetch('DYNAMIC_SETTINGS_JWK_PRESENT', '{\"kty\":\"RSA\",\"e\":\"AQAB\",\"n\":\"uX1MpfEMQCBUMcj0sBYI-iFaG5Nodp3C6OlN8uY60fa5zSBd83-iIL3n_qzZ8VCluuTLfB7rrV_tiX727XIEqQ\",\"kid\":\"2018-06-18T22:33:20Z\",\"d\":\"pYwR64x-LYFtA13iHIIeEvfPTws50ZutyGfpHN-kIZz3k-xVpun2Hgu0hVKZMxcZJ9DkG8UZPqD-zTDbCmCyLQ\",\"p\":\"6OQ2bi_oY5fE9KfQOcxkmNhxDnIKObKb6TVYqOOz2JM\",\"q\":\"y-UBef95njOrqMAxJH1QPds3ltYWr8QgGgccmcATH1M\",\"dp\":\"Ol_xkL7rZgNFt_lURRiJYpJmDDPjgkDVuafIeFTS4Ic\",\"dq\":\"RtzDY5wXr5TzrwWEztLCpYzfyAuF_PZj1cfs976apsM\",\"qi\":\"XA5wnwIrwe5MwXpaBijZsGhKJoypZProt47aVCtWtPE\"}') %>"
        jwk-future.json: "<%= ENV.fetch('DYNAMIC_SETTINGS_JWK_FUTURE', '{\"kty\":\"RSA\",\"e\":\"AQAB\",\"n\":\"uX1MpfEMQCBUMcj0sBYI-iFaG5Nodp3C6OlN8uY60fa5zSBd83-iIL3n_qzZ8VCluuTLfB7rrV_tiX727XIEqQ\",\"kid\":\"2018-07-18T22:33:20Z\",\"d\":\"pYwR64x-LYFtA13iHIIeEvfPTws50ZutyGfpHN-kIZz3k-xVpun2Hgu0hVKZMxcZJ9DkG8UZPqD-zTDbCmCyLQ\",\"p\":\"6OQ2bi_oY5fE9KfQOcxkmNhxDnIKObKb6TVYqOOz2JM\",\"q\":\"y-UBef95njOrqMAxJH1QPds3ltYWr8QgGgccmcATH1M\",\"dp\":\"Ol_xkL7rZgNFt_lURRiJYpJmDDPjgkDVuafIeFTS4Ic\",\"dq\":\"RtzDY5wXr5TzrwWEztLCpYzfyAuF_PZj1cfs976apsM\",\"qi\":\"XA5wnwIrwe5MwXpaBijZsGhKJoypZProt47aVCtWtPE\"}') %>"
EOF
}

create_file_store_config_file() {
  cat << EOF > "${FILE_STORE_FILE}"
production:
  storage: "<%= ENV.fetch('FILE_STORE_STORAGE', 'local') %>"
  path_prefix: "<%= ENV.fetch('FILE_STORE_PATH_PREFIX', 'tmp/files') %>"
EOF
}

create_outgoing_mail_config_file() {
  cat << EOF > "${OUTGOING_MAIL_FILE}"
production:
  address: "<%= ENV.fetch('OUTGOING_MAIL_PRODUCTION_ADDRESS', 'smtp.example.com') %>"
  port: "<%= ENV.fetch('OUTGOING_MAIL_PRODUCTION_PORT', '25') %>"
  # user_name: "<%= ENV.fetch('OUTGOING_MAIL_PRODUCTION_USER_NAME', 'user') %>"
  # password: "<%= ENV.fetch('OUTGOING_MAIL_PRODUCTION_PASSWORD', 'password') %>"
  # authentication: "<%= ENV.fetch('OUTGOING_MAIL_PRODUCTION_AUTHENTICATION', 'plain') %>" # plain, login, or cram_md5
  domain: "<%= ENV.fetch('OUTGOING_MAIL_PRODUCTION_DOMAIN', 'example.com') %>"
  outgoing_address: "<%= ENV.fetch('OUTGOING_MAIL_PRODUCTION_OUTGOING_ADDRESS', 'canvas@example.com') %>"
  default_name: "<%= ENV.fetch('OUTGOING_MAIL_PRODUCTION_DEFAULT_NAME', 'Instructure Canvas') %>"

# If receiving mail from multiple inboxes (see incoming_mail.yml.example),
# you'll want to include those addresses in a reply_to_addresses array so
# Canvas will select the Reply-To field of outgoing messages from all of the
# incoming mailboxes.

multiple_inboxes:
  address: "<%= ENV.fetch('OUTGOING_MAIL_MULTIPLE_INBOXES_ADDRESS', 'smtp.example.com') %>"
  port: "<%= ENV.fetch('OUTGOING_MAIL_MULTIPLE_INBOXES_PORT', '25') %>"
  user_name: "<%= ENV.fetch('OUTGOING_MAIL_MULTIPLE_INBOXES_USER_NAME', 'user') %>"
  password: "<%= ENV.fetch('OUTGOING_MAIL_MULTIPLE_INBOXES_PASSWORD', 'password') %>"
  authentication: "<%= ENV.fetch('OUTGOING_MAIL_MULTIPLE_INBOXES_AUTHENTICATION', 'plain') %>" # plain, login, or cram_md5
  domain: "<%= ENV.fetch('OUTGOING_MAIL_MULTIPLE_INBOXES_DOMAIN', 'example.com') %>"
  outgoing_address: "<%= ENV.fetch('OUTGOING_MAIL_MULTIPLE_INBOXES_OUTGOING_ADDRESS', 'canvas@example.com') %>"
  default_name: "<%= ENV.fetch('OUTGOING_MAIL_MULTIPLE_INBOXES_DEFAULT_NAME', 'Instructure Canvas') %>"
  reply_to_addresses:
  - "<%= ENV.fetch('OUTGOING_MAIL_MULTIPLE_INBOXES_REPLY_TO_ADDRESSES_1', 'canvas1@example.com') %>"
  - "<%= ENV.fetch('OUTGOING_MAIL_MULTIPLE_INBOXES_REPLY_TO_ADDRESSES_2', 'canvas2@example.com') %>"
  - "<%= ENV.fetch('OUTGOING_MAIL_MULTIPLE_INBOXES_REPLY_TO_ADDRESSES_3', 'canvas3@example.com') %>"
  - "<%= ENV.fetch('OUTGOING_MAIL_MULTIPLE_INBOXES_REPLY_TO_ADDRESSES_4', 'canvas4@example.com') %>"
EOF
}

create_predoc_config_file() {
  cat << EOF > "${PREDOC_FILE}"
production:
  viewer_url: "<%= ENV.fetch('PREDOC_URL', 'docs.google.com') %>"

development:
  viewer_url: "<%= ENV.fetch('PREDOC_URL', 'docs.google.com') %>"

test:
  viewer_url: "<%= ENV.fetch('PREDOC_URL', 'docs.google.com') %>"
EOF
}

create_redis_config_file() {
  cat << EOF > "${REDIS_FILE}"
production:
  servers:
    - "<%= ENV.fetch('REDIS_SERVERS', 'redis://localhost:6379') %>"
  database: "<%= ENV.fetch('REDIS_DATABASE', '1') %>"
EOF
}

create_saml_config_file() {
  cat << EOF > "${SAML_FILE}"
# In order to consume encrypted SAML assertions, you'll need to create
# a public/private keypair:
#
# openssl req -new -newkey rsa:2048 -days 730 -nodes -x509 -keyout samlkey.pem -out samlcert.pem

production:
  entity_id: "<%= ENV.fetch('SAML_ENTITY_ID', 'http://www.your-domain.com/saml2') %>"
  tech_contact_name: "<%= ENV.fetch('SAML_TECH_CONTACT_NAME', 'Administrator') %>"
  tech_contact_email: "<%= ENV.fetch('SAML_TECH_CONTACT_EMAIL', 'info@your-domain.com') %>"
  encryption:
    private_key: "<%= ENV.fetch('SAML_PRIVATE_KEY', '/path/to/samlkey.pem') %>"
    certificate: "<%= ENV.fetch('SAML_CERTIFICATE', '/path/to/samlcert.pem') %>"
    additional_private_keys:
      - "<%= ENV.fetch('SAML_ADDITIONAL_PRIVATE_KEYS', '/path/to/oldsamlkey.pem') %>"

development:
  entity_id: "<%= ENV.fetch('SAML_ENTITY_ID', 'http://www.your-domain.com/saml2') %>"
  tech_contact_name: "<%= ENV.fetch('SAML_TECH_CONTACT_NAME', 'Administrator') %>"
  tech_contact_email: "<%= ENV.fetch('SAML_TECH_CONTACT_EMAIL', 'info@your-domain.com') %>"
  encryption:
    private_key: "<%= ENV.fetch('SAML_PRIVATE_KEY', '/path/to/samlkey.pem') %>"
    certificate: "<%= ENV.fetch('SAML_CERTIFICATE', '/path/to/samlcert.pem') %>"
    additional_private_keys:
      - "<%= ENV.fetch('SAML_ADDITIONAL_PRIVATE_KEYS', '/path/to/oldsamlkey.pem') %>"

test:
  entity_id: "<%= ENV.fetch('SAML_ENTITY_ID', 'http://www.your-domain.com/saml2') %>"
  tech_contact_name: "<%= ENV.fetch('SAML_TECH_CONTACT_NAME', 'Administrator') %>"
  tech_contact_email: "<%= ENV.fetch('SAML_TECH_CONTACT_EMAIL', 'info@your-domain.com') %>"
EOF
}

create_security_config_file() {
  cat << EOF > "${SECURITY_FILE}"
production:
  encryption_key: "<%= ENV.fetch('SECURITY_ENCRYPTION_KEY', 'facdd3a131ddd8988b14f6e4e01039c93cfa0160') %>"
  lti_iss: "<%= ENV.fetch('SECURITY_LTI_ISS', 'https://canvas.instructure.com') %>"
EOF
}

create_session_store_config_file() {
  cat << EOF > "${SESSION_STORE_FILE}"
production:
  session_store: "<%= ENV.fetch('SESSION_STORE_SESSION_STORE', 'encrypted_cookie_store') %>"
  expire_after: "<%= ENV.fetch('SESSION_STORE_EXPIRE_AFTER', '86400') %>"
  secure: "<%= ENV.fetch('SESSION_STORE_SECURE', 'true') %>"
EOF
}

create_passengerfile_file() {
  cat << EOF > "${PASSENGERFILE_FILE}"
{
  "max_pool_size": ${PASSENGERFILE_MAX_POOL_SIZE},
  "min_instances": ${PASSENGERFILE_MIN_INSTANCES},
  "max_request_queue_size": ${PASSENGERFILE_MAX_REQUEST_QUEUE_SIZE},
  "max_requests": ${PASSENGERFILE_MAX_REQUESTS},
  "pool_idle_time": ${PASSENGERFILE_POOL_IDLE_TIME},
  "nginx_config_template": "${PASSENGER_NGINX_CONFIGURATION_TEMPLATE_FILE}",
  "start_timeout": ${PASSENGERFILE_START_TIMEOUT}
}
EOF
}

create_passenger_nginx_configuration_template_file() {
  cat << EOF > "${PASSENGER_NGINX_CONFIGURATION_TEMPLATE_FILE}"
##########################################################################
#  Passenger Standalone is built on the same technology that powers
#  Passenger for Nginx, so any configuration option supported by Passenger
#  for Nginx can be applied to Passenger Standalone as well. You can do
#  this by direct editing the Nginx configuration template that is used by
#  Passenger Standalone.
#
#  This file is the original template. DO NOT EDIT THIS FILE DIRECTLY.
#  Instead, make a copy of this file and pass the \`--nginx-config-template\`
#  parameter to Passenger Standalone.
#
#  Learn more about using the Nginx configuration template at:
#  https://www.phusionpassenger.com/library/config/standalone/intro.html#nginx-configuration-template
#
#  *** NOTE ***
#  If you customize the template file, make sure you keep an eye on the
#  original template file and merge any changes. New Phusion Passenger
#  features may require changes to the template file.
##############################################################

<%= include_passenger_internal_template('global.erb') %>

worker_processes 1;
events {
    worker_connections 4096;
}
http {
    <%= include_passenger_internal_template('http.erb', 4) %>

    ### BEGIN your own configuration options ###
    # This is a good place to put your own config
    # options. Note that your options must not
    # conflict with the ones Passenger already sets.
    # Learn more at:
    # https://www.phusionpassenger.com/library/config/standalone/intro.html#nginx-configuration-template

    passenger_intercept_errors on;
    error_page 503 /passenger_queue_full_error.html;

    ### END your own configuration options ###

    default_type application/octet-stream;
    types_hash_max_size 2048;
    server_names_hash_bucket_size 64;
    client_max_body_size 2048m;
    access_log off;
    keepalive_timeout 60;
    underscores_in_headers on;
    gzip on;
    gzip_comp_level 3;
    gzip_min_length 150;
    gzip_proxied any;
    gzip_types text/plain text/css text/json text/javascript
        application/javascript application/x-javascript application/json
        application/rss+xml application/vnd.ms-fontobject application/x-font-ttf
        application/xml font/opentype image/svg+xml text/xml;

    <% if @app_finder.multi_mode? %>
        # Default server entry for mass deployment mode.
        server {
            <%= include_passenger_internal_template('mass_deployment_default_server.erb', 12) %>
        }
    <% end %>

    <% for app in @apps %>
    server {
        <%= include_passenger_internal_template('server.erb', 8, true, binding) %>
        <%= include_passenger_internal_template('rails_asset_pipeline.erb', 8, false) %>

        ### BEGIN your own configuration options ###
        # This is a good place to put your own config
        # options. Note that your options must not
        # conflict with the ones Passenger already sets.
        # Learn more at:
        # https://www.phusionpassenger.com/library/config/standalone/intro.html#nginx-configuration-template

        ### END your own configuration options ###
    }
    passenger_pre_start <%= listen_url(app) %>;
    <% end %>
    <%= include_passenger_internal_template('footer.erb', 4) %>
}
EOF
}

create_logging_config_file() {
  cat << EOF > "${LOGGING_FILE}"
production:
  logger: rails
  log_level: "<%= ENV.fetch('LOGGING_LEVEL', 'info') %>"
EOF
}

create_delayed_job_delay() {
  cat << EOF > "${DELAYED_JOB_DELAY_FILE}"
# Affected code: app/models/discussion_entry.rb:context_module_action_later
# Check #http://gitlab.dlc.ntu.edu.tw/ntu-cool/canvas-lms/-/issues/216#note_28432 for details.

production:
  discussion_entry_context_module_action: "<%= ENV.fetch('DELAYED_JOB_DELAY_DISCUSSION_ENTRY_CONTEXT_MODULE_ACTION', 5) %>"

development:
  discussion_entry_context_module_action: "<%= ENV.fetch('DELAYED_JOB_DELAY_DISCUSSION_ENTRY_CONTEXT_MODULE_ACTION', 5) %>"
EOF
}

create_developer_keys() {
  cat << EOF > "${DEVELOPER_KEYS_FILE}"
# For customize Oauth2 confirm form
production:
  u_meeting_id: "<%= ENV.fetch('DEVELOPER_KEYS_U_MEETING_ID', 0) %>"
EOF
}

create_cache_store_config_file
create_cassandra_config_file
create_database_config_file
create_delayed_jobs_config_file
create_domain_config_file
create_dynamic_settings_config_file
create_file_store_config_file
create_outgoing_mail_config_file
create_predoc_config_file
create_redis_config_file
create_saml_config_file
create_security_config_file
create_session_store_config_file
create_passengerfile_file
create_passenger_nginx_configuration_template_file
create_logging_config_file
create_delayed_job_delay
create_developer_keys