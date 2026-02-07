import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload } from 'lucide-react';

export default function SignPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Sign Language Interpreter</CardTitle>
          <CardDescription>Translate short sign language clips into text.</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="w-full aspect-video bg-muted/50 rounded-lg flex items-center justify-center">
            <Camera className="h-16 w-16 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Position yourself in the frame and record a 3-6 second clip.</p>
          <div className="flex gap-4 justify-center">
            <Button size="lg">
              <Camera className="mr-2 h-5 w-5" /> Start Recording
            </Button>
            <Button size="lg" variant="secondary">
              <Upload className="mr-2 h-5 w-5" /> Upload Clip
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
