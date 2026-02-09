'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useUser, useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, updateDoc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import { chat } from '@/ai/flows/chat-agent';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Loader2, Bot, User, Plus, MessageSquare, Menu } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Timestamp;
  userId: string;
}

function SubmitButton({ isSending }: { isSending: boolean }) {
  return (
    <Button type="submit" size="icon" disabled={isSending} aria-label="Send message">
      {isSending ? <Loader2 className="animate-spin" /> : <Send />}
    </Button>
  );
}

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const chatId = searchParams.get('chatId');

  const [isSending, setIsSending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const chatsQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, 'users', user.uid, 'chats'), orderBy('createdAt', 'desc')) : null),
    [user, firestore]
  );
  const { data: chatHistories } = useCollection<Chat>(chatsQuery);

  const chatDocRef = useMemoFirebase(
    () => (user && chatId ? doc(firestore, 'users', user.uid, 'chats', chatId) : null),
    [user, chatId, firestore]
  );
  const { data: currentChat, isLoading: isChatLoading } = useDoc<Chat>(chatDocRef);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [currentChat?.messages]);
  
  const handleNewChat = async () => {
    if (!user) return;
    const newChat = {
      title: 'New Chat',
      userId: user.uid,
      createdAt: serverTimestamp(),
      messages: [],
    };
    try {
      const chatsCollection = collection(firestore, 'users', user.uid, 'chats');
      const newDocRef = await addDoc(chatsCollection, newChat);
      router.push(`/home?chatId=${newDocRef.id}`);
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !chatId || isSending) return;

    const formData = new FormData(event.currentTarget);
    const messageContent = formData.get('message') as string;

    if (!messageContent.trim()) return;

    formRef.current?.reset();
    textAreaRef.current?.focus();
    setIsSending(true);

    const userMessage: ChatMessage = { role: 'user', content: messageContent };
    const currentMessages = currentChat?.messages || [];
    const historyForAi = [...currentMessages];
    const messagesWithUser = [...currentMessages, userMessage];
    const chatRef = doc(firestore, 'users', user.uid, 'chats', chatId);

    try {
      const isNewChat = currentMessages.length === 0;
      await updateDoc(chatRef, {
        messages: messagesWithUser,
        ...(isNewChat && { title: messageContent }),
      });

      const result = await chat({ history: historyForAi, message: messageContent });
      const modelMessage: ChatMessage = { role: 'model', content: result.response };
      
      const finalMessages = [...messagesWithUser, modelMessage];
      await updateDoc(chatRef, { messages: finalMessages });
    } catch (e) {
      console.error(e);
      // Re-add user message to text area on error
      if (textAreaRef.current) {
          textAreaRef.current.value = messageContent;
      }
      // You might want to add an error message to the UI
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <SidebarProvider>
      <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row">
        <Sidebar className="w-full md:w-auto flex flex-col border-b md:border-r md:border-b-0">
          <SidebarHeader className="flex items-center justify-between p-2">
            <Button variant="outline" className="w-full justify-start" onClick={handleNewChat}>
              <Plus className="mr-2 h-4 w-4" /> New Chat
            </Button>
            <div className="md:hidden ml-2">
               <SidebarTrigger />
            </div>
          </SidebarHeader>
          <ScrollArea className="flex-1">
            <SidebarContent>
              <SidebarMenu>
                {chatHistories?.map((chatItem) => (
                  <SidebarMenuItem key={chatItem.id}>
                    <SidebarMenuButton asChild isActive={chatId === chatItem.id} className="truncate">
                      <Link href={`/home?chatId=${chatItem.id}`}>
                        <MessageSquare />
                        <span>{chatItem.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
          </ScrollArea>
        </Sidebar>
        <SidebarInset className="flex-1 flex flex-col">
            <div className="flex-1 flex flex-col bg-card overflow-hidden md:m-4 md:rounded-lg md:border md:shadow-lg">
                <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
                    <div className="space-y-6">
                        {!chatId ? (
                            <div className="text-center text-muted-foreground pt-16">
                                <Bot className="mx-auto h-12 w-12" />
                                <h2 className="text-2xl font-semibold mt-4">Welcome back!</h2>
                                <p className="mt-2">Select a conversation or start a new one to begin.</p>
                            </div>
                        ) : isChatLoading ? (
                            <div className="flex justify-center items-center h-full pt-16">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                          <>
                            {currentChat?.messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={cn('flex items-start gap-4', message.role === 'user' ? 'justify-end' : 'justify-start')}
                                >
                                    {message.role === 'model' && <Avatar className="h-9 w-9 border"><AvatarFallback><Bot /></AvatarFallback></Avatar>}
                                    <div className={cn('max-w-md lg:max-w-2xl rounded-lg px-4 py-3 text-card-foreground shadow', message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                        <p className="whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                    {message.role === 'user' && <Avatar className="h-9 w-9 border"><AvatarFallback><User /></AvatarFallback></Avatar>}
                                </div>
                            ))}
                            {isSending && currentChat?.messages[currentChat.messages.length - 1]?.role === 'user' && (
                                <div className="flex items-start gap-4 justify-start">
                                    <Avatar className="h-9 w-9 border"><AvatarFallback><Bot /></AvatarFallback></Avatar>
                                    <div className="max-w-md lg:max-w-2xl rounded-lg px-4 py-3 bg-muted shadow flex items-center space-x-2">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                        <span className="text-muted-foreground text-sm">Thinking...</span>
                                    </div>
                                </div>
                            )}
                          </>
                        )}
                    </div>
                </ScrollArea>
                {chatId && (
                     <div className="p-4 bg-card border-t">
                        <form onSubmit={handleSendMessage} ref={formRef} className="flex items-center gap-2">
                            <Textarea
                                ref={textAreaRef}
                                name="message"
                                placeholder="Type your message here..."
                                className="flex-1 resize-none bg-background"
                                rows={1}
                                onKeyDown={handleKeyDown}
                                disabled={isSending}
                            />
                            <SubmitButton isSending={isSending} />
                        </form>
                    </div>
                )}
            </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
