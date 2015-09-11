/** @jsx React.DOM */
define([
  'react',
  'underscore',
  'i18n!gradebook',
  './headerDropdownOption',
  '../constants',
  'jsx/gradebook/grid/components/dropdown_components/setDefaultGradeOption'
], function (React, _, I18n, HeaderDropdownOption, GradebookConstants, SetDefaultGradeOption) {

  var AssignmentHeaderDropdownOptions = React.createClass({

    propTypes: {
      assignment: React.PropTypes.object.isRequired,
      idAttribute: React.PropTypes.string.isRequired,
      enrollments: React.PropTypes.array.isRequired
    },

    getDropdownOptions() {
      var assignment                 = this.props.assignment,
          assignmentUrl              = assignment.html_url,
          downloadableSubmissions    = ['online_upload', 'online_text_entry', 'online_url'],
          hasDownloadableSubmissions = _.any(_.intersection(downloadableSubmissions, assignment.submission_types)),
          dropdownOptions            = [
            { title: I18n.t('Assignment Details'), action: 'showAssignmentDetails', url: assignmentUrl },
            { title: I18n.t('Message Students Who...'), action: 'messageStudentsWho' },
            { action: 'setDefaultGrade' },
            { title: I18n.t('Curve Grades'), action: 'curveGrades' }
          ],
          downloadSubmissionsOption, reuploadSubmissionsOption, speedGraderUrl, speedGraderOption,
          muteAssignmentOption;

      if (hasDownloadableSubmissions && assignment.has_submitted_submissions) {
        downloadSubmissionsOption = { title: I18n.t('Download Submissions'), action: 'downloadSubmissions' };
        dropdownOptions.push(downloadSubmissionsOption);
      }

      if (assignment.submissions_downloads > 0 ) {
       reuploadSubmissionsOption = { title: I18n.t('Re-Upload Submissions'), action: 'reuploadSubmissions' };
       dropdownOptions.push(reuploadSubmissionsOption);
      }

      if (GradebookConstants.speed_grader_enabled) {
        speedGraderUrl = assignment.speedgrader_url;
        speedGraderOption = { title: I18n.t('Speedgrader'), url: speedGraderUrl, action: 'openSpeedgrader' };
        dropdownOptions.splice(1, 0, speedGraderOption);
      }

      muteAssignmentOption = { title: I18n.t('Mute Assignment'), action: 'toggleMuting' };
      if (assignment.muted) muteAssignmentOption.title = I18n.t('Unmute Assignment');
      dropdownOptions.push(muteAssignmentOption);
      return dropdownOptions;
    },

    render() {
      var options     = this.getDropdownOptions(),
          assignment  = this.props.assignment,
          enrollments = this.props.enrollments,
          key;
      return (
        <ul id={this.props.idAttribute} className="gradebook-header-menu">
          {
            // this map is temporary and will go away. eventually we'll have a
            // renderer for each dropdown option. for now, we render a generic
            // HeaderDropDownOption for yet-to-be-implemented dropdown options.
            _.map(options, (listItem) => {
              key = listItem.action + '-' + assignment.id;
              if (listItem.action === 'setDefaultGrade') {
                return (
                  <SetDefaultGradeOption
                    key={key}
                    assignment={assignment}
                    enrollments={enrollments}
                    contextId={GradebookConstants.context_id}/>
                );
              } else {
                return(
                  <HeaderDropdownOption
                    key={key} title={listItem.title}
                    dataAction={listItem.action} url={listItem.url}
                    ref={listItem.action}/>
                );
              }
            })
          }
        </ul>
      );
    }
  });

  return AssignmentHeaderDropdownOptions;
});
