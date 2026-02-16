'use client';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ArrowRight, Loader2, BookOpen } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, Timestamp } from 'firebase/firestore';

interface LearningTrack {
  id: string;
  title: string;
  slug: string;
  description: string;
  order?: number;
}

const slugify = (text: string) => {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

export default function LearnPage() {
  const firestore = useFirestore();
  
  const tracksQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'learning_tracks')) : null,
    [firestore]
  );
  
  const { data: tracks, isLoading } = useCollection<LearningTrack>(tracksQuery);
  
  // Sort tracks by order field if available, otherwise by title
  const sortedTracks = tracks ? [...tracks].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    return a.title.localeCompare(b.title);
  }) : [];

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Learning Tracks</CardTitle>
          <CardDescription>Every lesson is available in multiple formats for accessibility.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          {!isLoading && sortedTracks.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {sortedTracks.map(track => (
                <Link key={track.id} href={`/learn/${track.slug || slugify(track.title)}`} passHref>
                  <Card className="hover:bg-muted/50 transition-colors h-full">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{track.title}</CardTitle>
                        <CardDescription className="mt-1">{track.description}</CardDescription>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
          {!isLoading && sortedTracks.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed border-muted-foreground/30 rounded-lg">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold text-card-foreground mt-4">No learning tracks yet</h3>
              <p className="text-muted-foreground mt-2">Check back soon for new learning content!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
    