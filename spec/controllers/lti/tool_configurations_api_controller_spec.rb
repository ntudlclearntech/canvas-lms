#
# Copyright (C) 2018 - present Instructure, Inc.
#
# This file is part of Canvas.
#
# Canvas is free software: you can redistribute it and/or modify it under
# the terms of the GNU Affero General Public License as published by the Free
# Software Foundation, version 3 of the License.
#
# Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
# details.
#
# You should have received a copy of the GNU Affero General Public License along
# with this program. If not, see <http://www.gnu.org/licenses/>.
#

require File.expand_path(File.dirname(__FILE__) + '/../../spec_helper')

RSpec.describe Lti::ToolConfigurationsApiController, type: :controller do
  subject { response }
  let_once(:account) { Account.default }
  let_once(:admin) { account_admin_user(account: account) }
  let_once(:student) do
    student_in_course
    @student
  end
  let(:developer_key) { DeveloperKey.create!(account: account) }
  let(:config_from_response) do
    Lti::ToolConfiguration.find(json_parse.dig('tool_configuration', 'id'))
  end
  let(:tool_configuration) do
    Lti::ToolConfiguration.create!(
      developer_key: developer_key,
      settings: settings
    )
  end
  let(:settings) do
    {
      'title' => 'LTI 1.3 Tool',
      'description' => '1.3 Tool',
      'launch_url' => launch_url,
      'custom_fields' => {'has_expansion' => '$Canvas.user.id', 'no_expansion' => 'foo'},
      'extensions' =>  [
        {
          'platform' => 'canvas.instructure.com',
          'privacy_level' => 'public',
          'tool_id' => 'LTI 1.3 Test Tool',
          'domain' => 'http://lti13testtool.docker',
          'settings' =>  {
            'icon_url' => 'https://static.thenounproject.com/png/131630-200.png',
            'selection_height' => 500,
            'selection_width' => 500,
            'text' => 'LTI 1.3 Test Tool Extension text',
            'course_navigation' =>  {
              'message_type' => 'LtiResourceLinkRequest',
              'canvas_icon_class' => 'icon-lti',
              'icon_url' => 'https://static.thenounproject.com/png/131630-211.png',
              'text' => 'LTI 1.3 Test Tool Course Navigation',
              'url' =>
              'http://lti13testtool.docker/launch?placement=course_navigation',
              'enabled' => true
            }
          }
        }
      ]
    }
  end
  let(:new_url) { 'https://www.new-url.com/test' }
  let(:launch_url) { 'http://lti13testtool.docker/blti_launch' }
  let(:dev_key_id) { developer_key.id }
  let(:valid_parameters) do
    {
      developer_key_id: dev_key_id,
      tool_configuration: {
        settings: settings
      }
    }.compact
  end

  before { user_session(admin) }

  shared_examples_for 'an action that requires manage developer keys' do |skip_404|
    context 'when the user has manage_developer_keys' do
      it { is_expected.to be_success }
    end

    context 'when the user is not an admin' do
      before { user_session(student) }

      it { is_expected.to be_unauthorized }
    end

    unless skip_404
      context 'when the developer key does not exist' do
        before { developer_key.destroy! }

        it { is_expected.to be_not_found }
      end
    end
  end

  shared_examples_for 'an endpoint that requires an existing tool configuration' do
    context 'when the tool configuration does not exist' do
      it { is_expected.to be_not_found }
    end
  end

  shared_examples_for 'an endpoint that accepts a settings_url' do
    let(:ok_response) do
      double(
        body: settings.to_json,
        is_a?: true,
        '[]' => 'application/json'
      )
    end
    let(:url) { 'https://www.mytool.com/config/json' }
    let(:valid_parameters) { {developer_key_id: developer_key.id, tool_configuration: {settings_url: url}} }
    let(:make_request) { raise 'Override in spec' }

    context 'when the request does not time out' do
      before do
        allow_any_instance_of(Net::HTTP).to receive(:request).and_return(ok_response)
      end

      it 'uses the tool configuration JSON from the settings_url' do
        subject
        expect(config_from_response.settings['launch_url']).to eq settings['launch_url']
      end
    end

    context 'when the request times out' do
      before do
        allow_any_instance_of(Net::HTTP).to receive(:request).and_raise(Timeout::Error)
      end

      it { is_expected.to have_http_status :unprocessable_entity }

      it 'responds with helpful error message' do
        subject
        expect(json_parse['errors'].first['message']).to eq 'Could not retrieve settings, the server response timed out.'
      end
    end

    context 'when the response is not a success' do
      subject { json_parse['errors'].first['message'] }

      let(:stubbed_response) { double() }

      before do
        allow(stubbed_response).to receive(:is_a?).with(Net::HTTPSuccess).and_return false
        allow(stubbed_response).to receive('[]').and_return('application/json')
        allow_any_instance_of(Net::HTTP).to receive(:request).and_return(stubbed_response)
      end

      context 'when the response is "not found"' do
        before do
          allow(stubbed_response).to receive(:message).and_return('Not found')
          allow(stubbed_response).to receive(:code).and_return('404')
          make_request
        end

        it { is_expected.to eq 'Not found' }
      end

      context 'when the response is "unauthorized"' do
        before do
          allow(stubbed_response).to receive(:message).and_return('Unauthorized')
          allow(stubbed_response).to receive(:code).and_return('401')
          make_request
        end

        it { is_expected.to eq 'Unauthorized' }
      end

      context 'when the response is "internal server error"' do
        before do
          allow(stubbed_response).to receive(:message).and_return('Internal server error')
          allow(stubbed_response).to receive(:code).and_return('500')
          make_request
        end

        it { is_expected.to eq 'Internal server error' }
      end

      context 'when the response is not JSON' do
        before do
          allow(stubbed_response).to receive('[]').and_return('text/html')
          allow(stubbed_response).to receive(:is_a?).with(Net::HTTPSuccess).and_return true
          make_request
        end

        it { is_expected.to eq 'Content type must be "application/json"' }
      end
    end
  end

  describe 'create' do
    subject { post :create, params: valid_parameters }
    let(:dev_key_id) { nil }

    it_behaves_like 'an action that requires manage developer keys', true

    context 'when the tool configuration does not exist' do
      let(:dev_key_id) { developer_key.id }

      it { is_expected.to be_ok }
    end

    it_behaves_like 'an endpoint that accepts a settings_url' do
      let(:make_request) { post :create, params: valid_parameters }
    end
  end

  describe 'update' do
    subject { put :update, params: valid_parameters }

    let(:launch_url) { new_url }

    before do
      tool_configuration
    end

    context do
      it { is_expected.to be_ok }

      it 'updates the tool configuration' do
        subject
        new_settings = config_from_response.settings
        expect(new_settings['launch_url']).to eq new_url
      end
    end

    it_behaves_like 'an endpoint that accepts a settings_url' do
      let(:make_request) { post :update, params: valid_parameters }
    end

    it_behaves_like 'an action that requires manage developer keys'
  end

  describe 'show' do
    subject { get :show, params: valid_parameters.except(:tool_configuration) }

    before do
      tool_configuration
    end

    it_behaves_like 'an action that requires manage developer keys'

    context do
      let(:tool_configuration) { nil }
      it_behaves_like 'an endpoint that requires an existing tool configuration'
    end

    context 'when the tool configuration exists' do
      it 'renders the tool configuration' do
        subject
        expect(config_from_response).to eq tool_configuration
      end
    end
  end

  describe 'destroy' do
    subject {  delete :destroy, params: valid_parameters.except(:tool_configuration) }

    before do
      tool_configuration
    end

    it_behaves_like 'an action that requires manage developer keys'

    context do
      let(:tool_configuration) { nil }
      it_behaves_like 'an endpoint that requires an existing tool configuration'
    end

    context 'when the tool configuration exists' do
      it 'destroys the tool configuration' do
        subject
        expect(Lti::ToolConfiguration.find_by(id: tool_configuration.id)).to be_nil
      end

      it { is_expected.to be_no_content }
    end
  end
end
