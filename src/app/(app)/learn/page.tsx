'use client';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

const learningTracks = [
    { title: "Digital Skills", description: "Learn to navigate the digital world." },
    { title: "Communication Confidence", description: "Build skills for effective communication." },
    { title: "Career Skills", description: "Get ready for the workplace." },
    { title: "Academic Basics", description: "Strengthen your reading and math skills." },
    { title: "Sign Language", description: "Start your journey learning to sign." },
    { title: "Life Skills", description: "Master everyday tasks and challenges." },
];

const slugify = (text: string) => {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

export default function LearnPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Learning Tracks</CardTitle>
          <CardDescription>Every lesson is available in multiple formats for accessibility.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
            {learningTracks.map(track => (
                 <Link key={track.title} href={`/learn/${slugify(track.title)}`} passHref>
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
        </CardContent>
      </Card>
    </div>
  );
}
    