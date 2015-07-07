require 'spec_helper'

module HandlebarsTasks

  expected_precompiled_template = <<-END
define(["ember","compiled/ember/shared/helpers/common"], function(Ember) {
  Ember.TEMPLATES['%s'] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};



  data.buffer.push("foo");

});
});
  END

  describe EmberHbs do
    describe "#compile_template" do
      def strip_js(str)
        str.gsub(/\s+/, '').gsub(/\/\*[^\*\/]*\*\//, '')
      end

      it "outputs a precompiled template wrapped in AMD and registers with Ember.TEMPLATES" do
        require 'tempfile'
        file = Tempfile.new("foo")
        file.write "foo"
        file.close
        expected = strip_js(expected_precompiled_template % EmberHbs::parse_name(file.path))
        strip_js(EmberHbs::compile_template(file.path)).should eq expected
        file.unlink
      end
    end

    describe "#parse_name" do
      it "parses the file path to the template name" do
        prefix = "app/coffeescripts/ember/inbox/templates"
        EmberHbs::parse_name("#{prefix}/application.hbs").should == 'application'
        EmberHbs::parse_name("#{prefix}/double/templates/foo_bar.hbs").should == 'double/templates/foo_bar'
        EmberHbs::parse_name("#{prefix}/components/x-foo.hbs").should == 'components/x-foo'
      end
    end

    describe "#parse_dest" do
      it "parses the file path to the template name" do
        prefix = "app/coffeescripts/ember/inbox/templates"
        dest = "public/javascripts/compiled/ember/inbox/templates"
        EmberHbs::parse_dest("#{prefix}/application.hbs").should == "#{dest}/application.js"
      end
    end
  end
end
