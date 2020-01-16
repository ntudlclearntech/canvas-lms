#!/usr/bin/env groovy

/*
 * Copyright (C) 2019 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

def runCoverage() {
  def flags = load 'build/new-jenkins/groovy/commit-flags.groovy'
  return env.GERRIT_EVENT_TYPE == 'change-merged' || flags.forceRunCoverage() ? '1' : ''
}

def getImageTagVersion() {
  def flags = load 'build/new-jenkins/groovy/commit-flags.groovy'
  return flags.getImageTagVersion()
}

def copyTestFiles(name, tests_dir, coverage_dir) {
  sh "mkdir -p ./tmp/$name"
  sh "docker cp \$(docker ps -qa -f name=$name):/usr/src/app/$tests_dir ./tmp/$name"
  if (env.COVERAGE == "1") {
    sh "mkdir -p ./tmp/$name-coverage"
    sh "docker cp \$(docker ps -qa -f name=$name):/usr/src/app/$coverage_dir ./tmp/$name-coverage"
  }
}

pipeline {
  agent { label 'canvas-docker' }
  options {
    ansiColor('xterm')
  }

  environment {
    COMPOSE_FILE = 'docker-compose.new-jenkins-web.yml:docker-compose.new-jenkins-karma.yml'
    COVERAGE = runCoverage()
    NAME = getImageTagVersion()
    PATCHSET_TAG = "$DOCKER_REGISTRY_FQDN/jenkins/canvas-lms:$NAME"
    SENTRY_URL="https://sentry.insops.net"
    SENTRY_ORG="instructure"
    SENTRY_PROJECT="master-javascript-build"
  }
  stages {
    stage('Pre-Cleanup') {
      steps {
        timeout(time: 2) {
          sh 'build/new-jenkins/docker-cleanup.sh'
        }
      }
    }
    stage('Tests Setup') {
      steps {
        timeout(time: 60) {
          echo 'Running containers'
          sh 'docker ps'
          sh 'printenv | sort'
          sh 'build/new-jenkins/docker-compose-pull.sh'
          sh 'build/new-jenkins/docker-compose-build-up.sh'
          sh 'rm -rf ./tmp/*'
        }
      }
    }
    stage('Tests') {
      parallel {
        stage('Jest') {
          environment {
            CONTAINER_NAME = 'tests-jest'
          }
          steps {
            sh 'build/new-jenkins/js/tests-jest.sh'
          }
          post {
            always {
              copyTestFiles(env.CONTAINER_NAME, 'coverage-js', 'coverage-jest')
            }
          }
        }
        stage('Packages') {
          environment {
            CONTAINER_NAME = 'tests-packages'
          }
          steps {
            sh 'build/new-jenkins/js/tests-packages.sh'
          }
          post {
            always {
              copyTestFiles(env.CONTAINER_NAME, 'packages', 'packages')
            }
          }
        }
        stage('canvas_quizzes') {
          steps {
            sh 'build/new-jenkins/js/tests-quizzes.sh'
          }
        }
        stage('Karma - Spec Group - coffee') {
          environment {
            JSPEC_GROUP = 'coffee'
            CONTAINER_NAME = 'tests-karma-coffee'
          }
          steps {
            sh 'build/new-jenkins/js/tests-karma.sh'
          }
          post {
            always {
              copyTestFiles(env.CONTAINER_NAME, 'coverage-js', 'coverage-karma')
            }
          }
        }
        stage('Karma - Spec Group - jsa - A-F') {
          environment {
            JSPEC_GROUP = 'jsa'
            CONTAINER_NAME = 'tests-karma-jsa'
          }
          steps {
            sh 'build/new-jenkins/js/tests-karma.sh'
          }
          post {
            always {
              copyTestFiles(env.CONTAINER_NAME, 'coverage-js', 'coverage-karma')
            }
          }
        }
        stage('Karma - Spec Group - jsg - G') {
          environment {
            JSPEC_GROUP = 'jsg'
            CONTAINER_NAME = 'tests-karma-jsg'
          }
          steps {
            sh 'build/new-jenkins/js/tests-karma.sh'
          }
          post {
            always {
              copyTestFiles(env.CONTAINER_NAME, 'coverage-js', 'coverage-karma')
            }
          }
        }
        stage('Karma - Spec Group - jsh - H-Z') {
          environment {
            JSPEC_GROUP = 'jsh'
            CONTAINER_NAME = 'tests-karma-jsh'
          }
          steps {
            sh 'build/new-jenkins/js/tests-karma.sh'
          }
          post {
            always {
              copyTestFiles(env.CONTAINER_NAME, 'coverage-js', 'coverage-karma')
            }
          }
        }
      }
    }
    stage('Upload Coverage') {
      when { expression { env.COVERAGE == '1' } }
      steps {
        timeout(time: 10) {
          sh 'build/new-jenkins/js/coverage-report.sh'
          archiveArtifacts(artifacts: 'coverage-report-js/**/*')
          uploadCoverage([
              uploadSource: "/coverage-report-js/report-html",
              uploadDest: "canvas-lms-js/coverage"
          ])
        }
      }
    }
  }
  post {
    always {
      script {
        junit allowEmptyResults: true, testResults: 'tmp/**/*.xml'
        sh 'find ./tmp -path "*.xml"'
      }
    }
    cleanup {
      sh 'build/new-jenkins/docker-cleanup.sh --allow-failure'
    }
  }
}
