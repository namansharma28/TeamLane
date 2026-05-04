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

  // Helper function to deduplicate messages
  const deduplicateMessages = (msgs: MessageType[]): MessageType[] => {
    const seen = new Set<string>();
    const uniqueMessages: MessageType[] = [];
    
    for (const msg of msgs) {
      // Create a unique identifier for each message
      const identifier = msg._id.startsWith('temp-') 
        ? `temp-${msg.content}-${msg.sender.email}-${msg.createdAt}`
        : msg._id;
      
      if (!seen.has(identifier)) {
        seen.add(identifier);
        uniqueMessages.push(msg);
      }
    }
    
    return uniqueMessages;
  };

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
          // Check if this message already exists by permanent ID
          const existsByPermanentId = prev.some(m => m._id === message._id && !m._id.startsWith('temp-'));
          
          if (existsByPermanentId) {
            console.log("Duplicate message detected (permanent ID exists), skipping");
            return prev;
          }
          
          // Check if this is from the current user (might be optimistic update)
          if (message.sender.email === session?.user?.email) {
            // Find and replace temporary message with permanent one
            const tempMessageIndex = prev.findIndex(m => 
              m._id.startsWith('temp-') &&
              m.content === message.content &&
              m.sender.email === message.sender.email &&
              Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 2000
            );
            
            if (tempMessageIndex !== -1) {
              console.log("Replacing temporary message with permanent one");
              const newMessages = [...prev];
              newMessages[tempMessageIndex] = message;
              return deduplicateMessages(newMessages);
            }
          }
          
          // Check for duplicate by content and timestamp (for messages from others)
          const duplicateByContent = prev.some(m => 
            m.content === message.content &&
            m.sender.email === message.sender.email &&
            Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 1000
          );
          
          if (duplicateByContent) {
            console.log("Duplicate message detected (content match), skipping");
            return prev;
          }
          
          return deduplicateMessages([...prev, message]);
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
      // Check for duplicates before adding (by temp ID or content)
      const isDuplicate = prev.some(m => 
        m._id === tempId || // Check temp ID
        (m.content === messageData.content &&
         m.sender.email === messageData.sender.email &&
         Math.abs(new Date(m.createdAt).getTime() - new Date(timestamp).getTime()) < 2000)
      );
      if (isDuplicate) {
        console.log("Duplicate optimistic message, skipping");
        return prev;
      }
      return deduplicateMessages([...prev, messageData]);
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
      setMessages(prev => {
        // Check if permanent message already exists
        const permanentExists = prev.some(m => m._id === savedMessage._id && !m._id.startsWith('temp-'));
        if (permanentExists) {
          console.log("Permanent message already exists, removing temp only");
          return deduplicateMessages(prev.filter(msg => msg._id !== tempId));
        }
        
        // Replace temp message with permanent one
        const updated = prev.map(msg => 
          msg._id === tempId
            ? {
                ...savedMessage,
                replyTo: messageData.replyTo // Ensure replyTo is preserved
              }
            : msg
        );
        return deduplicateMessages(updated);
      });

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
    <>
      {/* MOBILE VIEW - Completely separate design */}
      <div className="lg:hidden flex flex-col h-[calc(100dvh-14rem)] bg-background">
        {/* Mobile Header - Compact */}
        <div className="flex-shrink-0 border-b bg-card">
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Hash className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold">#{currentChannel}</h1>
                  <div className="flex items-center gap-1">
                    <div className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-[10px] text-muted-foreground">
                      {isConnected ? 'Connected' : 'Connecting...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Channel Pills */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setCurrentChannel(channel.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    currentChannel === channel.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {channel.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <div className="space-y-3" ref={scrollAreaRef}>
            {messages.map((msg) => {
              const isOwn = msg.sender.email === session?.user?.email;
              return (
                <div
                  key={msg._id}
                  className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={msg.sender.avatar || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {msg.sender.initials}
                    </AvatarFallback>
                  </Avatar>

                  {/* Message Content */}
                  <div className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    {/* Sender Name & Time */}
                    <div className={`flex items-center gap-1.5 mb-0.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-xs font-semibold">{msg.sender.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatMessageTime(msg.createdAt)}
                      </span>
                    </div>

                    {/* Reply Preview */}
                    {msg.replyTo && (
                      <div className={`mb-1 p-2 border-l-2 border-primary bg-muted/50 rounded text-[10px] ${isOwn ? 'self-end' : 'self-start'} max-w-full`}>
                        <div className="font-semibold">{msg.replyTo.senderName}</div>
                        <div className="line-clamp-1 text-muted-foreground">{msg.replyTo.content}</div>
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm break-words ${
                        isOwn
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-muted rounded-tl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Reply Button */}
                    <button
                      onClick={() => setReplyTo(msg)}
                      className="text-[10px] text-muted-foreground hover:text-foreground mt-0.5 px-1"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reply Preview Bar */}
        {replyTo && (
          <div className="flex-shrink-0 px-3 py-2 border-t bg-muted/30">
            <div className="flex items-start justify-between gap-2 p-2 bg-background border-l-2 border-primary rounded">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-muted-foreground">
                  Replying to <span className="font-semibold">{replyTo.sender.name}</span>
                </div>
                <div className="text-xs truncate">{replyTo.content}</div>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex-shrink-0 p-3 border-t bg-card">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              ref={messageInputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 h-10 text-sm"
              disabled={!isConnected}
            />
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 flex-shrink-0"
              disabled={!newMessage.trim() || !isConnected}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* DESKTOP VIEW - Original design preserved */}
      <div className="hidden lg:flex flex-col h-[calc(100vh-12rem)] p-6 pt-0 gap-6">
        {/* Main Chat Layout */}
        <div className="grid gap-6 lg:grid-cols-4 flex-1 min-h-0">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Header Card */}
            <div className="bg-background rounded-xl shadow-lg border p-4 my-2 mb-3 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Team Chat
                  </h1>
                  <p className="text-muted-foreground text-base">
                    Communicate with your team in real-time
                  </p>
                </div>
              </div>
            </div>

            {/* Channel Sidebar */}
            <Card className="shadow-lg h-max">
              <CardHeader className="pb-3 p-6">
                <CardTitle className="text-lg">Channels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-6 pt-0">
                <div className="flex flex-col gap-2">
                  {channels.map((channel) => (
                    <Button
                      key={channel.id}
                      variant={currentChannel === channel.id ? "default" : "ghost"}
                      className="justify-start text-sm w-full h-9 px-4"
                      onClick={() => setCurrentChannel(channel.id)}
                    >
                      {channel.icon}
                      <span className="ml-2">{channel.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3 flex flex-col min-h-0">
            <Card className="shadow-xl flex flex-col h-full">
              {/* Header */}
              <CardHeader className="border-b flex-shrink-0 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Hash className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">#{currentChannel}</CardTitle>
                      <CardDescription className="text-sm">
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
                <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full w-fit mt-2">
                  Press <kbd className="px-1.5 py-0.5 text-xs rounded border bg-background font-mono">Alt+M</kbd> to quickly focus the message input
                </div>
              </CardHeader>

              {/* Messages Area */}
              <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-4" ref={scrollAreaRef}>
                    {messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`flex items-start gap-3 ${
                          msg.sender.email === session?.user?.email
                            ? "justify-end"
                            : ""
                        }`}
                      >
                        {msg.sender.email !== session?.user?.email && (
                          <Avatar className="border-2 h-10 w-10 flex-shrink-0">
                            <AvatarImage src={msg.sender.avatar || undefined} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                              {msg.sender.initials}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`grid gap-1 max-w-[70%] ${
                          msg.sender.email === session?.user?.email ? 'text-right' : ''
                        }`}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-semibold text-sm">
                              {msg.sender.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatMessageTime(msg.createdAt)}
                            </div>
                          </div>

                          {/* Reply content if exists */}
                          {msg.replyTo && (
                            <div className="mb-1 p-3 border-l-4 border-primary bg-muted rounded-r text-xs text-left">
                              <span className="font-semibold">
                                {msg.replyTo.senderName}:
                              </span> <span className="line-clamp-2">{msg.replyTo.content}</span>
                            </div>
                          )}

                          {/* Actual message */}
                          <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm break-words ${
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
                            className="text-xs self-start h-7 px-3"
                            onClick={() => setReplyTo(msg)}
                          >
                            Reply
                          </Button>
                        </div>

                        {msg.sender.email === session?.user?.email && (
                          <Avatar className="border-2 h-10 w-10 flex-shrink-0">
                            <AvatarImage src={msg.sender.avatar || undefined} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                              {msg.sender.initials}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Reply Preview */}
                {replyTo && (
                  <div className="px-6 py-3 border-t bg-muted/50">
                    <div className="p-3 border-l-4 border-primary bg-background rounded-r relative">
                      <div className="flex justify-between items-start gap-2">
                        <div className="pr-8 max-w-full flex-1 min-w-0">
                          <div className="text-xs text-muted-foreground mb-1">
                            Replying to <b>{replyTo.sender.name || replyTo.sender.email}</b>
                          </div>
                          <div className="text-sm truncate">{replyTo.content}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-1 right-1 h-6 w-6 p-0 text-lg hover:bg-transparent"
                          onClick={() => setReplyTo(null)}
                        >
                          &times;
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message Input */}
                <div className="p-6 border-t bg-muted/30 flex-shrink-0">
                  <form onSubmit={handleSendMessage} className="flex gap-3">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        ref={messageInputRef}
                        className="pr-16 text-sm h-10"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded border">
                        Alt+M
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      size="icon" 
                      disabled={!newMessage.trim() || !isConnected}
                      className="h-10 w-10 flex-shrink-0"
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
    </>
  );
}
