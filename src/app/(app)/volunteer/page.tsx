'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HeartHandshake, Search, Loader2 } from 'lucide-react';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  useUser,
  errorEmitter,
  FirestorePermissionError,
} from '@/firebase';
import { collection, query, orderBy, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore';
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

interface HelpRequest {
  id: string;
  description: string;
  userId: string;
  createdAt: Timestamp;
  duration: number;
}

export default function VolunteerPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [requestDescription, setRequestDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offeringHelpId, setOfferingHelpId] = useState<string | null>(null);

  const requestsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'help_requests'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );
  const { data: requests, isLoading } = useCollection<HelpRequest>(requestsQuery);

  const handleRequestHelp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !requestDescription.trim() || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in and provide a description.',
      });
      return;
    }
    setIsSubmitting(true);

    const newRequest = {
      userId: user.uid,
      description: requestDescription,
      createdAt: serverTimestamp(),
      duration: 1, // Default to 1 hour
    };

    const requestsCollection = collection(firestore, 'help_requests');

    addDoc(requestsCollection, newRequest)
      .then(() => {
        toast({
          title: 'Request Submitted!',
          description: 'Your help request is now visible to volunteers.',
        });
        setRequestDescription('');
        setIsDialogOpen(false);
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: requestsCollection.path,
          operation: 'create',
          requestResourceData: newRequest,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleOfferHelp = (helpRequestId: string) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to offer help.',
      });
      return;
    }
    setOfferingHelpId(helpRequestId);

    const newOffer = {
      userId: user.uid,
      helpRequestId: helpRequestId,
      availability: 'pending', // Default status
      createdAt: serverTimestamp(),
    };

    const offersCollection = collection(firestore, 'volunteer_offers');

    addDoc(offersCollection, newOffer)
      .then(() => {
        toast({
          title: 'Offer Sent!',
          description: 'Thank you for offering your help. The user has been notified.',
        });
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: offersCollection.path,
          operation: 'create',
          requestResourceData: newOffer,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setOfferingHelpId(null);
      });
  };


  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Volunteer Hub</CardTitle>
          <CardDescription>Give or receive one hour of support.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <Button variant="default" className="h-24 text-lg">
              <HeartHandshake className="mr-4 h-6 w-6" /> Offer Help
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="h-24 text-lg" disabled={!user}>
                  <Search className="mr-4 h-6 w-6" /> Request Help
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Help</DialogTitle>
                  <DialogDescription>
                    Describe what you need help with. A volunteer can offer one hour of support.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleRequestHelp}>
                  <div className="grid gap-4 py-4">
                    <Textarea
                      placeholder="e.g., 'I need help practicing for a job interview.'"
                      value={requestDescription}
                      onChange={(e) => setRequestDescription(e.target.value)}
                      rows={4}
                      disabled={isSubmitting}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || !requestDescription.trim()}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit Request
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div>
            <h3 className="text-2xl font-semibold text-card-foreground mb-4">Open Requests</h3>
            {isLoading && (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            {!isLoading && requests && requests.length > 0 && (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-semibold">"{request.description}"</p>
                        <p className="text-sm text-muted-foreground">
                          Request from: User {request.userId.slice(0, 6)}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleOfferHelp(request.id)}
                        disabled={!user || offeringHelpId === request.id || user.uid === request.userId}
                      >
                        {offeringHelpId === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        Offer 1 Hour
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {!isLoading && (!requests || requests.length === 0) && (
              <div className="text-center py-16 border-2 border-dashed border-muted-foreground/30 rounded-lg">
                <h3 className="text-xl font-semibold text-card-foreground">
                  No open requests right now
                </h3>
                <p className="text-muted-foreground mt-2">
                  Check back later or be the first to request help!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
