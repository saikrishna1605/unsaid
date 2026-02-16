'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, BookCheck, PartyPopper } from 'lucide-react';
import { useState } from 'react';
import { generateLessonQuiz, type GenerateLessonQuizOutput } from '@/ai/flows/generate-lesson-quiz';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';


interface Lesson {
    id: string;
    title: string;
    text: string;
    track: string;
    trackSlug?: string;
}

type Quiz = GenerateLessonQuizOutput['quiz'];

function QuizPlayer({ quiz, onFinish }: { quiz: Quiz, onFinish: (score: number, total: number) => void }) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [isAnswered, setIsAnswered] = useState(false);

    const currentQuestion = quiz[currentQuestionIndex];

    const handleAnswerSelect = (index: number) => {
        if (isAnswered) return;
        setSelectedAnswer(index);
        setIsAnswered(true);
        if (index === currentQuestion.correctAnswerIndex) {
            setScore(s => s + 1);
        }
    };

    const handleNextQuestion = () => {
        setIsAnswered(false);
        setSelectedAnswer(null);
        if (currentQuestionIndex < quiz.length - 1) {
            setCurrentQuestionIndex(i => i + 1);
        } else {
            // This is the last question, so we finish and pass the score
            onFinish(score + (selectedAnswer === currentQuestion.correctAnswerIndex ? 1 : 0), quiz.length);
        }
    };
    
    // This state indicates that the quiz itself is finished and we should show the final score.
    const isQuizFinished = currentQuestionIndex >= quiz.length;

     if (isQuizFinished) {
         return (
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Quiz Complete!</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <PartyPopper className="h-16 w-16 text-yellow-400 mx-auto"/>
                    <p className="text-xl">You scored {score} out of {quiz.length}!</p>
                </CardContent>
                <CardFooter>
                     <Button onClick={() => onFinish(score, quiz.length)} className="w-full">Back to Lesson</Button>
                </CardFooter>
            </Card>
         )
    }

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Quiz: {currentQuestion.question}</CardTitle>
                <CardDescription>Question {currentQuestionIndex + 1} of {quiz.length}</CardDescription>
                <Progress value={((currentQuestionIndex) / quiz.length) * 100} className="mt-2"/>
            </CardHeader>
            <CardContent className="space-y-4">
                {currentQuestion.options.map((option, index) => (
                    <Button
                        key={index}
                        variant="outline"
                        className={cn(
                            "w-full justify-start text-left h-auto py-3 whitespace-normal",
                             isAnswered && (
                                index === currentQuestion.correctAnswerIndex
                                    ? 'bg-green-500/20 border-green-500/50 text-foreground'
                                    : index === selectedAnswer ? 'bg-red-500/20 border-red-500/50 text-foreground' : ''
                            ),
                           'hover:bg-accent'
                        )}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={isAnswered}
                    >
                        {option}
                    </Button>
                ))}
            </CardContent>
            <CardFooter className="flex-col items-stretch space-y-2">
                {isAnswered && (
                    <div className={cn("p-4 rounded-md text-sm", currentQuestion.correctAnswerIndex === selectedAnswer ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300')}>
                        {currentQuestion.correctAnswerIndex === selectedAnswer ? 'Correct!' : 'Not quite. The correct answer was:'}
                        {currentQuestion.correctAnswerIndex !== selectedAnswer && <p className="font-bold mt-1">{currentQuestion.options[currentQuestion.correctAnswerIndex]}</p>}
                    </div>
                )}
                {isAnswered && (
                    <Button onClick={handleNextQuestion} className="w-full">
                        {currentQuestionIndex < quiz.length - 1 ? 'Next Question' : 'Finish Quiz'}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

export default function LessonPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useUser();
    
    const trackSlug = params.track as string;
    const lessonId = params.lessonId as string;

    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
    const [quiz, setQuiz] = useState<Quiz | null>(null);

    const firestore = useFirestore();
    const lessonDocRef = useMemoFirebase(
        () => (firestore && lessonId ? doc(firestore, 'lessons', lessonId) : null),
        [firestore, lessonId]
    );
    const { data: lesson, isLoading } = useDoc<Lesson>(lessonDocRef);

    // Save progress to Firebase
    const saveProgress = async (score: number, total: number) => {
        if (!user || !firestore || !lesson) return;
        
        try {
            const progressRef = doc(firestore, 'users', user.uid, 'learning_progress', lessonId);
            await setDoc(progressRef, {
                lessonId: lessonId,
                lessonTitle: lesson.title,
                track: lesson.track,
                trackSlug: lesson.trackSlug || trackSlug,
                score: score,
                totalQuestions: total,
                completedAt: serverTimestamp(),
                lastAttemptAt: serverTimestamp(),
            });
            
            toast({
                title: 'Progress Saved!',
                description: `You scored ${score} out of ${total}.`,
            });
        } catch (error) {
            console.error('Error saving progress:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not save your progress.',
            });
        }
    };

    const handleTakeQuiz = async () => {
        if (!lesson) return;
        
        setIsGeneratingQuiz(true);
        setQuiz(null);

        try {
            const result = await generateLessonQuiz({ lessonText: lesson.text });
            if (result.quiz && result.quiz.length > 0) {
                setQuiz(result.quiz);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not generate a quiz for this lesson.' });
            }
        } catch (error) {
            console.error("Error generating quiz:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred while generating the quiz.' });
        } finally {
            setIsGeneratingQuiz(false);
        }
    };

    const handleQuizFinish = async (score: number, total: number) => {
        await saveProgress(score, total);
        setQuiz(null);
    };
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>;
    }

    if (!lesson) {
        return <div className="text-center pt-16">Lesson not found.</div>;
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            <Button variant="ghost" onClick={() => router.push(`/learn/${trackSlug}`)} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4"/> Back to {lesson.track}
            </Button>
            
            {!quiz ? (
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">{lesson.title}</CardTitle>
                        <CardDescription>From the "{lesson.track}" track.</CardDescription>
                    </CardHeader>
                    <CardContent className="whitespace-pre-wrap leading-relaxed">
                        <p>{lesson.text}</p>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleTakeQuiz} disabled={isGeneratingQuiz} className="w-full md:w-auto">
                            {isGeneratingQuiz ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <BookCheck className="mr-2 h-4 w-4" />}
                            {isGeneratingQuiz ? 'Generating Quiz...' : 'Take Quiz'}
                        </Button>
                    </CardFooter>
                </Card>
            ) : (
                <QuizPlayer quiz={quiz} onFinish={handleQuizFinish} />
            )}
        </div>
    );
}
