'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mic, Sparkles, Wind, Send, StopCircle, Smile, Frown, Meh, Music } from 'lucide-react';
import { dailyReflection } from '@/ai/flows/daily-reflection-ai';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const moodOptions = [
    { value: 'positive', label: 'Positive', icon: Smile, color: 'text-green-500' },
    { value: 'neutral', label: 'Neutral', icon: Meh, color: 'text-yellow-500' },
    { value: 'negative', label: 'Challenging', icon: Frown, color: 'text-blue-500' },
];

// Music/soundscape recommendations based on mood
const moodRecommendations: Record<string, { title: string; description: string; url: string }[]> = {
    positive: [
        { title: 'Uplifting Melody', description: 'Bright and energetic tunes', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk' },
        { title: 'Nature Sounds', description: 'Birds chirping in the morning', url: 'https://www.youtube.com/watch?v=eKFTSSKCzWA' },
    ],
    neutral: [
        { title: 'Peaceful Piano', description: 'Gentle instrumental music', url: 'https://www.youtube.com/watch?v=lTRiuFIWV54' },
        { title: 'Ocean Waves', description: 'Calming beach ambience', url: 'https://www.youtube.com/watch?v=V1bFr2SWP1I' },
    ],
    negative: [
        { title: 'Calming Rain', description: 'Soothing rainfall sounds', url: 'https://www.youtube.com/watch?v=q76bMs-NwRk' },
        { title: 'Meditation Music', description: 'Peaceful and grounding', url: 'https://www.youtube.com/watch?v=lFcSrYw-ARY' },
    ],
};

export default function ReflectPage() {
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();
    
    const [isLoading, setIsLoading] = useState(false);
    const [reflection, setReflection] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [showMusicRecommendations, setShowMusicRecommendations] = useState(false);

    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Save mood to Firebase
    const saveMood = async (mood: string, reflectionText: string) => {
        if (!user || !firestore) return;
        
        try {
            // Use auto-generated ID to avoid race conditions
            const moodRef = doc(collection(firestore, 'users', user.uid, 'mood_history'));
            await setDoc(moodRef, {
                mood: mood,
                input: inputText,
                reflection: reflectionText,
                timestamp: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error saving mood:', error);
        }
    };

    const handleReflection = async (input: string, mood?: string) => {
        if (!input.trim()) {
            toast({ variant: 'destructive', title: 'Input needed', description: 'Please provide something to reflect on.'});
            return;
        }
        setIsLoading(true);
        setReflection(null);
        setShowMusicRecommendations(false);

        try {
            const result = await dailyReflection({ input });
            setReflection(result.reflection);
            
            // Save mood if provided
            if (mood || selectedMood) {
                await saveMood(mood || selectedMood || 'neutral', result.reflection);
                setShowMusicRecommendations(true);
            }
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
                    {/* Mood Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">How are you feeling today?</label>
                        <div className="flex gap-2">
                            {moodOptions.map((mood) => {
                                const Icon = mood.icon;
                                return (
                                    <Button
                                        key={mood.value}
                                        variant={selectedMood === mood.value ? 'default' : 'outline'}
                                        onClick={() => setSelectedMood(mood.value)}
                                        disabled={anyLoading || isRecording}
                                        className={cn('flex-1', selectedMood === mood.value && 'ring-2 ring-offset-2')}
                                    >
                                        <Icon className={cn('mr-2 h-4 w-4', mood.color)} />
                                        {mood.label}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

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
                                onClick={() => handleReflection('The user chose to share a moment of silence.', selectedMood || 'neutral')}
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

                    {/* Music/Soundscape Recommendations */}
                    {showMusicRecommendations && selectedMood && moodRecommendations[selectedMood] && (
                        <Card className="bg-primary/5">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Music className="h-5 w-5" />
                                    Recommended for You
                                </CardTitle>
                                <CardDescription>
                                    Based on your current mood, here are some soundscapes that might help.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {moodRecommendations[selectedMood].map((rec, idx) => (
                                    <a 
                                        key={idx}
                                        href={rec.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                                    >
                                        <div className="font-medium">{rec.title}</div>
                                        <div className="text-sm text-muted-foreground">{rec.description}</div>
                                    </a>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
