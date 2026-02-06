import { History, Video, Clock, CheckCircle2, XCircle, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HistoryEntry {
  id: string;
  name: string;
  date: string;
  status: 'completed' | 'failed' | 'cancelled';
  duration: string;
  modelUsed: string;
  thumbnail?: string;
}

const SAMPLE_HISTORY: HistoryEntry[] = [
  {
    id: '1',
    name: 'Beach sunset - Object removal',
    date: '2 hours ago',
    status: 'completed',
    duration: '45s',
    modelUsed: 'Video Inpainting',
  },
  {
    id: '2',
    name: 'City timelapse - Color correction',
    date: '5 hours ago',
    status: 'completed',
    duration: '12s',
    modelUsed: 'Color Correction',
  },
  {
    id: '3',
    name: 'Interview clip - Background removal',
    date: 'Yesterday',
    status: 'failed',
    duration: '30s',
    modelUsed: 'Background Removal',
  },
  {
    id: '4',
    name: 'Product demo - Style transfer',
    date: 'Yesterday',
    status: 'completed',
    duration: '2m 10s',
    modelUsed: 'Style Transfer',
  },
  {
    id: '5',
    name: 'Drone footage - Object replacement',
    date: '3 days ago',
    status: 'cancelled',
    duration: '1m 05s',
    modelUsed: 'Object Replacement',
  },
  {
    id: '6',
    name: 'Wedding video - SAM 3 Segmentation',
    date: '1 week ago',
    status: 'completed',
    duration: '18s',
    modelUsed: 'SAM 3 Segmentation',
  },
];

const statusConfig = {
  completed: {
    icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    label: 'Completed',
    variant: 'default' as const,
    className: 'bg-green-50 text-green-700 border-green-200',
  },
  failed: {
    icon: <XCircle className="w-4 h-4 text-red-500" />,
    label: 'Failed',
    variant: 'destructive' as const,
    className: 'bg-red-50 text-red-700 border-red-200',
  },
  cancelled: {
    icon: <XCircle className="w-4 h-4 text-blue-400" />,
    label: 'Cancelled',
    variant: 'secondary' as const,
    className: 'bg-blue-50 text-blue-600 border-blue-200',
  },
};

export function HistoryPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#056cb8]/10 rounded-lg flex items-center justify-center">
            <History className="w-5 h-5 text-[#056cb8]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#056cb8]">History</h1>
            <p className="text-sm text-blue-900/50">Your recent editing sessions</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2 border-blue-200 text-[#056cb8] hover:bg-blue-50">
          <Trash2 className="w-4 h-4" />
          Clear History
        </Button>
      </div>

      <div className="space-y-3">
        {SAMPLE_HISTORY.map((entry) => {
          const status = statusConfig[entry.status];
          return (
            <Card key={entry.id} className="border-blue-100 hover:border-[#056cb8]/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Video className="w-6 h-6 text-[#056cb8]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-blue-900 truncate">{entry.name}</h3>
                      <Badge variant="outline" className={status.className}>
                        {status.icon}
                        <span className="ml-1">{status.label}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-blue-900/50">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {entry.date}
                      </span>
                      <span>Duration: {entry.duration}</span>
                      <span>Model: {entry.modelUsed}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="ghost" size="sm" className="text-[#056cb8] hover:bg-blue-50">
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center py-4">
        <p className="text-sm text-blue-900/40">Showing 6 of 6 entries</p>
      </div>
    </div>
  );
}
