module SectionTabHelper
  def available_section_tabs(context, dashboard_cards: false)
    AvailableSectionTabs.new(
      context, @current_user, @domain_root_account, session, dashboard_cards: dashboard_cards
    ).to_a
  end

  def section_tabs
    @section_tabs ||= begin
      if @context && available_section_tabs(@context).any?
        content_tag(:nav, {
          :role => 'navigation',
          :'aria-label' => 'context'
        }) do
          concat(content_tag(:ul, id: 'section-tabs') do
            available_section_tabs(@context).map do |tab|
              section_tab_tag(tab, @context, @active_tab)
            end
          end)
        end
      end
    end
    raw(@section_tabs)
  end

  def section_tab_tag(tab, context, active_tab)
    concat(SectionTabTag.new(tab, context, active_tab).to_html)
  end

  class AvailableSectionTabs
    DASHBOARD_CARD_TABS = [
      Course::TAB_DISCUSSIONS, Course::TAB_ASSIGNMENTS,
      Course::TAB_ANNOUNCEMENTS, Course::TAB_FILES
    ].freeze

    def initialize(context, current_user, domain_root_account, session, dashboard_cards: false)
      @context = context
      @current_user = current_user
      @domain_root_account = domain_root_account
      @session = session
      @dashboard_cards = dashboard_cards
    end
    attr_reader :context, :current_user, :domain_root_account, :session, :dashboard_cards

    def to_a
      return [] unless context.respond_to?(:tabs_available)

      Rails.cache.fetch(cache_key, expires_in: 1.hour) do
        new_collaborations_enabled = context.feature_enabled?(:new_collaborations) if context.respond_to?(:feature_enabled?)

        tabs = context.tabs_available(current_user, {
          session: session,
          root_account: domain_root_account
        }).select { |tab|
          tab_has_required_attributes?(tab)
        }

        if dashboard_cards
          tabs.select! { |tab| DASHBOARD_CARD_TABS.include?(tab[:id]) }
        else
          tabs.reject! { |tab|
            if tab_is?(tab, 'TAB_COLLABORATIONS')
              new_collaborations_enabled ||
                !Collaboration.any_collaborations_configured?(@context)
            elsif tab_is?(tab, 'TAB_COLLABORATIONS_NEW')
              !new_collaborations_enabled
            elsif tab_is?(tab, 'TAB_CONFERENCES')
              !WebConference.config
            end
          }
        end

        tabs
      end
    end

    private
    def cache_key
      [ context, current_user, domain_root_account,
        Lti::NavigationCache.new(domain_root_account),
        "section_tabs_hash2", I18n.locale
      ].cache_key
    end

    def tab_has_required_attributes?(tab)
      tab[:href] && tab[:label]
    end

    def tab_is?(tab, const_name)
      context.class.const_defined?(const_name) &&
        tab[:id] == context.class.const_get(const_name)
    end
  end

  class SectionTabTag
    include ActionView::Context
    include ActionView::Helpers::TagHelper
    include ActionView::Helpers::TextHelper

    def initialize(tab, context, active_tab=nil)
      @tab = SectionTabPresenter.new(tab, context)
      @active_tab = active_tab
    end

    def a_classes
      [ @tab.css_class.downcase.replace_whitespace('-') ].tap do |a|
        a << 'active' if @tab.active?(@active_tab)
      end
    end

    def a_attributes
      { href: @tab.path,
        title: @tab.label,
        class: a_classes }.tap do |h|
        h[:'aria-label'] = @tab.screenreader if @tab.screenreader?
        h[:target] = @tab.target if @tab.target?
      end
    end

    def a_tag
      content_tag(:a, a_attributes) do
        concat(@tab.label)
        concat(span_tag)
      end
    end

    def li_classes
      [ 'section' ].tap do |a|
        a << 'section-tab-hidden' if @tab.hide?
      end
    end

    def span_tag
      if @tab.hide?
        content_tag(:span, I18n.t('* No content has been added'), {
          id: 'inactive_nav_link',
          class: 'screenreader-only'
        })
      end
    end

    def to_html
      content_tag(:li, a_tag, {
        class: li_classes
      })
    end
  end
end
