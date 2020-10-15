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

def stashSpecCoverage(prefix, index) {
  dir("tmp") {
    stash name: "${prefix}_spec_coverage_${index}", includes: 'spec_coverage/**/*'
  }
}

def cleanupCoverage(prefix) {
  sh 'rm -vrf ./coverage_nodes'
  sh 'rm -vrf ./coverage'
  sh "rm -vrf coverage_nodes ${prefix}_coverage_nodes"
  sh "rm -vrf coverage ${prefix}_coverage"
}

def publishSpecCoverageToS3(prefix, ci_node_total, coverage_type) {
  echo "publishing coverage for $coverage_type: $ci_node_total for $prefix"

  cleanupCoverage(prefix)

  // get all the data for the report
  dir('coverage_nodes') {
    for(int index = 0; index < ci_node_total; index++) {
      dir("node_${index}") {
        unstash "${prefix}_spec_coverage_${index}"
      }
    }
  }

  // build the report
  sh './build/new-jenkins/rspec-coverage-report.sh'

  // upload to s3
  uploadCoverage([
      uploadSource: "/coverage",
      uploadDest: "$coverage_type/coverage"
  ])

  // archive for debugging
  sh "mv coverage_nodes ${prefix}_coverage_nodes"
  sh "mv coverage ${prefix}_coverage"
  archiveArtifacts(artifacts: "${prefix}_coverage_nodes/**")
  archiveArtifacts(artifacts: "${prefix}_coverage/**")

  cleanupCoverage(prefix)
}

// this method is to ensure that the stashing is done in a way that
// is expected in publishSpecFailuresAsHTML
def stashSpecFailures(prefix, index) {
  dir("tmp") {
    stash name: "${prefix}_spec_failures_${index}", includes: 'spec_failures/**/*', allowEmpty: true
  }
}

def stashParallelLogs(prefix, index) {
  dir("tmp") {
    stash name: "${prefix}_spec_parallel_${index}", includes: 'parallel_runtime_rspec_tests/**/*.log'
  }
}

def publishSpecFailuresAsHTML(prefix, ci_node_total, report_title) {
  def htmlFiles
  def failureCategories
  def working_dir = "${prefix}_compiled_failures"
  sh "rm -vrf ./$working_dir"
  sh "mkdir -p $working_dir"

  dir(working_dir) {
    for(int index = 0; index < ci_node_total; index++) {
      dir ("node_${index}") {
        try {
          unstash "${prefix}_spec_failures_${index}"
        } catch(err) {
          println (err)
        }
      }
    }
    htmlFiles = findFiles glob: '**/index.html'
    failureCategories = buildFailureCategories(htmlFiles)
    buildIndexPage(failureCategories)
    htmlFiles = findFiles glob: '**/index.html'
  }

  def report_name = "spec-failure-$prefix"
  def report_url = "${BUILD_URL}${report_name}"
  archiveArtifacts(artifacts: "$working_dir/**")
  publishHTML target: [
    allowMissing: false,
    alwaysLinkToLastBuild: false,
    keepAll: true,
    reportDir: working_dir,
    reportFiles: htmlFiles.join(','),
    reportName: report_name,
    reportTitles: report_title
  ]
  sh "rm -vrf ./$working_dir"
  return report_url
}

def buildFailureCategories(htmlFiles) {
  Map<String, List<String>> failureCategories = [:]
  if (htmlFiles.size() > 0) {
    htmlFiles.each { file ->
      // node_18/spec_failures/canvas__9224fba6fc34/spec_failures/Initial/spec/selenium/force_failure_spec.rb:20/index
      // split on the 5th to give us the rerun category (Initial, Rerun_1, Rerun_2...)
      def category = file.getPath().split("/")[4]
      if (!failureCategories.containsKey(category)) {
        failureCategories[category] = []
      }
      failureCategories[category] += file
    }
  }
  return failureCategories
}

def buildIndexPage(failureCategories) {
  def indexHtml = "<body style=\"font-family:sans-serif;line-height:1.25;font-size:14px\">"
  if (failureCategories.size() < 1) {
    indexHtml += "\\o/ yay good job, no failures"
  } else {
    failureCategories.each {category, failures ->
      indexHtml += "<h1>${category} Failures</h1>"
      failures.each { failure ->
        def spec = (failure =~ /.*spec_failures\/(.*)\/index/)[0][1]
        indexHtml += "<a href=\"${failure}\">${spec}</a><br>"
      }
    }
  }
  indexHtml += "</body>"
  writeFile file: "index.html", text: indexHtml
}

def copyParallelLogs(rspecTotal, seleniumTotal) {
  dir('parallel_logs') {
    for(int index = 0; index < rspecTotal; index++) {
      dir("rspec_node_${index}") {
        try {
          unstash "rspec_spec_parallel_${index}"
        } catch(err) {
          println (err)
        }
      }
    }
    for(int index = 0; index < seleniumTotal; index++) {
      dir("selenium_node_${index}") {
        try {
          unstash "selenium_spec_parallel_${index}"
        } catch(err) {
          println (err)
        }
      }
    }
    sh '../build/new-jenkins/parallel-log-combine.sh'
  }
}

return this
