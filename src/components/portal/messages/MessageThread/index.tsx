/**
 * MessageThread Component - Chat Interface
 * Displays messages in a thread with input box
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useThreadDetails, useSendMessage } from "@/lib/hooks/messages/useMessages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { MessageTime } from "../shared/MessageTime";
import { useSession } from "next-auth/react";

interface MessageThreadProps {
  threadId: string | null;
}

export function MessageThread({ threadId }: MessageThreadProps) {
  const { data: session } = useSession();
  const { messages, ticket, isLoading, mutate } = useThreadDetails(threadId);
  const { sendMessage, isProcessing } = useSendMessage();
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!threadId || !messageText.trim() || isProcessing) return;

    try {
      await sendMessage(threadId, messageText.trim());
      setMessageText("");
      mutate(); // Refresh messages
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!threadId) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full text-center">
          <MessageSquare className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No thread selected
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Select a thread from the list to view messages
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  // If it's a ticket, show ticket view
  if (ticket) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Support Ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">
            This is a support ticket. Use the ticket detail view to manage it.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Chat Thread
        </CardTitle>
      </CardHeader>

      {/* Messages List */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isOwnMessage = message.userId === session?.user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isOwnMessage
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                    }`}
                  >
                    {!isOwnMessage && (
                      <div className="text-xs font-semibold mb-1 opacity-75">
                        {message.userName}
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {message.text}
                    </div>
                    <div className={`text-xs mt-1 ${isOwnMessage ? "text-blue-100" : "text-gray-500"}`}>
                      <MessageTime timestamp={message.createdAt} />
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      {/* Message Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type your message... (Shift+Enter for new line)"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={2}
            className="resize-none"
            disabled={isProcessing}
          />
          <Button
            onClick={handleSend}
            disabled={!messageText.trim() || isProcessing}
            size="icon"
            className="h-auto"
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
