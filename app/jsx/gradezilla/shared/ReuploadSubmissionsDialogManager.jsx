define([
  'compiled/behaviors/authenticity_token',
  'jst/re_upload_submissions_form',
  'i18n!gradezilla',
  'jquery',
  'jquery.instructure_misc_helpers'
], (authenticity_token, re_upload_submissions_form, I18n, $) => {
  class ReuploadSubmissionsDialogManager {
    constructor (assignment, reuploadUrlTemplate) {
      this.assignment = assignment;
      this.reuploadUrl = $.replaceTags(reuploadUrlTemplate, 'assignment_id', assignment.id);
      this.showDialog = this.showDialog.bind(this);
    }

    isDialogEnabled () {
      return this.assignment.hasDownloadedSubmissions;
    }

    getReuploadForm () {
      if (ReuploadSubmissionsDialogManager.reuploadForm) {
        return ReuploadSubmissionsDialogManager.reuploadForm;
      }

      ReuploadSubmissionsDialogManager.reuploadForm = $(
        re_upload_submissions_form({ authenticityToken: authenticity_token() })
      ).dialog(
        {
          width: 400,
          modal: true,
          resizable: false,
          autoOpen: false
        }
      ).submit(function () {
        const data = $(this).getFormData();
        let submitForm = true;

        if (!data.submissions_zip) {
          submitForm = false;
        } else if (!data.submissions_zip.match(/\.zip$/)) {
          $(this).formErrors({ submissions_zip: I18n.t('Please upload files as a .zip') });
          submitForm = false;
        }

        return submitForm;
      });

      return ReuploadSubmissionsDialogManager.reuploadForm;
    }

    showDialog () {
      const form = this.getReuploadForm();
      form.attr('action', this.reuploadUrl).dialog('open');
    }
  }

  return ReuploadSubmissionsDialogManager;
});
