import React from 'react'
import ReactDOM from 'react-dom'
import { connect, Provider } from 'react-redux'
import BreakdownGraphs from './components/breakdown-graphs'
import StickySidebar from './components/sticky-sidebar'
import BreakdownDetails from './components/breakdown-details'

  const Graphs = connect((state) => ({
    assignment: state.assignment,
    ranges: state.ranges,
    enrolled: state.enrolled,
    isLoading: state.isInitialDataLoading,
  }))(BreakdownGraphs)

  const Sidebar = connect((state) => ({
    isHidden: !state.showDetails,
  }))(StickySidebar)

  const Details = connect((state) => ({
    isStudentDetailsLoading: state.isStudentDetailsLoading,
    selectedPath: state.selectedPath,
    assignment: state.assignment,
    ranges: state.ranges,
    students: state.studentCache,
  }))(BreakdownDetails)

export default class CRSApp {
    constructor (store, actions) {
      this.store = store
      this.actions = actions
    }

    renderGraphs (root) {
      const actions = {
        selectRange: this.actions.selectRange,
      }

      ReactDOM.render(
        <Provider store={this.store}>
          <Graphs {...actions} />
        </Provider>,
        root
      )
    }

    renderDetails (root) {
      const detailActions = {
        selectRange: this.actions.selectRange,
        selectStudent: this.actions.selectStudent,
      }

      ReactDOM.render(
        <Provider store={this.store}>
          <Sidebar
            closeSidebar={this.actions.closeSidebar}
          >
            <Details {...detailActions} />
          </Sidebar>
        </Provider>,
        root
      )
    }
  }
