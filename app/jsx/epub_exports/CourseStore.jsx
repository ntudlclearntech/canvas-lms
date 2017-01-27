import React from 'react'
import _ from 'underscore'
import createStore from 'jsx/shared/helpers/createStore'
import $ from 'jquery'
  var CourseEpubExportStore = createStore({}),
    _courses = {};

  CourseEpubExportStore.getAll = function() {
    $.getJSON('/api/v1/epub_exports', function(data) {
      _.each(data.courses, function(course) {
        _courses[course.id] = course;
      });
      CourseEpubExportStore.setState(_courses);
    });
  }

  CourseEpubExportStore.get = function(course_id, id) {
    var url = '/api/v1/courses/' + course_id + '/epub_exports/' + id;
    $.getJSON(url, function(data) {
      _courses[data.id] = data;
      CourseEpubExportStore.setState(_courses);
    });
  }

  CourseEpubExportStore.create = function(id) {
    var url = '/api/v1/courses/' + id + '/epub_exports';
    $.post(url, {}, function(data) {
      _courses[data.id] = data;
      CourseEpubExportStore.setState(_courses);
    }, 'json');
  }

export default CourseEpubExportStore
