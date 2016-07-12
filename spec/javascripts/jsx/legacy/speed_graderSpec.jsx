define([
  'jquery',
  'speed_grader',
  'speed_grader_helpers',
  'helpers/fakeENV',
  'jquery.ajaxJSON'
  ], ($, speedGrader, SpeedgraderHelpers, fakeENV) => {

  module("speedGrader", {
    setup() {
      fakeENV.setup();
      sinon.spy($, 'ajaxJSON');
      sinon.spy($.fn, 'append');
      this.originalWindowJSONData = window.jsonData;
      window.jsonData = {
        id: 27,
        GROUP_GRADING_MODE: false
      };
      speedGrader.EG.currentStudent = {
        id: 4,
        submission: {
          score: 7,
          grade: 70,
          submission_comments: [{
            group_comment_id: null,
            anonymous: false,
            assessment_request_id: null,
            attachment_ids: "",
            author_id: 1000,
            author_name: "neil@instructure.com",
            comment: "test",
            context_id: 1,
            context_type: "Course",
            created_at: "2016-07-12T23:47:34Z",
            hidden: false,
            id: 11,
            posted_at:"Jul 12 at 5:47pm",
            submission_id: 1,
            teacher_only_comment: false,
            updated_at: "2016-07-12T23:47:34Z"
          }]
        }
      };
      ENV.SUBMISSION = {
        grading_role: 'teacher'
      };
      ENV.RUBRIC_ASSESSMENT = {
        assessment_type: 'grading',
        assessor_id: 1
      };
      $("#fixtures").html(
        "<div id='grade_container'>"                          +
        "  <a class='update_submission_grade_url'"            +
        "   href='my_url.com' title='POST'></a>"              +
        "  <input class='grading_value' value='56' />"        +
        "  <div id='combo_box_container'></div>"              +
        "  <div id='comments'></div>"                         +
        "</div>"
      );
    },

    teardown() {
      fakeENV.teardown();
      window.jsonData = this.originalWindowJSONData;
      $.ajaxJSON.restore();
      $.fn.append.restore();
      $("#fixtures").empty();
    }
  });

  test('showDiscussion should not show private comments for a group assignment', () => {
    jsonData.GROUP_GRADING_MODE = true;
    speedGrader.EG.currentStudent.submission.submission_comments[0].group_comment_id = null;
    speedGrader.EG.showDiscussion();
    sinon.assert.notCalled($.fn.append);
  });

  test('showDiscussion should show group comments for group assignments', () => {
    jsonData.GROUP_GRADING_MODE = true;
    speedGrader.EG.currentStudent.submission.submission_comments[0].group_comment_id = "hippo";
    speedGrader.EG.showDiscussion();
    sinon.assert.calledOnce($.fn.append);
  });

  test('showDiscussion should show private comments for non group assignments', () => {
    jsonData.GROUP_GRADING_MODE = false;
    speedGrader.EG.currentStudent.submission.submission_comments[0].group_comment_id = null;
    speedGrader.EG.showDiscussion();
    sinon.assert.calledOnce($.fn.append);
  });

  test('handleGradeSubmit should submit score if using existing score', ()=>{
    speedGrader.EG.handleGradeSubmit(null, true);
    equal($.ajaxJSON.getCall(0).args[0], 'my_url.com');
    equal($.ajaxJSON.getCall(0).args[1], 'POST');
    const formData = $.ajaxJSON.getCall(0).args[2];
    equal(formData['submission[score]'], '7');
    equal(formData['submission[grade]'], undefined);
    equal(formData['submission[user_id]'], 4);
  });

  test('handleGradeSubmit should submit grade if not using existing score', ()=>{
    sinon.stub(SpeedgraderHelpers, 'determineGradeToSubmit').returns('56');
    speedGrader.EG.handleGradeSubmit(null, false);
    equal($.ajaxJSON.getCall(0).args[0], 'my_url.com');
    equal($.ajaxJSON.getCall(0).args[1], 'POST');
    const formData = $.ajaxJSON.getCall(0).args[2];
    equal(formData['submission[score]'], undefined);
    equal(formData['submission[grade]'], '56');
    equal(formData['submission[user_id]'], 4);
    SpeedgraderHelpers.determineGradeToSubmit.restore();
  });

  let $div = null;
  module('loading a submission Preview', {
    setup() {
      fakeENV.setup();
      sinon.spy($, 'ajaxJSON');
      $div = $("<div id='iframe_holder'>not empty</div>")
      $("#fixtures").html($div)
    },

    teardown() {
      fakeENV.teardown();
      $.ajaxJSON.restore();
      $("#fixtures").empty();
    }
  });

  test('entry point function, loadSubmissionPreview, is a function', () => {
    ok(typeof speedGrader.EG.loadSubmissionPreview === 'function');
  })

  module('emptyIframeHolder', {
    setup() {
      fakeENV.setup();
      sinon.spy($, 'ajaxJSON');
      $div = $("<div id='iframe_holder'>not empty</div>")
      $("#fixtures").html($div)
    },

    teardown() {
      fakeENV.teardown();
      $.ajaxJSON.restore();
      $("#fixtures").empty();
    }
  });

  test('is a function', () => {
    ok(typeof speedGrader.EG.emptyIframeHolder === 'function');
  });

  test('clears the contents of the iframe_holder', () => {
    speedGrader.EG.emptyIframeHolder($div);
    ok($div.is(':empty'));
  });

  module('renderLtiLaunch', {
    setup() {
      fakeENV.setup();
      sinon.spy($, 'ajaxJSON');
      $div = $("<div id='iframe_holder'>not empty</div>")
      $("#fixtures").html($div)
    },

    teardown() {
      fakeENV.teardown();
      $.ajaxJSON.restore();
      $("#fixtures").empty();
    }
  });

  test('is a function', () => {
    ok(typeof speedGrader.EG.renderLtiLaunch === 'function')
  })

  test('contains iframe with the escaped student submission url', () => {
    let retrieveUrl = 'canvas.com/course/1/external_tools/retrieve?display=borderless&assignment_id=22'
    let url = 'www.example.com/lti/launch/user/4'
    speedGrader.EG.renderLtiLaunch($div, retrieveUrl, url)
    let srcUrl = $div.find('iframe').attr('src')
    ok(srcUrl.indexOf(retrieveUrl) > -1)
    ok(srcUrl.indexOf(encodeURIComponent(url)) > -1)
  });

  module('speed_grader#getGradeToShow');

  test('returns an empty string if submission is null', () => {
    let grade = speedGrader.EG.getGradeToShow(null, 'some_role');

    equal(grade, '');
  });

  test('returns an empty string if the submission is undefined', () => {
    let grade = speedGrader.EG.getGradeToShow(undefined, 'some_role');

    equal(grade, '');
  });

  test('returns an empty string if a submission has no excused or grade', () => {
    let grade = speedGrader.EG.getGradeToShow({}, 'some_role');

    equal(grade, '');
  });

  test('returns excused if excused is true', () => {
    let grade = speedGrader.EG.getGradeToShow({ excused: true }, 'some_role');

    equal(grade, 'EX');
  });

  test('returns excused if excused is true and user is moderator', () => {
    let grade = speedGrader.EG.getGradeToShow({ excused: true }, 'moderator');

    equal(grade, 'EX');
  });

  test('returns excused if excused is true and user is provisional grader', () => {
    let grade = speedGrader.EG.getGradeToShow({ excused: true }, 'provisional_grader');

    equal(grade, 'EX');
  });

  test('returns grade if submission has no excused and grade is not a float', () => {
    let grade = speedGrader.EG.getGradeToShow({ grade: 'some_grade' }, 'some_role');

    equal(grade, 'some_grade');
  });

  test('returns score of submission if user is a moderator', () => {
    let grade = speedGrader.EG.getGradeToShow({ grade: 15, score: 25 }, 'moderator');

    equal(grade, '25');
  });

  test('returns score of submission if user is a provisional grader', () => {
    let grade = speedGrader.EG.getGradeToShow({ grade: 15, score: 25 }, 'provisional_grader');

    equal(grade, '25');
  });

  test('returns grade of submission if user is neither a moderator or provisional grader', () => {
    let grade = speedGrader.EG.getGradeToShow({ grade: 15, score: 25 }, 'some_role');

    equal(grade, '15');
  });

  test('returns grade of submission if user is moderator but score is null', () => {
    let grade = speedGrader.EG.getGradeToShow({ grade: 15 }, 'moderator');

    equal(grade, '15');
  });

  test('returns grade of submission if user is provisional grader but score is null', () => {
    let grade = speedGrader.EG.getGradeToShow({ grade: 15 }, 'provisional_grader');

    equal(grade, '15');
  });
});
