#!/bin/bash
source script/common/utils/common.sh
source script/common/os/linux/impl.sh
source script/common/utils/dory_setup.sh
dependencies='docker,docker-compose 1.20.0'
DOCKER_COMMAND="docker-compose"

message "It looks like you're using Linux. Let's set that up."

if ! installed mutagen; then
  prompt "Would you like to use Mutagen for file synchronization? [y/n]" use_mutagen
  [[ ${use_mutagen:-y} == 'n' ]] || IS_MUTAGEN=true
fi

if installed mutagen || [ "${IS_MUTAGEN:-false}" = true ]; then
  print_mutagen_intro
  dependencies+=',mutagen 0.13.0,mutagen-compose'
  DOCKER_COMMAND="mutagen-compose"
  IS_MUTAGEN=true
fi

set_service_util
check_dependencies
check_for_dory
start_docker_daemon
setup_docker_as_nonroot
[[ ${skip_dory:-n} == 'y' ]] || start_dory
