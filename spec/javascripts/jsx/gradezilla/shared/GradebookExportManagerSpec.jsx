define([
  'moxios',
  'jsx/gradezilla/shared/GradebookExportManager',
], (moxios, GradebookExportManager) => {
  const currentUserId = 42;
  const exportingUrl = 'http://exportingUrl';
  const monitoringBase = GradebookExportManager.DEFAULT_MONITORING_BASE_URL;
  const attachmentBase = `${GradebookExportManager.DEFAULT_ATTACHMENT_BASE_URL}/${currentUserId}/files`;
  const workingExport = {
    progressId: 'progressId',
    attachmentId: 'attachmentId'
  };

  module('GradebookExportManager - constructor', {
    setup () {
      moxios.install();
    },

    teardown () {
      moxios.uninstall();
    }
  });

  test('sets the polling interval with a sensible default', function () {
    const manager = new GradebookExportManager(exportingUrl, currentUserId, undefined, 5000);

    equal(manager.pollingInterval, 5000);

    const anotherManager = new GradebookExportManager(exportingUrl, currentUserId, workingExport);

    equal(anotherManager.pollingInterval, GradebookExportManager.DEFAULT_POLLING_INTERVAL);
  });

  test('sets the existing export if it is not already completed or failed', function () {
    ['completed', 'failed'].forEach((workflowState) => {
      const existingExport = {
        progressId: workingExport.progressId,
        attachmentId: workingExport.attachmentId,
        workflowState
      };

      const manager = new GradebookExportManager(exportingUrl, currentUserId, existingExport);

      deepEqual(manager.export, undefined);
    });

    ['discombobulated', undefined].forEach((workflowState) => {
      const existingExport = {
        progressId: workingExport.progressId,
        attachmentId: workingExport.attachmentId,
        workflowState
      };

      const manager = new GradebookExportManager(exportingUrl, currentUserId, existingExport);

      deepEqual(manager.export, existingExport);
    });
  });

  module('GradebookExportManager - monitoringUrl', {
    setup () {
      moxios.install();

      this.subject = new GradebookExportManager(exportingUrl, currentUserId, workingExport);
    },

    teardown () {
      moxios.uninstall();

      this.subject = undefined;
    }
  });

  test('returns an appropriate url if all relevant pieces are present', function () {
    equal(this.subject.monitoringUrl(), `${monitoringBase}/progressId`);
  });

  test('returns undefined if export is missing', function () {
    this.subject.export = undefined;

    equal(this.subject.monitoringUrl(), undefined);
  });

  test('returns undefined if progressId is missing', function () {
    this.subject.export.progressId = undefined;

    equal(this.subject.monitoringUrl(), undefined);
  });

  module('GradebookExportManager - attachmentUrl', {
    setup () {
      moxios.install();

      this.subject = new GradebookExportManager(exportingUrl, currentUserId, workingExport);
    },

    teardown () {
      moxios.uninstall();

      this.subject = undefined;
    }
  });

  test('returns an appropriate url if all relevant pieces are present', function () {
    equal(this.subject.attachmentUrl(), `${attachmentBase}/attachmentId`);
  });

  test('returns undefined if export is missing', function () {
    this.subject.export = undefined;

    equal(this.subject.attachmentUrl(), undefined);
  });

  test('returns undefined if attachmentId is missing', function () {
    this.subject.export.attachmentId = undefined;

    equal(this.subject.attachmentUrl(), undefined);
  });

  module('GradebookExportManager - startExport', {
    setup () {
      moxios.install();

      const expectedExportFromServer = {
        progress_id: 'newProgressId',
        attachment_id: 'newAttachmentId'
      };

      // Initial request to start the export
      moxios.stubRequest(exportingUrl, {
        status: 200,
        responseText: expectedExportFromServer
      });
    },

    teardown () {
      moxios.uninstall();

      this.subject = undefined;
    }
  });

  test('returns a rejected promise if the manager has no exportingUrl set', function () {
    this.subject = new GradebookExportManager(exportingUrl, currentUserId, undefined);
    this.subject.exportingUrl = undefined;

    return this.subject.startExport().catch((reason) => {
      equal(reason, 'No way to export gradebooks provided!');
    });
  });

  test('returns a rejected promise if the manager already has an export going', function () {
    this.subject = new GradebookExportManager(exportingUrl, currentUserId, workingExport);

    return this.subject.startExport().catch((reason) => {
      equal(reason, 'An export is already in progress.');
    });
  });

  test('sets a new existing export and returns a fulfilled promise', function () {
    const expectedExport = {
      progressId: 'newProgressId',
      attachmentId: 'newAttachmentId'
    };

    this.subject = new GradebookExportManager(exportingUrl, currentUserId, undefined);
    this.subject.monitorExport = (resolve, _reject) => {
      resolve('success');
    };

    return this.subject.startExport().then(() => {
      deepEqual(this.subject.export, expectedExport);
    });
  });

  test('clears any new export and returns a rejected promise if no monitoring is possible', function () {
    this.stub(GradebookExportManager.prototype, 'monitoringUrl').returns(undefined);
    this.subject = new GradebookExportManager(exportingUrl, currentUserId, undefined);

    return this.subject.startExport().catch((reason) => {
      equal(reason, 'No way to monitor gradebook exports provided!');
      equal(this.subject.export, undefined);
    });
  });

  test('starts polling for progress and returns a rejected promise on progress failure', function () {
    const expectedMonitoringUrl = `${monitoringBase}/newProgressId`;

    this.subject = new GradebookExportManager(exportingUrl, currentUserId, undefined);

    moxios.stubRequest(expectedMonitoringUrl, {
      status: 200,
      responseText: {
        workflow_state: 'failed',
        message: 'Arbitrary failure'
      }
    });

    return this.subject.startExport().catch((reason) => {
      equal(reason, 'Error exporting gradebook: Arbitrary failure');
    });
  });

  test('starts polling for progress and returns a fulfilled promise on progress completion', function () {
    const expectedMonitoringUrl = `${monitoringBase}/newProgressId`;
    const expectedAttachmentUrl = `${attachmentBase}/newAttachmentId`;

    this.subject = new GradebookExportManager(exportingUrl, currentUserId, undefined);

    moxios.stubRequest(expectedMonitoringUrl, {
      status: 200,
      responseText: {
        workflow_state: 'completed'
      }
    });

    moxios.stubRequest(expectedAttachmentUrl, {
      status: 200,
      responseText: {
        url: 'http://completedAttachmentUrl',
        updated_at: '2009-01-20T17:00:00Z'
      }
    });

    return this.subject.startExport().then((resolution) => {
      equal(this.subject.export, undefined);

      const expectedResolution = {
        attachmentUrl: 'http://completedAttachmentUrl',
        updatedAt: '2009-01-20T17:00:00Z'
      };
      deepEqual(resolution, expectedResolution);
    });
  });
});
