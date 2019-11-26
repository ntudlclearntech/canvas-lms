#!/bin/bash

#Location
cd /var/canvas

mkdir -p log tmp/pids public/assets app/stylesheets/brandable_css_brands
touch log/development.log

# Change group
sudo chown -R canvasuser config/environment.rb log tmp public/assets app/stylesheets/brandable_css_brands Gemfile.lock config.ru
