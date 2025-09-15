import hasPermission from "./hasPermission";

const canDeleteComment = (user, comment) => {
  if (!user) return false;

  if (hasPermission(user, "delete_any")) return true;

  if (hasPermission(user, "edit_own_comment") && comment.userId === user.id)
    return true;

  return false;
};

export default canDeleteComment;
