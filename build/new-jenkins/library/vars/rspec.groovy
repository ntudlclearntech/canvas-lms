/*
 * Copyright (C) 2020 - present Instructure, Inc.
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

def runSeleniumSuite(total, index) {
  _runRspecTestSuite(
      total,
      index,
      'docker-compose.new-jenkins.yml:docker-compose.new-jenkins-selenium.yml',
      'selenium',
      configuration.getInteger('selenium-rerun-retry'),
      '^./(spec|gems/plugins/.*/spec_canvas)/selenium',
      '.*/performance',
      '3',
      configuration.isForceFailureSelenium() ? '1' : ''
  )
}

def runRSpecSuite(total, index) {
  _runRspecTestSuite(
      total,
      index,
      'docker-compose.new-jenkins.yml',
      'rspec',
      configuration.getInteger('rspec-rerun-retry'),
      '^./(spec|gems/plugins/.*/spec_canvas)/',
      '.*/(selenium|contracts)',
      '4',
      configuration.isForceFailureRSpec() ? '1' : ''
  )
}

def _runRspecTestSuite(
    total,
    index,
    compose,
    prefix,
    rerunsRetry,
    testFilePattern,
    excludeRegex,
    rspecProcesses,
    forceFailure
) {
  withEnv([
      "CI_NODE_INDEX=$index",
      "COMPOSE_FILE=$compose",
      "RERUNS_RETRY=$rerunsRetry",
      "TEST_PATTERN=$testFilePattern",
      "EXCLUDE_TESTS=$excludeRegex",
      "CI_NODE_TOTAL=$total",
      "RSPEC_PROCESSES=$rspecProcesses",
      "FORCE_FAILURE=$forceFailure",
      'POSTGRES_PASSWORD=sekret',
      'SELENIUM_VERSION=3.141.59-20201119',
      "ENABLE_AXE_SELENIUM=${env.ENABLE_AXE_SELENIUM}",
  ]) {
    try {
      sh 'rm -rf ./tmp && mkdir -p tmp'
      timeout(time: 15) {
        credentials.withStarlordDockerLogin { ->
          sh(script: 'build/new-jenkins/docker-compose-pull.sh', label: 'Pull Images')
        }
        sh(script: 'build/new-jenkins/docker-compose-build-up.sh', label: 'Start Containers')
        sh(script: 'docker-compose exec -T -e RSPEC_PROCESSES -e ENABLE_AXE_SELENIUM canvas bash -c \'build/new-jenkins/rspec-with-retries.sh\'', label: 'Run Tests')
      }
    } catch (org.jenkinsci.plugins.workflow.steps.FlowInterruptedException e) {
      if (e.causes[0] instanceof org.jenkinsci.plugins.workflow.steps.TimeoutStepExecution.ExceededTimeout) {
        sh '''#!/bin/bash
          ids=( $(docker ps -aq --filter "name=canvas_") )
          for i in "${ids[@]}"
          do
            docker exec $i bash -c "cat /usr/src/app/log/cmd_output/*.log"
          done
        '''
      }

      throw e
    } finally {
      // copy spec failures to local
      sh "build/new-jenkins/docker-copy-files.sh /usr/src/app/log/spec_failures/ tmp/spec_failures/$prefix canvas_ --allow-error --clean-dir"
      sh 'build/new-jenkins/docker-copy-files.sh /usr/src/app/log/results tmp/rspec_results canvas_ --allow-error --clean-dir'

      if (configuration.getBoolean('upload-docker-logs', 'false')) {
        sh "docker ps -aq | xargs -I{} -n1 -P1 docker logs --timestamps --details {} 2>&1 > tmp/docker-${prefix}-${index}.log"
        archiveArtifacts(artifacts: "tmp/docker-${prefix}-${index}.log")
      }

      archiveArtifacts allowEmptyArchive: true, artifacts: "tmp/spec_failures/$prefix/**/*"
      findFiles(glob: "tmp/spec_failures/$prefix/**/index.html").each { file ->
        // node_18/spec_failures/canvas__9224fba6fc34/spec_failures/Initial/spec/selenium/force_failure_spec.rb:20/index
        // split on the 5th to give us the rerun category (Initial, Rerun_1, Rerun_2...)

        def pathCategory = file.getPath().split('/')[5]
        def finalCategory = reruns_retry.toInteger() == 0 ? 'Initial' : "Rerun_${reruns_retry.toInteger()}"
        def splitPath = file.getPath().split('/').toList()
        def specTitle = splitPath.subList(6, splitPath.size() - 1).join('/')
        def artifactsPath = "../artifact/${file.getPath()}"

        buildSummaryReport.addFailurePath(specTitle, artifactsPath, pathCategory)

        if (pathCategory == finalCategory) {
          buildSummaryReport.setFailureCategory(specTitle, buildSummaryReport.FAILURE_TYPE_TEST_NEVER_PASSED)
        } else {
          buildSummaryReport.setFailureCategoryUnlessExists(specTitle, buildSummaryReport.FAILURE_TYPE_TEST_PASSED_ON_RETRY)
        }
      }

      // junit publishing will set build status to unstable if failed tests found, if so set it back to the original value
      def preStatus = currentBuild.rawBuild.@result

      junit allowEmptyResults: true, testResults: 'tmp/rspec_results/**/*.xml'

      if (currentBuild.getResult() == 'UNSTABLE' && preStatus != 'UNSTABLE') {
        currentBuild.rawBuild.@result = preStatus
      }

      if (env.RSPEC_LOG == '1') {
        sh 'build/new-jenkins/docker-copy-files.sh /usr/src/app/log/parallel_runtime/ ./tmp/parallel_runtime_rspec_tests canvas_ --allow-error --clean-dir'
        archiveArtifacts(artifacts: 'tmp/parallel_runtime_rspec_tests/**/*.log')
      }

      sh 'rm -rf ./tmp'
    }
  }
}

return this
