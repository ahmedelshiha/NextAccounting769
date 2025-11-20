/**
 * TicketDetail Component - Ticket Detail View
 * Displays full ticket details with comments
 */

"use client";

import { useState } from "react";
import { useTicket, useTicketActions } from "@/lib/hooks/messages/useTickets";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, User, Clock, MessageCircle } from "lucide-react";
import { TicketStatus } from "../shared/TicketStatus";
import { TicketPriority } from "../shared/TicketPriority";
import { MessageTime } from "../shared/MessageTime";
import { format } from "date-fns";

interface TicketDetailProps {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

export function TicketDetail({ ticketId, open, onOpenChange, onRefresh }: TicketDetailProps) {
  const { ticket, isLoading, mutate } = useTicket(ticketId);
  const { addComment, isProcessing } = useTicketActions();
  const [commentText, setCommentText] = useState("");

  const handleAddComment = async () => {
    if (!ticketId || !commentText.trim()) return;

    try {
      await addComment(ticketId, commentText.trim());
      setCommentText("");
      mutate(); // Refresh ticket
      onRefresh(); // Refresh threads list
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Support Ticket Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : ticket ? (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {ticket.title}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <TicketStatus status={ticket.status} />
                    <TicketPriority priority={ticket.priority} />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      #{ticket.id.slice(0, 8)}
                    </span>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                  <div>Created {format(new Date(ticket.createdAt), "PPp")}</div>
                  {ticket.resolvedAt && (
                    <div>Resolved {format(new Date(ticket.resolvedAt), "PPp")}</div>
                  )}
                </div>
              </div>

              {/* Ticket Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Category</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {ticket.category.replace("_", " ")}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 dark:text-gray-400">Reported By</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {ticket.user?.name || ticket.user?.email || "Unknown"}
                    </div>
                  </div>
                </div>
                {ticket.description && (
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Description
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {ticket.description}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Comments ({ticket.comments?.length || 0})
              </h3>

              {ticket.comments && ticket.comments.length > 0 ? (
                <div className="space-y-4">
                  {ticket.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {comment.author?.name || comment.author?.email || "Unknown"}
                          </span>
                        </div>
                        <MessageTime timestamp={comment.createdAt} />
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {comment.content}
                      </div>
                      {comment.isInternal && (
                        <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                          Internal note
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No comments yet
                </div>
              )}
            </div>

            {/* Add Comment */}
            {ticket.status !== "CLOSED" && ticket.status !== "RESOLVED" && (
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Label htmlFor="comment">Add Comment</Label>
                <Textarea
                  id="comment"
                  placeholder="Type your comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={4}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddComment}
                    disabled={!commentText.trim() || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Comment"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Ticket not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
