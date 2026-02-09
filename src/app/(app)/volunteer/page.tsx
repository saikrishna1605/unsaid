'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HeartHandshake, Search, Loader2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';

interface HelpRequest {
    id: string;
    description: string;
    userId: string;
    createdAt: Timestamp;
}

export default function VolunteerPage() {
  const firestore = useFirestore();
  const requestsQuery = useMemoFirebase(
      () => firestore ? query(collection(firestore, 'help_requests'), orderBy('createdAt', 'desc')) : null,
      [firestore]
  );
  const { data: requests, isLoading } = useCollection<HelpRequest>(requestsQuery);

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
            <Button variant="secondary" className="h-24 text-lg">
              <Search className="mr-4 h-6 w-6" /> Request Help
            </Button>
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
                        {requests.map(request => (
                             <Card key={request.id}>
                                <CardContent className="p-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">"{request.description}"</p>
                                        <p className="text-sm text-muted-foreground">Request from: User {request.userId.slice(0,6)}</p>
                                    </div>
                                    <Button>Offer 1 Hour</Button>
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
        </CardContent>
      </Card>
    </div>
  );
}
    