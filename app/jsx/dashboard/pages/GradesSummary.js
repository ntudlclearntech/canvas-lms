/*
 * Copyright (C) 2021 - present Instructure, Inc.
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
 *
 */

import React from 'react'
import PropTypes from 'prop-types'

import {Button} from '@instructure/ui-buttons'
import {Flex} from '@instructure/ui-flex'
import {Heading} from '@instructure/ui-heading'
import {IconExternalLinkLine} from '@instructure/ui-icons'
import {Link} from '@instructure/ui-link'
import {ProgressBar} from '@instructure/ui-progress'
import {Text} from '@instructure/ui-text'
import {View} from '@instructure/ui-view'

import I18n from 'i18n!k5_dashboard'
import instFSOptimizedImageUrl from 'jsx/shared/helpers/instFSOptimizedImageUrl'
import k5Theme from 'jsx/dashboard/k5-theme'
import {PresentationContent} from '@instructure/ui-a11y-content'

const DEFAULT_COLOR = k5Theme.variables.colors.backgroundMedium
const DEFAULT_SIZE = 100

const GradeSummaryShape = {
  courseId: PropTypes.string.isRequired,
  courseName: PropTypes.string.isRequired,
  enrollmentType: PropTypes.string.isRequired,
  courseColor: PropTypes.string,
  courseImage: PropTypes.string,
  currentGradingPeriodId: PropTypes.string,
  grade: PropTypes.string,
  score: PropTypes.number
}

export const GradeCourseImage = ({
  onClick,
  courseImage,
  courseColor = DEFAULT_COLOR,
  size = DEFAULT_SIZE
}) => (
  <div
    style={{
      backgroundColor: !courseImage && courseColor,
      backgroundImage:
        courseImage && `url(${instFSOptimizedImageUrl(courseImage, {x: size, y: size})})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
      borderRadius: '6px',
      boxShadow: '0 0 0.2rem rgba(0, 0, 0, 0.2)',
      height: `${size}px`,
      width: `${size}px`,
      cursor: 'pointer'
    }}
    aria-hidden="true"
    data-testid="k5-grades-course-image"
    onClick={onClick}
  />
)

GradeCourseImage.displayName = 'GradeCourseImage'
GradeCourseImage.propTypes = {
  onClick: PropTypes.func.isRequired,
  courseColor: PropTypes.string,
  courseImage: PropTypes.string,
  size: PropTypes.number
}

export const GradeSummaryLine = ({
  courseId,
  courseImage,
  courseColor,
  courseName,
  currentGradingPeriodId,
  enrollmentType,
  grade,
  score
}) => {
  let gradeText = grade
  let isPercentage = false
  if (!grade) {
    if (score || score === 0) {
      gradeText = I18n.toPercentage(score, {
        precision: 0
      })
      isPercentage = true
    } else {
      gradeText = currentGradingPeriodId ? I18n.t('Not Graded') : '--'
      score = 0
    }
  }
  const courseUrl = `/courses/${courseId}`
  const handleImageClick = e => {
    if (e) {
      e.preventDefault()
    }
    window.location = courseUrl
  }
  return (
    <View as="div">
      <Flex>
        <Flex.Item margin="x-small medium x-small 0">
          <GradeCourseImage
            courseColor={courseColor}
            courseImage={courseImage}
            onClick={handleImageClick}
          />
        </Flex.Item>
        <Flex.Item shouldGrow shouldShrink>
          <View as="div">
            <Text transform="uppercase">
              <Heading as="h2" level="h3" margin="small 0">
                <Link
                  href={courseUrl}
                  display="inline-block"
                  isWithinText={false}
                  theme={{
                    color: k5Theme.variables.colors.textDarkest,
                    hoverColor: k5Theme.variables.colors.textDarkest,
                    fontWeight: 700
                  }}
                >
                  <div
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap'
                    }}
                    title={courseName}
                  >
                    {courseName}
                  </div>
                </Link>
              </Heading>
            </Text>
            {['student', 'observer'].includes(enrollmentType) && (
              <>
                <ProgressBar
                  screenReaderLabel={I18n.t('Grade for %{course}', {course: courseName})}
                  formatScreenReaderValue={() =>
                    isPercentage
                      ? I18n.t('%{percent} of points possible', {percent: gradeText})
                      : gradeText
                  }
                  size="small"
                  valueNow={score}
                  valueMax={100}
                  margin="small 0"
                />
                <PresentationContent>
                  <Text weight="bold">{gradeText}</Text>
                </PresentationContent>
              </>
            )}
            {['ta', 'teacher'].includes(enrollmentType) && (
              <Button
                renderIcon={IconExternalLinkLine}
                href={`/courses/${courseId}/gradebook`}
                target="_blank"
              >
                View Gradebook
              </Button>
            )}
          </View>
        </Flex.Item>
      </Flex>
      <PresentationContent>
        <hr />
      </PresentationContent>
    </View>
  )
}

GradeSummaryLine.displayName = 'GradeSummaryLine'
GradeSummaryLine.propTypes = GradeSummaryShape

const GradesSummary = ({courses}) => {
  return (
    <View as="div" margin="medium 0">
      {courses.map(course => (
        <GradeSummaryLine key={course.courseId} {...course} />
      ))}
    </View>
  )
}

GradesSummary.displayName = 'GradesSummary'
GradesSummary.propTypes = {
  courses: PropTypes.arrayOf(PropTypes.shape(GradeSummaryShape)).isRequired
}

export default GradesSummary
