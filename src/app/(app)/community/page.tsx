import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PenSquare } from 'lucide-react';

export default function CommunityPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Community</CardTitle>
           <CardDescription>Share, connect, and find support.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-center py-16 border-2 border-dashed border-muted-foreground/30 rounded-lg">
                <h3 className="text-xl font-semibold text-card-foreground">The community feed is quiet right now</h3>
                <p className="text-muted-foreground mt-2">Be the first to share something!</p>
                <Button className="mt-6">
                    <PenSquare className="mr-2 h-4 w-4" /> Create Post
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
