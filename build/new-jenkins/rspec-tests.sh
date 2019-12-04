#!/bin/bash

set -x -o errexit -o errtrace -o nounset -o pipefail

if [ "${1-}" = 'only-failures' ]; then
  docker-compose exec -T web bundle exec rake 'knapsack:rspec[--options spec/spec.opts --failure-exit-code 99 --only-failures]'
else
  docker-compose exec -T web bundle exec rake 'knapsack:rspec[--options spec/spec.opts --failure-exit-code 99]'
fi
