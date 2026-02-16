'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { Loader2, Newspaper } from 'lucide-react';

interface NewsArticle {
  id: string;
  title: string;
  imageUrl: string;
  imageHint?: string;
  content: string;
  createdAt?: Timestamp;
}

export default function NewsListPage() {
  const firestore = useFirestore();
  
  const articlesQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'news_articles'), orderBy('createdAt', 'desc')) : null,
    [firestore]
  );
  
  const { data: articles, isLoading } = useCollection<NewsArticle>(articlesQuery);

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Today's News Feed</CardTitle>
          <CardDescription>Select an article to read and get AI-powered summaries.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          {!isLoading && articles && articles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Link key={article.id} href={`/news/${article.id}`} passHref>
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full flex flex-col">
                    <div className="relative h-48 w-full">
                        <Image
                          src={article.imageUrl}
                          alt={article.title}
                          data-ai-hint={article.imageHint || ''}
                          fill
                          className="object-cover rounded-t-lg"
                        />
                    </div>
                    <div className="flex-1 p-6 flex flex-col">
                      <h3 className="text-xl font-bold mb-2">{article.title}</h3>
                      <p className="text-muted-foreground line-clamp-4 flex-1">{article.content}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
          {!isLoading && (!articles || articles.length === 0) && (
            <div className="text-center py-16 border-2 border-dashed border-muted-foreground/30 rounded-lg">
              <Newspaper className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold text-card-foreground mt-4">No news articles yet</h3>
              <p className="text-muted-foreground mt-2">Check back soon for new articles!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
