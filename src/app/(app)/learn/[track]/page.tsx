'use client';

import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BookOpen, Loader2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import Link from 'next/link';

interface Lesson {
    id: string;
    title: string;
    track: string;
    text: string;
}

const learningTracks: {[key: string]: string} = {
    "digital-skills": "Digital Skills",
    "communication-confidence": "Communication Confidence",
    "career-skills": "Career Skills",
    "academic-basics": "Academic Basics",
    "sign-language": "Sign Language",
    "life-skills": "Life Skills",
};

export default function TrackPage() {
    const params = useParams();
    const trackSlug = params.track as string;
    const trackTitle = learningTracks[trackSlug] || "Learning Track";

    const firestore = useFirestore();
    const lessonsQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'lessons'), where('track', '==', trackTitle)) : null,
        [firestore, trackTitle]
    );
    const { data: lessons, isLoading } = useCollection<Lesson>(lessonsQuery);

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            <Card>
                <CardHeader>
                    <Link href="/learn" className="text-sm text-muted-foreground hover:underline mb-2">
                        &larr; Back to Learning Tracks
                    </Link>
                    <CardTitle className="text-3xl font-headline">{trackTitle}</CardTitle>
                    <CardDescription>Lessons to help you build your skills.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && (
                        <div className="flex justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    )}
                    {!isLoading && lessons && lessons.length > 0 && (
                        <div className="space-y-4">
                            {lessons.map(lesson => (
                                <Link key={lesson.id} href={`/learn/${trackSlug}/${lesson.id}`}>
                                    <Card className="hover:bg-muted/50 transition-colors">
                                        <CardHeader>
                                            <CardTitle className="text-lg">{lesson.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-muted-foreground line-clamp-2">{lesson.text}</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                     {!isLoading && (!lessons || lessons.length === 0) && (
                        <div className="text-center py-16 border-2 border-dashed border-muted-foreground/30 rounded-lg">
                            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="text-xl font-semibold text-card-foreground mt-4">No lessons here yet</h3>
                            <p className="text-muted-foreground mt-2">Check back soon for new content in the {trackTitle} track!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
    