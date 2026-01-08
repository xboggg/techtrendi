import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Lightbulb,
  Reply,
  MoreVertical,
  Flag,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  Send,
} from 'lucide-react';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

interface Reaction {
  type: 'like' | 'dislike' | 'heart' | 'insightful';
  count: number;
  userReacted: boolean;
}

interface CommentAuthor {
  id: string;
  name: string;
  avatar?: string;
  role?: 'admin' | 'moderator' | 'premium' | 'user';
}

interface Comment {
  id: string;
  content: string;
  author: CommentAuthor;
  createdAt: string;
  editedAt?: string;
  reactions: Reaction[];
  replies?: Comment[];
  isHighlighted?: boolean;
}

interface CommentSystemProps {
  comments: Comment[];
  currentUserId?: string;
  onAddComment: (content: string, parentId?: string) => void;
  onEditComment: (id: string, content: string) => void;
  onDeleteComment: (id: string) => void;
  onReact: (commentId: string, reactionType: Reaction['type']) => void;
  onReport: (commentId: string) => void;
  className?: string;
}

const reactionIcons = {
  like: ThumbsUp,
  dislike: ThumbsDown,
  heart: Heart,
  insightful: Lightbulb,
};

const roleColors = {
  admin: 'bg-red-500/10 text-red-500 border-red-500/20',
  moderator: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  premium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  user: '',
};

const roleBadges = {
  admin: 'Admin',
  moderator: 'Mod',
  premium: 'Premium',
  user: '',
};

export function CommentSystem({
  comments,
  currentUserId,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onReact,
  onReport,
  className,
}: CommentSystemProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    onAddComment(newComment);
    setNewComment('');
  };

  const handleSubmitReply = (parentId: string) => {
    if (!replyContent.trim()) return;
    onAddComment(replyContent, parentId);
    setReplyContent('');
    setReplyingTo(null);
  };

  const handleSubmitEdit = (id: string) => {
    if (!editContent.trim()) return;
    onEditComment(id, editContent);
    setEditingId(null);
    setEditContent('');
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isAuthor = currentUserId === comment.author.id;
    const isEditing = editingId === comment.id;
    const hasReplies = comment.replies && comment.replies.length > 0;
    const repliesExpanded = expandedReplies.has(comment.id);

    return (
      <div
        key={comment.id}
        className={cn(
          'relative',
          isReply && 'ml-8 md:ml-12 pl-4 border-l-2 border-border',
          comment.isHighlighted && 'bg-primary/5 -mx-4 px-4 py-2 rounded-lg'
        )}
      >
        {comment.isHighlighted && (
          <span className="absolute -top-2 left-4 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
            Featured
          </span>
        )}

        <div className="flex gap-3">
          {/* Avatar */}
          {comment.author.avatar ? (
            <img
              src={comment.author.avatar}
              alt={comment.author.name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-primary">
                {comment.author.name.charAt(0)}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span className="font-semibold text-foreground">{comment.author.name}</span>
              {comment.author.role && comment.author.role !== 'user' && (
                <span
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded border',
                    roleColors[comment.author.role]
                  )}
                >
                  {roleBadges[comment.author.role]}
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                {formatDate(comment.createdAt)}
              </span>
              {comment.editedAt && (
                <span className="text-xs text-muted-foreground">(edited)</span>
              )}
            </div>

            {/* Content */}
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-3 rounded-lg border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleSubmitEdit(comment.id)}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(null);
                      setEditContent('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
            )}

            {/* Actions */}
            {!isEditing && (
              <div className="flex items-center flex-wrap gap-1 mt-2">
                {/* Reactions */}
                {comment.reactions.map((reaction) => {
                  const Icon = reactionIcons[reaction.type];
                  return (
                    <button
                      key={reaction.type}
                      onClick={() => onReact(comment.id, reaction.type)}
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors',
                        reaction.userReacted
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {reaction.count > 0 && <span>{reaction.count}</span>}
                    </button>
                  );
                })}

                {/* Reply button */}
                {!isReply && (
                  <button
                    onClick={() => {
                      setReplyingTo(replyingTo === comment.id ? null : comment.id);
                      setReplyContent('');
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground hover:bg-muted-foreground/20 transition-colors"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    Reply
                  </button>
                )}

                {/* More options */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded-full text-muted-foreground hover:bg-muted transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {isAuthor && (
                      <>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditContent(comment.content);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteComment(comment.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem onClick={() => onReport(comment.id)}>
                      <Flag className="w-4 h-4 mr-2" />
                      Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Reply form */}
            {replyingTo === comment.id && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitReply(comment.id);
                    }
                  }}
                />
                <Button size="sm" onClick={() => handleSubmitReply(comment.id)}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Replies */}
            {hasReplies && (
              <div className="mt-3">
                <button
                  onClick={() => toggleReplies(comment.id)}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  {repliesExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Hide {comment.replies!.length} replies
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show {comment.replies!.length} replies
                    </>
                  )}
                </button>

                {repliesExpanded && (
                  <div className="mt-3 space-y-4">
                    {comment.replies!.map((reply) => renderComment(reply, true))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Comment count */}
      <h3 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5" />
        {comments.length} Comments
      </h3>

      {/* New comment form */}
      <div className="mb-8">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full p-4 rounded-xl border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <Button onClick={handleSubmitComment} disabled={!newComment.trim()}>
            <Send className="w-4 h-4 mr-2" />
            Post Comment
          </Button>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-6">
        {comments.map((comment) => renderComment(comment))}
      </div>

      {comments.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h4 className="text-lg font-semibold text-foreground mb-2">No comments yet</h4>
          <p className="text-muted-foreground">Be the first to share your thoughts!</p>
        </div>
      )}
    </div>
  );
}

export default CommentSystem;
