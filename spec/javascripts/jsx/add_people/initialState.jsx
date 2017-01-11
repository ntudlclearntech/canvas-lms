define([], () => {
  const INITIAL_STATE = {
    courseParams: {
      courseId: 1,
      roles: [{id: 1}, {id: 2}, {id: 3}],
      sections: [{id: 1}, {id: 2}, {id: 3}]
    },
    inputParams: {
      searchType: 'unique_id',
      nameList: ['foo', 'bar', 'baz'],
      role: '1',
      section: '1',
      limitPrivilege: false
    },
    apiState: {
      pendingCount: 0,
      error: undefined,
    },
    userValidationResult: {
      validUsers: [],
      duplicates: {},
      missing: {}
    },
    usersToBeEnrolled: [],
    usersEnrolled: false
  };

  return INITIAL_STATE;
});
