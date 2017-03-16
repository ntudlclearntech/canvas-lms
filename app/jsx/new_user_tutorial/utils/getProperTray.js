import I18n from 'i18n!new_user_tutorials'
import HomeTray from '../trays/HomeTray'
import ModulesTray from '../trays/ModulesTray'
import PagesTray from '../trays/PagesTray'
import AssignmentsTray from '../trays/AssignmentsTray'
import QuizzesTray from '../trays/QuizzesTray'
import SettingsTray from '../trays/SettingsTray'
import FilesTray from '../trays/FilesTray'
import PeopleTray from '../trays/PeopleTray'
import AnnouncementsTray from '../trays/AnnouncementsTray'
import GradesTray from '../trays/GradesTray'
import DiscussionsTray from '../trays/DiscussionsTray'
import SyllabusTray from '../trays/SyllabusTray'
import CollaborationsTray from '../trays/CollaborationsTray'
import ImportTray from '../trays/ImportTray'
import ConferencesTray from '../trays/ConferencesTray'

  const generateObject = (component, label, pageName) => ({
    component,
    label,
    pageName
  });

  const getProperTray = (path = window.location.pathname) => {
    if (path.includes('modules')) {
      return generateObject(ModulesTray, I18n.t('Modules Tutorial Tray'), 'modules');
    } else if (path.includes('pages')) {
      return generateObject(PagesTray, I18n.t('Pages Tutorial Tray'), 'pages');
    } else if (path.includes('syllabus')) { // syllabus must come before assignments (courses/#/assignments/syllabus)
      return generateObject(SyllabusTray, I18n.t('Syllabus Tutorial Tray'), 'syllabus');
    } else if (path.includes('assignments')) {
      return generateObject(AssignmentsTray, I18n.t('Assignments Tutorial Tray'), 'assignments');
    } else if (path.includes('quizzes')) {
      return generateObject(QuizzesTray, I18n.t('Quizzes Tutorial Tray'), 'quizzes');
    } else if (path.includes('settings')) {
      return generateObject(SettingsTray, I18n.t('Settings Tutorial Tray'), 'settings');
    } else if (path.includes('files')) {
      return generateObject(FilesTray, I18n.t('Files Tutorial Tray'), 'files');
    } else if (path.includes('users')) {
      return generateObject(PeopleTray, I18n.t('People Tutorial Tray'), 'people');
    } else if (path.includes('announcements')) {
      return generateObject(AnnouncementsTray, I18n.t('Announcements Tutorial Tray'), 'announcements');
    } else if (path.includes('gradebook')) {
      return generateObject(GradesTray, I18n.t('Gradebook Tutorial Tray'), 'grades');
    } else if (path.includes('discussion_topics')) {
      return generateObject(DiscussionsTray, I18n.t('Discussions Tutorial Tray'), 'discussions');
    } else if (path.includes('lti_collaborations') || path.includes('collaborations')) {
      return generateObject(CollaborationsTray, I18n.t('Collaborations Tutorial Tray'), 'collaborations');
    } else if (path.includes('content_migrations')) {
      return generateObject(ImportTray, I18n.t('Import Tutorial Tray'), 'collaborations');
    } else if (path.includes('conferences')) {
      return generateObject(ConferencesTray, I18n.t('Conferences Tutorial Tray'), 'conferences');
    }
    return generateObject(HomeTray, I18n.t('Home Tutorial Tray'), 'home');
  }

export default getProperTray
