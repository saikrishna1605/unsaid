'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Speaker, Mic, MessageSquare, Hand, Loader2 } from 'lucide-react';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface PendingProfileData {
  name: string;
  preference: string;
}

export default function SetupPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [communicationPreference, setCommunicationPreference] = useState('speak');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingProfileData, setPendingProfileData] = useState<PendingProfileData | null>(null);

  // Effect to create user profile after anonymous sign-in completes
  useEffect(() => {
    const createProfile = async () => {
      if (user && pendingProfileData && firestore) {
        const userRef = doc(firestore, 'users', user.uid);
        const newUserProfile = {
          id: user.uid,
          name: pendingProfileData.name,
          role: 'Primary user',
          accessibilityPreferences: JSON.stringify({
            primaryCommunication: pendingProfileData.preference,
          }),
        };

        try {
          await setDoc(userRef, newUserProfile);
          // Profile created, now we can redirect.
          router.replace('/home');
        } catch (error) {
          console.error("Failed to create user profile:", error);
          toast({
            variant: "destructive",
            title: "Setup Failed",
            description: "Could not save your profile. Please try again.",
          });
          // Reset state on failure
          setIsSubmitting(false);
          setPendingProfileData(null);
        }
      }
    };

    createProfile();
  }, [user, pendingProfileData, firestore, router, toast]);

  // Effect to redirect an already logged-in user
  useEffect(() => {
    if (user && !isSubmitting) {
      router.replace('/home');
    }
  }, [user, router, isSubmitting]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !auth) return;
    
    setIsSubmitting(true);
    setPendingProfileData({ name, preference: communicationPreference });
    initiateAnonymousSignIn(auth);
  };
  
  if (isUserLoading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center">Welcome to Unsaid/Unheard</CardTitle>
          <CardDescription className="text-center pt-2">Let's get you set up. Your preferences help us make your experience better.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">What should we call you?</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
                className="bg-card"
              />
            </div>
            <div className="space-y-4">
              <Label>Choose your primary way to communicate</Label>
              <RadioGroup 
                defaultValue="speak" 
                onValueChange={setCommunicationPreference}
                className="grid grid-cols-2 gap-4"
                disabled={isSubmitting}
              >
                <div>
                  <RadioGroupItem value="speak" id="r1" className="peer sr-only" />
                  <Label htmlFor="r1" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <Speaker className="mb-3 h-6 w-6" />
                    Speak
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="type" id="r2" className="peer sr-only" />
                  <Label htmlFor="r2" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <MessageSquare className="mb-3 h-6 w-6" />
                    Type
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="voice" id="r3" className="peer sr-only" />
                  <Label htmlFor="r3" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <Mic className="mb-3 h-6 w-6" />
                    Voice
                  </Label>
                </div>
                 <div>
                  <RadioGroupItem value="sign" id="r4" className="peer sr-only" />
                  <Label htmlFor="r4" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <Hand className="mb-3 h-6 w-6" />
                    Sign
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Get Started
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

    