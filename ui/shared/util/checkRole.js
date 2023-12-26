const isStaff = ENV.current_user.sis_user_id ? ENV.current_user.sis_user_id.match(/^[a-zA-z0-9]{5}$/) : false

export { isStaff }
