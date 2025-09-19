"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Button from "@/Components/Button";
import CommentCard from "@/Components/CommentCard";
import NoComment from "@/Components/NoComment";
import RichTextEditor from "@/Components/RichTextEditor";
import { useAuth } from "@/context/AuthContext";
import hasPermission from "@/utils/hasPermission";
import { buildCommentTree } from "@/utils/buildCommentTree";

export default function CommentSection() {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadedCommentCounts, setLoadedCommentCounts] = useState([5]);

  const scrollContainerRef = useRef(null);

  const scrollToCommentIdRef = useRef(null);
  const isWaitingToScrollRef = useRef(false);
  const scrollAttemptRef = useRef(0);

  const isAdminLayout =
    user?.permissions?.some((permission) =>
      ["manage_roles", "manage_users", "manage_permissions"].includes(
        permission
      )
    ) || false;

  const canAddComment = hasPermission(user, "add_comment");
  const canViewComment = hasPermission(user, "view_comments");

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-User": userData || "{}",
    };
  }, []);

  const fetchComments = useCallback(async (currentSkip, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const res = await fetch(`/api/comment?take=5&skip=${currentSkip}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      if (isLoadMore) {
        setComments((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const newComments = data.comments.filter(
            (c) => !existingIds.has(c.id)
          );

          if (newComments.length === 0) {
            scrollToCommentIdRef.current = null;
            return prev;
          }
          // We'll scroll to the FIRST newly appended comment (so user sees newly loaded block)
          scrollToCommentIdRef.current = newComments[0].id;
          isWaitingToScrollRef.current = true;
          // reset attempt counter
          scrollAttemptRef.current = 0;
          return [...prev, ...newComments];
        });

        setLoadedCommentCounts((prev) => [
          ...prev,
          prev[prev.length - 1] + data.comments.length,
        ]);
      } else {
        setComments(data.comments);
        setLoadedCommentCounts([data.comments.length]);

        scrollToCommentIdRef.current = null;
        isWaitingToScrollRef.current = false;
      }

      setHasMore(Boolean(data.hasMore));
    } catch (error) {
      console.error("[Comments] fetch error:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchComments(0, false);
  }, [fetchComments]);

  const showMore = useCallback(async () => {
    const newSkip = skip + 5;
    setSkip(newSkip);
    await fetchComments(newSkip, true);
  }, [skip, fetchComments]);

  const showLess = useCallback(() => {
    if (loadedCommentCounts.length <= 1) return;

    const newCounts = [...loadedCommentCounts];
    newCounts.pop();
    const targetCount = newCounts[newCounts.length - 1];

    setComments((prev) => prev.slice(0, targetCount));
    setLoadedCommentCounts(newCounts);

    const newSkip = Math.max(0, skip - 5);
    setSkip(newSkip);

    setHasMore(true);
  }, [loadedCommentCounts, skip]);

  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

  useEffect(() => {
    if (!isWaitingToScrollRef.current || !scrollToCommentIdRef.current) return;
    const container = scrollContainerRef.current;
    if (!container) {
      isWaitingToScrollRef.current = false;
      scrollToCommentIdRef.current = null;
      return;
    }

    const tryScroll = () => {
      const targetId = scrollToCommentIdRef.current;
      if (!targetId) {
        isWaitingToScrollRef.current = false;
        return;
      }

      const el = document.getElementById(`comment-${targetId}`);
      if (el) {
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const scrollTopNeeded =
          container.scrollTop + (elRect.top - containerRect.top) - 8; // small offset
        container.scrollTo({ top: scrollTopNeeded, behavior: "smooth" });

        isWaitingToScrollRef.current = false;
        scrollToCommentIdRef.current = null;
        scrollAttemptRef.current = 0;
      } else {
        scrollAttemptRef.current = (scrollAttemptRef.current || 0) + 1;
        if (scrollAttemptRef.current < 8) {
          setTimeout(tryScroll, 80 * scrollAttemptRef.current); // incremental backoff
        } else {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });

          isWaitingToScrollRef.current = false;
          scrollToCommentIdRef.current = null;
          scrollAttemptRef.current = 0;
        }
      }
    };

    setTimeout(tryScroll, 50);
  }, [comments]);

  const findRootParent = useCallback((commentId, allComments) => {
    const comment = allComments.find((c) => c.id === commentId);
    if (!comment || !comment.parentId) return commentId;
    return findRootParent(comment.parentId, allComments);
  }, []);

  const handleAddComment = useCallback(
    async (parentId = null, text = null) => {
      console.log("parentId", parentId, "replyed text", text);

      const finalText = text ?? newCommentText;
      console.log("finalText", finalText);

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

        const result = await response.json();
        const newComment = result.comment;

        if (parentId) {
          const rootParentId = findRootParent(parentId, comments);
          setExpandedReplies((prev) => {
            const newSet = new Set(prev);
            newSet.add(rootParentId);
            newSet.add(parentId);
            return newSet;
          });

          // Append reply; scroll to the newly added reply
          setComments((prev) => {
            scrollToCommentIdRef.current = newComment.id;
            isWaitingToScrollRef.current = true;
            scrollAttemptRef.current = 0;
            return [...prev, newComment];
          });
        } else {
          // For a new root-level comment, reload first page so ordering stays consistent
          setSkip(0);
          setLoadedCommentCounts([5]);
          setComments([]);
          await fetchComments(0, false);
          setNewCommentText("");
        }
      } catch (error) {
        console.error("[Comments] add error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [newCommentText, authHeaders, user, findRootParent, comments, fetchComments]
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

        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, text, updatedAt: new Date().toISOString() }
              : c
          )
        );
      } catch (error) {
        console.error("[Comments] update error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [authHeaders]
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
          prev.filter((c) => c.id !== commentId && c.parentId !== commentId)
        );
      } catch (error) {
        console.error("[Comments] delete error:", error);
      }
    },
    [authHeaders]
  );

  const handleAddReply = useCallback(
    async (parentId, text) => {
      return handleAddComment(parentId, text);
    },
    [handleAddComment]
  );

  const handleToggleReplies = useCallback((commentId) => {
    setExpandedReplies((prev) => {
      const newSet = new Set(prev);
      newSet.has(commentId) ? newSet.delete(commentId) : newSet.add(commentId);
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
            id={`comment-${commentId}`}
            className={`transition-all bg-[#f7f7f7] dark:bg-gray-800 duration-200 hover:shadow-md ${
              depth > 0
                ? "ml-12 mb-4 border-l-2 border-indigo-300 dark:border-indigo-600 p-1"
                : "p-2"
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
      handleAddComment,
    ]
  );

  const hasRootComments = commentTree.rootComments.length > 0;
  const canShowLess = loadedCommentCounts.length > 1;

  return (
    <div
      className={`h-screen bg-gradient-to-br dark:bg-[#101828] ${
        isAdminLayout ? "pt-0" : "pt-[100px]"
      }`}
    >
      <div
        className={`${
          !isAdminLayout ? "max-w-[1500px] mx-auto" : ""
        } px-4 sm:px-6 lg:px-1`}
      >
        {canAddComment && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-2 mb-6 sm:mb-3">
            <div className="flex flex-col gap-3">
              <RichTextEditor
                value={newCommentText}
                setValue={setNewCommentText}
              />
              <div className="flex flex-col max-h-[200px] sm:flex-row justify-between items-start sm:items-center gap-2">
                <Button
                  className="w-full sm:w-auto"
                  disabled={isSubmitting || !newCommentText.trim()}
                  onClick={() => handleAddComment()}
                  isLoading={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
          </div>
        )}

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
          <div
            ref={scrollContainerRef}
            className="space-y-4 max-h-[485px] overflow-y-auto scroll-width-comment pb-4"
          >
            {renderComments()}
          </div>
        )}

        {!isLoading && hasRootComments && (
          <div className="flex flex-row justify-center gap-4 text-center mx-auto mt-2">
            {canShowLess && (
              <Button
                variant="primary"
                onClick={showLess}
                disabled={isLoadingMore}
              >
                Show Less
              </Button>
            )}
            {hasMore && (
              <Button
                variant="primary"
                onClick={showMore}
                disabled={isLoadingMore}
                isLoading={isLoadingMore}
              >
                {isLoadingMore ? "Loading..." : "Show More"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
