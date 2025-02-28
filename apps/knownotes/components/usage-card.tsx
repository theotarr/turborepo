import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface UsageCardProps {
  totalNotes: number;
  notesByType: {
    AUDIO_FILE: number;
    YOUTUBE: number;
    PDF: number;
    LIVE: number;
  };
}

export function UsageCard({ totalNotes, notesByType }: UsageCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage</CardTitle>
        <CardDescription>Your current usage statistics.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium">Notes ({totalNotes})</div>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-4 text-xs text-muted-foreground">
            <div className="flex flex-col items-center">
              <span className="text-lg font-medium text-foreground">
                {notesByType.LIVE}
              </span>
              <span>Live Lecture</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-medium text-foreground">
                {notesByType.YOUTUBE}
              </span>
              <span>YouTube Video</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-medium text-foreground">
                {notesByType.PDF}
              </span>
              <span>PDFs</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-medium text-foreground">
                {notesByType.AUDIO_FILE}
              </span>
              <span>Audio Files</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
