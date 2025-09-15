import hasPermission from "./hasPermission";

const canEditComment = (user, comment) => {
  if (!user) return false;

  if (hasPermission(user, "edit_any_comment")) return true;

  if (hasPermission(user, "edit_own_comment") && comment.userId === user.id)
    return true;

  return false;
};

export default canEditComment;
