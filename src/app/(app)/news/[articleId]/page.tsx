'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Headphones, Book, List, Hand, Loader2, ArrowLeft } from 'lucide-react';
import {
  summarizeArticleWithSignCards,
  type SummarizeArticleWithSignCardsOutput,
} from '@/ai/flows/summarize-article-with-sign-cards';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, Timestamp } from 'firebase/firestore';

interface NewsArticle {
  id: string;
  title: string;
  imageUrl: string;
  imageHint?: string;
  content: string;
  createdAt?: Timestamp;
}

type ModalContent = {
  type: 'audio' | 'easyRead' | 'keyFacts' | 'signCards';
  title: string;
} | null;

export default function NewsArticlePage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.articleId as string;
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const articleDocRef = useMemoFirebase(
    () => (firestore && articleId ? doc(firestore, 'news_articles', articleId) : null),
    [firestore, articleId]
  );
  const { data: article, isLoading: isArticleLoading, error } = useDoc<NewsArticle>(articleDocRef);
  
  const [summaryData, setSummaryData] = useState<SummarizeArticleWithSignCardsOutput | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [modalContent, setModalContent] = useState<ModalContent>(null);

  useEffect(() => {
    if (error || (articleDocRef && !isArticleLoading && !article)) {
      // Article not found or permission denied, redirect
      router.push('/news');
    }
  }, [error, article, isArticleLoading, router, articleDocRef]);
  
  useEffect(() => {
    if (!article) return;

    const getSummary = async () => {
      setIsLoadingSummary(true);
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
        setIsLoadingSummary(false);
      }
    };
    getSummary();
  }, [article, toast]);

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
  ];

  if (isArticleLoading) {
      return (
        <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>
      );
  }

  if (!article) {
      return null; // Will redirect in useEffect
  }

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 md:p-8">
         <Button variant="ghost" onClick={() => router.push('/news')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4"/> Back to News Feed
        </Button>
        <Card className="w-full">
          <CardContent className="space-y-6 pt-6">
            <div className="relative w-full h-80 rounded-lg overflow-hidden">
              <Image
                src={article.imageUrl}
                alt={article.title}
                data-ai-hint={article.imageHint}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                <h2 className="text-3xl font-bold text-white">{article.title}</h2>
              </div>
            </div>
            
            <p className="text-lg leading-relaxed whitespace-pre-wrap">{article.content}</p>

            <div className='pt-6 border-t'>
                <h3 className="text-xl font-semibold mb-4">Accessible Summaries</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {buttonMap.map(({ type, icon: Icon, label }) => (
                    <Button
                      key={type}
                      variant="outline"
                      className="h-20 flex-col gap-1"
                      onClick={() => setModalContent({ type, title: label })}
                      disabled={isLoadingSummary}
                    >
                      {isLoadingSummary ? <Loader2 className="h-5 w-5 animate-spin"/> : <Icon className="h-5 w-5"/>}
                      {label}
                    </Button>
                  ))}
                </div>
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
