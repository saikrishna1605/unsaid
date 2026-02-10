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
        <CardContent className="grid gap-6">
          {articles.map((article) => (
            <Link key={article.id} href={`/news/${article.id}`} passHref>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex flex-col md:flex-row">
                  <div className="relative h-48 md:h-auto md:w-1/3">
                    <Image
                      src={article.imageUrl}
                      alt={article.title}
                      data-ai-hint={article.imageHint}
                      fill
                      className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                    />
                  </div>
                  <div className="flex-1 p-6">
                    <h3 className="text-xl font-bold mb-2">{article.title}</h3>
                    <p className="text-muted-foreground line-clamp-3">{article.content}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
