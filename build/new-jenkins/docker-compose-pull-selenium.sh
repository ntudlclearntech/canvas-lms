#!/bin/bash

set -x -o errexit -o errtrace -o nounset -o pipefail

# pull docker images (or build them if missing)
REGISTRY_BASE=starlord.inscloudgate.net/jenkins

./build/new-jenkins/docker-with-flakey-network-protection.sh pull $REGISTRY_BASE/selenium-chrome:"$SELENIUM_VERSION"

# pull canvas-rce-api here to avoid flakes, dependency of docker-compose.new-jenkins.selenium.yml
./build/new-jenkins/docker-with-flakey-network-protection.sh pull $BUILD_REGISTRY_FQDN/jenkins/canvas-rce-api
