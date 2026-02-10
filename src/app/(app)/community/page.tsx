'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PenSquare, MessageCircle, Heart, Loader2, HandHelping, PartyPopper } from 'lucide-react';
import {
  useCollection,
  useDoc,
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
  doc,
  setDoc,
  deleteDoc,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// --- Interfaces ---
interface Post {
  id: string;
  userId: string;
  userName: string;
  rawContent: string;
  createdAt: Timestamp;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Timestamp;
}

type ReactionType = 'like' | 'support' | 'celebrate';

interface Reaction {
  id: string; // This will be the userId
  userId: string;
  type: ReactionType;
}

// --- Post Card Component ---
function PostCard({ post }: { post: Post }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Fetch current user's profile for name
  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile } = useDoc(userDocRef);

  // Fetch comments for the post (only when expanded)
  const commentsQuery = useMemoFirebase(
    () =>
      showComments && firestore
        ? query(collection(firestore, 'posts', post.id, 'comments'), orderBy('createdAt', 'asc'))
        : null,
    [firestore, post.id, showComments]
  );
  const { data: comments, isLoading: isLoadingComments } = useCollection<Comment>(commentsQuery);
  
  // Fetch all comments for count, not for display
  const allCommentsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'posts', post.id, 'comments')) : null,
    [firestore, post.id]
  );
  const { data: allComments } = useCollection<Comment>(allCommentsQuery);


  // Fetch reactions for the post
  const reactionsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'posts', post.id, 'reactions') : null),
    [firestore, post.id]
  );
  const { data: reactions } = useCollection<Reaction>(reactionsQuery);

  // Memoize computed reaction data
  const { userReaction, reactionCounts, totalReactions, totalComments } = useMemo(() => {
    const counts: Record<ReactionType, number> = { like: 0, support: 0, celebrate: 0 };
    let total = 0;
    if (reactions) {
      for (const reaction of reactions) {
        if (counts[reaction.type] !== undefined) {
          counts[reaction.type]++;
          total++;
        }
      }
    }
    return {
      userReaction: reactions?.find((r) => r.userId === user?.uid),
      reactionCounts: counts,
      totalReactions: total,
      totalComments: allComments?.length || 0,
    };
  }, [reactions, user?.uid, allComments]);

  // Handler for adding a comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || !firestore || !userProfile) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to comment.' });
      return;
    }
    setIsSubmittingComment(true);

    const commentData = {
      userId: user.uid,
      userName: userProfile.name || 'Anonymous',
      content: newComment,
      postId: post.id,
      createdAt: serverTimestamp(),
    };

    const commentsCollection = collection(firestore, 'posts', post.id, 'comments');
    addDoc(commentsCollection, commentData)
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: commentsCollection.path,
          operation: 'create',
          requestResourceData: commentData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setNewComment('');
        setIsSubmittingComment(false);
      });
  };

  // Handler for adding/removing a reaction
  const handleReaction = async (type: ReactionType) => {
    if (!user || !firestore) return;
    const reactionRef = doc(firestore, 'posts', post.id, 'reactions', user.uid);

    if (userReaction?.type === type) {
      await deleteDoc(reactionRef);
    } else {
      await setDoc(reactionRef, { userId: user.uid, type });
    }
  };
  
  const reactionIcons: Record<ReactionType, React.ElementType> = {
    like: Heart,
    support: HandHelping,
    celebrate: PartyPopper,
  };
  const DefaultReactionIcon = Heart;
  const CurrentReactionIcon = userReaction ? reactionIcons[userReaction.type] : DefaultReactionIcon;


  return (
    <Card>
      <CardHeader className="flex-row gap-4 items-center">
        <Avatar>
          <AvatarFallback>{post.userName ? post.userName.slice(0, 2).toUpperCase() : '??'}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg">{post.userName || `User ${post.userId.slice(0, 6)}`}</CardTitle>
          <CardDescription>
            {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{post.rawContent}</p>
      </CardContent>

      {(totalReactions > 0 || totalComments > 0) && (
          <CardContent className="py-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                    {reactionCounts.like > 0 && <Heart className="h-4 w-4 text-pink-500" />}
                    {reactionCounts.support > 0 && <HandHelping className="h-4 w-4 text-yellow-500" />}
                    {reactionCounts.celebrate > 0 && <PartyPopper className="h-4 w-4 text-blue-500" />}
                    {totalReactions > 0 && <span className="ml-1">{totalReactions}</span>}
                </div>
                 {totalComments > 0 && <span>{totalComments} {totalComments === 1 ? 'Comment' : 'Comments'}</span>}
            </div>
          </CardContent>
      )}

      <CardFooter className="flex-col items-start p-0 border-t mx-6">
        <div className="flex w-full">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="w-full rounded-none">
                <CurrentReactionIcon className={cn("mr-2 h-4 w-4", userReaction && 'text-primary')} />
                {userReaction ? userReaction.type.charAt(0).toUpperCase() + userReaction.type.slice(1) : 'Like'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1">
              <div className="flex gap-1">
                {(Object.keys(reactionIcons) as ReactionType[]).map((type) => {
                  const Icon = reactionIcons[type];
                  return (
                     <Button key={type} variant="ghost" size="icon" onClick={() => handleReaction(type)}>
                        <Icon className={cn('h-5 w-5', userReaction?.type === type && 'text-primary fill-current')} />
                    </Button>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="ghost" className="w-full rounded-none" onClick={() => setShowComments(!showComments)}>
            <MessageCircle className="mr-2 h-4 w-4" /> Comment
          </Button>
        </div>
      </CardFooter>

      {showComments && (
        <CardContent className="pt-4 border-t">
          {isLoadingComments && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>}
          
          <div className="space-y-4 mb-4">
            {comments && comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{comment.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="bg-muted p-3 rounded-lg w-full text-sm">
                  <p className="font-semibold">{comment.userName}</p>
                  <p className="text-card-foreground/90 whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            ))}
             {comments && comments.length === 0 && !isLoadingComments && (
                <p className="text-xs text-center text-muted-foreground py-4">No comments yet. Be the first!</p>
             )}
          </div>
          
          <form onSubmit={handleAddComment} className="flex items-start gap-2">
            <Avatar className="h-9 w-9 mt-1">
                <AvatarFallback>{userProfile?.name ? userProfile.name.slice(0,2).toUpperCase() : <MessageCircle />}</AvatarFallback>
            </Avatar>
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={!user || isSubmittingComment}
              rows={1}
              className="text-sm min-h-0 h-10"
            />
            <Button type="submit" size="icon" disabled={!user || isSubmittingComment || !newComment.trim()}>
              {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenSquare />}
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
}

// --- Main Page Component ---
export default function CommunityPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile } = useDoc(userDocRef);

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
      userName: userProfile?.name || 'Anonymous',
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
