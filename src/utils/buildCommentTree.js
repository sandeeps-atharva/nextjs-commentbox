export function buildCommentTree(comments) {
  const commentMap = new Map();
  const rootComments = [];
  const replyCounts = new Map();

  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] });
    replyCounts.set(comment.id, 0);

    if (!comment.parentId) {
      rootComments.push(comment.id);
    }
  });

  comments.forEach((comment) => {
    if (comment.parentId && commentMap.has(comment.parentId)) {
      commentMap.get(comment.parentId).replies.push(comment.id);
      replyCounts.set(
        comment.parentId,
        (replyCounts.get(comment.parentId) || 0) + 1
      );
    }
  });

  rootComments.sort(
    (a, b) =>
      new Date(commentMap.get(b).createdAt) -
      new Date(commentMap.get(a).createdAt)
  );

  commentMap.forEach((c) => {
    c.replies.sort(
      (a, b) =>
        new Date(commentMap.get(a).createdAt) -
        new Date(commentMap.get(b).createdAt)
    );
  });

  return { commentMap, rootComments, replyCounts };
}
