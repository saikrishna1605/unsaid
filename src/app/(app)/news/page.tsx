'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Headphones, Book, List, Hand, Loader2 } from 'lucide-react';
import {
  summarizeArticleWithSignCards,
  type SummarizeArticleWithSignCardsOutput,
} from '@/ai/flows/summarize-article-with-sign-cards';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

// A mock article for demonstration
const article = {
  title: 'Major Breakthrough in Renewable Energy Technology Announced',
  imageUrl: 'https://picsum.photos/seed/1/1200/800',
  imageHint: 'abstract technology',
  content: `Scientists have announced a significant breakthrough in renewable energy storage, potentially revolutionizing how we power our world. The new technology, based on a novel crystalline material, can store solar and wind energy with unprecedented efficiency, boasting a 95% energy return rate. This development addresses the critical issue of intermittency in renewable sources, ensuring a stable power supply even when the sun isn't shining or the wind isn't blowing. Experts believe this could accelerate the global transition away from fossil fuels by making green energy more reliable and cost-effective than ever before. The research team is now working on scaling up production for commercial use, with pilot projects expected within the next two years.`
};

type ModalContent = {
  type: 'audio' | 'easyRead' | 'keyFacts' | 'signCards';
  title: string;
} | null;

export default function NewsPage() {
  const { toast } = useToast();
  const [summaryData, setSummaryData] = useState<SummarizeArticleWithSignCardsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalContent, setModalContent] = useState<ModalContent>(null);
  
  useEffect(() => {
    const getSummary = async () => {
      setIsLoading(true);
      try {
        const result = await summarizeArticleWithSignCards({ articleText: article.content });
        setSummaryData(result);
      } catch (error) {
        console.error('Error summarizing article:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load the news summary. Please try again later.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    getSummary();
  }, [toast]);

  const renderModalContent = () => {
    if (!modalContent || !summaryData) return null;

    switch (modalContent.type) {
      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <Headphones className="h-16 w-16 text-primary" />
            <p>Playing audio summary...</p>
            <audio controls autoPlay src={summaryData.audioSummary} className="w-full">
              Your browser does not support the audio element.
            </audio>
          </div>
        );
      case 'easyRead':
        return (
          <ul className="list-disc space-y-2 pl-6 py-4">
            {summaryData.easyReadBullets.map((bullet, i) => <li key={i}>{bullet}</li>)}
          </ul>
        );
      case 'keyFacts':
        return (
          <ul className="list-disc space-y-2 pl-6 py-4">
            {summaryData.keyFacts.map((fact, i) => <li key={i}>{fact}</li>)}
          </ul>
        );
      case 'signCards':
        return (
          <div className="grid grid-cols-2 gap-4 py-4">
            {summaryData.signCards.map((card, i) => (
              <Card key={i} className="p-4 flex items-center justify-center text-center">
                <p className="font-semibold">{card}</p>
              </Card>
            ))}
          </div>
        );
    }
  };

  const buttonMap: { type: NonNullable<ModalContent>['type'], icon: React.ElementType, label: string }[] = [
      { type: 'audio', icon: Headphones, label: 'Audio Summary' },
      { type: 'easyRead', icon: Book, label: 'Easy Read' },
      { type: 'keyFacts', icon: List, label: 'Key Facts' },
      { type: 'signCards', icon: Hand, label: 'Sign Cards' },
  ]

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 md:p-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-3xl font-headline">Today's News, Made Clear</CardTitle>
            <CardDescription>One article, presented in multiple ways for you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative w-full h-64 rounded-lg overflow-hidden">
              <Image
                src={article.imageUrl}
                alt={article.title}
                data-ai-hint={article.imageHint}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                <h2 className="text-2xl font-bold text-white">{article.title}</h2>
              </div>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              {buttonMap.map(({ type, icon: Icon, label }) => (
                <Button
                  key={type}
                  variant="outline"
                  className="h-20 flex-col gap-1"
                  onClick={() => setModalContent({ type, title: label })}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin"/> : <Icon className="h-5 w-5"/>}
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog open={!!modalContent} onOpenChange={(open) => !open && setModalContent(null)}>
        <DialogContent className="max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{modalContent?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="pr-6">
              {renderModalContent()}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
