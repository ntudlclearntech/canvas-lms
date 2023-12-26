/*
  The roles arguments will be filtered out for non admin users.
  Available roles includes 'StudentEnrollment', 'TeacherEnrollment', 'TaEnrollment', 'DesignerEnrollment', 'ObserverEnrollment'
*/

export default function filterRoles(roles) {
  let filteredRoles;
  let allRoles = ENV.ALL_ROLES
  let currentUserRoles = ENV.current_user_roles

  if (currentUserRoles.includes('admin') || currentUserRoles.includes('root admin')) {
    filteredRoles = Array.from(allRoles)
  } else {
    filteredRoles = Array.from(allRoles).filter(role => {
      return !roles.includes(role.name)
    })
  }

  return filteredRoles
}
