const hasPermission = (user, permission) => {
  if (!user || !Array.isArray(user.permissions)) return false;
  return user.permissions.includes(permission);
};

export default hasPermission;
