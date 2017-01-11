import React from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'
import { mount } from 'enzyme'
import DashboardOptionsMenu from 'jsx/dashboard_card/DashboardOptionsMenu'
import moxios from 'moxios';

const container = document.getElementById('fixtures')

const FakeDashboard = function (props) {
  return (
    <div>
      <DashboardOptionsMenu
        ref={(c) => { props.menuRef(c) }}
        recent_activity_dashboard={props.recent_activity_dashboard}
        planner_enabled={props.planner_enabled}
      />
      {
        (props.planner_enabled) ? (
          <div
            id="dashboard-planner"
            style={{ display: 'block' }}
          />
        ) :
        (
          <div
            id="dashboard-activity"
            style={{ display: 'block' }}
          />
        )
      }
      <div
        id="DashboardCard_Container"
        style={{ display: 'none' }}
      >
        <div className="ic-DashboardCard__header">
          <div className="ic-DashboardCard__header_image">
            <div
              className="ic-DashboardCard__header_hero"
              style={{opacity: 0.6}}
            />
          </div>
          <div
            className="ic-DashboardCard__header-button-bg"
            style={{opacity: 0}}
          />
        </div>
      </div>
    </div>
  )
}

FakeDashboard.propTypes = {
  menuRef: React.PropTypes.func.isRequired,
  recent_activity_dashboard: React.PropTypes.bool,
  planner_enabled: React.PropTypes.bool
}

FakeDashboard.defaultProps = {
  recent_activity_dashboard: false,
  planner_enabled: false
}

QUnit.module('Dashboard Options Menu', {
  teardown () {
    ReactDOM.unmountComponentAtNode(container)
  }
})

test('it renders', function () {
  const dashboardMenu = TestUtils.renderIntoDocument(
    <DashboardOptionsMenu />
  )
  ok(dashboardMenu)
})

test('it should switch dashboard view appropriately when view option is selected', function () {
  this.stub(DashboardOptionsMenu.prototype, 'postDashboardToggle')

  let dashboardMenu = null
  ReactDOM.render(
    <FakeDashboard
      menuRef={(c) => { dashboardMenu = c }}
      recent_activity_dashboard
    />, container)

  dashboardMenu.handleViewOptionSelect(null, ['cards'])
  ok(document.getElementById('dashboard-activity').style.display === 'none')
  ok(document.getElementById('DashboardCard_Container').style.display === 'block')

  dashboardMenu.handleViewOptionSelect(null, ['activity'])
  ok(document.getElementById('dashboard-activity').style.display === 'block')
  ok(document.getElementById('DashboardCard_Container').style.display === 'none')
})

test('it should not call toggleDashboardView when correct view is already set', function () {
  this.stub(DashboardOptionsMenu.prototype, 'postDashboardToggle')
  const toggleDashboardView = this.stub(DashboardOptionsMenu.prototype, 'toggleDashboardView')

  const wrapper = mount(<DashboardOptionsMenu recent_activity_dashboard />)
  wrapper.find('button').simulate('click')

  const menuItems = Array.from(document.querySelectorAll('[role="menuitemradio"]'))
  const recentActivity = menuItems.filter(menuItem => menuItem.textContent.trim() === 'Recent Activity')[0]
  recentActivity.click()

  equal(toggleDashboardView.callCount, 0)
  wrapper.unmount()
})

test('it should switch dashboard view appropriately with Student Planner enabled when view option is selected', function () {
  this.stub(DashboardOptionsMenu.prototype, 'postDashboardToggle')

  let dashboardMenu = null
  ReactDOM.render(
    <FakeDashboard
      menuRef={(c) => { dashboardMenu = c }}
      planner_enabled
    />, container)

  dashboardMenu.handleViewOptionSelect(null, ['cards'])
  ok(document.getElementById('dashboard-planner').style.display === 'none')
  ok(document.getElementById('DashboardCard_Container').style.display === 'block')

  dashboardMenu.handleViewOptionSelect(null, ['planner'])
  ok(document.getElementById('dashboard-planner').style.display === 'block')
  ok(document.getElementById('DashboardCard_Container').style.display === 'none')
})

test('it should use the dashboard view endpoint when Student Planner is enabled', function (assert) {
  const done = assert.async();
  moxios.install();
  let dashboardMenu = null
  ReactDOM.render(
    <FakeDashboard
      menuRef={(c) => { dashboardMenu = c }}
      planner_enabled
    />, container)

  dashboardMenu.handleViewOptionSelect(null, ['cards'])
  dashboardMenu.postDashboardToggle();

  moxios.wait(() => {
    const request = moxios.requests.mostRecent()
    equal(request.url, '/dashboard/view')
    equal(request.config.data, '{"dashboard_view":"cards"}');
    done()
  })

  moxios.uninstall();
})

test('it should include a planner menu item when Student Planner is enabled', function () {
  const wrapper = mount(
    <DashboardOptionsMenu
      planner_enabled
    />
  )
  wrapper.find('button').simulate('click')
  const menuItems = Array.from(document.querySelectorAll('[role="menuitemradio"]'))
  ok(menuItems.some(menuItem => menuItem.textContent.trim() === 'Planner'))
  wrapper.unmount()
});

test('it should display toggle color overlay option if card view is set', function () {
  const wrapper = mount(<DashboardOptionsMenu />)
  wrapper.find('button').simulate('click')

  const menuItems = Array.from(document.querySelectorAll('[role="menuitemradio"]'))
  const colorToggle = menuItems.filter(menuItem => menuItem.textContent.trim() === 'Color Overlay')[0]

  ok(colorToggle)
  wrapper.unmount()
})

test('it should not display toggle color overlay option if recent activity view is set', function () {
  const wrapper = mount(<DashboardOptionsMenu recent_activity_dashboard />)
  wrapper.find('button').simulate('click')

  const menuItems = Array.from(document.querySelectorAll('[role="menuitemradio"]'))
  const colorToggle = menuItems.filter(menuItem => menuItem.textContent.trim() === 'Color Overlay')[0]

  notOk(colorToggle)
  wrapper.unmount()
})

test('it should toggle color overlays', function () {
  this.stub(DashboardOptionsMenu.prototype, 'postToggleColorOverlays')
  let dashboardMenu = null
  ReactDOM.render(
    <FakeDashboard
      menuRef={(c) => { dashboardMenu = c }}
      recent_activity_dashboard={false}
    />, container)

  dashboardMenu.handleColorOverlayOptionSelect(null, [''])
  ok(document.getElementsByClassName('ic-DashboardCard__header_hero')[0].style.opacity === '0')
  ok(document.getElementsByClassName('ic-DashboardCard__header-button-bg')[0].style.opacity === '1')

  dashboardMenu.handleColorOverlayOptionSelect(null, ['colorOverlays'])
  ok(document.getElementsByClassName('ic-DashboardCard__header_hero')[0].style.opacity === '0.6')
  ok(document.getElementsByClassName('ic-DashboardCard__header-button-bg')[0].style.opacity === '0')
});
