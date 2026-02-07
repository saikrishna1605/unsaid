'use client';

import { useFormStatus } from 'react-dom';
import { getReflection } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState, useRef, useActionState } from 'react';
import { Mic, Hand, Moon, Send, Loader2, Sparkles } from 'lucide-react';

const initialState = {
  reflection: '',
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="icon" disabled={pending} aria-label="Send">
      {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
    </Button>
  );
}

export default function HomePage() {
  const [state, formAction] = useActionState(getReflection, initialState);
  const [inputMode, setInputMode] = useState<'text' | 'voice' | 'sign' | 'silence' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.reflection || state.error) {
      setInputValue('');
      setInputMode(null);
      formRef.current?.reset();
    }
  }, [state]);

  const handleModeSelect = (mode: 'text' | 'voice' | 'sign' | 'silence') => {
    setInputMode(mode);
    setInputValue(mode === 'silence' ? 'silence' : '');
    if (mode === 'silence') {
      // Use a timeout to ensure React has time to re-render with the hidden input
      setTimeout(() => {
        formRef.current?.requestSubmit();
      }, 0);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center justify-center space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-headline font-bold text-foreground">
            How are you today?
          </h1>
          <p className="text-lg text-foreground/80 mt-2">
            One word. A sound. A sign. Or just silence. All are welcome.
          </p>
        </header>

        <Card className="w-full max-w-2xl shadow-xl">
          <form action={formAction} ref={formRef}>
            <CardContent className="p-6">
              <div className="flex items-center justify-around gap-2 mb-6">
                <Button type="button" variant={inputMode === 'text' ? 'secondary' : 'ghost'} onClick={() => handleModeSelect('text')} className="flex-1 flex-col h-20">
                  <span className="text-xl">A</span>
                  <span>Word</span>
                </Button>
                <Button type="button" variant={inputMode === 'voice' ? 'secondary' : 'ghost'} onClick={() => handleModeSelect('voice')} className="flex-1 flex-col h-20">
                  <Mic className="h-6 w-6" />
                  <span>Voice</span>
                </Button>
                <Button type="button" variant={inputMode === 'sign' ? 'secondary' : 'ghost'} onClick={() => handleModeSelect('sign')} className="flex-1 flex-col h-20">
                  <Hand className="h-6 w-6" />
                  <span>Sign</span>
                </Button>
                <Button type="button" variant={inputMode === 'silence' ? 'secondary' : 'ghost'} onClick={() => handleModeSelect('silence')} className="flex-1 flex-col h-20">
                  <Moon className="h-6 w-6" />
                  <span>Silence</span>
                </Button>
              </div>

              {inputMode === 'silence' && <input type="hidden" name="input" value="silence" />}

              {inputMode && inputMode !== 'silence' && (
                <div className="relative">
                  <Textarea
                    name="input"
                    placeholder={
                      inputMode === 'text' ? 'Share your word...' : 
                      inputMode === 'voice' ? 'Describe your sound...' : 'Describe your sign...'
                    }
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="pr-12 bg-card"
                    rows={2}
                  />
                  <div className="absolute top-1/2 right-3 -translate-y-1/2">
                    <SubmitButton />
                  </div>
                </div>
              )}
            </CardContent>
          </form>

          {(state.reflection || state.error) && (
            <CardFooter className="flex flex-col items-start gap-4 p-6 border-t">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                <h3 className="font-semibold text-lg">A gentle reflection</h3>
              </div>
              {state.reflection && (
                <p className="text-card-foreground/90 text-base">{state.reflection}</p>
              )}
              {state.error && (
                <p className="text-destructive text-base">{state.error}</p>
              )}
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
