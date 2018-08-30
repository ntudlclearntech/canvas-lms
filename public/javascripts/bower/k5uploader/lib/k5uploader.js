import Uploader from "./uploader";
import SessionManager from "./session_manager";
import KalturaSession from "./kaltura_session";
import mBus from "./message_bus";
import Messenger from "./messenger";
import EntryService from "./entry_service";
import UiconfService from "./uiconf_service";
import k5Options from "./k5_options";

function K5Uploader (options){
  // set up instance as an event dispatcher
  Messenger.decorate(this);

  k5Options.setOptions(options);
  this.buildDependencies();
  this.addListeners();
  this.session.setSession(options.kaltura_session);
  this.loadUiConf();
}

K5Uploader.prototype.destroy = function() {
  mBus.destroy();
  this.session = undefined;
  this.entryService = undefined;
  this.uiconfService = undefined;
};

K5Uploader.prototype.buildDependencies = function() {
  this.session = new KalturaSession();
  this.entryService = new EntryService();
  this.uiconfService = new UiconfService();
};

K5Uploader.prototype.addListeners = function() {
  mBus.addEventListener('UiConf.error', this.onUiConfError.bind(this));
  mBus.addEventListener('UiConf.complete', this.onUiConfComplete.bind(this));
  mBus.addEventListener('Uploader.error', this.onUploadError.bind(this));
  mBus.addEventListener('Uploader.success', this.onUploadSuccess.bind(this));
  mBus.addEventListener('Uploader.progress', this.onProgress.bind(this));

  mBus.addEventListener('Entry.success', this.onEntrySuccess.bind(this));
  mBus.addEventListener('Entry.fail', this.onEntryFail.bind(this));
};

K5Uploader.prototype.onSessionLoaded = function(data) {
  this.session = data;
  this.loadUiConf();
};

K5Uploader.prototype.loadUiConf = function() {
  this.uiconfService.load(this.session);
};

K5Uploader.prototype.onUiConfComplete = function(result) {
  this.uiconfig = result;
  this.dispatchEvent("K5.ready", {}, this);
};


K5Uploader.prototype.uploadFile = function(file) {
  this.file = file;
  if (!file) {
    return
  }

  if (ENV.ARC_RECORDING_FEATURE_ENABLED && this.uiconfig.acceptableFile(file, k5Options.allowedMediaTypes) || file.type === "webm") {
    this.uploader = new Uploader();
    this.uploader.send(this.session, file);
  } else if (this.uiconfig.acceptableFile(file, k5Options.allowedMediaTypes)) {
    this.uploader = new Uploader();
    this.uploader.send(this.session, file);
  } else {
    var details = {
      maxFileSize: this.uiconfig.maxFileSize,
      file: file,
      allowedMediaTypes: k5Options.allowedMediaTypes
    };
    this.dispatchEvent("K5.fileError", details, this);
  }
};

K5Uploader.prototype.onUploadSuccess = function(result) {
  // combine all needed data and add an entry to kaltura
  var allParams;
  if (ENV.ARC_RECORDING_FEATURE_ENABLED) {
    allParams = [
      this.session.asEntryParams(),
      result.asEntryParams(),
      k5Options.asEntryParams()
    ]
    this.entryService.addEntry(allParams)
  } else {
    allParams = [
      this.uiconfig.asEntryParams(this.file.name),
      this.session.asEntryParams(),
      result.asEntryParams(),
      k5Options.asEntryParams()
    ]
    this.entryService.addEntry(allParams)
  }
}

// Delegate to publicly available K5 events
K5Uploader.prototype.onProgress = function(e) {
  this.dispatchEvent('K5.progress', e, this);
};

K5Uploader.prototype.onUploadError = function(result) {
  this.dispatchEvent('K5.error', result, this);
};

K5Uploader.prototype.onEntrySuccess = function(data) {
  this.dispatchEvent('K5.complete', data, this);
};

K5Uploader.prototype.onEntryFail = function(data) {
  this.dispatchEvent('K5.error', data, this);
};

K5Uploader.prototype.onUiConfError = function(result) {
  this.dispatchEvent('K5.uiconfError', result, this);
};


export default K5Uploader;
