'use client';

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PenSquare, MessageCircle, Heart, Loader2 } from 'lucide-react';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  useUser,
  errorEmitter,
  FirestorePermissionError,
} from '@/firebase';
import {
  collection,
  query,
  orderBy,
  Timestamp,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Post {
  id: string;
  userId: string;
  rawContent: string;
  createdAt: Timestamp;
}

function PostCard({ post }: { post: Post }) {
  return (
    <Card>
      <CardHeader className="flex-row gap-4 items-center">
        <Avatar>
          <AvatarFallback>{post.userId.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg">User {post.userId.slice(0, 6)}</CardTitle>
          <CardDescription>
            {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{post.rawContent}</p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="ghost" size="sm">
          <Heart className="mr-2 h-4 w-4" /> Like
        </Button>
        <Button variant="ghost" size="sm">
          <MessageCircle className="mr-2 h-4 w-4" /> Comment
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function CommunityPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const postsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'posts'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );
  const { data: posts, isLoading } = useCollection<Post>(postsQuery);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !postContent.trim() || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to create a post.',
      });
      return;
    }
    setIsPosting(true);

    const newPost = {
      userId: user.uid,
      rawContent: postContent,
      createdAt: serverTimestamp(),
    };

    const postsCollection = collection(firestore, 'posts');

    addDoc(postsCollection, newPost)
      .then(() => {
        toast({
          title: 'Post Created!',
          description: 'Your post is now live in the community.',
        });
        setPostContent('');
        setIsDialogOpen(false);
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: postsCollection.path,
          operation: 'create',
          requestResourceData: newPost,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsPosting(false);
      });
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Community</CardTitle>
          <CardDescription>Share, connect, and find support.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto" disabled={!user}>
                <PenSquare className="mr-2 h-4 w-4" /> Create Post
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new post</DialogTitle>
                <DialogDescription>
                  Share your thoughts with the community. What's on your mind?
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePost}>
                <div className="grid gap-4 py-4">
                  <Textarea
                    placeholder="Type your message here..."
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    rows={6}
                    disabled={isPosting}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isPosting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPosting || !postContent.trim()}>
                    {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Post
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {isLoading && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          {!isLoading && posts && posts.length > 0 && (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {!isLoading && (!posts || posts.length === 0) && (
            <div className="text-center py-16 border-2 border-dashed border-muted-foreground/30 rounded-lg">
              <h3 className="text-xl font-semibold text-card-foreground">
                The community feed is quiet right now
              </h3>
              <p className="text-muted-foreground mt-2">Be the first to share something!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
