/*
 * Copyright (C) 2015 - present Instructure, Inc.
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

import React from 'react'
import {shape, object, func, string, oneOfType, arrayOf, node, bool} from 'prop-types'
import {Flex} from '@instructure/ui-flex'
import {View} from '@instructure/ui-view'
import {Badge} from '@instructure/ui-badge'
import {Avatar} from '@instructure/ui-avatar'
import {Text} from '@instructure/ui-text'
import {List} from '@instructure/ui-list'
import {Heading} from '@instructure/ui-heading'
import {Spinner} from '@instructure/ui-spinner'
import {IconButton} from '@instructure/ui-buttons'
import {ToggleDetails} from '@instructure/ui-toggle-details'
import {
  IconXLine,
  IconAdminLine,
  IconCoursesLine,
  IconGroupLine,
  IconDashboardLine,
  IconLockLine,
  IconQuestionLine,
  IconInboxLine,
  IconCalendarMonthLine,
  IconClockLine,
  IconHomeLine,
} from '@instructure/ui-icons'
import {useScope as useI18nScope} from '@canvas/i18n'
import HelpDialog from './HelpDialog/index'
import LogoutButton from './LogoutButton'
import HighContrastModeToggle from './trays/HighContrastModeToggle'
import HistoryList from './HistoryList'
import {isStaff} from '@canvas/util/checkRole'

import {Link} from '@instructure/ui-link'

const I18n = useI18nScope('MobileGlobalMenu')

function ActiveText({children, url}) {
  return window.location.pathname.startsWith(url) ? <Text weight="bold">{children}</Text> : children
}
ActiveText.propTypes = {
  url: string.isRequired,
  children: oneOfType([arrayOf(node), node]).isRequired,
}

export default class MobileGlobalMenu extends React.Component {
  state = {
    externalTools: [],
    showGroups: false,
  }

  static propTypes = {
    current_user: shape({
      display_name: string,
      avatar_image_url: string,
    }),
    DesktopNavComponent: shape({
      ensureLoaded: func.isRequired,
      state: object.isRequired,
    }).isRequired,
    onDismiss: func.isRequired,
    k5User: bool,
    isStudent: bool,
  }

  static defaultProps = {
    current_user: ENV.current_user,
    k5User: ENV.K5_USER,
    isStudent: ENV.current_user_roles?.every(role => role === 'student' || role === 'user'),
  }

  UNSAFE_componentWillMount() {
    // this is all the stuff that relies on the DOM of the desktop global nav
    const showGroups = !!document.getElementById('global_nav_groups_link')

    let externalTools = [...document.querySelectorAll('.globalNavExternalTool')].map(el => {
      const svg = el.querySelector('svg')
      return {
        href: el.querySelector('a').getAttribute('href'),
        isActive: el.classList.contains('ic-app-header__menu-list-item--active'),
        label: el.querySelector('.menu-item__text').innerText,
        ...(svg ? {svgPath: svg.innerHTML} : {imgSrc: el.querySelector('img').getAttribute('src')}),
      }
    })

    // Hide if not a staff
    if (!isStaff) {
      const courseBuilderExternalToolId = typeof courseBuilderId !== 'undefined' ? courseBuilderId : 0;
      externalTools = externalTools.filter((externalTool) => externalTool?.href !== `/accounts/1/external_tools/${courseBuilderExternalToolId}?launch_type=global_navigation`);
    }

    this.setState({externalTools, showGroups})
  }

  render() {
    const ensureLoaded = type => (_e, isExpanded) => {
      if (isExpanded) this.props.DesktopNavComponent.ensureLoaded(type)
    }

    const courses =
      this.props.k5User && this.props.isStudent
        ? this.props.DesktopNavComponent.state.courses.filter(c => !c.homeroom_course)
        : this.props.DesktopNavComponent.state.courses

    return (
      <View
        display="block"
        height="100%"
        width="100%"
        textAlign="start"
        padding="medium large medium medium"
      >
        <Flex direction="row-reverse" margin="0 0 large 0">
          <Flex.Item>
            <IconButton
              renderIcon={IconXLine}
              withBackground={false}
              withBorder={false}
              onClick={this.props.onDismiss}
              screenReaderLabel="Close"
            />
          </Flex.Item>
          <Flex.Item shouldGrow={true} shouldShrink={true}>
            <Heading>
              <a className="ic-brand-mobile-global-nav-logo" href="/">
                <span className="screenreader-only">
                  {this.props.k5User ? I18n.t('Home') : I18n.t('My Dashboard')}
                </span>
              </a>
            </Heading>
          </Flex.Item>
        </Flex>
        <List isUnstyled={true} itemSpacing="medium">
          <List.Item>
            <Link href="/" isWithinText={false} size="small" display="block" textAlign="start">
              <Flex>
                <Flex.Item width="3rem">
                  {this.props.k5User ? (
                    <IconHomeLine inline={false} size="small" />
                  ) : (
                    <IconDashboardLine inline={false} size="small" />
                  )}
                </Flex.Item>
                <Flex.Item>
                  <Text size="medium">
                    {this.props.k5User ? I18n.t('Home') : I18n.t('Dashboard')}
                  </Text>
                </Flex.Item>
              </Flex>
            </Link>
          </List.Item>
          <List.Item>
            {this.props.current_user && Object.keys(this.props.current_user).length ? (
              <ToggleDetails
                iconPosition="end"
                fluidWidth={true}
                onToggle={ensureLoaded('profile')}
                summary={
                  <Flex padding="xx-small small">
                    <Flex.Item width="3rem">
                      <Avatar
                        name={this.props.current_user.display_name}
                        src={this.props.current_user.avatar_image_url}
                        size="x-small"
                        data-fs-exclude={true}
                      />
                    </Flex.Item>
                    <Flex.Item>
                      <Text color="brand">{I18n.t('Account')}</Text>
                    </Flex.Item>
                  </Flex>
                }
              >
                <List isUnstyled={true} itemSpacing="small" margin="0 0 0 x-large">
                  {this.props.DesktopNavComponent.state.profileAreLoaded ? (
                    this.props.DesktopNavComponent.state.profile.map(tab => (
                      <List.Item key={tab.id}>
                        <Link
                          href={tab.html_url}
                          isWithinText={false}
                          display="block"
                          textAlign="start"
                        >
                          <ActiveText url={tab.html_url}>{tab.label}</ActiveText>
                        </Link>
                      </List.Item>
                    ))
                  ) : (
                    <List.Item>
                      <Spinner margin="auto" size="small" renderTitle={I18n.t('Loading')} />
                    </List.Item>
                  )}
                  <List.Item>
                    <LogoutButton variant="link" fluidWidth={true} />
                  </List.Item>
                  {/* removed by NTU COOL
                  <List.Item>
                    <HighContrastModeToggle isMobile={true} />
                  </List.Item>
                  */}
                </List>
              </ToggleDetails>
            ) : (
              <Link href="/login" isWithinText={false} display="block" textAlign="start">
                <Flex>
                  <Flex.Item width="3rem">
                    <IconLockLine inline={false} size="small" />
                  </Flex.Item>
                  <Flex.Item>
                    <Text size="medium">{I18n.t('Login')}</Text>
                  </Flex.Item>
                </Flex>
              </Link>
            )}
          </List.Item>

          {window.ENV.current_user_roles && window.ENV.current_user_roles.includes('admin') && (
            <List.Item>
              <ToggleDetails
                iconPosition="end"
                fluidWidth={true}
                onToggle={ensureLoaded('accounts')}
                summary={
                  <Flex padding="xx-small small">
                    <Flex.Item width="3rem">
                      <IconAdminLine inline={false} size="small" color="brand" />
                    </Flex.Item>
                    <Flex.Item>
                      <Text color="brand">{I18n.t('Admin')}</Text>
                    </Flex.Item>
                  </Flex>
                }
              >
                <List isUnstyled={true} itemSpacing="small" margin="0 0 0 x-large">
                  {this.props.DesktopNavComponent.state.accountsAreLoaded ? (
                    this.props.DesktopNavComponent.state.accounts
                      .map(account => (
                        <List.Item key={account.id}>
                          <Link
                            href={`/accounts/${account.id}`}
                            isWithinText={false}
                            display="block"
                            textAlign="start"
                          >
                            <ActiveText url={`/accounts/${account.id}`}>{account.name}</ActiveText>
                          </Link>
                        </List.Item>
                      ))
                      .concat([
                        <List.Item key="all">
                          <Link
                            href="/accounts"
                            isWithinText={false}
                            display="block"
                            textAlign="start"
                          >
                            {I18n.t('All Accounts')}
                          </Link>
                        </List.Item>,
                      ])
                  ) : (
                    <List.Item>
                      <Spinner size="small" renderTitle={I18n.t('Loading')} />
                    </List.Item>
                  )}
                </List>
              </ToggleDetails>
            </List.Item>
          )}
          <List.Item>
            <ToggleDetails
              iconPosition="end"
              fluidWidth={true}
              onToggle={ensureLoaded('courses')}
              summary={
                <Flex padding="xx-small small">
                  <Flex.Item width="3rem">
                    <IconCoursesLine inline={false} size="small" color="brand" />
                  </Flex.Item>
                  <Flex.Item>
                    <Text color="brand">
                      {this.props.k5User ? I18n.t('Subjects') : I18n.t('Courses')}
                    </Text>
                  </Flex.Item>
                </Flex>
              }
            >
              <List isUnstyled={true} itemSpacing="small" margin="0 0 0 x-large">
                {this.props.DesktopNavComponent.state.coursesAreLoaded ? (
                  courses
                    .map(course => (
                      <List.Item key={course.id}>
                        <Link
                          href={`/courses/${course.id}`}
                          isWithinText={false}
                          display="block"
                          textAlign="start"
                        >
                          <ActiveText url={`/courses/${course.id}`}>
                            {course.name}
                            {course.enrollment_term_id > 1 && (
                              <Text as="div" size="x-small" weight="light">
                                {course.term.name}
                              </Text>
                            )}
                          </ActiveText>
                        </Link>
                      </List.Item>
                    ))
                    .concat([
                      <List.Item key="all">
                        <Link
                          href="/courses"
                          isWithinText={false}
                          display="block"
                          textAlign="start"
                        >
                          {this.props.k5User ? I18n.t('All Subjects') : I18n.t('All Courses')}
                        </Link>
                      </List.Item>,
                    ])
                ) : (
                  <List.Item>
                    <Spinner size="small" renderTitle={I18n.t('Loading')} />
                  </List.Item>
                )}
              </List>
            </ToggleDetails>
          </List.Item>
          {this.state.showGroups && (
            <List.Item>
              <ToggleDetails
                iconPosition="end"
                fluidWidth={true}
                onToggle={ensureLoaded('groups')}
                summary={
                  <Flex padding="xx-small small">
                    <Flex.Item width="3rem">
                      <IconGroupLine inline={false} size="small" color="brand" />
                    </Flex.Item>
                    <Flex.Item>
                      <Text color="brand">{I18n.t('Groups')}</Text>
                    </Flex.Item>
                  </Flex>
                }
              >
                <List isUnstyled={true} itemSpacing="small" margin="0 0 0 x-large">
                  {this.props.DesktopNavComponent.state.groupsAreLoaded ? (
                    this.props.DesktopNavComponent.state.groups
                      .map(group => (
                        <List.Item key={group.id}>
                          <Link
                            margin="0 0 0 xx-small"
                            href={`/groups/${group.id}`}
                            isWithinText={false}
                            display="block"
                            textAlign="start"
                          >
                            <ActiveText url={`/groups/${group.id}`}>{group.name}</ActiveText>
                          </Link>
                        </List.Item>
                      ))
                      .concat([
                        <List.Item key="all">
                          <Link
                            margin="0 0 0 xx-small"
                            href="/groups"
                            isWithinText={false}
                            display="block"
                            textAlign="start"
                          >
                            {I18n.t('All Groups')}
                          </Link>
                        </List.Item>,
                      ])
                  ) : (
                    <List.Item>
                      <Spinner size="small" renderTitle={I18n.t('Loading')} />
                    </List.Item>
                  )}
                </List>
              </ToggleDetails>
            </List.Item>
          )}
          <List.Item>
            <Link
              href="/calendar"
              isWithinText={false}
              size="small"
              display="block"
              textAlign="start"
            >
              <Flex>
                <Flex.Item width="3rem">
                  <IconCalendarMonthLine inline={false} size="small" />
                </Flex.Item>
                <Flex.Item>
                  <Text size="medium">{I18n.t('Calendar')}</Text>
                </Flex.Item>
              </Flex>
            </Link>
          </List.Item>
          <List.Item>
            <Link href="/inbox" isWithinText={false} size="small" display="block" textAlign="start">
              <Flex>
                <Flex.Item width="3rem">
                  <IconInboxLine inline={false} size="small" />
                </Flex.Item>
                <Flex.Item>
                  <Text size="medium">{I18n.t('Inbox')}</Text>
                  {!!this.props.DesktopNavComponent.state.unreadInboxCount && (
                    <Badge
                      standalone={true}
                      margin="0 small"
                      count={this.props.DesktopNavComponent.state.unreadInboxCount}
                    />
                  )}
                </Flex.Item>
              </Flex>
            </Link>
          </List.Item>
          {this.state.externalTools.map(tool => (
            <List.Item key={tool.href}>
              <Link
                href={tool.href}
                isWithinText={false}
                size="small"
                display="block"
                textAlign="start"
              >
                <Flex>
                  <Flex.Item width="3rem">
                    {tool.svgPath ? (
                      <svg
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                        viewBox="0 0 64 64"
                        dangerouslySetInnerHTML={{__html: tool.svgPath}}
                        width="1em"
                        height="1em"
                        aria-hidden="true"
                        role="presentation"
                        focusable="false"
                        style={{fill: 'currentColor', fontSize: 32}}
                      />
                    ) : (
                      <img width="1em" height="1em" src={tool.imgSrc} alt="" />
                    )}
                  </Flex.Item>
                  <Flex.Item>
                    <Text size="medium">{tool.label}</Text>
                  </Flex.Item>
                </Flex>
              </Link>
            </List.Item>
          ))}

          {/*
          <List.Item>
            <ToggleDetails
              iconPosition="end"
              fluidWidth={true}
              onToggle={ensureLoaded('history')}
              summary={
                <Flex padding="xx-small small">
                  <Flex.Item width="3rem">
                    <IconClockLine inline={false} size="small" color="brand" />
                  </Flex.Item>
                  <Flex.Item>
                    <Text color="brand">{I18n.t('History')}</Text>
                  </Flex.Item>
                </Flex>
              }
            >
              <View as="div" margin="0 0 0 xx-large">
                <HistoryList
                  history={this.props.DesktopNavComponent.state.history}
                  hasLoaded={this.props.DesktopNavComponent.state.historyAreLoaded}
                />
              </View>
            </ToggleDetails>
          </List.Item>
          */}

          {false /* TODO: put a check for if we should show help */ && (
            <List.Item>
              <ToggleDetails
                iconPosition="end"
                fluidWidth={true}
                onToggle={ensureLoaded('help')}
                summary={
                  <Flex padding="xx-small small">
                    <Flex.Item width="3rem">
                      <IconQuestionLine inline={false} size="small" color="brand" />
                    </Flex.Item>
                    <Flex.Item>
                      <Text color="brand">{window.ENV.help_link_name || I18n.t('Help')}</Text>
                    </Flex.Item>
                  </Flex>
                }
              >
                <View as="div" margin="0 0 0 xx-large">
                  <HelpDialog
                    links={this.props.DesktopNavComponent.state.help}
                    hasLoaded={this.props.DesktopNavComponent.state.helpAreLoaded}
                    onFormSubmit={this.props.onDismiss}
                  />
                </View>
              </ToggleDetails>
            </List.Item>
          )}
        </List>
      </View>
    )
  }
}
