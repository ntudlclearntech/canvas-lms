#!/bin/bash

# This file contains commonly used BASH functions for scripting in canvas-lms,
# particularly script/canvas_update and script/rebase_canvas_and_plugins . As such,
# *be careful* when you modify these functions as doing so will impact multiple
# scripts that likely aren't used or tested in continuous integration builds.

if [[ -n "${COMMON_LIB_LOADED-}" ]]; then
     return
fi
COMMON_LIB_LOADED=i_am_here
BOLD="$(tput bold)"
NORMAL="$(tput sgr0)"

function create_log_file {
  if [ ! -f "$LOG" ]; then
    echo "" > "$LOG"
  fi
}

function echo_console_and_log {
  echo "$1" |tee -a "$LOG"
}

function print_results {
  exit_code=$?
  set +e

  if [ "${exit_code}" == "0" ]; then
    echo ""
    echo_console_and_log "  \o/ Success!"
    _canvas_lms_telemetry_report_status $exit_code
  else
    echo ""
    echo_console_and_log "  /o\ Something went wrong. Check ${LOG} for details."
    _canvas_lms_telemetry_report_status $exit_code
  fi

  exit ${exit_code}
}

function is_git_dir {
  [ "$(basename "$(git rev-parse --show-toplevel)")" == "$(basename "$(pwd)")" ]
}

# Parameter: the name of the script calling this function
function intro_message {
  script_name="$1"
  echo "Bringing Canvas up to date ..."
  echo "  Log file is $LOG"

  echo >>"$LOG"
  echo "-----------------------------" >>"$LOG"
  echo "$1 ($(date)):" >>"$LOG"
  echo "-----------------------------" >>"$LOG"
}

# If DOCKER var set true, run with docker-compose
function run_command {
  if [ "${DOCKER:-}" == 'y' ]; then
    docker-compose run --rm web "$@"
  else
    "$@"
  fi
}

function _canvas_lms_track {
  command="$@"
  if _canvas_lms_telemetry_enabled; then
    _inst_telemetry $command
  else
    $command
  fi
}

function _canvas_lms_track_with_log {
  command="$@"
  if _canvas_lms_telemetry_enabled; then
    _inst_telemetry_with_log $command
  else
    $command >> "$LOG" 2>&1
  fi
}

function _canvas_lms_telemetry_enabled() {
  if [[ "${TELEMETRY_OPT_IN-n}" == 'y' ]] && installed _inst_telemetry ; then
    return 0
  fi
  return 1
}

function _canvas_lms_opt_in_telemetry() {
  SCRIPT_NAME=$1
  LOG_FILE=$2
  if installed _canvas_lms_activate_telemetry; then
    _canvas_lms_activate_telemetry
    if installed _inst_setup_telemetry && _inst_setup_telemetry "canvas-lms:$SCRIPT_NAME"; then
      _inst_track_os
      if [[ ! -z "${LOG_FILE-}" ]]; then
        _inst_set_redirect_log_file "$LOG_FILE"
      fi
    fi
  fi
}

function installed {
  type "$@" &> /dev/null
}

function _canvas_lms_telemetry_report_status() {
  exit_status=$?
  if [[ ! -z ${1-} ]]; then
    exit_status=$1
  fi
  if installed _inst_report_status && _canvas_lms_telemetry_enabled; then
    _inst_report_status $exit_status
  fi
}

function prompt {
  read -r -p "$1 " "$2"
}

function message {
  echo ''
  echo "$BOLD> $*$NORMAL"
}

function confirm_command {
  if [ -z "${JENKINS-}" ]; then
    prompt "OK to run '$*'? [y/n]" confirm
    [[ ${confirm:-n} == 'y' ]] || return 1
  fi
  eval "$*"
}

function check_dependencies {
  local packages=()
  #check for proper docker-compose version
  if ! check_docker_compose_version; then
    message "docker-compose $DOCKER_COMPOSE_MIN_VERSION or higher is required."
    printf "\tPlease see %s for installation instructions.\n" "https://docs.docker.com/compose/install/"
    packages+=("docker-compose")
    docker_missing=1
  fi
  #check for required packages installed
  for package in $dependencies; do
    if ! installed "$package"; then
      packages+=("$package")
    fi
  done
  #if missing packages, print missing packages with install assistance.
  if [[ ${#packages[@]} -gt 0 ]]; then
    #when more dependencies get added, modify this output to include them.
    if [[ $OS == 'Linux' ]];then
      if [[ "${packages[*]}" =~ "dory" ]];then
        message "Some additional dependencies need to be installed for your OS."
        printf "\tCanvas recommends using dory for a reverse proxy allowing you to
\taccess canvas at http://canvas.docker. Detailed instructions
\tare available at https://github.com/FreedomBen/dory.
\tIf you want to install it, run 'gem install dory' then rerun this script.\n"
        [[ ${docker_missing:-0} == 1 ]] || prompt 'Would you like to skip dory? [y/n]' skip_dory
        [[ ${skip_dory:-n} != 'y' ]] || return 0
      fi
    elif [[ $OS == 'Darwin' ]];then
      message "Some additional dependencies need to be installed for your OS."
      printf -v joined '%s,' "${packages[@]}"
      echo "Please install ${joined%,}."
      printf "\tTry: %s %s\n" "$install" "${packages[*]}"
    else
      echo 'This script only supports MacOS and Linux :('
      exit 1
    fi
    printf "\nOnce all dependencies are installed, rerun this script.\n"
    exit 1
  fi
}

function check_docker_compose_version {
  if ! installed "docker-compose"; then
    return 1
  fi
  compose_version=$(eval docker-compose --version |grep -oE "[[:digit:]]+\.[[:digit:]]+\.[[:digit:]]+")
  if (( $(echo "$compose_version $DOCKER_COMPOSE_MIN_VERSION" | awk '{print ($1 < $2)}') )); then
    return 1
  fi
}

function display_next_steps {
  message "You're good to go! Next steps:"

  # shellcheck disable=SC2016
  [[ $OS == 'Darwin' ]] && echo '
  First, run:

    eval "$(dinghy env)"

  This will set up environment variables for docker to work with the dinghy VM.'

  [[ $OS == 'Linux' ]] && echo '
  I have added your user to the docker group so you can run docker commands
  without sudo. Note that this has security implications:

  https://docs.docker.com/engine/installation/linux/linux-postinstall/

  You may need to logout and login again for this to take effect.'

  echo "
  Running Canvas:

    docker-compose up -d
    open http://canvas.docker

  Running the tests:

    docker-compose run --rm web bundle exec rspec

   Running Selenium tests:

    add docker-compose/selenium.override.yml in the .env file
      echo ':docker-compose/selenium.override.yml' >> .env

    build the selenium container
      docker-compose build selenium-chrome

    run selenium
      docker-compose run --rm web bundle exec rspec spec/selenium

    Virtual network remote desktop sharing to selenium container
      for Firefox:
        $ open vnc://secret:secret@seleniumff.docker
      for chrome:
        $ open vnc://secret:secret@seleniumch.docker:5901

  I'm stuck. Where can I go for help?

    FAQ:           https://github.com/instructure/canvas-lms/wiki/FAQ
    Dev & Friends: http://instructure.github.io/
    Canvas Guides: https://guides.instructure.com/
    Vimeo channel: https://vimeo.com/canvaslms
    API docs:      https://canvas.instructure.com/doc/api/index.html
    Mailing list:  http://groups.google.com/group/canvas-lms-users
    IRC:           http://webchat.freenode.net/?channels=canvas-lms

    Please do not open a GitHub issue until you have tried asking for help on
    the mailing list or IRC - GitHub issues are for verified bugs only.
    Thanks and good luck!
  "
}
