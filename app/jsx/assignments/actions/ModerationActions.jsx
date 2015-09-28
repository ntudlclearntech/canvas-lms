/** @jsx React.DOM */

define([
  'axios',
  'i18n!moderated_grading'
], function (axios, I18n) {

  var ModerationActions = {

    // Define 'constants' for types
    SELECT_STUDENT: 'SELECT_STUDENT',
    UNSELECT_STUDENT: 'UNSELECT_STUDENT',
    SELECT_ALL_STUDENTS: 'SELECT_ALL_STUDENTS',
    UNSELECT_ALL_STUDENTS: 'UNSELECT_ALL_STUDENTS',
    SELECT_MARK: 'SELECT_MARK',
    UPDATED_MODERATION_SET: 'UPDATED_MODERATION_SET',
    UPDATE_MODERATION_SET_FAILED: 'UPDATE_MODERATION_SET_FAILED',
    PUBLISHED_GRADES: 'PUBLISHED_GRADES',
    PUBLISHED_GRADES_FAILED: 'PUBLISHED_GRADES_FAILED',
    GOT_STUDENTS: 'GOT_STUDENTS',
    SORT_MARK_COLUMN: 'SORT_MARK_COLUMN',

    sortMarkColumn (markColumnData) {
      return {
        type: this.SORT_MARK_COLUMN,
        payload: markColumnData
      };
    },

    selectStudent (studentId) {
      return {
        type: this.SELECT_STUDENT,
        payload: { studentId }
      };
    },

    unselectStudent (studentId) {
      return {
        type: this.UNSELECT_STUDENT,
        payload: { studentId }
      };
    },

    selectAllStudents (students) {
      return {
        type: this.SELECT_ALL_STUDENTS,
        payload: { students }
      };
    },

    unselectAllStudents () {
      return {
        type: this.UNSELECT_ALL_STUDENTS
      };
    },

    moderationSetUpdated (students) {
      return {
        type: this.UPDATED_MODERATION_SET,
        payload: {
          students,
          time: Date.now(),
          message: I18n.t('Reviewers successfully added')
        }
      };
    },

    moderationSetUpdateFailed () {
      return {
        type: this.UPDATE_MODERATION_SET_FAILED,
        payload: {
          time: Date.now(),
          message: I18n.t('A problem occurred adding reviewers.')
        },
        error: true
      };
    },

    gotStudents (students) {
      return {
        type: this.GOT_STUDENTS,
        payload: { students }
      };
    },

    publishedGrades (message) {
      return {
        type: this.PUBLISHED_GRADES,
        payload: {
          message,
          time: Date.now()
        }
      };
    },

    publishGradesFailed (message) {
      return {
        type: this.PUBLISHED_GRADES_FAILED,
        payload: {
          message,
          time: Date.now()
        },
        error: true
      };
    },

    publishGrades (ajaxLib) {
      return (dispatch, getState) => {
        var endpoint = getState().urls.publish_grades_url;
        ajaxLib = ajaxLib || axios;
        ajaxLib.post(endpoint)
               .then((response) => {
                 dispatch(this.publishedGrades(I18n.t('Success! Grades were published to the grade book.')));
               })
               .catch((response) => {
                 if (response.status === 400) {
                   dispatch(this.publishGradesFailed(I18n.t('Assignment grades have already been published.')));
                 } else {
                   dispatch(this.publishGradesFailed(I18n.t('An error occurred publishing grades.')));
                 }
               });
      };
    },

    addStudentToModerationSet (ajaxLib) {
      return (dispatch, getState) => {
        var endpoint = getState().urls.add_moderated_students;
        ajaxLib = ajaxLib || axios;
        ajaxLib.post(endpoint, {
                  student_ids: getState().moderationStage
               })
               .then((response) => {
                 dispatch(this.moderationSetUpdated(response.data));
               })
               .catch((response) => {
                 dispatch(this.moderationSetUpdateFailed());
               });
      };
    },

    apiGetStudents (ajaxLib) {
      return (dispatch, getState) => {
        var endpoint = getState().urls.list_gradeable_students;
        ajaxLib = ajaxLib || axios;
        ajaxLib.get(endpoint)
               .then((response) => {
                 dispatch(this.gotStudents(response.data));
               })
               .catch((response) => {
                 throw new Error(response);
               });
      };
    }
  };

  return ModerationActions;
});
