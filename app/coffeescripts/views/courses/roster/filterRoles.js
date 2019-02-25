export default function filterRoles(allRoles, currentUserRoles) {
  var filteredRoles;
  if (currentUserRoles.includes('admin') || currentUserRoles.includes('root admin')) {
    filteredRoles = Array.from(allRoles)
  } else {
    filteredRoles = Array.from(allRoles).filter((role) => { return role.id != 3 })
  }

  return filteredRoles
}
