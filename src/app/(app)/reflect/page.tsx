'use client';

import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mic, Sparkles, Wind, Send, StopCircle } from 'lucide-react';
import { dailyReflection } from '@/ai/flows/daily-reflection-ai';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { useToast } from '@/hooks/use-toast';

export default function ReflectPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [reflection, setReflection] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');

    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleReflection = async (input: string) => {
        if (!input.trim()) {
            toast({ variant: 'destructive', title: 'Input needed', description: 'Please provide something to reflect on.'});
            return;
        }
        setIsLoading(true);
        setReflection(null);

        try {
            const result = await dailyReflection({ input });
            setReflection(result.reflection);
        } catch (error) {
            console.error('Error generating reflection:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not generate a reflection. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRecordStop = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

    const handleRecordStart = async () => {
        setReflection(null);
        setInputText('');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setIsRecording(true);

            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                
                if (audioBlob.size === 0) {
                    console.warn("No audio recorded.");
                    return;
                }

                setIsTranscribing(true);
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const audioDataUri = reader.result as string;
                    try {
                        const { text } = await transcribeAudio({ audioDataUri });
                        setInputText(text); // Show transcribed text
                        await handleReflection(`A user recorded a voice note. The transcription is: "${text}"`);
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
    
    const anyLoading = isLoading || isTranscribing;

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-3xl font-headline flex items-center gap-2">
                        <Sparkles className="h-8 w-8 text-yellow-400"/>
                        Daily Reflection
                    </CardTitle>
                    <CardDescription>
                        A quiet space to check in with yourself. Share a word, a thought, or simply embrace the silence.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Textarea 
                            placeholder={isRecording ? "Recording your thoughts..." : (isTranscribing ? "Transcribing..." : "How are you feeling today?")}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            rows={3}
                            disabled={anyLoading || isRecording}
                        />
                        <div className="flex flex-wrap gap-2">
                            <Button 
                                onClick={() => handleReflection(inputText)}
                                disabled={anyLoading || isRecording || !inputText.trim()}
                            >
                                <Send className="mr-2 h-4 w-4"/>
                                Reflect on my words
                            </Button>
                            <Button 
                                variant="secondary"
                                onClick={() => handleReflection('The user chose to share a moment of silence.')}
                                disabled={anyLoading || isRecording}
                            >
                                <Wind className="mr-2 h-4 w-4"/>
                                Share silence
                            </Button>
                             {isRecording ? (
                                <Button 
                                    variant="secondary"
                                    onClick={handleRecordStop}
                                    className="text-red-500"
                                >
                                    <StopCircle className="mr-2 h-4 w-4"/>
                                    Stop Recording
                                </Button>
                             ) : (
                                <Button 
                                    variant="secondary"
                                    onClick={handleRecordStart}
                                    disabled={anyLoading}
                                >
                                    {isTranscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Mic className="mr-2 h-4 w-4"/>}
                                    {isTranscribing ? 'Processing...' : 'Record a feeling'}
                                </Button>
                             )}
                        </div>
                    </div>

                    {anyLoading && !isRecording && (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p className="ml-4 text-muted-foreground">
                                {isTranscribing ? 'Transcribing your voice...' : 'Generating a thoughtful reflection...'}
                            </p>
                        </div>
                    )}
                    
                    {reflection && !anyLoading && (
                        <Card className="bg-muted/50">
                            <CardHeader>
                                <CardTitle className="text-lg">A Moment's Reflection</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap leading-relaxed">{reflection}</p>
                            </CardContent>
                        </Card>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
