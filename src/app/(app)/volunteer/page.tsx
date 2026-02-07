import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HeartHandshake, Search } from 'lucide-react';

export default function VolunteerPage() {
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
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                                <p className="font-semibold">"I need help practicing for a job interview."</p>
                                <p className="text-sm text-muted-foreground">Request for: Career Skills</p>
                            </div>
                            <Button>Offer 1 Hour</Button>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                                <p className="font-semibold">"Can someone help me set up my email?"</p>
                                <p className="text-sm text-muted-foreground">Request for: Digital Skills</p>
                            </div>
                            <Button>Offer 1 Hour</Button>
                        </CardContent>
                    </Card>
                </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
