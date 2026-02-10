'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HeartHandshake, Search, Loader2, Users, MessageSquare, Briefcase } from 'lucide-react';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  useUser,
  useDoc,
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
  where,
  doc,
  writeBatch,
} from 'firebase/firestore';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// --- Interfaces ---
interface HelpRequest {
  id: string;
  description: string;
  userId: string;
  createdAt: Timestamp;
  status: 'open' | 'matched' | 'completed';
  duration: number;
}

interface VolunteerOffer {
  id: string;
  userId: string;
  userName: string;
  helpRequestId: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface Session {
    id: string;
    helpRequestId: string;
    participantIds: string[];
    status: 'active' | 'completed';
    createdAt: Timestamp;
}

// --- Main Page Component ---
export default function VolunteerPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  if (!user || !firestore) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Volunteer Hub</CardTitle>
          <CardDescription>Give or receive one hour of support.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="find">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="find">Find Help</TabsTrigger>
              <TabsTrigger value="activity">My Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="find">
              <FindHelpTab />
            </TabsContent>
            <TabsContent value="activity">
              <MyActivityTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}


// --- Find Help Tab ---
function FindHelpTab() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [offeringHelpId, setOfferingHelpId] = useState<string | null>(null);

  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile } = useDoc(userDocRef);

  const requestsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'help_requests'), where('status', '==', 'open'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );
  const { data: requests, isLoading } = useCollection<HelpRequest>(requestsQuery);

  const handleOfferHelp = (helpRequest: HelpRequest) => {
    if (!user || !firestore || !userProfile) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to offer help.'});
      return;
    }
    setOfferingHelpId(helpRequest.id);

    const newOffer = {
      userId: user.uid,
      userName: userProfile.name || 'Anonymous Volunteer',
      helpRequestId: helpRequest.id,
      status: 'pending',
      createdAt: serverTimestamp(),
    };

    const offersCollection = collection(firestore, 'volunteer_offers');
    addDoc(offersCollection, newOffer)
      .then(() => {
        toast({ title: 'Offer Sent!', description: 'Thank you for offering your help. The user has been notified.' });
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: offersCollection.path, operation: 'create', requestResourceData: newOffer,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setOfferingHelpId(null);
      });
  };

  return (
    <div className="space-y-8 mt-6">
        <RequestHelpButton />
        <div>
            <h3 className="text-2xl font-semibold text-card-foreground mb-4">Open Requests</h3>
            {isLoading && <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>}
            
            {!isLoading && requests && requests.length > 0 && (
                <div className="space-y-4">
                {requests.map((request) => (
                    <Card key={request.id}>
                    <CardContent className="p-4 flex justify-between items-center">
                        <div>
                        <p className="font-semibold">"{request.description}"</p>
                        <p className="text-sm text-muted-foreground">Request from: User {request.userId.slice(0, 6)}</p>
                        </div>
                        <Button onClick={() => handleOfferHelp(request)} disabled={!user || offeringHelpId === request.id || user.uid === request.userId}>
                        {offeringHelpId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Offer 1 Hour
                        </Button>
                    </CardContent>
                    </Card>
                ))}
                </div>
            )}

            {!isLoading && (!requests || requests.length === 0) && (
                <div className="text-center py-16 border-2 border-dashed border-muted-foreground/30 rounded-lg">
                <h3 className="text-xl font-semibold text-card-foreground">No open requests right now</h3>
                <p className="text-muted-foreground mt-2">Check back later or be the first to request help!</p>
                </div>
            )}
        </div>
    </div>
  );
}


// --- My Activity Tab ---
function MyActivityTab() {
    const firestore = useFirestore();
    const { user } = useUser();

    // Queries for My Activity
    const myRequestsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'help_requests'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')) : null, [firestore, user]);
    const { data: myRequests, isLoading: loadingMyRequests } = useCollection<HelpRequest>(myRequestsQuery);

    const myOffersQuery = useMemoFirebase(() => user ? query(collection(firestore, 'volunteer_offers'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')) : null, [firestore, user]);
    const { data: myOffers, isLoading: loadingMyOffers } = useCollection<VolunteerOffer>(myOffersQuery);
    
    const mySessionsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'sessions'), where('participantIds', 'array-contains', user.uid), orderBy('createdAt', 'desc')) : null, [firestore, user]);
    const { data: mySessions, isLoading: loadingMySessions } = useCollection<Session>(mySessionsQuery);


    const isLoading = loadingMyRequests || loadingMyOffers || loadingMySessions;

    return (
        <div className="space-y-8 mt-6">
            {isLoading && <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>}
            
            {!isLoading && (
                <>
                    <MyHelpRequests requests={myRequests || []} />
                    <MyVolunteerOffers offers={myOffers || []} />
                    <MySessions sessions={mySessions || []} />
                </>
            )}
        </div>
    )
}

function MyHelpRequests({ requests }: { requests: HelpRequest[] }) {
    return (
        <div>
            <h3 className="text-xl font-semibold text-card-foreground mb-4 flex items-center gap-2"><Search /> My Help Requests</h3>
             {requests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">You haven't made any help requests.</p>
            ) : (
                <div className="space-y-4">
                    {requests.map(request => <MyRequestCard key={request.id} request={request} />)}
                </div>
            )}
        </div>
    )
}

function MyRequestCard({ request }: { request: HelpRequest }) {
    const firestore = useFirestore();
    
    const offersQuery = useMemoFirebase(() => 
        query(collection(firestore, 'volunteer_offers'), where('helpRequestId', '==', request.id), where('status', '==', 'pending'))
    , [firestore, request.id]);
    const { data: offers, isLoading } = useCollection<VolunteerOffer>(offersQuery);
    const { toast } = useToast();
    const [isAccepting, setIsAccepting] = useState<string|null>(null);

    const handleAcceptOffer = async (offer: VolunteerOffer) => {
        if (!firestore) return;
        setIsAccepting(offer.id);

        const batch = writeBatch(firestore);

        // 1. Create new session
        const sessionRef = doc(collection(firestore, 'sessions'));
        const newSession = {
            helpRequestId: request.id,
            participantIds: [request.userId, offer.userId],
            status: 'active',
            createdAt: serverTimestamp(),
            chatLog: [],
        };
        batch.set(sessionRef, newSession);

        // 2. Update help request status
        const requestRef = doc(firestore, 'help_requests', request.id);
        batch.update(requestRef, { status: 'matched' });

        // 3. Update offer status
        const offerRef = doc(firestore, 'volunteer_offers', offer.id);
        batch.update(offerRef, { status: 'accepted' });

        try {
            await batch.commit();
            toast({ title: "Session started!", description: "You can now chat with your volunteer in 'My Sessions'."})
        } catch (error) {
            console.error("Error accepting offer: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not start the session.'});
        } finally {
            setIsAccepting(null);
        }
    }

    return (
        <Card className="bg-muted/30">
            <CardHeader>
                <CardTitle className="text-lg">Request: "{request.description}"</CardTitle>
                <CardDescription>Status: <span className="font-semibold capitalize">{request.status}</span></CardDescription>
            </CardHeader>
            {request.status === 'open' && (
                <CardContent>
                    <h4 className="font-semibold mb-2">Offers Received:</h4>
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {!isLoading && (!offers || offers.length === 0) && <p className="text-sm text-muted-foreground">No pending offers yet.</p>}
                    {offers && offers.length > 0 && (
                        <div className="space-y-2">
                            {offers.map(offer => (
                                <div key={offer.id} className="flex justify-between items-center p-2 rounded bg-background">
                                    <p className="text-sm font-medium">Offer from {offer.userName}</p>
                                    <Button size="sm" onClick={() => handleAcceptOffer(offer)} disabled={!!isAccepting}>
                                        {isAccepting === offer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept"}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    )
}

function MyVolunteerOffers({ offers }: { offers: VolunteerOffer[] }) {
    return (
        <div>
             <h3 className="text-xl font-semibold text-card-foreground mb-4 flex items-center gap-2"><HeartHandshake /> My Volunteer Offers</h3>
              {offers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">You haven't offered to help anyone yet.</p>
            ) : (
                <div className="space-y-2">
                    {offers.map(offer => (
                         <Card key={offer.id}>
                            <CardContent className="p-3 flex items-center justify-between">
                                <p className="text-sm">Your offer for request <Link href={`/requests/${offer.helpRequestId}`} className="underline font-semibold">{offer.helpRequestId.slice(0,6)}...</Link></p>
                                <p className="text-sm font-bold capitalize">{offer.status}</p>
                            </CardContent>
                         </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

function MySessions({ sessions }: { sessions: Session[] }) {
    return (
        <div>
             <h3 className="text-xl font-semibold text-card-foreground mb-4 flex items-center gap-2"><Users /> My Sessions</h3>
             {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">You have no active or past sessions.</p>
            ) : (
                <div className="space-y-2">
                    {sessions.map(session => (
                         <Card key={session.id}>
                             <CardContent className="p-3 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold">Session for request <span className="font-normal underline">{session.helpRequestId.slice(0,6)}...</span></p>
                                    <p className="text-xs text-muted-foreground">Status: <span className="font-semibold capitalize">{session.status}</span></p>
                                </div>
                                <Button asChild variant="secondary" size="sm">
                                    <Link href={`/sessions/${session.id}`}>
                                        <MessageSquare className="mr-2 h-4 w-4"/>
                                        Open Chat
                                    </Link>
                                </Button>
                            </CardContent>
                         </Card>
                    ))}
                </div>
            )}
        </div>
    )
}


function RequestHelpButton() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [requestDescription, setRequestDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleRequestHelp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !requestDescription.trim() || !firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and provide a description.' });
        return;
        }
        setIsSubmitting(true);

        const newRequest = {
        userId: user.uid,
        description: requestDescription,
        createdAt: serverTimestamp(),
        status: 'open',
        duration: 1, 
        };

        const requestsCollection = collection(firestore, 'help_requests');

        addDoc(requestsCollection, newRequest)
        .then(() => {
            toast({ title: 'Request Submitted!', description: 'Your help request is now visible to volunteers.' });
            setRequestDescription('');
            setIsDialogOpen(false);
        })
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({ path: requestsCollection.path, operation: 'create', requestResourceData: newRequest });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setIsSubmitting(false);
        });
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
            <Button variant="secondary" className="w-full h-24 text-lg" disabled={!user}>
                <Search className="mr-4 h-6 w-6" /> Request Help
            </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>Request Help</DialogTitle>
                <DialogDescription>Describe what you need help with. A volunteer can offer one hour of support.</DialogDescription>
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
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || !requestDescription.trim()}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Request
                </Button>
                </DialogFooter>
            </form>
            </DialogContent>
        </Dialog>
    )
}

    