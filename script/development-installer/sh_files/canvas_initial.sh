#!/bin/bash

# Location
cd /var/canvas

# Canvas initail
RAILS_ENV=development bundle exec rake db:initial_setup
