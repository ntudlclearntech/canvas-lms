if Rails.env.development?
  Rails.application.configure do
    config.lograge.enabled = true
  end
end
