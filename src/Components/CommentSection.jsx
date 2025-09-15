"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Button from "@/Components/Button";
import CommentCard from "@/Components/CommentCard";
import NoComment from "@/Components/NoComment";
import RichTextEditor from "@/Components/RichTextEditor";
import { useAuth } from "@/context/AuthContext";
import hasPermission from "@/utils/hasPermission";

const MAX_COMMENT_LENGTH = 500;

export default function CommentSection() {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canAddComment = hasPermission(user, "add_comment");

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-User": userData || "{}",
    };
  }, []);

  // Fetch comments on mount
  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/comment");
      if (!res.ok) throw new Error("Failed to fetch comments");
      const data = await res.json();
      setComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Comment tree structure with reply counts
  const commentTree = useMemo(() => {
    const commentMap = new Map();
    const rootComments = [];
    const replyCounts = new Map();

    // Initialize maps
    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
      replyCounts.set(comment.id, 0);

      if (!comment.parentId) {
        rootComments.push(comment.id);
      }
    });

    // Build reply structure and count replies
    comments.forEach((comment) => {
      if (comment.parentId && commentMap.has(comment.parentId)) {
        commentMap.get(comment.parentId).replies.push(comment.id);
        replyCounts.set(
          comment.parentId,
          (replyCounts.get(comment.parentId) || 0) + 1
        );
      }
    });

    return { commentMap, rootComments, replyCounts };
  }, [comments]);

  // API handlers - passed to CommentCard as callbacks
  const handleAddComment = useCallback(
    async (parentId = null, text = null) => {
      const finalText = text || newCommentText;
      if (!finalText.trim()) return;

      setIsSubmitting(true);
      try {
        const response = await fetch("/api/comment", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            userId: user.id,
            username: user.username,
            text: finalText,
            parentId,
          }),
        });

        if (!response.ok) throw new Error("Failed to add comment");

        await fetchComments();

        if (!parentId) {
          setNewCommentText("");
        }
      } catch (error) {
        throw new Error("Error adding comment:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [newCommentText, authHeaders, user, fetchComments]
  );

  const handleUpdateComment = useCallback(
    async (commentId, text) => {
      setIsSubmitting(true);
      try {
        const response = await fetch(`/api/comment/${commentId}`, {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify({ text }),
        });

        if (!response.ok) throw new Error("Failed to update comment");

        await fetchComments();
      } catch (error) {
        throw new Error("Error updating comment:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [authHeaders, fetchComments]
  );

  const handleDeleteComment = useCallback(
    async (commentId) => {
      try {
        const response = await fetch(`/api/comment/${commentId}`, {
          method: "DELETE",
          headers: authHeaders,
        });

        if (!response.ok) throw new Error("Failed to delete comment");

        setComments((prev) =>
          prev.filter((comment) => comment.id !== commentId)
        );
      } catch (error) {
        throw new Error("Error deleting comment:", error);
      }
    },
    [authHeaders, fetchComments]
  );

  const handleAddReply = useCallback(
    async (parentId, text) => {
      return handleAddComment(parentId, text);
    },
    [handleAddComment]
  );

  // Toggle replies expansion
  const handleToggleReplies = useCallback((commentId) => {
    setExpandedReplies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  }, []);

  const renderComments = useCallback(
    (parentId = null, depth = 0) => {
      const { commentMap, rootComments, replyCounts } = commentTree;
      const commentIds = parentId
        ? commentMap.get(parentId)?.replies || []
        : rootComments;
      const isExpanded = parentId ? expandedReplies.has(parentId) : true;

      if (!isExpanded && parentId) return null;

      return commentIds.map((commentId) => {
        const comment = commentMap.get(commentId);
        if (!comment) return null;

        return (
          <div
            key={commentId}
            className={`transition-all bg-[#f7f7f7] dark:bg-gray-800  duration-200 hover:shadow-md ${
              depth > 0
                ? "ml-12 mb-2  border-l-2 border-indigo-300 dark:border-indigo-600 p-1"
                : "mx-5 p-2"
            }`}
          >
            <CommentCard
              comment={comment}
              user={user}
              replyCount={replyCounts.get(commentId) || 0}
              isRepliesExpanded={expandedReplies.has(commentId)}
              onToggleReplies={handleToggleReplies}
              onUpdateComment={handleUpdateComment}
              onDeleteComment={handleDeleteComment}
              onAddReply={handleAddReply}
              isSubmitting={isSubmitting}
            />
            {renderComments(commentId, depth + 1)}
          </div>
        );
      });
    },
    [
      commentTree,
      expandedReplies,
      user,
      isSubmitting,
      handleToggleReplies,
      handleUpdateComment,
      handleDeleteComment,
      handleAddReply,
    ]
  );

  const isTextValid =
    newCommentText.trim().length > 0 &&
    newCommentText.length <= MAX_COMMENT_LENGTH;
  const hasRootComments = commentTree.rootComments.length > 0;

  return (
    <div className="min-h-screen pt-20 sm:pt-24 bg-gradient-to-br dark:bg-[#101828]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* New Comment Input */}
        {canAddComment && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col gap-3">
              <RichTextEditor
                value={newCommentText}
                setValue={setNewCommentText}
              />
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span
                  className={`text-xs sm:text-sm ${
                    newCommentText.length > MAX_COMMENT_LENGTH
                      ? "text-red-500 dark:text-red-400"
                      : newCommentText.length > MAX_COMMENT_LENGTH * 0.8
                      ? "text-amber-500 dark:text-amber-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {newCommentText.length}/{MAX_COMMENT_LENGTH} characters
                </span>
                <Button
                  className="w-full sm:w-auto"
                  disabled={!isTextValid || isSubmitting}
                  onClick={() => handleAddComment()}
                  isLoading={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base">
                Loading comments...
              </p>
            </div>
          ) : !hasRootComments ? (
            <NoComment />
          ) : (
            renderComments()
          )}
        </div>
      </div>
    </div>
  );
}
