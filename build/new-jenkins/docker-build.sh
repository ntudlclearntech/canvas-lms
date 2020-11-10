#!/usr/bin/env bash

set -o errexit -o errtrace -o nounset -o pipefail -o xtrace

WORKSPACE=${WORKSPACE:-$(pwd)}

DOCKER_BUILDKIT=1 docker build --file Dockerfile.jenkins-cache --tag "local/cache-helper-collect-gems" --target cache-helper-collect-gems "$WORKSPACE"
DOCKER_BUILDKIT=1 docker build --file Dockerfile.jenkins-cache --tag "local/cache-helper-collect-yarn" --target cache-helper-collect-yarn "$WORKSPACE"
DOCKER_BUILDKIT=1 docker build --file Dockerfile.jenkins-cache --tag "local/cache-helper-collect-webpack" --target cache-helper-collect-webpack "$WORKSPACE"

# shellcheck disable=SC2086
docker pull $WEBPACK_BUILDER_TAG || true
docker pull $CACHE_TAG || true
docker pull instructure/ruby-passenger:$RUBY

# Buildkit pulls the manifest directly from the server to avoid downloading
# the whole image. This path seems to have an issue on CI systems where the
# layers will intermittently not be reused. Usually it happens when it pulls
# the entire instructure/ruby-passenger manifest. Normal docker has a different
# code path that doesn't reproduce the error, so we skip using Buildkit here.
docker build \
  --build-arg CANVAS_RAILS6_0=${CANVAS_RAILS6_0:-0} \
  --build-arg POSTGRES_CLIENT="$POSTGRES_CLIENT" \
  --build-arg RUBY="$RUBY" \
  --cache-from $WEBPACK_BUILDER_TAG \
  --file Dockerfile.jenkins \
  --tag "local/webpack-builder" \
  "$WORKSPACE"

docker build \
  --build-arg COMPILE_ADDITIONAL_ASSETS="$COMPILE_ADDITIONAL_ASSETS" \
  --build-arg JS_BUILD_NO_UGLIFY="$JS_BUILD_NO_UGLIFY" \
  --cache-from $CACHE_TAG \
  --file Dockerfile.jenkins.webpack-runner \
  --tag "$1" \
  "$WORKSPACE"
