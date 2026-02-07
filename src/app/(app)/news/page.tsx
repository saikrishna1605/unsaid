import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Headphones, Book, List, Hand } from 'lucide-react';

export default function NewsPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Today's News, Made Clear</CardTitle>
          <CardDescription>One article, presented in multiple ways for you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="relative w-full h-64 rounded-lg overflow-hidden">
                <Image
                    src="https://picsum.photos/seed/1/1200/800"
                    alt="Abstract image representing world news"
                    data-ai-hint="abstract technology"
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                    <h2 className="text-2xl font-bold text-white">Major Breakthrough in Renewable Energy Technology Announced</h2>
                </div>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <Button variant="outline" className="h-20 flex-col gap-1">
                    <Headphones className="h-5 w-5"/>
                    Audio Summary
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-1">
                    <Book className="h-5 w-5"/>
                    Easy Read
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-1">
                    <List className="h-5 w-5"/>
                    Key Facts
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-1">
                    <Hand className="h-5 w-5"/>
                    Sign Cards
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
