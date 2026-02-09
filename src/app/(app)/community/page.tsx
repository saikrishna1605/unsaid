'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PenSquare, MessageCircle, Heart, Loader2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: string;
  userId: string;
  rawContent: string;
  createdAt: Timestamp;
}

function PostCard({ post }: { post: Post }) {
    return (
        <Card>
            <CardHeader className='flex-row gap-4 items-center'>
                <Avatar>
                    <AvatarFallback>{post.userId.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-lg">User {post.userId.slice(0,6)}</CardTitle>
                    <CardDescription>
                        {formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true })}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <p>{post.rawContent}</p>
            </CardContent>
            <CardFooter className="gap-2">
                <Button variant="ghost" size="sm"><Heart className="mr-2 h-4 w-4" /> Like</Button>
                <Button variant="ghost" size="sm"><MessageCircle className="mr-2 h-4 w-4" /> Comment</Button>
            </CardFooter>
        </Card>
    )
}


export default function CommunityPage() {
  const firestore = useFirestore();
  const postsQuery = useMemoFirebase(
      () => firestore ? query(collection(firestore, 'posts'), orderBy('createdAt', 'desc')) : null,
      [firestore]
  )
  const { data: posts, isLoading } = useCollection<Post>(postsQuery);

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Community</CardTitle>
           <CardDescription>Share, connect, and find support.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <Button className="w-full md:w-auto">
                <PenSquare className="mr-2 h-4 w-4" /> Create Post
            </Button>
           
            {isLoading && (
                 <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            )}

            {!isLoading && posts && posts.length > 0 && (
                <div className="space-y-4">
                    {posts.map(post => <PostCard key={post.id} post={post} />)}
                </div>
            )}
            
            {!isLoading && (!posts || posts.length === 0) && (
                 <div className="text-center py-16 border-2 border-dashed border-muted-foreground/30 rounded-lg">
                    <h3 className="text-xl font-semibold text-card-foreground">The community feed is quiet right now</h3>
                    <p className="text-muted-foreground mt-2">Be the first to share something!</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
    