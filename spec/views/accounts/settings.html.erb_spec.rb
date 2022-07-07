# frozen_string_literal: true

#
# Copyright (C) 2011 - present Instructure, Inc.
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

require_relative "../views_helper"

describe "accounts/settings" do
  before do
    assign(:account_roles, [])
    assign(:course_roles, [])
  end

  describe "sis_source_id edit box" do
    before do
      @account = Account.default.sub_accounts.create!
      @account.sis_source_id = "so_special_sis_id"
      @account.save!

      assign(:context, @account)
      assign(:account, @account)
      assign(:account_users, [])
      assign(:root_account, @account)
      assign(:associated_courses_count, 0)
      assign(:announcements, AccountNotification.none.paginate)
    end

    it "shows to sis admin" do
      admin = account_admin_user
      view_context(@account, admin)
      assign(:current_user, admin)
      render
      expect(response).to have_tag("input#account_sis_source_id")
    end

    it "does not show to non-sis admin" do
      admin = account_admin_user_with_role_changes(role_changes: { "manage_sis" => false })
      view_context(@account, admin)
      assign(:current_user, admin)
      render
      expect(response).to have_tag("span.sis_source_id", @account.sis_source_id)
      expect(response).not_to have_tag("input#account_sis_source_id")
    end
  end

  describe "open registration" do
    before do
      @account = Account.default
      assign(:account, @account)
      assign(:account_users, [])
      assign(:root_account, @account)
      assign(:associated_courses_count, 0)
      assign(:announcements, AccountNotification.none.paginate)
      admin = account_admin_user
      view_context(@account, admin)
    end

    it "shows by default" do
      render
      expect(response).to have_tag("input#account_settings_open_registration")
      expect(response).not_to have_tag("div#open_registration_delegated_warning_dialog")
    end

    it "shows warning dialog when a delegated auth config is around" do
      @account.authentication_providers.create!(auth_type: "cas")
      @account.authentication_providers.first.move_to_bottom
      render
      expect(response).to have_tag("input#account_settings_open_registration")
      expect(response).to have_tag("div#open_registration_delegated_warning_dialog")
    end
  end

  describe "managed by site admins" do
    before do
      @account = Account.default
      assign(:account, @account)
      assign(:account_users, [])
      assign(:root_account, @account)
      assign(:associated_courses_count, 0)
      assign(:announcements, AccountNotification.none.paginate)
    end

    it "shows settings that can only be managed by site admins" do
      admin = site_admin_user
      view_context(@account, admin)
      render
      expect(response).to have_tag("input#account_settings_global_includes")
      expect(response).to have_tag("input#account_settings_show_scheduler")
      expect(response).to have_tag("input#account_settings_enable_profiles")
    end

    it "does not show settings to regular admin user" do
      admin = account_admin_user
      view_context(@account, admin)
      render
      expect(response).not_to have_tag("input#account_settings_global_includes")
      expect(response).not_to have_tag("input#account_settings_show_scheduler")
      expect(response).not_to have_tag("input#account_settings_enable_profiles")
    end
  end

  describe "announcements" do
    shared_examples "account notifications" do |text|
      before do
        assign(:account_users, [])
        assign(:associated_courses_count, 0)
        assign(:announcements, AccountNotification.none.paginate)

        @account = account
        assign(:account, @account)
        assign(:root_account, @account)
      end

      it "renders the appropriate text" do
        admin = account_admin_user
        view_context(@account, admin)

        assign(:announcements, [account_notification(account: @account)].paginate)
        render
        expect(response).to have_text(text)
      end
    end

    describe "Root Account Announcements" do
      let(:account) { Account.create!(name: "reading_rainbow") }

      include_examples "account notifications", "This is a message from reading_rainbow"
    end

    describe "Site Admin Announcements" do
      let(:account) { Account.site_admin }

      include_examples "account notifications", "This is a message from Canvas Administration"
    end
  end

  describe "Admin setting allow_gradebook_show_first_last_names" do
    context "site admin user" do
      let_once(:account) { Account.site_admin }
      let_once(:admin) { account_admin_user(account: account) }

      before do
        view_context(account, admin)
        assign(:account, account)
        assign(:context, account)
        assign(:root_account, account)
        assign(:current_user, admin)
        assign(:announcements, AccountNotification.none.paginate)
      end

      it "does not show the setting when the gradebook_show_first_last_names feature is enabled" do
        Account.site_admin.enable_feature!(:gradebook_show_first_last_names)
        render

        expect(response).to_not have_tag("input#account_settings_allow_gradebook_show_first_last_names")
      end

      it "does not show the setting when the gradebook_show_first_last_names feature is disabled" do
        Account.site_admin.disable_feature!(:gradebook_show_first_last_names)
        render

        expect(response).to_not have_tag("input#account_settings_allow_gradebook_show_first_last_names")
      end
    end

    context "account admin user" do
      let_once(:account) { Account.default }
      let_once(:admin) { account_admin_user(account: account) }

      before do
        view_context(account, admin)
        assign(:account, account)
        assign(:context, account)
        assign(:root_account, account)
        assign(:current_user, admin)
        assign(:announcements, AccountNotification.none.paginate)
      end

      it "shows the setting check box when the gradebook_show_first_last_names feature is enabled" do
        Account.site_admin.enable_feature!(:gradebook_show_first_last_names)
        render

        expect(response).to have_tag("input#account_settings_allow_gradebook_show_first_last_names")
      end

      it "does not show the setting by default" do
        render

        expect(response).to_not have_tag("input#account_settings_allow_gradebook_show_first_last_names")
      end

      it "does not show the setting when the gradebook_show_first_last_names feature is disabled" do
        Account.site_admin.disable_feature!(:gradebook_show_first_last_names)
        render

        expect(response).to_not have_tag("input#account_settings_allow_gradebook_show_first_last_names")
      end
    end
  end

  describe "SIS Integration Settings" do
    before do
      assign(:account_users, [])
      assign(:associated_courses_count, 0)
      assign(:announcements, AccountNotification.none.paginate)
    end

    def do_render(user, account = nil)
      account ||= @account
      view_context(account, user)
      render
    end

    context "site admin user" do
      before do
        @account = Account.site_admin
        assign(:account, @account)
        assign(:root_account, @account)
      end

      context "should not show settings to site admin user" do
        context "new_sis_integrations => true" do
          before do
            allow(@account).to receive(:feature_enabled?).with(:new_sis_integrations).and_return(true)
          end

          it { expect(response).not_to have_tag("#sis_integration_settings") }
          it { expect(response).not_to have_tag("#sis_grade_export_settings") }
          it { expect(response).not_to have_tag("#old_sis_integrations") }
          it { expect(response).not_to have_tag("input#allow_sis_import") }
        end
      end

      context "new_sis_integrations => false" do
        before do
          allow(@account).to receive(:feature_enabled?).with(:new_sis_integrations).and_return(false)
        end

        it { expect(response).not_to have_tag("#sis_integration_settings") }
        it { expect(response).not_to have_tag("#sis_grade_export_settings") }
        it { expect(response).not_to have_tag("#old_sis_integrations") }
        it { expect(response).not_to have_tag("input#allow_sis_import") }
      end
    end

    context "regular admin user" do
      let(:current_user) { account_admin_user }

      before do
        @account = Account.default
        @subaccount = @account.sub_accounts.create!(name: "sub-account")

        assign(:account, @account)
        assign(:root_account, @account)
        assign(:current_user, current_user)
      end

      context "new_sis_integrations => false" do
        before do
          @account.disable_feature!(:new_sis_integrations)
          @account.enable_feature!(:post_grades)
          allow(@account).to receive(:grants_right?).with(current_user, :manage_account_memberships).and_return(true)
        end

        context "show old version of settings to regular admin user" do
          before do
            allow(@account).to receive(:grants_right?).and_call_original
            allow(@account).to receive(:grants_right?).with(current_user, :manage_site_settings).and_return(true)
            do_render(current_user)
          end

          it { expect(response).to     have_tag("#sis_grade_export_settings") }
          it { expect(response).to     have_tag("#account_allow_sis_import") }
          it { expect(response).to     have_tag("#old_sis_integrations") }
          it { expect(response).not_to have_tag("#sis_integration_settings") }
          it { expect(response).not_to have_tag("#account_settings_sis_syncing_value") }
        end
      end

      context "new_sis_integrations => true" do
        let(:sis_name) { "input#account_settings_sis_name" }
        let(:allow_sis_import) { "input#account_allow_sis_import" }
        let(:sis_syncing) { "input#account_settings_sis_syncing_value" }
        let(:sis_syncing_locked) { "input#account_settings_sis_syncing_locked" }
        let(:default_grade_export) { "#account_settings_sis_default_grade_export_value" }
        let(:require_assignment_due_date) { "#account_settings_sis_require_assignment_due_date_value" }
        let(:assignment_name_length) { "#account_settings_sis_assignment_name_length_value" }

        before do
          @account.enable_feature!(:new_sis_integrations)
        end

        context "should show settings to regular admin user" do
          before do
            @account.enable_feature!(:post_grades)
            do_render(current_user)
          end

          it { expect(response).to     have_tag("#sis_integration_settings") }
          it { expect(response).to     have_tag(allow_sis_import) }
          it { expect(response).to     have_tag(sis_syncing) }
          it { expect(response).to     have_tag(sis_syncing_locked) }
          it { expect(response).to     have_tag(require_assignment_due_date) }
          it { expect(response).to     have_tag(assignment_name_length) }
          it { expect(response).not_to have_tag("#sis_grade_export_settings") }
          it { expect(response).not_to have_tag("#old_sis_integrations") }
          it { expect(response).to     have_tag(sis_name) }
        end

        context "SIS syncing enabled" do
          before do
            allow(Assignment).to receive(:sis_grade_export_enabled?).and_return(true)
          end

          context "for root account" do
            before do
              allow(@account).to receive(:sis_syncing).and_return({ value: true, locked: true })
              do_render(current_user)
            end

            it "enables all controls under SIS syncing" do
              expect(response).not_to have_tag("#{sis_syncing}[disabled]")
              expect(response).not_to have_tag("#{sis_syncing_locked}[disabled]")
              expect(response).not_to have_tag("#{default_grade_export}[disabled]")
              expect(response).not_to have_tag("#{require_assignment_due_date}[disabled]")
              expect(response).not_to have_tag("#{sis_name}[disabled]")
              expect(response).not_to have_tag("#{assignment_name_length}[disabled]")
            end
          end

          context "for sub-accounts (inherited)" do
            context "locked" do
              before do
                @account.enable_feature!(:post_grades)
                allow(@account).to receive(:sis_syncing).and_return({ value: true, locked: true, inherited: true })
                do_render(current_user, @account)
              end

              it "disables all controls under SIS syncing" do
                expect(response).to have_tag("#{sis_syncing}[disabled]")
                expect(response).to have_tag("#{sis_syncing_locked}[disabled]")
                expect(response).to have_tag("#{default_grade_export}[disabled]")
                expect(response).to have_tag("#{require_assignment_due_date}[disabled]")
                expect(response).to have_tag("#{assignment_name_length}[disabled]")
              end
            end

            context "not locked" do
              before do
                allow(@account).to receive(:sis_syncing).and_return({ value: true, locked: false, inherited: true })
                do_render(current_user)
              end

              it "enables all controls under SIS syncing" do
                expect(response).not_to have_tag("#{sis_syncing}[disabled]")
                expect(response).not_to have_tag("#{sis_syncing_locked}[disabled]")
                expect(response).not_to have_tag("#{default_grade_export}[disabled]")
                expect(response).not_to have_tag("#{require_assignment_due_date}[disabled]")
                expect(response).not_to have_tag("#{assignment_name_length}[disabled]")
              end
            end
          end
        end
      end
    end
  end

  describe "quotas" do
    before do
      @account = Account.default
      assign(:account, @account)
      assign(:account_users, [])
      assign(:root_account, @account)
      assign(:associated_courses_count, 0)
      assign(:announcements, AccountNotification.none.paginate)
    end

    context "with :manage_storage_quotas" do
      before do
        admin = account_admin_user
        view_context(@account, admin)
        assign(:current_user, admin)
      end

      it "shows quota options" do
        render
        expect(@controller.js_env).to include :ACCOUNT
        expect(@controller.js_env[:ACCOUNT]).to include "default_storage_quota_mb"
        expect(response).to have_tag "#tab-quotas-link"
        expect(response).to have_tag "#tab-quotas"
      end
    end

    context "without :manage_storage_quotas" do
      before do
        admin = account_admin_user_with_role_changes(account: @account, role_changes: { "manage_storage_quotas" => false })
        view_context(@account, admin)
        assign(:current_user, admin)
      end

      it "does not show quota options" do
        render
        expect(@controller.js_env).to include :ACCOUNT
        expect(@controller.js_env[:ACCOUNT]).not_to include "default_storage_quota_mb"
        expect(response).not_to have_tag "#tab-quotas-link"
        expect(response).not_to have_tag "#tab-quotas"
      end
    end
  end

  describe "reports" do
    before do
      @account = Account.default
      assign(:account, @account)
      assign(:account_users, [])
      assign(:root_account, @account)
      assign(:associated_courses_count, 0)
      assign(:announcements, AccountNotification.none.paginate)
    end

    context "with :read_reports" do
      it "shows reports tab link" do
        admin = account_admin_user
        view_context(@account, admin)
        assign(:current_user, admin)
        render
        expect(response).to have_tag "#tab-reports-link"
      end
    end

    context "without :read_reports" do
      it "does not show reports tab link" do
        admin = account_admin_user_with_role_changes(account: @account, role_changes: { "read_reports" => false })
        view_context(@account, admin)
        assign(:current_user, admin)
        render
        expect(response).not_to have_tag "#tab-reports-link"
      end
    end
  end

  context "admins" do
    it "does not show add admin button if don't have permission to any roles" do
      role = custom_account_role("CustomAdmin", account: Account.site_admin)
      account_admin_user_with_role_changes(
        account: Account.site_admin,
        role: role,
        role_changes: { manage_account_memberships: true }
      )
      view_context(Account.default, @user)
      assign(:account, Account.default)
      assign(:announcements, AccountNotification.none.paginate)
      render
      expect(response).not_to have_tag "#enroll_users_form"
    end
  end

  describe "blocked emojis" do
    before do
      @account = Account.default
      @admin = account_admin_user
      assign(:account, @account)
      assign(:account_users, [])
      assign(:root_account, @account)
      assign(:associated_courses_count, 0)
      assign(:announcements, AccountNotification.none.paginate)
      view_context(@account, @admin)
      assign(:current_user, @admin)
    end

    it "shows the blocked emojis section when submission_comment_emojis is allowed" do
      @account.allow_feature!(:submission_comment_emojis)
      render
      expect(response).to have_tag "#emoji-deny-list"
    end

    it "shows the blocked emojis section when submission_comment_emojis is enabled" do
      @account.enable_feature!(:submission_comment_emojis)
      render
      expect(response).to have_tag "#emoji-deny-list"
    end

    it "hides the blocked emojis section when submission_comment_emojis disabled" do
      @account.disable_feature!(:submission_comment_emojis)
      render
      expect(response).not_to have_tag "#emoji-deny-list"
    end
  end

  context "theme editor" do
    before do
      @account = Account.default
      assign(:account, @account)
      assign(:account_users, [])
      assign(:root_account, @account)
      assign(:associated_courses_count, 0)
      assign(:announcements, AccountNotification.none.paginate)
    end

    it "shows sub account theme editor option for non siteadmin admins" do
      admin = account_admin_user
      view_context(@account, admin)
      assign(:current_user, admin)
      render
      expect(response).to include("Let sub-accounts use the Theme Editor")
    end
  end

  context "smart alerts" do
    let(:account) { Account.default }
    let(:admin) { account_admin_user }

    before do
      assign(:context, account)
      assign(:account, account)
      assign(:root_account, account)
      assign(:current_user, admin)
      assign(:account_users, [])
      assign(:associated_courses_count, 0)
      assign(:announcements, AccountNotification.none.paginate)

      view_context(account, admin)
    end

    def expect_threshold_to_be(value)
      expect(response).to have_tag(
        "select#account_settings_smart_alerts_threshold" \
        "  option[value=\"#{value}\"][selected]"
      )
    end

    it "shows a threshold control" do
      account.enable_feature!(:smart_alerts)

      render

      expect(response).to include("Smart Assignment Alerts")
      expect(response).to include("Hours (from due date) before students are alerted")
    end

    it "does not show if the feature flag is turned off" do
      account.disable_feature!(:smart_alerts)

      render

      expect(response).not_to include("Smart Assignment Alerts")
    end

    it "defaults to a 36 hour threshold" do
      account.enable_feature!(:smart_alerts)

      render

      expect_threshold_to_be(36)
    end

    it "selects the current threshold" do
      account.enable_feature!(:smart_alerts)
      account.settings[:smart_alerts_threshold] = 24
      account.save!

      render

      expect_threshold_to_be(24)
    end
  end

  context "privacy" do
    let(:account) { account_model }
    let(:account_admin) { account_admin_user(account: account) }
    let(:dom) { Nokogiri::HTML5(response) }
    let(:enable_fullstory) { dom.at_css("#account_settings_enable_fullstory") }
    let(:site_admin) { site_admin_user }
    let(:sub_account) { account_model(root_account: account) }

    def render_for(target_account, target_user)
      assign(:context, target_account)
      assign(:account, target_account)
      assign(:root_account, target_account)
      assign(:current_user, target_user)
      assign(:account_users, [])
      assign(:associated_courses_count, 0)
      assign(:announcements, AccountNotification.none.paginate)

      view_context(target_account, target_user)
      render
      yield if block_given?
    end

    it "is not available to account admins" do
      render_for(account, account_admin) do
        expect(response).not_to have_tag("#tab-privacy")
      end
    end

    it "is not available for the site_admin account" do
      render_for(Account.site_admin, site_admin) do
        expect(response).not_to have_tag("#tab-privacy")
      end
    end

    it "is not available for sub accounts" do
      render_for(sub_account, site_admin) do
        expect(response).not_to have_tag("#tab-privacy")
      end
    end

    it "opts in to FullStory by default" do
      render_for(account, site_admin) do
        expect(enable_fullstory).to be_checked
      end
    end

    it "allows opting out of FullStory" do
      account.settings[:enable_fullstory] = false
      account.save!

      render_for(account, site_admin) do
        expect(enable_fullstory).not_to be_checked
      end
    end
  end

  context "course templates" do
    let_once(:account) { Account.default }
    let_once(:admin) { account_admin_user(account: account) }

    before do
      account.enable_feature!(:course_templates)
      view_context(account, admin)
      assign(:current_user, admin)
      assign(:context, account)
      assign(:account, account)
      assign(:account_users, [])
      assign(:root_account, account)
      assign(:associated_courses_count, 0)
      assign(:announcements, AccountNotification.none.paginate)
    end

    it "shows no template only for root account" do
      render
      doc = Nokogiri::HTML5(response.body)
      select = doc.at_css("#account_course_template_id")
      expect(select.css("option").map { |o| o["value"] }).to eq [""]
    end

    it "shows no template and inherit for sub accounts" do
      a2 = account.sub_accounts.create!
      view_context(a2, admin)
      assign(:context, a2)
      assign(:account, a2)

      render
      doc = Nokogiri::HTML5(response.body)
      select = doc.at_css("#account_course_template_id")
      expect(select.css("option").map { |o| o["value"] }).to eq ["", "0"]
    end

    it "disables if you don't have permission" do
      c = account.courses.create!(template: true)
      account.role_overrides.create!(role: admin.account_users.first.role, permission: :edit_course_template, enabled: false)

      render
      doc = Nokogiri::HTML5(response.body)
      select = doc.at_css("#account_course_template_id")
      expect(select.css("option").map { |o| o["value"] }).to eq ["", c.id.to_s]
      expect(select.css("option").map { |o| o["disabled"] }).to eq [nil, "disabled"]
    end

    it "disables if you don't have permission in a sub-account" do
      c = account.courses.create!(template: true)
      account.role_overrides.create!(role: admin.account_users.first.role, permission: :edit_course_template, enabled: false)
      account.role_overrides.create!(role: admin.account_users.first.role, permission: :delete_course_template, enabled: false)

      a2 = account.sub_accounts.create!
      view_context(a2, admin)
      assign(:context, a2)
      assign(:account, a2)

      render
      doc = Nokogiri::HTML5(response.body)
      select = doc.at_css("#account_course_template_id")
      expect(select.css("option").map { |o| o["value"] }).to eq ["", "0", c.id.to_s]
      expect(select.css("option").map { |o| o["disabled"] }).to eq %w[disabled disabled disabled]
    end
  end

  context "internal settings" do
    before do
      @admin = account_admin_user
      @site_admin = site_admin_user
      assign(:account_users, [])
      assign(:root_account, Account.default)
      assign(:associated_courses_count, 0)
      assign(:announcements, AccountNotification.none.paginate)
    end

    context "as an account admin" do
      before do
        @account = Account.default
        assign(:account, @account)
        view_context(@account, @admin)
        assign(:current_user, @admin)
      end

      it "does not render" do
        render
        expect(response).not_to have_tag "#tab-internal-settings"
      end
    end

    context "as a siteadmin" do
      before do
        @account = Account.site_admin
        assign(:account, @account)
        view_context(@account, @site_admin)
        assign(:current_user, @site_admin)
      end

      it "renders" do
        render
        expect(response).to have_tag "#tab-internal-settings"
      end
    end
  end
end
