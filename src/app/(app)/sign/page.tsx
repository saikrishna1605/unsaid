'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Video, Loader2, Play, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { interpretSignLanguage } from '@/ai/flows/interpret-sign-language';

export default function SignPage() {
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
  }, [isRecording]);

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

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    stopCameraStream();
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
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Sign Language Interpreter</CardTitle>
          <CardDescription>Translate short sign language clips into text.</CardDescription>
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
    </div>
  );
}
