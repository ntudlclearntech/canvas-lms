import _ from 'underscore'

  export function scopeToUser (dueDateData, userId) {
    const scopedData = {};
    _.forEach(dueDateData, (dueDateDataByUserId, assignmentId) => {
      if (dueDateDataByUserId[userId]) {
        scopedData[assignmentId] = dueDateDataByUserId[userId];
      }
    });
    return scopedData;
  }
