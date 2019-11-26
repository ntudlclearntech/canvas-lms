#!/bin/bash

# Location
cd /var/canvas

# Compile assets
RAILS_ENV=development bundle exec rake canvas:compile_assets
