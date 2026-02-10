'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogOut } from 'lucide-react';

export default function ProfilePage() {
    const auth = useAuth();
    const firestore = useFirestore();
    const { user } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    const userDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'users', user.uid) : null),
        [user, firestore]
    );
    const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setName(userProfile.name);
        }
    }, [userProfile]);
    
    const handleSave = async () => {
        if (!name.trim() || !userDocRef) return;

        setIsSaving(true);
        try {
            await updateDoc(userDocRef, { name: name.trim() });
            toast({
                title: 'Profile Updated',
                description: 'Your name has been saved.',
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not update your profile.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
            // The router will redirect to the homepage, which will then redirect to the setup page if not authenticated.
            router.push('/');
            router.refresh(); // Force a refresh to ensure auth state is cleared everywhere
        } catch (error) {
            console.error('Error signing out:', error);
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not sign you out.',
            });
        }
    };
    
    if (isProfileLoading) {
        return <div className="flex justify-center items-center h-full pt-16"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            <Card className="w-full max-w-lg mx-auto">
                <CardHeader>
                    <CardTitle className="text-3xl font-headline">My Profile</CardTitle>
                    <CardDescription>View and edit your personal information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="name">Your Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isSaving}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
                    <Button onClick={handleSave} disabled={isSaving || !name.trim() || name === userProfile?.name}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4"/>
                        Log Out
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
