'use client';

import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BookOpen, Loader2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, Timestamp, doc } from 'firebase/firestore';
import Link from 'next/link';

interface Lesson {
    id: string;
    title: string;
    track: string;
    trackSlug?: string;
    text: string;
}

interface LearningTrack {
    id: string;
    title: string;
    slug: string;
    description: string;
}

export default function TrackPage() {
    const params = useParams();
    const trackSlug = params.track as string;
    const firestore = useFirestore();

    // Fetch track info by slug
    const trackQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'learning_tracks'), where('slug', '==', trackSlug)) : null,
        [firestore, trackSlug]
    );
    const { data: trackData, isLoading: isTrackLoading } = useCollection<LearningTrack>(trackQuery);
    const track = trackData && trackData.length > 0 ? trackData[0] : null;

    // Fetch lessons for this track (parallel with track query)
    const lessonsQuery = useMemoFirebase(
        () => firestore ? query(
            collection(firestore, 'lessons'), 
            where('trackSlug', '==', trackSlug)
        ) : null,
        [firestore, trackSlug]
    );
    const { data: lessons, isLoading: isLessonsLoading } = useCollection<Lesson>(lessonsQuery);

    const isLoading = isTrackLoading || isLessonsLoading;

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            <Card>
                <CardHeader>
                    <Link href="/learn" className="text-sm text-muted-foreground hover:underline mb-2">
                        &larr; Back to Learning Tracks
                    </Link>
                    <CardTitle className="text-3xl font-headline">
                        {track?.title || 'Learning Track'}
                    </CardTitle>
                    <CardDescription>
                        {track?.description || 'Lessons to help you build your skills.'}
                    </CardDescription>
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
                            <p className="text-muted-foreground mt-2">
                                Check back soon for new content in the {track?.title || 'learning track'}!
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
    