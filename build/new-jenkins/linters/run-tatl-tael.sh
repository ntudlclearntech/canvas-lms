#!/bin/bash

set -x -o errexit -o errtrace -o nounset -o pipefail

docker-compose --file $(pwd)/docker-compose.new-jenkins.canvas.yml \
  run --name linter-tatl-tael --rm canvas bundle exec ruby script/tatl_tael
