"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageSquare, Hash } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { pusherClient } from "@/lib/pusher";
import { LoadingPage } from "@/components/ui/loading-page";

interface MessageType {
  _id: string;
  teamId: string;
  channel: string;
  content: string;
  createdAt: string;
  sender: {
    email: string;
    name?: string;
    avatar?: string;
    initials: string;
  };
  replyTo?: {
    _id: string;
    senderName: string;
    content: string;
  };
}

export default function ChatPage() {
  const { data: session } = useSession();
  const params = useParams();
  const teamId = params?.teamId as string;
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentChannel, setCurrentChannel] = useState("general");
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<MessageType | null>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Add keyboard shortcut to focus message input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch messages for current channel
  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `/api/teams/${teamId}/chat?channel=${currentChannel}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  // Initialize Pusher and fetch messages
  useEffect(() => {
    if (!session?.user?.email || !teamId) return;

    // Subscribe to the team channel
    const channelName = `team-${teamId}`;
    const channel = pusherClient.subscribe(channelName);
    setIsConnected(true);

    // Handle new messages
    channel.bind('new-message', (message: MessageType) => {
      console.log("Received new message:", message);
      if (message.channel === currentChannel) {
        setMessages((prev) => {
          // More thorough duplicate check
          const exists = prev.some(m => 
            m._id === message._id || // Check permanent ID
            (m.content === message.content && // Or check content and timestamp
             m.sender.email === message.sender.email &&
             Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 1000)
          );
          if (exists) {
            console.log("Duplicate message detected, skipping");
            return prev;
          }
          return [...prev, message];
        });
      }
    });

    // Fetch initial messages
    fetchMessages();

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [teamId, session, currentChannel]);

  // Auto scroll to bottom when new messages come
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !session?.user?.email || !session?.user?.name) return;
    
    if (!isConnected) {
      toast.error("Not connected to chat server. Please wait or refresh the page.");
      return;
    }

    // Create a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    const messageData = {
      _id: tempId,
      content: newMessage.trim(),
      channel: currentChannel,
      teamId: teamId,
      createdAt: timestamp,
      sender: {
        email: session.user.email,
        name: session.user.name || session.user.email,
        avatar: `https://ui-avatars.com/api/?name=${
          session.user.name || session.user.email
        }&background=random`,
        initials: session.user.name
          ? session.user.name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
          : session.user.email[0].toUpperCase(),
      },
      replyTo: replyTo
        ? {
            _id: replyTo._id,
            senderName: replyTo.sender.name || replyTo.sender.email,
            content: replyTo.content,
          }
        : undefined,
    };

    // Clear input immediately for better UX
    setNewMessage("");

    // Optimistically update UI
    setMessages(prev => {
      // Check for duplicates before adding
      const isDuplicate = prev.some(m => 
        m.content === messageData.content &&
        m.sender.email === messageData.sender.email &&
        Math.abs(new Date(m.createdAt).getTime() - new Date(timestamp).getTime()) < 1000
      );
      if (isDuplicate) return prev;
      return [...prev, messageData];
    });

    try {
      // Send message to server
      const response = await fetch(`/api/teams/${teamId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: messageData.content,
          channel: currentChannel,
          replyTo: messageData.replyTo
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const { data: savedMessage } = await response.json();
      
      // Update the temporary message with the permanent one
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempId || // Match by temp ID
          (msg.content === messageData.content && // Or match by content and timestamp
           msg.sender.email === messageData.sender.email &&
           Math.abs(new Date(msg.createdAt).getTime() - new Date(timestamp).getTime()) < 1000)
            ? {
                ...savedMessage,
                replyTo: messageData.replyTo // Ensure replyTo is preserved
              }
            : msg
        )
      );

      // Only clear reply state after successful message send
      setReplyTo(null);

    } catch (error) {
      console.error("Error:", error);
      // Remove the temporary message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    }
  };

  const channels = [
    { id: "general", name: "General", icon: <Hash className="h-4 w-4" /> },
    { id: "development", name: "Development", icon: <Hash className="h-4 w-4" /> },
    { id: "design", name: "Design", icon: <Hash className="h-4 w-4" /> },
    { id: "marketing", name: "Marketing", icon: <Hash className="h-4 w-4" /> },
  ];

  const formatMessageTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return "Just now";
    }
  };

  if (loading) {
    return <div>
      <LoadingPage />
    </div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] p-6 pt-0 gap-6">

      {/* Main Chat Layout */}
      <div className="grid gap-6 lg:grid-cols-4 flex-1 min-h-0">

      {/* Header Card */}
        <div className="lg:col-span-1">
            <div className="bg-background rounded-xl shadow-lg border p-4 my-2 mb-3 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Team Chat
                  </h1>
                  <p className="text-muted-foreground">
                    Communicate with your team in real-time
                  </p>
                </div>
              </div>
            </div>

        {/* Channel Sidebar */}
          <Card className="shadow-lg h-max">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Channels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {channels.map((channel) => (
                <Button
                  key={channel.id}
                  variant={currentChannel === channel.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setCurrentChannel(channel.id)}
                >
                  {channel.icon}
                  <span className="ml-2">{channel.name}</span>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <Card className="shadow-xl flex flex-col h-full">
            <CardHeader className="border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Hash className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      #{currentChannel}
                    </CardTitle>
                    <CardDescription>
                      Channel for {currentChannel} team discussion
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium">Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                      <span className="text-xs font-medium">Connecting...</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs mt-2 text-muted-foreground bg-muted px-3 py-1 rounded-full inline-block">
                Press <kbd className="px-1 py-0.5 text-xs rounded border bg-background font-mono">Alt+M</kbd> to quickly focus the message input
              </div>
            </CardHeader>
            
            {/* Messages Area - Scrollable */}
            <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6" ref={scrollAreaRef}>
                  {messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`flex items-start gap-4 ${
                        msg.sender.email === session?.user?.email
                          ? "justify-end"
                          : ""
                      }`}
                    >
                      {msg.sender.email !== session?.user?.email && (
                        <Avatar className="border-2">
                          <AvatarImage src={msg.sender.avatar || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {msg.sender.initials}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`grid gap-2 max-w-[70%] ${
                        msg.sender.email === session?.user?.email ? 'text-right' : ''
                      }`}>
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">
                            {msg.sender.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatMessageTime(msg.createdAt)}
                          </div>
                        </div>
                        
                        {/* Reply content if exists */}
                        {msg.replyTo && (
                          <div className="mb-2 p-3 border-l-4 border-primary bg-muted rounded-r text-xs text-left">
                            <span className="font-semibold">
                              {msg.replyTo.senderName}:
                            </span> {msg.replyTo.content}
                          </div>
                        )}
                        
                        {/* Actual message */}
                        <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                          msg.sender.email === session?.user?.email 
                            ? 'bg-primary text-primary-foreground ml-auto'
                            : 'bg-muted border'
                        }`}>
                          {msg.content}
                        </div>
                        
                        {/* Reply button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs self-start"
                          onClick={() => setReplyTo(msg)}
                        >
                          Reply
                        </Button>
                      </div>
                      
                      {msg.sender.email === session?.user?.email && (
                        <Avatar className="border-2">
                          <AvatarImage src={msg.sender.avatar || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {msg.sender.initials}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              {/* Reply Preview - Fixed above input */}
              {replyTo && (
                <div className="px-6 py-3 border-t bg-muted/50">
                  <div className="p-3 border-l-4 border-primary bg-background rounded-r relative">
                    <div className="flex justify-between items-start">
                      <div className="pr-10 max-w-full">
                        <div className="text-xs text-muted-foreground mb-1">
                          Replying to <b>{replyTo.sender.name || replyTo.sender.email}</b>
                        </div>
                        <div className="text-sm truncate">{replyTo.content}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => setReplyTo(null)}
                      >
                        &times;
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Message Input - Fixed at bottom */}
              <div className="p-6 border-t bg-muted/30 flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      ref={messageInputRef}
                      className="pr-16"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded border">
                      Alt+M
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!newMessage.trim() || !isConnected}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}