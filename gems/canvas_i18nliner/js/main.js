var I18nliner = require("i18nliner").default;
var Commands = I18nliner.Commands;
var Check = Commands.Check;

var CoffeeScript = require("coffee-script");
var fs = require('fs');

var JsProcessor = require("i18nliner/dist/lib/processors/js_processor").default;
var HbsProcessor = require("i18nliner-handlebars/dist/lib/hbs_processor").default;
var CallHelpers = require("i18nliner/dist/lib/call_helpers").default;

var glob = require("glob");

// explict subdirs, to work around perf issues
// https://github.com/jenseng/i18nliner-js/issues/7
JsProcessor.prototype.directories = ["public/javascripts", "app/coffeescripts", "app/jsx"];
JsProcessor.prototype.defaultPattern = ["*.js", "*.jsx", "*.coffee"];
HbsProcessor.prototype.directories = ["app/views/jst", "app/coffeescripts/ember"];
HbsProcessor.prototype.defaultPattern = ["*.hbs", "*.handlebars"];

JsProcessor.prototype.sourceFor = function(file) {
  var source = fs.readFileSync(file).toString();
  var data = { source: source, skip: !source.match(/I18n\.t/) };

  if (file.match(/\.coffee$/)) {
    data.source = CoffeeScript.compile(source, {});
  }
  return data;
};

// we do the actual pre-processing in sourceFor, so just pass data straight through
JsProcessor.prototype.preProcess = function(data) {
  return data;
};

require("./scoped_hbs_pre_processor");
var ScopedI18nJsExtractor = require("./scoped_i18n_js_extractor");
var ScopedHbsExtractor = require("./scoped_hbs_extractor");
var ScopedTranslationHash = require("./scoped_translation_hash");

// remove path stuff we don't want in the scope
var pathRegex = new RegExp(
  ".*(" + HbsProcessor.prototype.directories.join("|") + ")(/plugins/[^/]+)?/"
);
ScopedHbsExtractor.prototype.normalizePath = function(path) {
  return path.replace(pathRegex, "").replace(/^([^\/]+\/)templates\//, '$1');
};

var GenerateJs = require("./generate_js");
Commands.Generate_js = GenerateJs;

// swap out the defaults for our scope-aware varieties
Check.prototype.TranslationHash = ScopedTranslationHash;
JsProcessor.prototype.I18nJsExtractor = ScopedI18nJsExtractor;
HbsProcessor.prototype.Extractor = ScopedHbsExtractor;
CallHelpers.keyPattern = /^\#?\w+(\.\w+)+$/ // handle our absolute keys

module.exports = {
  I18nliner: I18nliner,
  runCommand: function(argv) {
    argv = require('minimist')(argv);
    Commands.run(argv._[0], argv) || process.exit(1);
  }
};
