'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Speaker, Mic, MessageSquare, Hand } from 'lucide-react';

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically save user preferences
    router.push('/home');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center">Welcome to Unsaid/Unheard</CardTitle>
          <CardDescription className="text-center pt-2">Let's get you set up. Your preferences help us make your experience better.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">What should we call you?</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-card"
              />
            </div>
            <div className="space-y-4">
              <Label>Choose your primary way to communicate</Label>
              <RadioGroup defaultValue="speak" className="grid grid-cols-2 gap-4">
                <div>
                  <RadioGroupItem value="speak" id="r1" className="peer sr-only" />
                  <Label htmlFor="r1" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <Speaker className="mb-3 h-6 w-6" />
                    Speak
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="type" id="r2" className="peer sr-only" />
                  <Label htmlFor="r2" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <MessageSquare className="mb-3 h-6 w-6" />
                    Type
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="voice" id="r3" className="peer sr-only" />
                  <Label htmlFor="r3" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <Mic className="mb-3 h-6 w-6" />
                    Voice
                  </Label>
                </div>
                 <div>
                  <RadioGroupItem value="sign" id="r4" className="peer sr-only" />
                  <Label htmlFor="r4" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <Hand className="mb-3 h-6 w-6" />
                    Sign
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" size="lg">Get Started</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
