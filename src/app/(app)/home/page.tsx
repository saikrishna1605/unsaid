'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useCollection, useDoc, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, addDoc, updateDoc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import { chat } from '@/ai/flows/chat-agent';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Loader2, Bot, User, Plus, MessageSquare, Menu, Mic, Paperclip, Trash2, X } from 'lucide-react';
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
  SidebarMenuAction,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  imageUrl?: string;
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
    <Button type="submit" size="icon" disabled={isSending} aria-label="Send message" className="shrink-0">
      {isSending ? <Loader2 className="animate-spin" /> : <Send />}
    </Button>
  );
}

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const chatId = searchParams.get('chatId');
  const { toast } = useToast();

  const [isSending, setIsSending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // State for image handling
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);

  // State for voice input
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
  
  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile } = useDoc(userDocRef);

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
    router.push('/home');
  };
  
  const handleDeleteChat = (e: React.MouseEvent, chatIdToDelete: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user || !firestore) return;

    if (window.confirm('Are you sure you want to delete this chat?')) {
        const chatRef = doc(firestore, 'users', user.uid, 'chats', chatIdToDelete);
        
        deleteDocumentNonBlocking(chatRef);

        if (chatId === chatIdToDelete) {
            router.push('/home');
        }

        toast({
            title: "Chat Deleted",
            description: "The conversation has been removed.",
        });
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setImageData(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            handleRemoveImage(); // Clean up previous image if any
            setImagePreview(URL.createObjectURL(file)); // For preview
            setImageData(reader.result as string); // For sending to AI
        };
        reader.readAsDataURL(file);
    }
    event.target.value = ''; // Allow selecting the same file again
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    setMessage('');
    setIsTranscribing(false);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        if (audioBlob.size === 0) {
            console.warn("No audio recorded.");
            setIsTranscribing(false);
            return;
        }

        setIsTranscribing(true);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const audioDataUri = reader.result as string;
          try {
            const { text } = await transcribeAudio({ audioDataUri });
            setMessage(text);
          } catch (error) {
            console.error('Error transcribing audio:', error);
            toast({
              variant: 'destructive',
              title: 'Transcription Failed',
              description: 'Could not transcribe the audio.',
            });
          } finally {
            setIsTranscribing(false);
          }
        };
      };
      recorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        variant: 'destructive',
        title: 'Microphone Access Denied',
        description: 'Please enable microphone permissions in your browser settings.',
      });
    }
  };


  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || isSending || isUserLoading) return;

    const messageContent = message;

    if (!messageContent.trim() && !imageData) return;

    setMessage('');
    textAreaRef.current?.focus();
    setIsSending(true);

    const userMessage: ChatMessage = { 
      role: 'user', 
      content: messageContent,
    };

    if (imageData) {
        userMessage.imageUrl = imageData;
    }

    const tempImageData = imageData;
    
    handleRemoveImage();

    try {
        let activeChatId = chatId;
        
        if (!activeChatId) {
            const newChatData = {
                title: messageContent.substring(0, 30) || 'Image Chat',
                userId: user.uid,
                createdAt: serverTimestamp(),
                messages: [userMessage],
            };
            const chatsCollection = collection(firestore, 'users', user.uid, 'chats');
            const newDocRef = await addDoc(chatsCollection, newChatData);
            activeChatId = newDocRef.id;
            
            router.push(`/home?chatId=${activeChatId}`);
            
            const result = await chat({
              history: [],
              message: messageContent,
              ...(tempImageData && { imageUrl: tempImageData }),
            });
            const modelMessage: ChatMessage = { role: 'model', content: result.response };
            
            await updateDoc(newDocRef, { messages: [userMessage, modelMessage] });

        } else {
            const chatRef = doc(firestore, 'users', user.uid, 'chats', activeChatId);
            
            const historyForAi = currentChat?.messages || [];
            const messagesWithUser = [...historyForAi, userMessage];

            await updateDoc(chatRef, { messages: messagesWithUser });

            const result = await chat({
              history: historyForAi,
              message: messageContent,
              ...(tempImageData && { imageUrl: tempImageData }),
            });
            const modelMessage: ChatMessage = { role: 'model', content: result.response };
            
            await updateDoc(chatRef, { messages: [...messagesWithUser, modelMessage] });
        }
    } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not send message.'})
        setMessage(messageContent);
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

  const placeholderText = isUserLoading
    ? "Connecting..."
    : !user
    ? "Authenticating..."
    : isRecording
    ? "Recording... tap mic to stop"
    : isTranscribing
    ? "Transcribing audio..."
    : "Type your message here...";

  return (
    <SidebarProvider>
      <div className="h-full flex flex-col md:flex-row">
        <Sidebar collapsible="icon" className="flex flex-col border-b md:border-r md:border-b-0">
          <SidebarHeader className="flex items-center justify-between p-2">
             <SidebarMenuButton variant="outline" className="w-full justify-start" onClick={handleNewChat} tooltip="New Chat">
              <Plus />
              <span>New Chat</span>
            </SidebarMenuButton>
            <SidebarTrigger className="ml-2" />
          </SidebarHeader>
          <ScrollArea className="flex-1">
            <SidebarContent>
              <SidebarMenu>
                {chatHistories?.map((chatItem) => (
                  <SidebarMenuItem key={chatItem.id}>
                    <SidebarMenuButton asChild isActive={chatId === chatItem.id} className="truncate" tooltip={chatItem.title}>
                      <Link href={`/home?chatId=${chatItem.id}`}>
                        <MessageSquare />
                        <span>{chatItem.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <SidebarMenuAction
                            onClick={(e) => handleDeleteChat(e, chatItem.id)}
                            showOnHover={true}
                            aria-label="Delete chat"
                          >
                          <Trash2 />
                        </SidebarMenuAction>
                      </TooltipTrigger>
                      <TooltipContent side="right" align="center">
                        <p>Delete chat</p>
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
          </ScrollArea>
        </Sidebar>
        <SidebarInset className="flex-1 flex flex-col">
            <div className="flex-1 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1" ref={scrollAreaRef}>
                    <div className="p-6">
                      <div className="space-y-6">
                          {!chatId ? (
                              <div className="text-center text-muted-foreground pt-16">
                                  <Bot className="mx-auto h-12 w-12" />
                                  <h2 className="text-2xl font-semibold mt-4">Welcome back, {userProfile?.name || 'friend'}!</h2>
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
                                          {message.imageUrl && (
                                            <div className="mb-2 relative">
                                                <Image src={message.imageUrl} alt="User upload" width={300} height={300} className="rounded-md max-w-full h-auto" />
                                            </div>
                                          )}
                                          {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
                                      </div>
                                      {message.role === 'user' && <Avatar className="h-9 w-9 border"><AvatarFallback>{userProfile?.name?.slice(0,2).toUpperCase() || <User />}</AvatarFallback></Avatar>}
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
                    </div>
                </ScrollArea>
                <div className="border-t p-4 bg-background">
                  <div>
                    {imagePreview && (
                        <div className="relative mb-2 w-24">
                            <Image src={imagePreview} alt="Image preview" width={80} height={80} className="rounded-md object-cover aspect-square" />
                            <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={handleRemoveImage}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    <form onSubmit={handleSendMessage} ref={formRef} className="flex items-start gap-2">
                        <Button variant="ghost" size="icon" asChild className="shrink-0">
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <Paperclip className="h-5 w-5" />
                            <span className="sr-only">Attach file</span>
                          </label>
                        </Button>
                        <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isSending || isUserLoading || !user || isRecording || isTranscribing} />
                        <Textarea
                            ref={textAreaRef}
                            name="message"
                            placeholder={placeholderText}
                            className="flex-1 resize-none bg-background"
                            rows={1}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isSending || isUserLoading || !user || isRecording || isTranscribing}
                        />
                        <Button variant="ghost" size="icon" type="button" onClick={handleToggleRecording} disabled={isSending || isUserLoading || !user || isTranscribing} className={cn("shrink-0", isRecording && "text-red-500 animate-pulse")}>
                            {isTranscribing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
                            <span className="sr-only">Use voice</span>
                        </Button>
                        <SubmitButton isSending={isSending} />
                    </form>
                  </div>
                </div>
            </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
