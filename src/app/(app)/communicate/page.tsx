'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Coffee, Apple, Smile, Frown, Bed, Home, Sun, Moon, Volume2, Mic, Eye, Camera, Bot, Loader2, X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { readTextFromImage } from '@/ai/flows/read-text-from-image';
import { generateEasyReadVersion } from '@/ai/flows/generate-easy-read-version';


// AAC Tab Component (mostly unchanged)
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

// Deaf/HoH Tab with Live Captions
function DeafHoHTab() {
  const [isListening, setIsListening] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check for permission status on mount
    navigator.permissions.query({ name: 'microphone' as PermissionName }).then((permissionStatus) => {
      setHasMicPermission(permissionStatus.state === 'granted');
      permissionStatus.onchange = () => {
        setHasMicPermission(permissionStatus.state === 'granted');
      };
    });
  }, []);

  const handleListen = async () => {
    if (!isListening) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // We have permission, and the stream is active.
        // In a real app, you'd connect this stream to a speech-to-text service.
        setHasMicPermission(true);
        setIsListening(true);
        // Clean up stream when user stops listening
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('Error accessing microphone:', error);
        setHasMicPermission(false);
        toast({
          variant: 'destructive',
          title: 'Microphone Access Denied',
          description: 'Please enable microphone permissions in your browser settings.',
        });
      }
    } else {
      // Logic to stop listening
      setIsListening(false);
    }
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle>Live Captions</CardTitle>
        <CardDescription>Real-time speech-to-text with speaker labels.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="w-full h-64 rounded-lg bg-muted/50 p-4 flex flex-col justify-between">
          <div className='space-y-2 text-card-foreground'>
            {isListening ? (
              <>
                <p><strong className='text-primary'>Speaker A:</strong> This is a demonstration of live captioning.</p>
                <p className="text-muted-foreground animate-pulse">Listening...</p>
              </>
            ) : (
              <>
                <p><strong className='text-primary'>Speaker A:</strong> Hello, how are you doing today?</p>
                <p><strong className='text-accent-foreground/80'>Speaker B:</strong> I'm doing well, thank you! Just enjoying the quiet.</p>
              </>
            )}
          </div>
           {!isListening && <p className='text-muted-foreground text-sm text-center'>Tap "Start Listening" to begin transcribing.</p>}
        </div>
         {hasMicPermission === false && (
          <Alert variant="destructive">
            <AlertTitle>Microphone Access Required</AlertTitle>
            <AlertDescription>
              Please allow microphone access to use this feature.
            </AlertDescription>
          </Alert>
        )}
        <Button className="w-full" size="lg" onClick={handleListen}>
          <Mic className="mr-2 h-4 w-4" /> {isListening ? 'Stop Listening' : 'Start Listening'}
        </Button>
      </CardContent>
    </Card>
  );
}

// Blind/LV Tab with Audio Assistance
function BlindLVTab() {
  const { toast } = useToast();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State for Read with Camera
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);

  // State for Explain Simply
  const [showExplainDialog, setShowExplainDialog] = useState(false);
  const [textToExplain, setTextToExplain] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainedText, setExplainedText] = useState('');

  const getCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings.',
      });
      return null;
    }
  };

  const handleReadWithCamera = async () => {
    const stream = await getCameraPermission();
    if (stream) {
      setShowCamera(true);
    }
  };
  
  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUri = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUri);
      setShowCamera(false);
      stopCameraStream();
    }
  };

  const stopCameraStream = () => {
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
      }
  }

  useEffect(() => {
    if (capturedImage) {
      const processImage = async () => {
        setIsReading(true);
        setExtractedText(null);
        try {
          const result = await readTextFromImage({ photoDataUri: capturedImage });
          setExtractedText(result.text);
        } catch (error) {
          console.error("Error reading text from image:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Could not read text from the image.' });
        } finally {
          setIsReading(false);
        }
      };
      processImage();
    }
  }, [capturedImage, toast]);

  const handleExplain = async () => {
      if (!textToExplain.trim()) return;
      setIsExplaining(true);
      setExplainedText('');
      try {
          const result = await generateEasyReadVersion({ text: textToExplain });
          setExplainedText(result.easyReadVersion);
      } catch (error) {
          console.error("Error explaining text:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Could not simplify the text.' });
      } finally {
          setIsExplaining(false);
      }
  }

  return (
    <>
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Audio Assistance</CardTitle>
          <CardDescription>Tools for low-vision and blind users.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button variant="secondary" className="w-full h-24 text-lg" onClick={handleReadWithCamera}>
            <Camera className="mr-4 h-6 w-6" /> Read with Camera
          </Button>
          <Button variant="secondary" className="w-full h-24 text-lg" onClick={() => setShowExplainDialog(true)}>
            <Bot className="mr-4 h-6 w-6" /> Explain Simply
          </Button>
        </CardContent>
      </Card>

      {/* Read with Camera Dialog */}
      <Dialog open={showCamera} onOpenChange={(open) => { if (!open) { stopCameraStream(); setShowCamera(false); } else { setShowCamera(open); }}}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Read with Camera</DialogTitle>
            <DialogDescription>Position the text in front of the camera and capture.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted />
            {hasCameraPermission === false && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>Please allow camera access to use this feature.</AlertDescription>
                </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCamera(false); stopCameraStream(); }}>Cancel</Button>
            <Button onClick={handleCapture} disabled={!hasCameraPermission}>Capture Text</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <canvas ref={canvasRef} className="hidden" />

      {/* Extracted Text Dialog */}
      <Dialog open={!!capturedImage} onOpenChange={(open) => { if (!open) { setCapturedImage(null); setExtractedText(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extracted Text</DialogTitle>
          </DialogHeader>
          {isReading && <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>}
          {extractedText && (
            <div className="space-y-4">
              <Textarea value={extractedText} readOnly rows={10} className="bg-muted"/>
              <Button onClick={() => {
                if (typeof window !== 'undefined') {
                    const utterance = new SpeechSynthesisUtterance(extractedText);
                    window.speechSynthesis.speak(utterance);
                }
              }}>
                <Volume2 className="mr-2 h-4 w-4" /> Read Aloud
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Explain Simply Dialog */}
      <Dialog open={showExplainDialog} onOpenChange={setShowExplainDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Explain Simply</DialogTitle>
                <DialogDescription>Paste text below and we'll create a simpler version.</DialogDescription>
            </DialogHeader>
            <Textarea 
                placeholder="Paste your text here..."
                rows={8}
                value={textToExplain}
                onChange={(e) => setTextToExplain(e.target.value)}
            />
            {isExplaining && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Simplifying...</div>}
            {explainedText && (
                 <div className="p-4 bg-muted rounded-md space-y-2">
                    <h4 className="font-semibold">Simplified Version:</h4>
                    <p>{explainedText}</p>
                 </div>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowExplainDialog(false)}>Cancel</Button>
                <Button onClick={handleExplain} disabled={isExplaining}>
                    {isExplaining ? <Loader2 className="h-4 w-4 animate-spin"/> : "Explain"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
