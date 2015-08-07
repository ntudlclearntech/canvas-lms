require File.expand_path(File.dirname(__FILE__) + '/../common')

shared_examples_for "external tools tests" do
  include_context "in-process server selenium tests"

  def tool_checker (tool, opts)

    if (opts.include? :xml)
      url = "http://example.com/other_url"
      expect(tool.url).to eq url
      expect(tool.workflow_state).to eq "public"
      expect(tool.description).to eq "Description"
      ContextExternalTool::EXTENSION_TYPES.each do |type|
        expect(tool.extension_setting(type)).not_to be_empty
        expect(f("#external_tool_#{tool.id} .#{type}")).to be_displayed
      end
      
    elsif opts.include? :url
      expect(tool.workflow_state).to eq "anonymous"
      expect(tool.url).to eq "http://www.edu-apps.org/tool_redirect?id=youtube"
      expect(tool.description).to include_text "YouTube videos"
      expect(tool.has_placement?(:editor_button)).to be_truthy
      expect(tool.settings).to be_present
      expect(tool.editor_button).to be_present
      expect(f("#external_tool_#{tool.id} .edit_tool_link")).to be_displayed

    else
      expect(tool.description).to eq @description
      tool.settings.count > 0
      tool.custom_fields.keys.count >0
      custom_hash = {@custom_key => @custom_value}
      expect(tool.custom_fields).to eq custom_hash
      if (opts.include? :manual_url)
        expect(tool.url).to eq @manual_url
      else
        expect(tool.domain).to eq @domain
      end
    end

  end

  def add_manual (opts)
    f("#external_tool_config_type option[value='manual']").click
    expect(f(".config_type.manual")).to be_displayed
    expect(f("#external_tool_config_url")).not_to be_displayed
    expect(f("#external_tool_config_xml")).not_to be_displayed
    @custom_key = "value"
    @custom_value = "custom tool"
    @description = "this is an external tool"
    @domain = "http://example.org"
    f("#external_tool_custom_fields_string").send_keys(@custom_key+"="+ @custom_value)
    f("#external_tool_description").send_keys(@description)
    if opts.include? :manual_url
      @manual_url = @domain+":80"
      f("#external_tool_url").send_keys(@manual_url)
    else
      f("#external_tool_domain").send_keys(@domain)
    end

    if opts.include? :name_only
      f("#external_tool_privacy_level option[value='name_only']").click
    elsif opts.include? :public
      f("#external_tool_privacy_level option[value='public']").click
    else
      f("#external_tool_privacy_level option[value='anonymous']").click
    end
  end

  def add_url
    url = "#{app_host}/lti_url"
    f("#external_tool_config_type option[value='by_url']").click
    expect(f("#external_tool_form .config_type.manual")).not_to be_displayed
    expect(f("#external_tool_config_xml")).not_to be_displayed
    expect(f("#external_tool_config_url")).to be_displayed
    f("#external_tool_config_url").send_keys(url)
  end


  def add_xml
    f("#external_tool_config_type option[value='by_xml']").click
    expect(f(".config_type.manual")).not_to be_displayed
    expect(f("#external_tool_config_url")).not_to be_displayed
    expect(f("#external_tool_config_xml")).to be_displayed

#XML must be broken up to avoid intermittent selenium failures
    f("#external_tool_config_xml").send_keys <<-XML
<?xml version="1.0" encoding="UTF-8"?>
<cartridge_basiclti_link xmlns="http://www.imsglobal.org/xsd/imslticc_v1p0"
    xmlns:blti = "http://www.imsglobal.org/xsd/imsbasiclti_v1p0"
    xmlns:lticm ="http://www.imsglobal.org/xsd/imslticm_v1p0"
    xmlns:lticp ="http://www.imsglobal.org/xsd/imslticp_v1p0"
    xmlns:xsi = "http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation = "http://www.imsglobal.org/xsd/imslticc_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticc_v1p0.xsd
    http://www.imsglobal.org/xsd/imsbasiclti_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imsbasiclti_v1p0.xsd
    http://www.imsglobal.org/xsd/imslticm_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticm_v1p0.xsd
    http://www.imsglobal.org/xsd/imslticp_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticp_v1p0.xsd">
    XML
    f("#external_tool_config_xml").send_keys <<-XML
    <blti:title>Other Name</blti:title>
    <blti:description>Description</blti:description>
    <blti:launch_url>http://example.com/other_url</blti:launch_url>
    <blti:extensions platform="canvas.instructure.com">
      <lticm:property name="privacy_level">public</lticm:property>
      <lticm:property name="vendor_help_link">http://example.com/help</lticm:property>
      <lticm:options name="editor_button">
        <lticm:property name="url">http://example.com/editor</lticm:property>
        <lticm:property name="icon_url">http://example.com/icon.png</lticm:property>
        <lticm:property name="text">Editor Button</lticm:property>
        <lticm:property name="selection_width">500</lticm:property>
        <lticm:property name="selection_height">300</lticm:property>
      </lticm:options>
    XML
    f("#external_tool_config_xml").send_keys <<-XML
      <lticm:options name="resource_selection">
        <lticm:property name="url">https://example.com/wiki</lticm:property>
        <lticm:property name="text">Build/Link to Wiki Page</lticm:property>
        <lticm:property name="selection_width">500</lticm:property>
        <lticm:property name="selection_height">300</lticm:property>
      </lticm:options>
      <lticm:options name="homework_submission">
        <lticm:property name="url">https://example.com/wiki</lticm:property>
        <lticm:property name="text">Build/Link to Wiki Page</lticm:property>
        <lticm:property name="selection_width">500</lticm:property>
        <lticm:property name="selection_height">300</lticm:property>
      </lticm:options>
      <lticm:options name="course_navigation">
        <lticm:property name="url">https://example.com/attendance</lticm:property>
        <lticm:property name="text">Attendance</lticm:property>
      </lticm:options>
      <lticm:options name="migration_selection">
        <lticm:property name="url">https://example.com/wiki</lticm:property>
        <lticm:property name="text">Build/Link to Wiki Page</lticm:property>
        <lticm:property name="selection_width">500</lticm:property>
        <lticm:property name="selection_height">300</lticm:property>
      </lticm:options>
      <lticm:options name="course_home_sub_navigation">
        <lticm:property name="url">https://example.com/wiki</lticm:property>
        <lticm:property name="text">Build/Link to Wiki Page</lticm:property>
        <lticm:property name="display_type">full_width</lticm:property>
      </lticm:options>
      <lticm:options name="course_settings_sub_navigation">
        <lticm:property name="url">https://example.com/wiki</lticm:property>
        <lticm:property name="text">Build/Link to Wiki Page</lticm:property>
        <lticm:property name="display_type">full_width</lticm:property>
      </lticm:options>
      <lticm:options name="global_navigation">
        <lticm:property name="url">https://example.com/wiki</lticm:property>
        <lticm:property name="text">Build/Link to Wiki Page</lticm:property>
        <lticm:property name="display_type">full_width</lticm:property>
      </lticm:options>
      <lticm:options name="assignment_menu">
        <lticm:property name="url">https://example.com/wiki</lticm:property>
        <lticm:property name="text">Build/Link to Wiki Page</lticm:property>
        <lticm:property name="display_type">full_width</lticm:property>
      </lticm:options>
      <lticm:options name="discussion_topic_menu">
        <lticm:property name="url">https://example.com/wiki</lticm:property>
        <lticm:property name="text">Build/Link to Wiki Page</lticm:property>
        <lticm:property name="display_type">full_width</lticm:property>
      </lticm:options>
      <lticm:options name="file_menu">
        <lticm:property name="url">https://example.com/wiki</lticm:property>
        <lticm:property name="text">Build/Link to Wiki Page</lticm:property>
        <lticm:property name="display_type">full_width</lticm:property>
      </lticm:options>
      <lticm:options name="module_menu">
        <lticm:property name="url">https://example.com/wiki</lticm:property>
        <lticm:property name="text">Build/Link to Wiki Page</lticm:property>
        <lticm:property name="display_type">full_width</lticm:property>
      </lticm:options>
      <lticm:options name="quiz_menu">
        <lticm:property name="url">https://example.com/wiki</lticm:property>
        <lticm:property name="text">Build/Link to Wiki Page</lticm:property>
        <lticm:property name="display_type">full_width</lticm:property>
      </lticm:options>
      <lticm:options name="wiki_page_menu">
        <lticm:property name="url">https://example.com/wiki</lticm:property>
        <lticm:property name="text">Build/Link to Wiki Page</lticm:property>
        <lticm:property name="display_type">full_width</lticm:property>
      </lticm:options>

    XML
    f("#external_tool_config_xml").send_keys <<-XML
      <lticm:options name="user_navigation">
        <lticm:property name="url">https://example.com/attendance</lticm:property>
        <lticm:property name="text">Attendance</lticm:property>
      </lticm:options>
      <lticm:options name="account_navigation">
        <lticm:property name="url">https://example.com/attendance</lticm:property>
        <lticm:property name="text">Attendance</lticm:property>
      </lticm:options>
    </blti:extensions>
    <cartridge_bundle identifierref="BLTI001_Bundle"/>
    <cartridge_icon identifierref="BLTI001_Icon"/>
</cartridge_basiclti_link>
    XML
  end
end
