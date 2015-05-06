#
# Copyright (C) 2012 - 2015 Instructure, Inc.
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

require 'account_reports/report_helper'

module AccountReports
  class SisExporter
    include ReportHelper

    SIS_CSV_REPORTS = ["users", "accounts", "terms", "courses", "sections", "enrollments", "groups", "group_membership", "xlist"]

    def initialize(account_report, params = {})
      @account_report = account_report
      @reports = SIS_CSV_REPORTS & @account_report.parameters.keys
      @sis_format = params[:sis_format]
      extra_text_term(@account_report)

      if @account_report.has_parameter? "include_deleted"
        @include_deleted = @account_report.parameters["include_deleted"]
        add_extra_text(I18n.t('account_reports.grades.deleted',
                              'Include Deleted Objects: true;'))
      end
    end

    def csv
      files = ""
      @reports.each do |report_name|
        files << "#{report_name} "
      end
      @account_report.parameters["extra_text"] << I18n.t(
        'account_reports.sis_exporter.reports',
        'Reports: %{files}',
        :files => files
      )

      if @reports.length == 0
        send_report()
      elsif @reports.length == 1
        csv = self.send(@reports.first)
        send_report(csv)
      else
        csvs = {}

        @reports.each do |report_name|
          csvs[report_name] = self.send(report_name)
        end
        send_report(csvs)
        csvs
      end
    end

    def users
      filename = AccountReports.generate_file(@account_report)
      CSV.open(filename, "w") do |csv|
        if @sis_format
          # headers are not translated on sis_export to maintain import compatibility
          headers = ['user_id', 'login_id', 'password', 'first_name', 'last_name', 'email', 'status']
        else #provisioning_report
          headers = []
          headers << I18n.t('#account_reports.report_header_canvas_user_id', 'canvas_user_id')
          headers << I18n.t('#account_reports.report_header_user__id', 'user_id')
          headers << I18n.t('#account_reports.report_header_login_id', 'login_id')
          headers << I18n.t('#account_reports.report_header_first_name', 'first_name')
          headers << I18n.t('#account_reports.report_header_last_name', 'last_name')
          headers << I18n.t('#account_reports.report_header_email', 'email')
          headers << I18n.t('#account_reports.report_header_status', 'status')
        end
        csv << headers
        users = root_account.pseudonyms.except(:includes).joins(:user).select(
          "pseudonyms.id, pseudonyms.sis_user_id, pseudonyms.user_id,
           pseudonyms.unique_id, pseudonyms.workflow_state, users.sortable_name,
           users.updated_at AS user_updated_at").where(
          "NOT EXISTS (SELECT user_id
                       FROM enrollments e
                       WHERE e.type = 'StudentViewEnrollment'
                       AND e.user_id = pseudonyms.user_id)")

        if @sis_format
          users = users.where("sis_user_id IS NOT NULL")
        end

        if @include_deleted
          users = users.where("pseudonyms.workflow_state<>'deleted' OR pseudonyms.sis_user_id IS NOT NULL")
        else
          users = users.where("pseudonyms.workflow_state<>'deleted'")
        end

        users = add_user_sub_account_scope(users)

        Shackles.activate(:slave) do
          users.find_in_batches do |batch|
            emails = Shard.partition_by_shard(batch.map(&:user_id)) do |user_ids|
                CommunicationChannel.
                  email.
                  unretired.
                  select([:user_id, :path]).
                  where(user_id: user_ids).
                  order('user_id, position ASC').
                  distinct_on(:user_id)
            end.index_by(&:user_id)

            batch.each do |u|
              row = []
              row << u.user_id unless @sis_format
              row << u.sis_user_id
              row << u.unique_id
              row << nil if @sis_format
              name_parts = User.name_parts(u.sortable_name)
              row << name_parts[0] || '' # first name
              row << name_parts[1] || '' # last name
              row << emails[u.user_id].try(:path)
              row << u.workflow_state
              csv << row
            end
          end
        end
      end
      filename
    end

    def accounts
      filename = AccountReports.generate_file(@account_report)
      CSV.open(filename, "w") do |csv|
        if @sis_format
          # headers are not translated on sis_export to maintain import compatibility
          headers = ['account_id', 'parent_account_id', 'name', 'status']
        else
          headers = []
          headers << I18n.t('#account_reports.report_header_canvas_account_id', 'canvas_account_id')
          headers << I18n.t('#account_reports.report_header_account_id', 'account_id')
          headers << I18n.t('#account_reports.report_header_canvas_parent_id', 'canvas_parent_id')
          headers << I18n.t('#account_reports.report_header_parent_account_id', 'parent_account_id')
          headers << I18n.t('#account_reports.report_header_name', 'name')
          headers << I18n.t('#account_reports.report_header_status', 'status')
        end
        csv << headers
        accounts = root_account.all_accounts.
          select("accounts.*, pa.id AS parent_id,
                  pa.sis_source_id AS parent_sis_source_id").
          joins("INNER JOIN accounts AS pa ON accounts.parent_account_id=pa.id")

        if @sis_format
          accounts = accounts.where("accounts.sis_source_id IS NOT NULL")
        end

        if @include_deleted
          accounts = accounts.where("accounts.workflow_state<>'deleted' OR accounts.sis_source_id IS NOT NULL")
        else
          accounts = accounts.where("accounts.workflow_state<>'deleted'")
        end

        if account != root_account
          #this does not give the full tree pf sub accounts, just the direct children.
          accounts = accounts.where(:accounts => {:parent_account_id => account})
        end

        Shackles.activate(:slave) do
          accounts.find_each do |a|
            row = []
            row << a.id unless @sis_format
            row << a.sis_source_id
            row << a.parent_id unless @sis_format
            row << a.parent_sis_source_id
            row << a.name
            row << a.workflow_state
            csv << row
          end
        end
      end
      filename
    end

    def terms
      filename = AccountReports.generate_file(@account_report)
      CSV.open(filename, "w") do |csv|
        if @sis_format
          # headers are not translated on sis_export to maintain import compatibility
          headers = ['term_id', 'name', 'status', 'start_date', 'end_date']
        else
          headers = []
          headers << I18n.t('#account_reports.report_header_canvas_term_id', 'canvas_term_id')
          headers << I18n.t('#account_reports.report_header_term__id', 'term_id')
          headers << I18n.t('#account_reports.report_header_name', 'name')
          headers << I18n.t('#account_reports.report_header_status', 'status')
          headers << I18n.t('#account_reports.report_header_start__date', 'start_date')
          headers << I18n.t('#account_reports.report_header_end__date', 'end_date')
        end
        csv << headers
        terms = root_account.enrollment_terms

        if @sis_format
          terms = terms.where("sis_source_id IS NOT NULL")
        end

        if @include_deleted
          terms = terms.where("workflow_state<>'deleted' OR sis_source_id IS NOT NULL")
        else
          terms = terms.where("workflow_state<>'deleted'")
        end

        Shackles.activate(:slave) do
          terms.each do |t|
            row = []
            row << t.id unless @sis_format
            row << t.sis_source_id
            row << t.name
            row << t.workflow_state
            row << default_timezone_format(t.start_at)
            row << default_timezone_format(t.end_at)
            csv << row
          end
        end
      end
      filename
    end

    def courses
      filename = AccountReports.generate_file(@account_report)
      CSV.open(filename, "w") do |csv|
        if @sis_format
          # headers are not translated on sis_export to maintain import compatibility
          headers = ['course_id', 'short_name', 'long_name', 'account_id', 'term_id', 'status',
                     'start_date', 'end_date']
        else
          headers = []
          headers << I18n.t('#account_reports.report_header_canvas_course_id', 'canvas_course_id')
          headers << I18n.t('#account_reports.report_header_course__id', 'course_id')
          headers << I18n.t('#account_reports.report_header_short__name', 'short_name')
          headers << I18n.t('#account_reports.report_header_long__name', 'long_name')
          headers << I18n.t('#account_reports.report_header_canvas_account_id', 'canvas_account_id')
          headers << I18n.t('#account_reports.report_header_account_id', 'account_id')
          headers << I18n.t('#account_reports.report_header_canvas_term_id', 'canvas_term_id')
          headers << I18n.t('#account_reports.report_header_term__id', 'term_id')
          headers << I18n.t('#account_reports.report_header_status', 'status')
          headers << I18n.t('#account_reports.report_header_start__date', 'start_date')
          headers << I18n.t('#account_reports.report_header_end__date', 'end_date')
        end

        csv << headers
        courses = root_account.all_courses.includes(:account, :enrollment_term)
        courses = courses.where("courses.sis_source_id IS NOT NULL") if @sis_format

        if @include_deleted
          courses = courses.where("(courses.workflow_state='deleted' AND courses.updated_at > ?)
                                    OR courses.workflow_state<>'deleted'
                                    OR courses.sis_source_id IS NOT NULL", 120.days.ago)
        else
          courses = courses.where("courses.workflow_state<>'deleted' AND courses.workflow_state<>'completed'")
        end

        courses = add_course_sub_account_scope(courses)
        courses = add_term_scope(courses)

        course_state_sub = {'claimed' => 'unpublished', 'created' => 'unpublished',
                            'completed' => 'concluded', 'deleted' => 'deleted',
                            'available' => 'active'}

        Shackles.activate(:slave) do
          courses.find_each do |c|
            row = []
            row << c.id unless @sis_format
            row << c.sis_source_id
            row << c.course_code
            row << c.name
            row << c.account_id unless @sis_format
            row << c.account.try(:sis_source_id)
            row << c.enrollment_term_id unless @sis_format
            row << c.enrollment_term.try(:sis_source_id)
            #for sis import format 'claimed', 'created', and 'available' are all considered active
            if @sis_format
              if c.workflow_state == 'deleted' || c.workflow_state == 'completed'
                row << c.workflow_state
              else
                row << 'active'
              end
            else
              row << course_state_sub[c.workflow_state]
            end
            if c.restrict_enrollments_to_course_dates
              row << default_timezone_format(c.start_at)
              row << default_timezone_format(c.conclude_at)
            else
              row << nil
              row << nil
            end
            csv << row
          end
        end
      end
      filename
    end

    def sections
      filename = AccountReports.generate_file(@account_report)
      CSV.open(filename, "w") do |csv|
        if @sis_format
          # headers are not translated on sis_export to maintain import compatibility
          headers = ['section_id', 'course_id', 'name', 'status', 'start_date', 'end_date']
        else
          headers = []
          headers << I18n.t('#account_reports.report_header_canvas_section_id', 'canvas_section_id')
          headers << I18n.t('#account_reports.report_header_section__id', 'section_id')
          headers << I18n.t('#account_reports.report_header_canvas_course_id', 'canvas_course_id')
          headers << I18n.t('#account_reports.report_header_course__id', 'course_id')
          headers << I18n.t('#account_reports.report_header_name', 'name')
          headers << I18n.t('#account_reports.report_header_status', 'status')
          headers << I18n.t('#account_reports.report_header_start__date', 'start_date')
          headers << I18n.t('#account_reports.report_header_end__date', 'end_date')
          headers << I18n.t('#account_reports.report_header_canvas_account_id', 'canvas_account_id')
          headers << I18n.t('#account_reports.report_header_account_id', 'account_id')
        end
        csv << headers
        sections = root_account.course_sections.
          select("course_sections.*, nxc.sis_source_id AS non_x_course_sis_id,
                  rc.sis_source_id AS course_sis_id, nxc.id AS non_x_course_id,
                  ra.id AS r_account_id, ra.sis_source_id AS r_account_sis_id,
                  nxc.account_id AS nx_account_id, nxa.sis_source_id AS nx_account_sis_id").
          joins("INNER JOIN courses AS rc ON course_sections.course_id = rc.id
                 INNER JOIN accounts AS ra ON rc.account_id = ra.id
                 LEFT OUTER JOIN courses AS nxc ON course_sections.nonxlist_course_id = nxc.id
                 LEFT OUTER JOIN accounts AS nxa ON nxc.account_id = nxa.id")

        if @include_deleted
          sections = sections.where("course_sections.workflow_state<>'deleted'
                                     OR
                                     (course_sections.sis_source_id IS NOT NULL
                                      AND (nxc.sis_source_id IS NOT NULL
                                           OR rc.sis_source_id IS NOT NULL))")
        else
          sections = sections.where("course_sections.workflow_state<>'deleted'
                                     AND (nxc.workflow_state<>'deleted'
                                          OR rc.workflow_state<>'deleted')")
        end

        if @sis_format
          sections = sections.where("course_sections.sis_source_id IS NOT NULL
                                     AND (nxc.sis_source_id IS NOT NULL
                                     OR rc.sis_source_id IS NOT NULL)")
        end

        sections = add_course_sub_account_scope(sections, 'rc')
        sections = add_term_scope(sections, 'rc')

        Shackles.activate(:slave) do
          sections.find_each do |s|
            row = []
            row << s.id unless @sis_format
            row << s.sis_source_id
            if s.nonxlist_course_id == nil
              row << s.course_id unless @sis_format
              row << s.course_sis_id
            else
              row << s.non_x_course_id unless @sis_format
              row << s.non_x_course_sis_id
            end
            row << s.name
            row << s.workflow_state
            if s.restrict_enrollments_to_section_dates
              row << default_timezone_format(s.start_at)
              row << default_timezone_format(s.end_at)
            else
              row << nil
              row << nil
            end
            unless @sis_format
              if s.nonxlist_course_id == nil
                row << s.r_account_id
                row << s.r_account_sis_id
              else
                row << s.nx_account_id
                row << s.nx_account_sis_id
              end
            end
            csv << row
          end
        end
      end
      filename
    end

    def enrollments
      filename = AccountReports.generate_file(@account_report)
      CSV.open(filename, "w") do |csv|
        if @sis_format
          # headers are not translated on sis_export to maintain import compatibility
          headers = ['course_id', 'user_id', 'role', 'role_id', 'section_id', 'status', 'associated_user_id']
        else
          headers = []
          headers << I18n.t('#account_reports.report_header_canvas_course_id', 'canvas_course_id')
          headers << I18n.t('#account_reports.report_header_course__id', 'course_id')
          headers << I18n.t('#account_reports.report_header_canvas_user_id', 'canvas_user_id')
          headers << I18n.t('#account_reports.report_header_user__id', 'user_id')
          headers << I18n.t('#account_reports.report_header_role', 'role')
          headers << I18n.t('#account_reports.report_header_role_id', 'role_id')
          headers << I18n.t('#account_reports.report_header_canvas_section_id', 'canvas_section_id')
          headers << I18n.t('#account_reports.report_header_section__id', 'section_id')
          headers << I18n.t('#account_reports.report_header_status', 'status')
          headers << I18n.t('#account_reports.report_header_canvas_associated_user_id', 'canvas_associated_user_id')
          headers << I18n.t('#account_reports.report_header_associated_user_id', 'associated_user_id')
        end
        csv << headers
        enrol = root_account.enrollments.
          select("enrollments.*, courses.sis_source_id AS course_sis_id,
                  nxc.id AS nxc_id, nxc.sis_source_id AS nxc_sis_id,
                  cs.sis_source_id AS course_section_sis_id,
                  pseudonyms.sis_user_id AS pseudonym_sis_id,
                  ob.sis_user_id AS ob_sis_id,
                  CASE WHEN enrollments.workflow_state = 'invited' THEN 'invited'
                       WHEN enrollments.workflow_state = 'creation_pending' THEN 'invited'
                       WHEN enrollments.workflow_state = 'active' THEN 'active'
                       WHEN enrollments.workflow_state = 'completed' THEN 'concluded'
                       WHEN enrollments.workflow_state = 'deleted' THEN 'deleted'
                       WHEN enrollments.workflow_state = 'rejected' THEN 'rejected' END AS enroll_state").
          joins("INNER JOIN course_sections cs ON cs.id = enrollments.course_section_id
                 INNER JOIN courses ON courses.id = cs.course_id
                 INNER JOIN pseudonyms ON pseudonyms.user_id=enrollments.user_id
                 LEFT OUTER JOIN courses nxc ON cs.nonxlist_course_id = nxc.id
                 LEFT OUTER JOIN pseudonyms AS ob ON ob.user_id = enrollments.associated_user_id
                   AND ob.account_id = enrollments.root_account_id").
          where("pseudonyms.account_id=enrollments.root_account_id
                 AND enrollments.type <> 'StudentViewEnrollment'")

        if @include_deleted
          enrol = enrol.where("enrollments.workflow_state<>'deleted'
                              OR
                              ( pseudonyms.sis_user_id IS NOT NULL
                                AND enrollments.workflow_state NOT IN ('rejected', 'invited')
                                AND (courses.sis_source_id IS NOT NULL
                                   OR cs.sis_source_id IS NOT NULL))")
        else
          enrol = enrol.where("enrollments.workflow_state<>'deleted'
                               AND enrollments.workflow_state<>'completed'
                               AND pseudonyms.workflow_state<>'deleted'")
        end

        if @sis_format
          enrol = enrol.where("pseudonyms.sis_user_id IS NOT NULL
                               AND enrollments.workflow_state NOT IN ('rejected', 'invited', 'creation_pending')
                               AND (courses.sis_source_id IS NOT NULL
                                 OR cs.sis_source_id IS NOT NULL)")
        end

        enrol = add_course_sub_account_scope(enrol)
        enrol = add_term_scope(enrol)

        Shackles.activate(:slave) do
          # the "start" parameter is purely to
          # force activerecord to use LIMIT/OFFSET
          # rather than a cursor for this iteration
          # because it often is big enough that the slave
          # kills it mid-run (http://www.postgresql.org/docs/9.0/static/hot-standby.html)
          enrol.find_each(start: 0) do |e|
            row = []
            if e.nxc_id == nil
              row << e.course_id unless @sis_format
              row << e.course_sis_id
            else
              row << e.nxc_id unless @sis_format
              row << e.nxc_sis_id
            end
            row << e.user_id unless @sis_format
            row << e.pseudonym_sis_id
            row << e.sis_role
            row << e.role_id
            row << e.course_section_id unless @sis_format
            row << e.course_section_sis_id
            row << e.enroll_state
            row << e.associated_user_id unless @sis_format
            row << e.ob_sis_id
            csv << row
          end
        end
      end
      filename
    end

    def groups
      filename = AccountReports.generate_file(@account_report)
      CSV.open(filename, "w") do |csv|
        if @sis_format
          # headers are not translated on sis_export to maintain import compatibility
          headers = ['group_id', 'account_id', 'name', 'status']
        else
          headers = []
          headers << I18n.t('#account_reports.report_header_canvas_group_id', 'canvas_group_id')
          headers << I18n.t('#account_reports.report_header_group_id', 'group_id')
          headers << I18n.t('#account_reports.report_header_canvas_account_id', 'canvas_account_id')
          headers << I18n.t('#account_reports.report_header_account_id', 'account_id')
          headers << I18n.t('#account_reports.report_header_name', 'name')
          headers << I18n.t('#account_reports.report_header_status', 'status')
        end

        csv << headers
        groups = root_account.all_groups.
          select("groups.*, accounts.sis_source_id AS account_sis_id").
          joins("INNER JOIN accounts ON accounts.id = groups.account_id")

        if @sis_format
          groups = groups.where("groups.sis_source_id IS NOT NULL")
        end

        if @include_deleted
          groups = groups.where("groups.workflow_state<>'deleted' OR groups.sis_source_id IS NOT NULL")
        else
          groups = groups.where("groups.workflow_state<>'deleted'")
        end

        if account != root_account
          groups = groups.where(:groups => {:context_id => account, :context_type => 'Account'})
        end

        Shackles.activate(:slave) do
          groups.find_each do |g|
            row = []
            row << g.id unless @sis_format
            row << g.sis_source_id
            row << g.account_id unless @sis_format
            row << g.account_sis_id
            row << g.name
            row << g.workflow_state
            csv << row
          end
        end
      end
      filename
    end

    def group_membership
      filename = AccountReports.generate_file(@account_report)
      CSV.open(filename, "w") do |csv|
        if @sis_format
          # headers are not translated on sis_export to maintain import compatibility
          headers = ['group_id', 'user_id', 'status']
        else
          headers = []
          headers << I18n.t('#account_reports.report_header_canvas_group_id', 'canvas_group_id')
          headers << I18n.t('#account_reports.report_header_group_id', 'group_id')
          headers << I18n.t('#account_reports.report_header_canvas_user_id', 'canvas_user_id')
          headers << I18n.t('#account_reports.report_header_user__id', 'user_id')
          headers << I18n.t('#account_reports.report_header_status', 'status')
        end

        csv << headers
        gm = root_account.all_groups.
          select("group_id, sis_source_id, group_memberships.user_id, pseudonyms.sis_user_id AS user_sis_id, group_memberships.workflow_state").
          joins("INNER JOIN group_memberships ON groups.id = group_memberships.group_id
                 INNER JOIN pseudonyms ON pseudonyms.user_id=group_memberships.user_id").
          where("pseudonyms.account_id=groups.root_account_id AND
                 NOT EXISTS (SELECT user_id
                             FROM enrollments e
                             WHERE e.type = 'StudentViewEnrollment'
                             AND e.user_id = pseudonyms.user_id)")

        if @sis_format
          gm = gm.where("pseudonyms.sis_user_id IS NOT NULL AND group_memberships.sis_batch_id IS NOT NULL")
        end

        if @include_deleted
          gm = gm.where("(groups.workflow_state<>'deleted'
                         AND group_memberships.workflow_state<>'deleted')
                         OR
                         (pseudonyms.sis_user_id IS NOT NULL
                         AND group_memberships.sis_batch_id IS NOT NULL)")
        else
          gm = gm.where("groups.workflow_state<>'deleted' AND group_memberships.workflow_state<>'deleted'")
        end

        if account != root_account
          gm = gm.where(:groups => {:context_id => account, :context_type => 'Account'})
        end

        Shackles.activate(:slave) do
          gm.find_each do |gm|
            row = []
            row << gm.group_id unless @sis_format
            row << gm.sis_source_id
            row << gm.user_id unless @sis_format
            row << gm.user_sis_id
            row << gm.workflow_state
            csv << row
          end
        end
      end
      filename
    end

    def xlist
      filename = AccountReports.generate_file(@account_report)
      CSV.open(filename, "w") do |csv|
        if @sis_format
          # headers are not translated on sis_export to maintain import compatibility
          headers = ['xlist_course_id', 'section_id', 'status']
        else
          headers = []
          headers << I18n.t('#account_reports.report_header_canvas_xlist_course_id', 'canvas_xlist_course_id')
          headers << I18n.t('#account_reports.report_header_xlist_course_id', 'xlist_course_id')
          headers << I18n.t('#account_reports.report_header_canvas_section_id', 'canvas_section_id')
          headers << I18n.t('#account_reports.report_header_section__id', 'section_id')
          headers << I18n.t('#account_reports.report_header_status', 'status')
          headers << I18n.t('#account_reports.report_header_canvas_nonxlist_course_id', 'canvas_nonxlist_course_id')
          headers << I18n.t('#account_reports.report_header_nonxlist_course_id', 'nonxlist_course_id')
        end
        csv << headers
        @domain_root_account = root_account
        xl = root_account.course_sections.
          select("course_sections.*, courses.sis_source_id AS course_sis_id,
                  nxc.sis_source_id AS nxc_sis_id").
          joins("INNER JOIN courses ON course_sections.course_id = courses.id
                 INNER JOIN courses nxc ON course_sections.nonxlist_course_id = nxc.id").
          where("course_sections.nonxlist_course_id IS NOT NULL")

        if @sis_format
          xl = xl.where("courses.sis_source_id IS NOT NULL AND course_sections.sis_source_id IS NOT NULL")
        end

        if @include_deleted
          xl = xl.where("(courses.workflow_state<>'deleted'
                         AND course_sections.workflow_state<>'deleted')
                         OR
                         (courses.sis_source_id IS NOT NULL
                         AND course_sections.sis_source_id IS NOT NULL)")
        else
          xl = xl.where("courses.workflow_state<>'deleted'
                         AND courses.workflow_state<>'completed'
                         AND course_sections.workflow_state<>'deleted'")
        end

        xl = add_course_sub_account_scope(xl)
        xl = add_term_scope(xl)

        Shackles.activate(:slave) do
          xl.find_each do |x|
            row = []
            row << x.course_id unless @sis_format
            row << x.course_sis_id
            row << x.id unless @sis_format
            row << x.sis_source_id
            row << x.workflow_state
            row << x.nonxlist_course_id unless @sis_format
            row << x.nxc_sis_id unless @sis_format
            csv << row
          end
        end
      end
      filename
    end
  end
end
