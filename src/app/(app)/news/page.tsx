'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { articles } from '@/lib/articles';

export default function NewsListPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Today's News Feed</CardTitle>
          <CardDescription>Select an article to read and get AI-powered summaries.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link key={article.id} href={`/news/${article.id}`} passHref>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full flex flex-col">
                  <div className="relative h-48 w-full">
                      <Image
                        src={article.imageUrl}
                        alt={article.title}
                        data-ai-hint={article.imageHint}
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
        </CardContent>
      </Card>
    </div>
  );
}
