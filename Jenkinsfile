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
import org.jenkinsci.plugins.workflow.support.steps.build.DownstreamFailureCause
import org.jenkinsci.plugins.workflow.steps.FlowInterruptedException

def buildParameters = [
  string(name: 'GERRIT_REFSPEC', value: "${env.GERRIT_REFSPEC}"),
  string(name: 'GERRIT_EVENT_TYPE', value: "${env.GERRIT_EVENT_TYPE}"),
  string(name: 'GERRIT_PROJECT', value: "${env.GERRIT_PROJECT}"),
  string(name: 'GERRIT_BRANCH', value: "${env.GERRIT_BRANCH}"),
  string(name: 'GERRIT_CHANGE_NUMBER', value: "${env.GERRIT_CHANGE_NUMBER}"),
  string(name: 'GERRIT_PATCHSET_NUMBER', value: "${env.GERRIT_PATCHSET_NUMBER}"),
  string(name: 'GERRIT_EVENT_ACCOUNT_NAME', value: "${env.GERRIT_EVENT_ACCOUNT_NAME}"),
  string(name: 'GERRIT_EVENT_ACCOUNT_EMAIL', value: "${env.GERRIT_EVENT_ACCOUNT_EMAIL}"),
  string(name: 'GERRIT_CHANGE_COMMIT_MESSAGE', value: "${env.GERRIT_CHANGE_COMMIT_MESSAGE}"),
  string(name: 'GERRIT_HOST', value: "${env.GERRIT_HOST}"),
  string(name: 'GERGICH_PUBLISH', value: "${env.GERGICH_PUBLISH}"),
  string(name: 'MASTER_BOUNCER_RUN', value: "${env.MASTER_BOUNCER_RUN}")
]

library "canvas-builds-library"

def runDatadogMetric(name, body) {
  def dd = load('build/new-jenkins/groovy/datadog.groovy')
  dd.runDataDogForMetric(name,body)
}

def skipIfPreviouslySuccessful(name, block) {
   runDatadogMetric(name) {
    def successes = load('build/new-jenkins/groovy/successes.groovy')
    successes.skipIfPreviouslySuccessful(name, true, block)
  }
}

def wrapBuildExecution(jobName, parameters, propagate, urlExtra) {
  try {
    build(job: jobName, parameters: parameters, propagate: propagate)
  }
  catch(FlowInterruptedException ex) {
    // if its this type, then that means its a build failure.
    // other reasons can be user cancelling or jenkins aborting, etc...
    def failure = ex.causes.find { it instanceof DownstreamFailureCause }
    if (failure != null) {
      def downstream = failure.getDownstreamBuild()
      def url = downstream.getAbsoluteUrl() + urlExtra
      load('build/new-jenkins/groovy/reports.groovy').appendFailMessageReport(jobName, url)
    }
    throw ex
  }
}

// if the build never starts or gets into a node block, then we
// can never load a file. and a very noisy/confusing error is thrown.
def ignoreBuildNeverStartedError(block) {
  try {
    block()
  }
  catch (org.jenkinsci.plugins.workflow.steps.MissingContextVariableException ex) {
    if (!ex.message.startsWith('Required context class hudson.FilePath is missing')) {
      throw ex
    }
    else {
      echo "ignored MissingContextVariableException: \n${ex.message}"
    }
    // we can ignore this very noisy error
  }
}

// ignore builds where the current patchset tag doesn't match the
// mainline publishable tag. i.e. ignore ruby-passenger-2.6/pg-12
// upgrade builds
def isPatchsetPublishable() {
  env.PATCHSET_TAG == env.PUBLISHABLE_TAG
}

def isPatchsetSlackableOnFailure() {
  env.SLACK_MESSAGE_ON_FAILURE == 'true' && env.GERRIT_EVENT_TYPE == 'change-merged'
}

pipeline {
  agent { label 'canvas-docker' }
  options {
    ansiColor('xterm')
    timestamps()
  }

  environment {
    GERRIT_PORT = '29418'
    GERRIT_URL = "$GERRIT_HOST:$GERRIT_PORT"
    NAME = imageTagVersion()
    CANVAS_LMS_IMAGE = "$DOCKER_REGISTRY_FQDN/jenkins/canvas-lms"
    BUILD_REGISTRY_FQDN = configuration.buildRegistryFQDN()
    BUILD_IMAGE = "$BUILD_REGISTRY_FQDN/jenkins/canvas-lms"
    POSTGRES = configuration.postgres()
    RUBY_PASSENGER = configuration.rubyPassenger()

    // e.g. postgres-9.5-ruby-passenger-2.6
    TAG_SUFFIX = "postgres-$POSTGRES-ruby-passenger-$RUBY_PASSENGER"

    // this is found in the PUBLISHABLE_TAG_SUFFIX config file on jenkins
    PUBLISHABLE_TAG_SUFFIX = configuration.publishableTagSuffix()

    // e.g. canvas-lms:01.123456.78-postgres-12-ruby-passenger-2.6
    PATCHSET_TAG = "$BUILD_IMAGE:$NAME-$TAG_SUFFIX"

    // e.g. canvas-lms:01.123456.78-postgres-9.5-ruby-passenger-2.6
    PUBLISHABLE_TAG = "$BUILD_IMAGE:$NAME-$PUBLISHABLE_TAG_SUFFIX"

    // e.g. canvas-lms:master when not on another branch
    MERGE_TAG = "$CANVAS_LMS_IMAGE:$GERRIT_BRANCH"

    // e.g. canvas-lms:01.123456.78; this is for consumers like Portal 2 who want to build a patchset
    EXTERNAL_TAG = "$CANVAS_LMS_IMAGE:$NAME"
  }

  stages {
    stage('Setup') {
      steps {
        timeout(time: 5) {
          script {
            runDatadogMetric("Setup") {
              cleanAndSetup()

              buildParameters += string(name: 'PATCHSET_TAG', value: "${env.PATCHSET_TAG}")
              buildParameters += string(name: 'POSTGRES', value: "${env.POSTGRES}")
              buildParameters += string(name: 'RUBY_PASSENGER', value: "${env.RUBY_PASSENGER}")
              if (env.CANVAS_LMS_REFSPEC) {
                // the plugin builds require the canvas lms refspec to be different. so only
                // set this refspec if the main build is requesting it to be set.
                // NOTE: this is only being set in main-from-plugin build. so main-canvas wont run this.
                buildParameters += string(name: 'CANVAS_LMS_REFSPEC', value: env.CANVAS_LMS_REFSPEC)
              }

              pullGerritRepo('gerrit_builder', 'master', '.')
              gems = readFile('gerrit_builder/canvas-lms/config/plugins_list').split()
              echo "Plugin list: ${gems}"
              /* fetch plugins */
              gems.each { gem ->
                if (env.GERRIT_PROJECT == gem) {
                  /* this is the commit we're testing */
                  pullGerritRepo(gem, env.GERRIT_REFSPEC, 'gems/plugins')
                } else {
                  pullGerritRepo(gem, 'master', 'gems/plugins')
                }
              }
              pullGerritRepo("qti_migration_tool", "master", "vendor")

              sh 'mv -v gerrit_builder/canvas-lms/config/* config/'
              sh 'rm -v config/cache_store.yml'
              sh 'rm -vr gerrit_builder'
              sh 'rm -v config/database.yml'
              sh 'rm -v config/security.yml'
              sh 'rm -v config/selenium.yml'
              sh 'rm -v config/file_store.yml'
              sh 'cp -v docker-compose/config/selenium.yml config/'
              sh 'cp -vR docker-compose/config/new-jenkins/* config/'
              sh 'cp -v config/delayed_jobs.yml.example config/delayed_jobs.yml'
              sh 'cp -v config/domain.yml.example config/domain.yml'
              sh 'cp -v config/external_migration.yml.example config/external_migration.yml'
              sh 'cp -v config/outgoing_mail.yml.example config/outgoing_mail.yml'
            }
          }
        }
      }
    }

    stage('Rebase') {
      when { expression { env.GERRIT_EVENT_TYPE == 'patchset-created' && env.GERRIT_PROJECT == 'canvas-lms' } }
      steps {
        timeout(time: 2) {
          script {
            runDatadogMetric("Rebase") {
              credentials.withGerritCredentials({ ->
                sh '''#!/bin/bash
                  set -o errexit -o errtrace -o nounset -o pipefail -o xtrace

                  GIT_SSH_COMMAND='ssh -i \"$SSH_KEY_PATH\" -l \"$SSH_USERNAME\"' \
                    git fetch origin $GERRIT_BRANCH:origin/$GERRIT_BRANCH

                  git config user.name "$GERRIT_EVENT_ACCOUNT_NAME"
                  git config user.email "$GERRIT_EVENT_ACCOUNT_EMAIL"

                  # this helps current build issues where cleanup is needed before proceeding.
                  # however the later git rebase --abort should be enough once this has
                  # been on jenkins for long enough to hit all nodes, maybe a couple days?
                  if [ -d .git/rebase-merge ]; then
                    echo "A previous build's rebase failed and the build exited without cleaning up. Aborting the previous rebase now..."
                    git rebase --abort
                    git checkout $GERRIT_REFSPEC
                  fi

                  # store exit_status inline to  ensures the script doesn't exit here on failures
                  git rebase --preserve-merges origin/$GERRIT_BRANCH; exit_status=$?
                  if [ $exit_status != 0 ]; then
                    echo "Warning: Rebase couldn't resolve changes automatically, please resolve these conflicts locally."
                    git rebase --abort
                    exit $exit_status
                  fi
                '''
              })
            }
          }
        }
      }
    }

    stage ('Build Docker Image') {
      steps {
        timeout(time: 36) { /* this timeout is `2 * average build time` which currently: 18m * 2 = 36m */
          skipIfPreviouslySuccessful('docker-build-and-push') {
            script {
              if (configuration.getBoolean('skip-docker-build')) {
                sh './build/new-jenkins/docker-with-flakey-network-protection.sh pull $MERGE_TAG'
                sh 'docker tag $MERGE_TAG $PATCHSET_TAG'
              }
              else {
                if (!configuration.getBoolean('skip-cache')) {
                  sh './build/new-jenkins/docker-with-flakey-network-protection.sh pull $MERGE_TAG || true'
                }
                sh """
                  docker build \
                    --tag $PATCHSET_TAG \
                    --build-arg RUBY_PASSENGER=$RUBY_PASSENGER \
                    --build-arg POSTGRES_VERSION=$POSTGRES \
                    .
                """
              }
              sh "./build/new-jenkins/docker-with-flakey-network-protection.sh push $PATCHSET_TAG"
              if (isPatchsetPublishable()) {
                sh 'docker tag $PATCHSET_TAG $EXTERNAL_TAG'
                sh './build/new-jenkins/docker-with-flakey-network-protection.sh push $EXTERNAL_TAG'
              }
            }
          }
        }
      }
    }

    stage('Parallel Run Tests') {
      steps {
        script {
          def stages = [:]
          if (env.GERRIT_EVENT_TYPE != 'change-merged' && env.GERRIT_PROJECT == 'canvas-lms') {
            echo 'adding Linters'
            stages['Linters'] = {
              skipIfPreviouslySuccessful("linters") {
                credentials.withGerritCredentials {
                  sh 'build/new-jenkins/linters/run-gergich.sh'
                }
                if (env.MASTER_BOUNCER_RUN == '1' && env.GERRIT_EVENT_TYPE == 'patchset-created') {
                  credentials.withMasterBouncerCredentials {
                    sh 'build/new-jenkins/linters/run-master-bouncer.sh'
                  }
                }
              }
            }
          }

          echo 'adding Consumer Smoke Test'
          stages['Consumer Smoke Test'] = {
            skipIfPreviouslySuccessful("consumer-smoke-test") {
              sh 'build/new-jenkins/consumer-smoke-test.sh'
            }
          }

          echo 'adding Vendored Gems'
          stages['Vendored Gems'] = {
            skipIfPreviouslySuccessful("vendored-gems") {
              wrapBuildExecution('/Canvas/test-suites/vendored-gems', buildParameters, true, "")
            }
          }

          echo 'adding Javascript (Jest)'
          stages['Javascript (Jest)'] = {
            skipIfPreviouslySuccessful("javascript_jest") {
              wrapBuildExecution('/Canvas/test-suites/JS', buildParameters + [
                string(name: 'TEST_SUITE', value: "jest"),
              ], true, "testReport")
            }
          }

          echo 'adding Javascript (Karma)'
          stages['Javascript (Karma)'] = {
            skipIfPreviouslySuccessful("javascript_karma") {
              wrapBuildExecution('/Canvas/test-suites/JS', buildParameters + [
                string(name: 'TEST_SUITE', value: "karma"),
              ], true, "testReport")
            }
          }

          echo 'adding Contract Tests'
          stages['Contract Tests'] = {
            skipIfPreviouslySuccessful("contract-tests") {
              wrapBuildExecution('/Canvas/test-suites/contract-tests', buildParameters, true, "")
            }
          }

          if (env.GERRIT_EVENT_TYPE != 'change-merged') {
            echo 'adding Flakey Spec Catcher'
            stages['Flakey Spec Catcher'] = {
              skipIfPreviouslySuccessful("flakey-spec-catcher") {
                def propagate = configuration.fscPropagate()
                echo "fsc propagation: $propagate"
                wrapBuildExecution('/Canvas/test-suites/flakey-spec-catcher', buildParameters, propagate, "")
              }
            }
          }

          // // keep this around in case there is changes to the subbuilds that need to happen
          // // and you have no other way to test it except by running a test build.
          // stages['Test Subbuild'] = {
          //   skipIfPreviouslySuccessful("test-subbuild") {
          //     build(job: '/Canvas/proofs-of-concept/test-subbuild', parameters: buildParameters)
          //   }
          // }

          // // Don't run these on all patch sets until we have them ready to report results.
          // // Uncomment stage to run when developing.
          // stages['Xbrowser'] = {
          //   skipIfPreviouslySuccessful("xbrowser") {
          //     build(job: '/Canvas/proofs-of-concept/xbrowser', propagate: false, parameters: buildParameters)
          //   }
          // }

          def distribution = load 'build/new-jenkins/groovy/distribution.groovy'
          distribution.stashBuildScripts()

          distribution.addRSpecSuites(stages)
          distribution.addSeleniumSuites(stages)

          parallel(stages)
        }
      }
    }

    stage('Publish Image on Merge') {
      when {
        allOf {
          expression { isPatchsetPublishable() }
          expression { env.GERRIT_EVENT_TYPE == 'change-merged' }
        }
      }
      steps {
        timeout(time: 10) {
          script {
            runDatadogMetric("publishImageOnMerge") {
              // Retriggers won't have an image to tag/push, pull that
              // image if doesn't exist. If image is not found it will
              // return NULL
              if (!sh (script: 'docker images -q $PATCHSET_TAG')) {
                sh './build/new-jenkins/docker-with-flakey-network-protection.sh pull $PATCHSET_TAG'
              }

              // publish canvas-lms:$GERRIT_BRANCH (i.e. canvas-lms:master)
              sh 'docker tag $PUBLISHABLE_TAG $MERGE_TAG'
              // push *all* canvas-lms images (i.e. all canvas-lms prefixed tags)
              sh './build/new-jenkins/docker-with-flakey-network-protection.sh push $MERGE_TAG'
            }
          }
        }
      }
    }

    stage('Dependency Check') {
      when { expression { env.GERRIT_EVENT_TYPE == 'change-merged' } }
      steps {
        script {
            runDatadogMetric("dependencyCheck") {
              def reports = load 'build/new-jenkins/groovy/reports.groovy'
              reports.snykCheckDependencies("$PATCHSET_TAG", "/usr/src/app/")
            }
        }
      }
    }

    stage('Mark Build as Successful') {
      steps {
        script {
          runDatadogMetric("markBuildAsSuccessful") {
            def successes = load 'build/new-jenkins/groovy/successes.groovy'
            successes.markBuildAsSuccessful()
          }
        }
      }
    }
  }

  post {
    failure {
      script {
        if (isPatchsetSlackableOnFailure()) {
          def branchSegment = env.GERRIT_BRANCH ? "[$env.GERRIT_BRANCH]" : ''
          def authorSlackId = env.GERRIT_EVENT_ACCOUNT_EMAIL ? slackUserIdFromEmail(email: env.GERRIT_EVENT_ACCOUNT_EMAIL, botUser: true, tokenCredentialId: 'slack-user-id-lookup') : ''
          def authorSlackMsg = authorSlackId ? "<@$authorSlackId>" : env.GERRIT_EVENT_ACCOUNT_NAME
          def authorSegment = authorSlackMsg ? "Patchset by ${authorSlackMsg}. " : ''
          slackSend(
            channel: '#canvas_builds',
            color: 'danger',
            message: "${branchSegment}${env.JOB_NAME} failed on merge. ${authorSegment}(<${env.BUILD_URL}|${env.BUILD_NUMBER}>)"
          )
        }
      }
    }
    always {
      script {
        ignoreBuildNeverStartedError {
          def rspec = load 'build/new-jenkins/groovy/rspec.groovy'
          rspec.uploadJunitReports()
          rspec.uploadSeleniumFailures()
          rspec.uploadRSpecFailures()
          load('build/new-jenkins/groovy/reports.groovy').sendFailureMessageIfPresent()
          def splunk = load 'build/new-jenkins/groovy/splunk.groovy'
          splunk.upload([splunk.eventForBuildDuration(currentBuild.duration)])
        }
      }
    }
    cleanup {
      ignoreBuildNeverStartedError {
        execute 'bash/docker-cleanup.sh --allow-failure'
      }
    }
  }
}
