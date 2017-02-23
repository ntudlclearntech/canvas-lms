require File.expand_path(File.dirname(__FILE__) + '/lti2_api_spec_helper')
require_dependency "lti/ims/access_token_helper"
module Lti
  describe 'Webhook Subscription API', type: :request do
    include_context 'lti2_api_spec_helper'

    let(:controller){ double(lti2_service_name: 'vnd.Canvas.webhooksSubscription') }

    let(:subscription) do
      {
        EventTypes:["attachment_created"],
        ContextType: "account",
        ContextId: account.id,
        Format: "live-event",
        TransportType: "sqs",
        TransportMetadata: { Url: "http://sqs.docker"}
      }
    end

    describe '#create' do
      let(:test_subscription){ {'RootAccountId' => '1', 'foo' => 'bar'} }
      let(:create_endpoint){ "/api/lti/subscriptions" }
      let(:stub_response){ double(code: 200, body: test_subscription.to_json) }

      before(:each) do
        ss = class_double(Services::LiveEventsSubscriptionService).as_stubbed_const
        allow(ss).to receive_messages(create_tool_proxy_subscription: stub_response)
      end

      it 'creates subscriptions' do
        allow_any_instance_of(Lti::ToolProxy).to receive(:active_in_context?).with(an_instance_of(Account)).and_return(true)
        tool_proxy[:raw_data]['enabled_capability'] = %w(vnd.instructure.webhooks.assignment.attachment_created)
        tool_proxy.save!
        post create_endpoint, { subscription: subscription }, request_headers
        expect(response).to be_success
      end

      it 'checks that the tool proxy has an active developer key' do
        product_family.update_attributes(developer_key: nil)
        allow_any_instance_of(Lti::ToolProxy).to receive(:active_in_context?).with(an_instance_of(Account)).and_return(true)
        tool_proxy[:raw_data]['enabled_capability'] = %w(vnd.instructure.webhooks.assignment.attachment_created)
        tool_proxy.save!
        post create_endpoint, { subscription: subscription }, request_headers
        expect(response).to be_unauthorized
      end

      it 'checks that the tool proxy has the correct enabled capabilities' do
        allow_any_instance_of(Lti::ToolProxy).to receive(:active_in_context?).with(an_instance_of(Account)).and_return(true)
        post create_endpoint, { subscription: subscription }, request_headers
        expect(response).to be_unauthorized
      end

      it 'gives error message when missing capabilities' do
        allow_any_instance_of(Lti::ToolProxy).to receive(:active_in_context?).with(an_instance_of(Account)).and_return(true)
        post create_endpoint, { subscription: subscription }, request_headers
        expect(JSON.parse(response.body)['error']).to eq 'Unauthorized subscription'
      end

      it 'renders 401 if Lti::ToolProxy#active_in_context? does not return true' do
        tool_proxy[:raw_data]['enabled_capability'] = %w(vnd.instructure.webhooks.assignment.attachment_created)
        tool_proxy.save!
        post create_endpoint, { subscription: subscription }, request_headers
        expect(response).to be_unauthorized
      end

      it 'gives error message if Lti::ToolProxy#active_in_context? does not return true' do
        tool_proxy[:raw_data]['enabled_capability'] = %w(vnd.instructure.webhooks.assignment.attachment_created)
        tool_proxy.save!
        post create_endpoint, { subscription: subscription }, request_headers
        expect(JSON.parse(response.body)['error']).to eq 'Unauthorized subscription'
      end

      it 'requires JWT Access token' do
        allow_any_instance_of(Lti::ToolProxy).to receive(:active_in_context?).with(an_instance_of(Account)).and_return(true)
        tool_proxy[:raw_data]['enabled_capability'] = %w(vnd.instructure.webhooks.assignment.attachment_created)
        tool_proxy.save!
        post create_endpoint, { subscription: subscription }
        expect(response).to be_unauthorized
      end
    end

    describe '#destroy' do
      let(:subscription_id){ 'ab342-c444-29392-e222' }
      let(:test_subscription){ {'RootAccountId' => '1', 'Id' => subscription_id} }
      let(:delete_endpoint){ "/api/lti/subscriptions/#{subscription_id}" }
      let(:ok_response){ double(code: 200, body: subscription.to_json) }
      let(:not_found_response){ double(code: 404, body: "{}") }
      let(:delete_response){ double(code: 200, body: "{}") }
      let(:subscription_service){ class_double(Services::LiveEventsSubscriptionService).as_stubbed_const }

      before(:each) do
        allow(subscription_service).to receive_messages(destroy_tool_proxy_subscription: delete_response)
        allow_any_instance_of(Lti::ToolProxy).to receive(:active_in_context?).with(an_instance_of(Account)).and_return(true)
        tool_proxy[:raw_data]['enabled_capability'] = %w(vnd.instructure.webhooks.assignment.attachment_created)
        tool_proxy.save!
      end

      it 'deletes subscriptions' do
        allow(subscription_service).to receive_messages(tool_proxy_subscription: ok_response)
        delete delete_endpoint, {}, request_headers
        expect(response).to be_success
      end

      it 'gives gives 404 if subscription does not exist' do
        allow(subscription_service).to receive_messages(destroy_tool_proxy_subscription: not_found_response)
        delete delete_endpoint, {}, request_headers
        expect(response).not_to be_success
      end

      it 'checks that the tool proxy has an active developer key' do
        product_family.update_attributes(developer_key: nil)
        allow(subscription_service).to receive_messages(tool_proxy_subscription: ok_response)
        tool_proxy[:raw_data]['enabled_capability'] = %w(vnd.instructure.webhooks.assignment.attachment_created)
        tool_proxy.save!
        delete delete_endpoint, {}, request_headers
        expect(response).to be_unauthorized
      end

      it 'requires JWT Access token' do
        delete delete_endpoint, {}
        expect(response).to be_unauthorized
      end
    end

  end
end
