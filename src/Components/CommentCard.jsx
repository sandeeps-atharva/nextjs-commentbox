"use client";

import React, { useEffect, useRef, useState, memo, useMemo } from "react";
import { formatTime } from "@/utils/formatTime";
import {
  Save,
  Edit,
  Delete as DeleteIcon,
  Reply as ReplyIcon,
  ChevronDown,
  ChevronUp,
  MoreVertical,
} from "lucide-react";
import Button from "@/Components/Button";
import Avatar from "./Avatar";
import RichTextEditor from "./RichTextEditor";
import canEditComment from "@/utils/canEditComment";
import canDeleteComment from "@/utils/canDeleteComment";
import hasPermission from "@/utils/hasPermission";

const CommentCard = memo(
  ({
    comment,
    user,
    replyCount,
    isRepliesExpanded,
    onToggleReplies,
    onUpdateComment,
    onDeleteComment,
    onAddReply,
    isSubmitting,
  }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isTextExpanded, setIsTextExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState("");
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState("");

    const menuRef = useRef(null);

    const permissions = useMemo(
      () => ({
        canEdit: canEditComment(user, comment),
        canDelete: canDeleteComment(user, comment),
        canReply: hasPermission(user, "reply_to_comment"),
        canView: hasPermission(user, "view_comments"),
      }),
      [user, comment]
    );

    const { canEdit, canDelete, canReply, canView } = permissions;
    const showMenu = canEdit || canDelete;

    if (!canView) return null;

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (menuRef.current && !menuRef.current.contains(e.target)) {
          setMenuOpen(false);
        }
      };

      const handleEscKey = (e) => {
        if (e.key === "Escape") {
          setMenuOpen(false);
        }
      };

      if (menuOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscKey);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscKey);
      };
    }, [menuOpen]);

    // Text truncation logic
    const textContent = React.useMemo(() => {
      const textOnly = comment.text.replace(/<[^>]+>/g, "");
      const words = textOnly.split(" ");
      const shouldTruncate = words.length > 20;
      const preview = words.slice(0, 20).join(" ");

      return { shouldTruncate, preview };
    }, [comment.text]);

    // Local handlers
    const handleMenuAction = (action) => {
      setMenuOpen(false);
      action();
    };

    const handleStartEdit = () => {
      setIsEditing(true);
      setEditText(comment.text);
    };

    const handleSaveEdit = async () => {
      if (!editText.trim()) return;

      try {
        await onUpdateComment(comment.id, editText);
        setIsEditing(false);
        setEditText("");
      } catch (error) {
        console.error("Failed to save edit:", error);
      }
    };

    const handleCancelEdit = () => {
      setIsEditing(false);
      setEditText("");
    };

    const handleStartReply = () => {
      setIsReplying(!isReplying);
      if (!isReplying) {
        setReplyText("");
      }
    };

    const handleSubmitReply = async () => {
      if (!replyText.trim()) return;

      try {
        await onAddReply(comment.id, replyText);
        setIsReplying(false);
        setReplyText("");
      } catch (error) {
        console.error("Failed to submit reply:", error);
      }
    };

    const handleCancelReply = () => {
      setIsReplying(false);
      setReplyText("");
    };

    const handleDelete = () => {
      if (window.confirm("Are you sure you want to delete this comment?")) {
        onDeleteComment(comment.id);
      }
    };

    // Edit mode
    if (isEditing && canEdit) {
      return (
        <div className="mb-3 space-y-3">
          <RichTextEditor value={editText} setValue={setEditText} />
          <div className="flex gap-2">
            <Button
              onClick={handleSaveEdit}
              disabled={isSubmitting || !editText.trim()}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              <Save size={15} />
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
            <Button
              onClick={handleCancelEdit}
              disabled={isSubmitting}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-3">
        <div className="flex  gap-3 p-4 rounded-lg">
          <Avatar avatar={comment.avatar} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {comment.firstname}
            </p>

            <div className="my-2">
              {textContent.shouldTruncate && !isTextExpanded ? (
                <>
                  {textContent.preview}...
                  <button
                    onClick={() => setIsTextExpanded(true)}
                    className="ml-2 text-indigo-600 text-xs hover:underline"
                  >
                    Show more
                  </button>
                </>
              ) : (
                <>
                  <div dangerouslySetInnerHTML={{ __html: comment.text }} />
                  {textContent.shouldTruncate && (
                    <button
                      onClick={() => setIsTextExpanded(false)}
                      className="ml-2 text-indigo-600 text-xs hover:underline"
                    >
                      Show less
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-3 text-[12px] text-gray-500">
              <span>{formatTime(comment)}</span>

              {canReply && (
                <Button onClick={handleStartReply} variant="default">
                  <ReplyIcon size={14} />
                  <span>Reply</span>
                </Button>
              )}

              {replyCount > 0 && (
                <Button
                  onClick={() => onToggleReplies(comment.id)}
                  variant="ghost"
                  className="flex items-center gap-1 text-indigo-500 hover:text-indigo-700"
                >
                  {isRepliesExpanded ? (
                    <>
                      <ChevronUp size={16} />
                      <span>{replyCount} Hide replies</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} />
                      <span>{replyCount} View replies</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {showMenu && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              >
                <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                  {canEdit && (
                    <button
                      onClick={() => handleMenuAction(handleStartEdit)}
                      className="w-full text-left px-3 py-2 flex items-center gap-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Edit size={14} />
                      <span>Edit</span>
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleMenuAction(handleDelete)}
                      className="w-full text-left px-3 py-2 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <DeleteIcon size={14} />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {isReplying && canReply && (
          <div className="mt-3 ml-12">
            <RichTextEditor value={replyText} setValue={setReplyText} />
            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleSubmitReply}
                disabled={!replyText.trim() || isSubmitting}
                variant="primary"
              >
                {isSubmitting ? "Replying..." : "Reply"}
              </Button>
              <Button onClick={handleCancelReply} variant="cancel">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default CommentCard;
