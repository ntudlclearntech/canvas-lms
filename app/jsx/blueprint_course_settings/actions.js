import { createActions } from 'redux-actions'
import api from './apiClient'

const types = [
  'LOAD_COURSES_START', 'LOAD_COURSES_SUCCESS', 'LOAD_COURSES_FAIL',
  'LOAD_ASSOCIATIONS_START', 'LOAD_ASSOCIATIONS_SUCCESS', 'LOAD_ASSOCIATIONS_FAIL',
  'SAVE_ASSOCIATIONS_START', 'SAVE_ASSOCIATIONS_SUCCESS', 'SAVE_ASSOCIATIONS_FAIL',
  'CHECK_MIGRATION_START', 'CHECK_MIGRATION_SUCCESS', 'CHECK_MIGRATION_FAIL',
  'BEGIN_MIGRATION_START', 'BEGIN_MIGRATION_SUCCESS', 'BEGIN_MIGRATION_FAIL',
  'ADD_COURSE_ASSOCIATIONS', 'UNDO_ADD_COURSE_ASSOCIATIONS',
  'REMOVE_COURSE_ASSOCIATIONS', 'UNDO_REMOVE_COURSE_ASSOCIATIONS',
  'CLEAR_ASSOCIATIONS',
]
const actions = createActions(...types)

actions.checkMigration = () => (dispatch, getState) => {
  dispatch(actions.checkMigrationStart())
  api.checkMigration(getState())
    .then(res => dispatch(actions.checkMigrationSuccess(res.data)))
    .catch(err => dispatch(actions.checkMigrationFail(err)))
}

actions.beginMigration = () => (dispatch, getState) => {
  dispatch(actions.beginMigrationStart())
  api.beginMigration(getState())
    .then(res => dispatch(actions.beginMigrationSuccess(res.data)))
    .catch(err => dispatch(actions.beginMigrationFail(err)))
}

actions.addAssociations = associations => (dispatch, getState) => {
  const state = getState()
  const existing = state.existingAssociations
  const toAdd = []
  const toUndo = []

  associations.forEach((courseId) => {
    if (existing.find(course => course.id === courseId)) {
      toUndo.push(courseId)
    } else {
      toAdd.push(courseId)
    }
  })

  if (toAdd.length) {
    const courses = state.courses.concat(state.existingAssociations)
    dispatch(actions.addCourseAssociations(courses.filter(c => toAdd.includes(c.id))))
  }

  if (toUndo.length) {
    dispatch(actions.undoRemoveCourseAssociations(toUndo))
  }
}

actions.removeAssociations = associations => (dispatch, getState) => {
  const existing = getState().existingAssociations
  const toRm = []
  const toUndo = []

  associations.forEach((courseId) => {
    if (existing.find(course => course.id === courseId)) {
      toRm.push(courseId)
    } else {
      toUndo.push(courseId)
    }
  })

  if (toRm.length) {
    dispatch(actions.removeCourseAssociations(toRm))
  }

  if (toUndo.length) {
    dispatch(actions.undoAddCourseAssociations(toUndo))
  }
}

actions.loadCourses = filters => (dispatch, getState) => {
  dispatch(actions.loadCoursesStart())
  api.getCourses(getState(), filters)
    .then(res => dispatch(actions.loadCoursesSuccess(res.data)))
    .catch(err => dispatch(actions.loadCoursesFail(err)))
}

actions.loadAssociations = () => (dispatch, getState) => {
  dispatch(actions.loadAssociationsStart())
  api.getAssociations(getState())
    .then((res) => {
      const data = res.data.map(course =>
        Object.assign({}, course, {
          term: {
            id: '0',
            name: course.term_name,
          },
          term_name: undefined,
        }))
      dispatch(actions.loadAssociationsSuccess(data))
    })
    .catch(err => dispatch(actions.loadAssociationsFail(err)))
}

actions.saveAssociations = () => (dispatch, getState) => {
  dispatch(actions.saveAssociationsStart())
  const state = getState()
  api.saveAssociations(state)
    .then(() => dispatch(actions.saveAssociationsSuccess({ added: state.addedAssociations, removed: state.removedAssociations })))
    .catch(err => dispatch(actions.saveAssociationsFail(err)))
}

const actionTypes = types.reduce((typesMap, actionType) =>
  Object.assign(typesMap, { [actionType]: actionType }), {})

export { actionTypes, actions as default }
