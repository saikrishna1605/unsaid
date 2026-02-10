'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, arrayUnion, Timestamp, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Loader2, Bot, User, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// --- Interfaces ---
interface ChatMessage {
  userId: string;
  userName: string;
  content: string;
  timestamp: Timestamp;
}

interface Session {
  id: string;
  participantIds: string[];
  chatLog: ChatMessage[];
  createdAt: Timestamp;
}

// --- Main Page Component ---
export default function SessionChatPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Fetch the session document
  const sessionDocRef = useMemoFirebase(
    () => (firestore && sessionId ? doc(firestore, 'sessions', sessionId) : null),
    [firestore, sessionId]
  );
  const { data: session, isLoading: isSessionLoading, error } = useDoc<Session>(sessionDocRef);

  // Fetch current user's profile for name
  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile } = useDoc(userDocRef);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [session?.chatLog]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || !userProfile || !sessionDocRef) return;
    
    setIsSending(true);
    
    const newMessage: ChatMessage = {
      userId: user.uid,
      userName: userProfile.name || 'Anonymous',
      content: message.trim(),
      timestamp: Timestamp.now()
    };
    
    try {
      await updateDoc(sessionDocRef, {
        chatLog: arrayUnion(newMessage)
      });
      setMessage('');
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  if (isSessionLoading || isUserLoading) {
    return <div className="flex justify-center items-center h-full pt-16"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-4 sm:p-6 md:p-8 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader><CardTitle className="text-destructive">Access Denied</CardTitle></CardHeader>
          <CardContent>
            <p>You do not have permission to view this session.</p>
            <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
            <Button asChild className="mt-4">
              <Link href="/volunteer">Go to Volunteer Hub</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return <div className="text-center pt-16">Session not found.</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <Card className="h-[80vh] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center gap-4">
             <Button asChild variant="outline" size="icon">
                <Link href="/volunteer">
                    <ArrowLeft className="h-4 w-4"/>
                </Link>
            </Button>
            <div>
                <CardTitle>Support Session</CardTitle>
                <p className="text-sm text-muted-foreground">A private chat with your support partner.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="p-6 space-y-4">
              {session.chatLog.map((msg, index) => (
                <div key={index} className={cn("flex items-end gap-3", msg.userId === user?.uid ? 'justify-end' : 'justify-start')}>
                  {msg.userId !== user?.uid && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{msg.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn(
                      "max-w-xs md:max-w-md rounded-lg p-3",
                      msg.userId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    <p className="text-sm font-bold mb-1">{msg.userName}</p>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-2 text-right">
                        {msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {msg.userId === user?.uid && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{msg.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
               {session.chatLog.length === 0 && (
                <div className="text-center text-muted-foreground pt-16">
                    <p>This is the beginning of your private session.</p>
                    <p className="text-sm">Say hello!</p>
                </div>
               )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
            <Textarea
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSending}
              rows={1}
              className="flex-1 resize-none"
              onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                  }
              }}
            />
            <Button type="submit" size="icon" disabled={isSending || !message.trim()}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}

    