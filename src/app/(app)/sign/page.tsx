'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Video, Loader2, Pause, BookText, Send, Hand } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import { interpretSignLanguage } from '@/ai/flows/interpret-sign-language';
import { generateSignCardsFromText } from '@/ai/flows/generate-sign-cards-from-text';


function InterpretClipTab() {
  const { toast } = useToast();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedClip, setRecordedClip] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);

  const getCameraPermission = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        variant: "destructive",
        title: "Camera Not Supported",
        description: "Your browser does not support camera access.",
      });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.error("Video play failed", e));
      }
      return stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings to use this app.',
      });
    }
  }, [toast]);
  
  useEffect(() => {
      getCameraPermission();
      return () => {
          stopCameraStream();
      }
  }, [getCameraPermission]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    stopCameraStream();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(time => {
          const newTime = time + 1;
          if (newTime >= 6) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, stopRecording]);

  const stopCameraStream = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
  };

  const blobToDataUri = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  const handleTranslation = async (clipBlob: Blob) => {
    setIsTranslating(true);
    setTranslatedText(null);
    try {
        const videoDataUri = await blobToDataUri(clipBlob);
        const result = await interpretSignLanguage({ videoDataUri });
        setTranslatedText(result.text);
    } catch(error) {
        console.error("Error interpreting sign language:", error);
        toast({
          variant: 'destructive',
          title: 'Translation Failed',
          description: 'Could not interpret the sign language clip.',
        });
        setTranslatedText("We couldn't translate this clip. Please try again.");
    } finally {
        setIsTranslating(false);
    }
  }

  const startRecording = async () => {
    setRecordedClip(null);
    setTranslatedText(null);
    const stream = await getCameraPermission();
    if (stream && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

      setIsRecording(true);
      setRecordingTime(0);
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedClip(url);
        handleTranslation(blob);
      };
      recorder.start();
    }
  };
  
  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          setRecordedClip(URL.createObjectURL(file));
          setTranslatedText(null);
          handleTranslation(file);
      }
  }

  return (
    <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Interpret Clip</CardTitle>
          <CardDescription>Record or upload a short sign language clip to translate it into text.</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
            <div className="w-full aspect-video bg-muted/50 rounded-lg flex items-center justify-center overflow-hidden">
                {recordedClip ? (
                    <video src={recordedClip} controls autoPlay className="w-full h-full object-cover" />
                ) : (
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline/>
                )}
                {!recordedClip && !hasCameraPermission && <Camera className="h-16 w-16 text-muted-foreground absolute" />}
            </div>
            
            {hasCameraPermission === false && (
                <Alert variant="destructive">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>Please allow camera access to use this feature.</AlertDescription>
                </Alert>
            )}
            
            {isRecording && (
                <div className='space-y-2'>
                    <Progress value={(recordingTime / 6) * 100} className="w-full" />
                    <p className='text-sm text-muted-foreground'>Recording... ({recordingTime}s / 6s)</p>
                </div>
            )}

            {isTranslating && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <p>Translating clip...</p>
                </div>
            )}

            {translatedText && (
                <Card className="text-left">
                    <CardHeader>
                        <CardTitle>Translation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{translatedText}</p>
                    </CardContent>
                </Card>
            )}

            <div className="flex gap-4 justify-center">
                {isRecording ? (
                    <Button size="lg" onClick={stopRecording} variant="destructive">
                    <Pause className="mr-2 h-5 w-5" /> Stop Recording
                    </Button>
                ) : (
                    <Button size="lg" onClick={startRecording} disabled={!hasCameraPermission || isTranslating}>
                    <Video className="mr-2 h-5 w-5" /> Start Recording
                    </Button>
                )}

                <Button asChild size="lg" variant="secondary" disabled={isRecording || isTranslating}>
                <label>
                    <Upload className="mr-2 h-5 w-5" /> Upload Clip
                    <input type="file" accept="video/*" className="sr-only" onChange={handleUpload}/>
                </label>
                </Button>
            </div>
            <p className="text-muted-foreground text-sm">Position yourself in the frame and record a 3-6 second clip.</p>
        </CardContent>
    </Card>
  )
}

function TextToSignTab() {
  const { toast } = useToast();
  const [inputText, setInputText] = useState('');
  const [signCards, setSignCards] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateCards = async () => {
    if (!inputText.trim()) {
      toast({ variant: 'destructive', title: 'Input Required', description: 'Please enter some text to translate.' });
      return;
    }

    setIsLoading(true);
    setSignCards(null);

    try {
      const result = await generateSignCardsFromText({ text: inputText });
      setSignCards(result.signCards);
    } catch (error) {
      console.error("Error generating sign cards:", error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Could not generate sign cards for the provided text.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Text to Sign Cards</CardTitle>
          <CardDescription>Enter text below to generate a series of sign language concept cards.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter text to translate..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={4}
            disabled={isLoading}
          />
          <Button onClick={handleGenerateCards} disabled={isLoading || !inputText.trim()}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Generate Cards
          </Button>

          {isLoading && (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {signCards && (
            <div>
              <h3 className="text-lg font-semibold my-4">Generated Sign Cards</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {signCards.map((cardText, index) => (
                  <Card key={index} className="aspect-square flex flex-col items-center justify-center p-4 text-center">
                      <Hand className="h-8 w-8 mb-2 text-primary" />
                      <p className="font-semibold">{cardText}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
  )
}


export default function SignPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Sign Language Tools</CardTitle>
          <CardDescription>Translate between sign language clips and text.</CardDescription>
        </CardHeader>
        <CardContent>
           <Tabs defaultValue="interpret" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto">
              <TabsTrigger value="interpret" className="py-3 text-sm"><Video className="mr-2" /> Interpret Clip</TabsTrigger>
              <TabsTrigger value="text-to-sign" className="py-3 text-sm"><BookText className="mr-2" /> Text to Sign</TabsTrigger>
            </TabsList>
            <TabsContent value="interpret">
                <InterpretClipTab />
            </TabsContent>
            <TabsContent value="text-to-sign">
                <TextToSignTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
