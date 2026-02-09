'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { sendMessage, type ChatState } from './actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Mic, Paperclip, Loader2, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const initialState: ChatState = {
  messages: [],
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="icon" disabled={pending} aria-label="Send message">
      {pending ? <Loader2 className="animate-spin" /> : <Send />}
    </Button>
  );
}

export default function HomePage() {
  const [state, formAction, isPending] = useActionState(sendMessage, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [state.messages]);

  // Reset form after submission
  useEffect(() => {
    if (!isPending && state.messages.length > 0) {
      formRef.current?.reset();
      textAreaRef.current?.focus();
    }
  }, [isPending, state.messages]);
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <div className="container mx-auto h-[calc(100vh-8rem)] flex flex-col p-0 md:p-8">
      <div className="flex-1 flex flex-col bg-card border rounded-lg shadow-lg overflow-hidden">
        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          <div className="space-y-6">
            {state.messages.length === 0 && !isPending && (
              <div className="text-center text-muted-foreground pt-16">
                  <Bot className="mx-auto h-12 w-12" />
                  <h2 className="text-2xl font-semibold mt-4">Welcome to your AI Assistant</h2>
                  <p className="mt-2">Start a conversation by typing a message below.</p>
              </div>
            )}

            {state.messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-4',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'model' && (
                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback><Bot /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-md lg:max-w-2xl rounded-lg px-4 py-3 text-card-foreground shadow',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                 {message.role === 'user' && (
                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback><User /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isPending && state.messages[state.messages.length - 1]?.role === 'user' && (
                <div className="flex items-start gap-4 justify-start">
                    <Avatar className="h-9 w-9 border">
                        <AvatarFallback><Bot /></AvatarFallback>
                    </Avatar>
                    <div className="max-w-md lg:max-w-2xl rounded-lg px-4 py-3 bg-muted shadow flex items-center space-x-2">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span className="text-muted-foreground text-sm">Thinking...</span>
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-card border-t">
          {state.error && <p className="text-destructive text-sm mb-2">{state.error}</p>}
          <form action={formAction} ref={formRef} className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground" disabled>
              <Paperclip />
              <span className="sr-only">Attach file</span>
            </Button>
            <Textarea
              ref={textAreaRef}
              name="message"
              placeholder="Type your message here..."
              className="flex-1 resize-none bg-background"
              rows={1}
              onKeyDown={handleKeyDown}
              disabled={isPending}
            />
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground" disabled>
              <Mic />
              <span className="sr-only">Use voice</span>
            </Button>
            <SubmitButton />
          </form>
        </div>
      </div>
    </div>
  );
}
