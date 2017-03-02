# @API Webhooks Subscriptions
# @internal
#
# API for WebhooksSubscriptions
# Webhooks from Canvas are your way to know that a change (new or updated
# submission, or change to assignment) has taken place.
#
# Webhooks are available via HTTPS to an endpoint you own and specify, or via
# an AWS SQS queue that you provision, own, and specify. We recommend SQS for
# the most robust integration, but do support HTTPS for lower volume applications.
#
# We do not deduplicate or batch messages before transmission. Avoid
# creating multiple identical subscriptions. Webhooks always identify the ID
# of the subscription that caused them to be sent, allowing you to identify
# problematic or high volume subscriptions.
#
# We cannot guarantee the transmission order of webhooks. If order is important
# to your application, you must check the "event_time" attribute in the
# "metadata" hash to determine sequence.

module Lti
  class SubscriptionsApiController < ApplicationController
    include Lti::Ims::AccessTokenHelper

    WEBHOOK_SUBSCRIPTION_SERVICE = 'vnd.Canvas.webhooksSubscription'.freeze

    SERVICE_DEFINITIONS = [
      {
        id: WEBHOOK_SUBSCRIPTION_SERVICE,
        endpoint: 'api/lti/subscriptions',
        format: ['application/json'].freeze,
        action: ['POST'].freeze
      }.freeze
    ].freeze

    skip_before_action :require_user, :load_user
    before_action :authorized_lti2_tool

    rescue_from Lti::SubscriptionsValidator::InvalidContextType do
      render json: {error: 'Invalid subscription'}, status: :bad_request
    end

    rescue_from Lti::SubscriptionsValidator::MissingCapability,
                Lti::SubscriptionsValidator::ToolNotInContext do
        render json: {error: 'Unauthorized subscription'}, status: :unauthorized
    end

    def lti2_service_name
      WEBHOOK_SUBSCRIPTION_SERVICE
    end

    # @API Create a Webhook Subscription
    #
    # @argument submission[ContextId] [Required, String]
    #   The id of the context for the subscription.
    #
    # @argument subscription[ContextType] [Required, String]
    #   The type of context for the subscription. Must be 'assignment',
    #   'account', or 'course'.
    #
    # @argument subscription[EventTypes] [Required, Array]
    #   Array of strings representing the event types for
    #   the subscription.
    #
    # @argument subscription[Format] [Required, String]
    #   Format to deliver the live events. Must be 'live-event' or 'caliper'.
    #
    # @argument subscription[TransportMetadata] [Required, Object]
    #   An object with a single key: 'Url'. Example: '{ "Url" => "http://sqs.example"}'
    #
    # @argument subscription[TransportType] [Required, String]
    #   Must be either 'sqs' or 'https'.
    #
    # @returns Webhook Subscription
    def create
      subscription_helper = SubscriptionsValidator.new(params.require(:subscription), tool_proxy)
      subscription_helper.validate_subscription_request!
      response = Services::LiveEventsSubscriptionService.create_tool_proxy_subscription(tool_proxy, subscription_helper.subscription)
      forward_service_response(response)
    end

    private

    def forward_service_response(service_response)
      render json: service_response.body, status: service_response.code
    end

  end
end
