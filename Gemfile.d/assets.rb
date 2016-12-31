group :development, :test do
  gem 'dress_code', '1.0.2', github: "colleenpalmer/dress_code"
    gem 'colored', '1.2', require: false
    gem 'mustache', '1.0.3', require: false
    gem 'pygments.rb', '1.1.1', require: false
  gem 'coffee-script', '2.4.1'
    gem 'execjs', '2.7.0', require: false
    gem 'coffee-script-source', '1.6.2' #pinned so everyone's compiled output matches
end
