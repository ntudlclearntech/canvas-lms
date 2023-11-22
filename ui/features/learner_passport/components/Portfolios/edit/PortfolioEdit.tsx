/*
 * Copyright (C) 2023 - present Instructure, Inc.
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

import React, {useCallback} from 'react'
import {useActionData, useLoaderData, useNavigate, useSubmit} from 'react-router-dom'
import {Breadcrumb} from '@instructure/ui-breadcrumb'
import {Button} from '@instructure/ui-buttons'
import {Flex} from '@instructure/ui-flex'
import {Heading} from '@instructure/ui-heading'
import {IconDragHandleLine, IconReviewScreenLine, IconSaveLine} from '@instructure/ui-icons'
import {View} from '@instructure/ui-view'

import PersonalInfo from './PersonalInfo'
import AchievementsEdit from './AchievementsEdit'
import EducationEdit from './EducationEdit'
import ExperienceEdit from './ExperienceEdit'
import ProjectsEdit from './ProjectsEdit'

import type {PortfolioDetailData, SkillData} from '../../types'

const PortfolioEdit = () => {
  const navigate = useNavigate()
  const submit = useSubmit()
  const create_portfolio = useActionData() as PortfolioDetailData
  const edit_portfolio = useLoaderData() as PortfolioDetailData
  const portfolio = create_portfolio || edit_portfolio

  const handlePreviewClick = useCallback(() => {
    navigate(`../view/${portfolio.id}`)
  }, [navigate, portfolio.id])

  const handleSaveClick = useCallback(() => {
    ;(document.getElementById('edit_portfolio_form') as HTMLFormElement)?.requestSubmit()
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const form = document.getElementById('edit_portfolio_form') as HTMLFormElement
      const formData = new FormData(form)

      const skills = JSON.parse(formData.get('skills') as string)
      formData.delete('skills')
      skills.forEach((skill: SkillData) => {
        formData.append('skills[]', JSON.stringify(skill))
      })

      submit(formData, {method: 'POST'})
    },
    [submit]
  )

  return (
    <View as="div">
      <View as="div" maxWidth="986px" margin="0 auto">
        <form id="edit_portfolio_form" method="POST" onSubmit={handleSubmit}>
          <Flex as="div" direction="column" gap="medium" margin="0 0 xx-small 0">
            <input type="hidden" name="id" value={portfolio.id} />
            <Breadcrumb label="You are here:" size="small">
              <Breadcrumb.Link href={`/users/${ENV.current_user.id}/passport/portfolios/dashboard`}>
                Portfolios
              </Breadcrumb.Link>
              <Breadcrumb.Link
                href={`/users/${ENV.current_user.id}/passport/portfolios/view/${portfolio.id}`}
              >
                {portfolio.title}
              </Breadcrumb.Link>
              <Breadcrumb.Link>edit</Breadcrumb.Link>
            </Breadcrumb>
            <Flex as="div" margin="0 0 medium 0">
              <Flex.Item shouldGrow={true}>
                <Heading level="h1" themeOverride={{h1FontWeight: 700}}>
                  {portfolio.title}
                </Heading>
              </Flex.Item>
              <Flex.Item>
                <Button margin="0 x-small 0 0" renderIcon={IconDragHandleLine}>
                  Reorder
                </Button>
                <Button
                  margin="0 x-small 0 0"
                  renderIcon={IconReviewScreenLine}
                  onClick={handlePreviewClick}
                >
                  Preview
                </Button>
                <Button margin="0 x-small 0 0" renderIcon={IconSaveLine} onClick={handleSaveClick}>
                  Save
                </Button>
              </Flex.Item>
            </Flex>
            <View margin="0 medium" borderWidth="small">
              <PersonalInfo portfolio={portfolio} />
            </View>
            <View margin="0 medium" borderWidth="small">
              <EducationEdit portfolio={portfolio} />
            </View>
            <View margin="0 medium" borderWidth="small">
              <ExperienceEdit portfolio={portfolio} />
            </View>
            <View margin="0 medium" borderWidth="small">
              <ProjectsEdit portfolio={portfolio} />
            </View>
            <View margin="0 medium" borderWidth="small">
              <AchievementsEdit portfolio={portfolio} />
            </View>
          </Flex>
        </form>
      </View>
      <div
        id="footer"
        style={{
          position: 'sticky',
          bottom: '0',
        }}
      >
        <View as="div" background="primary" borderWidth="small 0 0 0">
          <Flex justifyItems="end" padding="small" gap="small">
            <Button>Reorder</Button>
            <Button onClick={handlePreviewClick}>Preview</Button>
            <Button color="primary" onClick={handleSaveClick}>
              Save
            </Button>
          </Flex>
        </View>
      </div>
    </View>
  )
}

export default PortfolioEdit
