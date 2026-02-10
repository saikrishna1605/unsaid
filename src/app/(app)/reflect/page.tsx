'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mic, Sparkles, Wind, Send } from 'lucide-react';
import { dailyReflection } from '@/ai/flows/daily-reflection-ai';
import { useToast } from '@/hooks/use-toast';

export default function ReflectPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [reflection, setReflection] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');

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
                            placeholder="How are you feeling today?"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            rows={3}
                            disabled={isLoading}
                        />
                        <div className="flex flex-wrap gap-2">
                            <Button 
                                onClick={() => handleReflection(inputText)}
                                disabled={isLoading || !inputText.trim()}
                            >
                                <Send className="mr-2 h-4 w-4"/>
                                Reflect on my words
                            </Button>
                            <Button 
                                variant="secondary"
                                onClick={() => handleReflection('The user chose to share a moment of silence.')}
                                disabled={isLoading}
                            >
                                <Wind className="mr-2 h-4 w-4"/>
                                Share silence
                            </Button>
                             <Button 
                                variant="secondary"
                                disabled={true}
                            >
                                <Mic className="mr-2 h-4 w-4"/>
                                Record a feeling (coming soon)
                            </Button>
                        </div>
                    </div>

                    {isLoading && (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p className="ml-4 text-muted-foreground">Generating a thoughtful reflection...</p>
                        </div>
                    )}
                    
                    {reflection && (
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
