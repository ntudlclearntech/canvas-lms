#! /bin/bash

# Tired of building canvas?
# now you can add a `image: instructure/canvas-lms:master` to your docker-compose.local.yml
# then just `docker-compose pull web`
# note if you do a `docker-compose build` it will try to build everything
# but if you do a `docker-compose up` it will just use the image you pulled down
# there is some weirdness to the way canvas is setup, that make this a little more
# difficult. We need to copy the Gemfile.lock from the container, and nuke stale
# volumes. You should be able to go while without pulling the new image down by
# running `bundle` and `yarn install` in your container after pulling
#
# ```yml
# version: '2'
# services:
#   web: &WEB
#     image: instructure/canvas-lms:master
#     build:
#       context: .
#   guard:
#     <<: *WEB
#   jobs:
#     <<: *WEB
#   webpack:
#     <<: *WEB
# ```
#

docker-compose down
docker-compose pull web
docker volume rm canvaslms_bundler canvaslms_canvas-docker-gems canvaslms_node_modules canvaslms_quizzes_node_modules canvaslms_selinimum_node_modules canvaslms_yarn-cache
docker run --rm instructure/canvas-lms:master cat Gemfile.lock > Gemfile.lock
docker-compose run --rm web bash -c "bundle; bundle exec rake db:migrate"
