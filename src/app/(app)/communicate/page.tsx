'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Coffee,
  Apple,
  Smile,
  Frown,
  Bed,
  Home,
  Sun,
  Moon,
  Volume2,
  Mic,
  Eye,
  Camera,
  Bot
} from 'lucide-react';

const aacItems = [
  { icon: Coffee, label: 'Drink' },
  { icon: Apple, label: 'Eat' },
  { icon: Smile, label: 'Happy' },
  { icon: Frown, label: 'Sad' },
  { icon: Bed, label: 'Tired' },
  { icon: Home, label: 'Home' },
  { icon: Sun, label: 'Day' },
  { icon: Moon, label: 'Night' },
];

function AACTab() {
  const [text, setText] = useState('');

  const handleTap = (label: string) => {
    setText((prev) => (prev ? `${prev} ${label}` : label));
  };
  
  const handleSpeak = () => {
    if (typeof window !== 'undefined' && text) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle>AAC Mode</CardTitle>
        <CardDescription>Tap icons to build sentences. Press speak to say it out loud.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Textarea value={text} readOnly className="bg-card text-lg p-4 pr-16" placeholder="Your sentence will appear here..."/>
          <Button size="icon" className="absolute top-3 right-3" onClick={handleSpeak} aria-label="Speak">
            <Volume2 />
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {aacItems.map(({ icon: Icon, label }) => (
            <Button
              key={label}
              variant="outline"
              className="h-24 flex-col gap-2 text-lg"
              onClick={() => handleTap(label)}
            >
              <Icon className="h-8 w-8" />
              {label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DeafHoHTab() {
  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle>Live Captions</CardTitle>
        <CardDescription>Real-time speech-to-text with speaker labels.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="w-full h-64 rounded-lg bg-muted/50 p-4 flex flex-col justify-between">
            <div className='space-y-2 text-card-foreground'>
                <p><strong className='text-primary'>Speaker A:</strong> Hello, how are you doing today?</p>
                <p><strong className='text-accent-foreground/80'>Speaker B:</strong> I'm doing well, thank you! Just enjoying the quiet.</p>
            </div>
            <p className='text-muted-foreground text-sm text-center'>Tap "Start Listening" to begin transcribing.</p>
        </div>
        <Button className="w-full" size="lg">
          <Mic className="mr-2 h-4 w-4" /> Start Listening
        </Button>
      </CardContent>
    </Card>
  );
}

function BlindLVTab() {
  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle>Audio Assistance</CardTitle>
        <CardDescription>Tools for low-vision and blind users.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Button variant="secondary" className="w-full h-24 text-lg">
          <Camera className="mr-4 h-6 w-6" /> Read with Camera
        </Button>
        <Button variant="secondary" className="w-full h-24 text-lg">
          <Bot className="mr-4 h-6 w-6" /> Explain Simply
        </Button>
      </CardContent>
    </Card>
  );
}

export default function CommunicatePage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <Tabs defaultValue="aac" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="aac" className="py-3 text-sm">AAC</TabsTrigger>
          <TabsTrigger value="deaf-hoh" className="py-3 text-sm">Deaf/HoH</TabsTrigger>
          <TabsTrigger value="blind-lv" className="py-3 text-sm">Blind/LV</TabsTrigger>
        </TabsList>
        <TabsContent value="aac">
          <AACTab />
        </TabsContent>
        <TabsContent value="deaf-hoh">
          <DeafHoHTab />
        </TabsContent>
        <TabsContent value="blind-lv">
          <BlindLVTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
