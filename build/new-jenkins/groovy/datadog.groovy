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

import groovy.time.*

// Datadog metric format is the following:
// <METRIC_NAME>:<VALUE>|<TYPE>|@<SAMPLE_RATE>|#<TAG_KEY_1>:<TAG_VALUE_1>,<TAG_2>
// We are just allowing counts for now to be simple.
// Source https://docs.datadoghq.com/developers/dogstatsd/datagram_shell/?tab=metrics
def hackyMetricSend(metric, value, tags) {
  def script = """#!/bin/bash
    echo -n "${metric}:${value}|c|1|#${tags.join(',')}" > /dev/udp/localhost/8125
  """
  // exit code is captured in case we want upstream caller status correction
  return sh(script: script, returnStatus: true)
}

def runDataDogForMetric(name, block) {
  def timeStart = new Date()
  block.call()
  def timeStop = new Date()
  def duration = TimeCategory.minus(timeStop, timeStart).toMilliseconds()

  hackyMetricSend("jenkins.stage.elapsedTime", duration, ["stage:${name}"])
}

def runDataDogForMetricWithExtraTags(name, extraTags, block) {
  def timeStart = new Date()
  block.call()
  def timeStop = new Date()
  def duration = TimeCategory.minus(timeStop, timeStart).toMilliseconds()

  hackyMetricSend("jenkins.stage.elapsedTime", duration, ["stage:${name}", extraTags].flatten())
}

return this