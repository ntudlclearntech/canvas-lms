#!/bin/bash

# Canvas dependencies (root permission)
sudo apt -y install software-properties-common
sudo add-apt-repository -y ppa:brightbox/ruby-ng && sudo apt update
sudo apt -y install ruby2.5 ruby2.5-dev zlib1g-dev libxml2-dev libsqlite3-dev postgresql libpq-dev libxmlsec1-dev curl make g++

# Location
cd /var/canvas

# Bundle install
sudo gem install bundler --version 1.13.6
# Do not run this with sudo
bundle _1.13.6_ install --path vendor/bundle
