var fs = require("fs");
const glob = require('glob');

var webpackFileExists = false;
var webpackFilePath = __dirname + "/config/WEBPACK";
try {
  fs.statSync(webpackFilePath);
  webpackFileExists = true;
}
catch (e) {
  console.log("no webpack file....")
}

var usingWebpack = (process.env.USE_WEBPACK == 'True' ||
                    process.env.USE_WEBPACK == 'true' ||
                    webpackFileExists);

// If we're using webpack, we don't want to load all the requirejs stuff;
var karmaFiles;
if (usingWebpack) {
  karmaFiles = [
    'spec/javascripts/support/sinon/sinon-1.17.2.js',
    'spec/javascripts/support/axe.js',
    {pattern: 'spec/javascripts/webpack/*.bundle.test.js', included: true, served: true},
    {pattern: 'spec/javascripts/fixtures/*', included: false, served: true}
  ];
}else{
  if (process.env.JS_SPEC_MATCHER) {
    const files = glob.sync(process.env.JS_SPEC_MATCHER);
    console.log('These spec files were matched:');
    console.log(files);
    karmaFiles = [
      'spec/javascripts/requirejs_config.js',
      'spec/javascripts/tests.js',
      'public/javascripts/vendor/require.js',
      'node_modules/karma-requirejs/lib/adapter.js',
      'spec/javascripts/support/sinon/sinon-1.17.2.js',
      'spec/javascripts/support/sinon/sinon-qunit-1.0.0.js',
      'spec/javascripts/support/axe.js',
      {pattern: 'public/javascripts/*.js', included: false, served: true},
      {pattern: 'spec/javascripts/fixtures/*.html', included: false, served: true},
      {pattern: 'spec/javascripts/tests.js', included: false, served: true},
      {pattern: 'spec/javascripts/compiled/helpers/*.js', included: false, served: true}
    ];
    files.forEach(f => karmaFiles.push({pattern: f, included: false, served: true}));
    karmaFiles = karmaFiles.concat([
      {pattern: 'spec/javascripts/fixtures/*', included: false, served: true},
      {pattern: 'public/javascripts/**/*.js', included: false, served: true},
      {pattern: 'public/dist/brandable_css/**/*.css', included: false, served: true},
      'spec/javascripts/load_tests.js'
    ]);
  } else {
    karmaFiles = [
      'spec/javascripts/requirejs_config.js',
      'spec/javascripts/tests.js',
      'public/javascripts/vendor/require.js',
      'node_modules/karma-requirejs/lib/adapter.js',
      'spec/javascripts/support/sinon/sinon-1.17.2.js',
      'spec/javascripts/support/sinon/sinon-qunit-1.0.0.js',
      'spec/javascripts/support/axe.js',
      {pattern: 'public/javascripts/*.js', included: false, served: true},
      {pattern: 'spec/javascripts/fixtures/*.html', included: false, served: true},
      {pattern: 'spec/javascripts/tests.js', included: false, served: true},
      {pattern: 'spec/javascripts/compiled/*.js', included: false, served: true},
      {pattern: 'spec/javascripts/compiled/**/*.js', included: false, served: true},
      {pattern: 'spec/**/javascripts/compiled/**/*.js', included: false, served: true},
      {pattern: 'spec/javascripts/fixtures/*', included: false, served: true},
      {pattern: 'public/javascripts/**/*.js', included: false, served: true},
      {pattern: 'public/dist/brandable_css/**/*.css', included: false, served: true},
      'spec/javascripts/load_tests.js'
    ]
  }
}


var karmaConfig = {
  basePath: '',

  frameworks: ['qunit'],

  files: karmaFiles,

  preprocessors: {
    '**/*.js': ['sourcemap']
  },

  proxies: {
    "/dist/brandable_css/": "/base/public/dist/brandable_css/"
  },

  exclude: [],

  // 'dots', 'progress', 'junit', 'growl', 'coverage', 'spec'
  reporters: ['progress', 'coverage'],

  coverageReporter: {
    type: 'html',
    dir: 'coverage-js/',
    subdir: '.'
  },

  port: 9876,

  colors: true,

  autoWatch: true,

  // - Chrome
  // - ChromeCanary
  // - Firefox
  // - Opera (has to be installed with `npm install karma-opera-launcher`)
  // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
  // - PhantomJS
  // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
  browsers: ['Chrome', 'PhantomJS'],

  // If browser does not capture in given timeout [ms], kill it
  captureTimeout: 60000,

  browserNoActivityTimeout: 20000,

  // Continuous Integration mode
  // if true, it capture browsers, run tests and exit
  singleRun: false
};

module.exports = function(config) {
  // config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
  karmaConfig.logLevel = config.LOG_ERROR,
  config.set(karmaConfig);
};
