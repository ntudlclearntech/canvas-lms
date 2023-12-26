#!/bin/bash

rm -rf public/dist/brandable_css/*
bundle exec rake brand_configs:write
bundle exec rake css:compile
