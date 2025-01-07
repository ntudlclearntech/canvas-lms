FROM ubuntu:22.04

# Create app directory
WORKDIR /usr/workspace

#
# Avoid warnings by switching to noninteractive
ARG DEBIAN_FRONTEND=noninteractive

#
# Set up user for workspace permission
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=${USER_UID}

#
# Set up timezone
ARG TIME_ZONE=Asia/Taipei
RUN ln -snf /usr/share/zoneinfo/${TIME_ZONE} /etc/localtime \
  && echo ${TIME_ZONE} > /etc/timezone

#
# Install locales package and enable en_US.UTF-8 supported with locale-gen
RUN apt-get update \
  && apt-get install -y locales \
  && sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen \
  #
  # Remove apt cached data
  && apt-get autoremove -y \
  && apt-get clean -y \
  && rm -rf /var/lib/apt/lists/*
# Set up local ENV
# ref: build/Dockerfile.template 
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US.UTF-8
ENV LC_CTYPE=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8

#
# Set up runtime versions ARG and ENV
ARG NODE_VERSION=18
ENV NODE_OPTIONS=--openssl-legacy-provider
ARG YARN_VERSION=1.19.1
ARG PASSENGER_VERSION=6.0.19
ARG RUBY_VERSION=3.1
ARG BUNDLER_VERSION=2.4.19
ENV BUNDLER_VERSION=${BUNDLER_VERSION}

#
# Set up apt packages
# ref: Dockerfile.cool
ARG APT_RUBY_PPA_DEPS="software-properties-common"
ARG APT_RUBY_GEMS_DEPS="git tzdata automake build-essential libpq-dev libidn-dev libxmlsec1-dev libyaml-dev"
ARG APT_ADD_SOURCE_LIST_DEPS="dirmngr gnupg apt-transport-https ca-certificates curl"
ARG APT_QTIMIGRATION_DEPS="python-is-python3 python3-lxml python3-pygments"
ARG APT_APPLICATION_DEPS="file"
# Install some commands and tools for development
ARG APT_DEVELOPMENT_DEPS="apt-utils dialog wget vim less bash-completion procps lsb-release sudo"

# Configure apt and install packages
RUN apt-get update \
  #
  # Install apt dependencies at once for save install time
  && apt-get install -y 2>&1 \
    ${APT_RUBY_PPA_DEPS} \
    ${APT_RUBY_GEMS_DEPS} \
    ${APT_ADD_SOURCE_LIST_DEPS} \
    ${APT_QTIMIGRATION_DEPS} \
    ${APT_APPLICATION_DEPS} \
    ${APT_DEVELOPMENT_DEPS} \
  #
  # Install ruby and bundler
  # ref: Dockerfile.cool
  && add-apt-repository ppa:instructure/ruby && apt-get update \
  && apt-get install -y ruby${RUBY_VERSION} ruby${RUBY_VERSION}-dev \
  && gem install bundler:${BUNDLER_VERSION} \
  #
  # Install node.js and yarn
  # ref: Dockerfile.cool
  && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
  && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_VERSION}.x nodistro main" \
    | tee /etc/apt/sources.list.d/nodesource.list \
  && apt-get update \
  && apt-get install -y nodejs \
  && npm i -g yarn@${YARN_VERSION} \
  #
  # Create a non-root user to use if preferred
  && groupadd --force --gid ${USER_GID} ${USERNAME} \
  && useradd -s /bin/bash --uid ${USER_UID} --gid ${USER_GID} -m ${USERNAME} \
  && mkdir -p /home/${USERNAME}/.vscode-server/extensions \
  && mkdir -p /home/${USERNAME}/.vscode-server-insiders/extensions \
  && chown -R ${USER_UID}:${USER_GID} /home/${USERNAME}/.vscode-server* \
  #
  # Add sudo support for the non-root user
  && echo ${USERNAME} ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/${USERNAME}\
  && chmod 0440 /etc/sudoers.d/${USERNAME} \
  #
  # Remove apt cached data
  && apt-get autoremove -y \
  && apt-get clean -y \
  && rm -rf /var/lib/apt/lists/*

USER ${USERNAME}
