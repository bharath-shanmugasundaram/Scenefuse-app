import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Split,
  Layers,
  Columns,
  Play,
  Pause,
  Download,
  AlertCircle,
} from 'lucide-react';
import { useEditorStore } from '@/store';

interface ComparisonViewProps {
  className?: string;
}

type ComparisonMode = 'split' | 'overlay' | 'side-by-side';

export function ComparisonView({ className }: ComparisonViewProps) {
  const { video, processedVideoUrl, ui, setShowComparison, setComparisonMode } = useEditorStore();
  const [splitPosition, setSplitPosition] = useState(50);
  const [overlayOpacity, setOverlayOpacity] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!video) {
    return (
      <div className={cn('p-6 bg-gray-50 rounded-lg text-center', className)}>
        <Layers className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">Upload and process a video to compare</p>
      </div>
    );
  }

  const beforeUrl = video.url;
  const afterUrl = processedVideoUrl || video.url;
  const hasProcessedVideo = !!processedVideoUrl;

  const handleModeChange = (mode: ComparisonMode) => {
    setComparisonMode(mode);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={ui.comparisonMode === 'split' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('split')}
            className="gap-2"
          >
            <Split className="w-4 h-4" />
            Split
          </Button>
          <Button
            variant={ui.comparisonMode === 'overlay' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('overlay')}
            className="gap-2"
          >
            <Layers className="w-4 h-4" />
            Overlay
          </Button>
          <Button
            variant={ui.comparisonMode === 'side-by-side' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('side-by-side')}
            className="gap-2"
          >
            <Columns className="w-4 h-4" />
            Side by Side
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="gap-2"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
        </div>
      </div>

      {!hasProcessedVideo && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            No processed video yet. Run an execution plan to see before &amp; after comparison.
            Showing original video on both sides for preview.
          </p>
        </div>
      )}

      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {ui.comparisonMode === 'split' && (
          <SplitView
            beforeUrl={beforeUrl}
            afterUrl={afterUrl}
            splitPosition={splitPosition}
            onSplitChange={setSplitPosition}
            isPlaying={isPlaying}
          />
        )}

        {ui.comparisonMode === 'overlay' && (
          <OverlayView
            beforeUrl={beforeUrl}
            afterUrl={afterUrl}
            opacity={overlayOpacity}
            isPlaying={isPlaying}
          />
        )}

        {ui.comparisonMode === 'side-by-side' && (
          <SideBySideView
            beforeUrl={beforeUrl}
            afterUrl={afterUrl}
            isPlaying={isPlaying}
          />
        )}
      </div>

      {ui.comparisonMode === 'split' && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Split position:</span>
          <Slider
            value={[splitPosition]}
            max={100}
            step={1}
            onValueChange={(v) => setSplitPosition(v[0])}
            className="flex-1"
          />
          <span className="text-sm text-gray-500 w-12">{splitPosition}%</span>
        </div>
      )}

      {ui.comparisonMode === 'overlay' && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Overlay opacity:</span>
          <Slider
            value={[overlayOpacity]}
            max={100}
            step={1}
            onValueChange={(v) => setOverlayOpacity(v[0])}
            className="flex-1"
          />
          <span className="text-sm text-gray-500 w-12">{overlayOpacity}%</span>
        </div>
      )}

      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Before (Original)</span>
        <span className="text-gray-500">After (Processed)</span>
      </div>
    </div>
  );
}

function useSyncedVideos(isPlaying: boolean) {
  const beforeRef = useRef<HTMLVideoElement>(null);
  const afterRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const before = beforeRef.current;
    const after = afterRef.current;
    if (!before || !after) return;

    if (isPlaying) {
      before.play().catch(() => {});
      after.play().catch(() => {});
    } else {
      before.pause();
      after.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const before = beforeRef.current;
    const after = afterRef.current;
    if (!before || !after) return;

    const syncAfterToBefore = () => {
      if (Math.abs(before.currentTime - after.currentTime) > 0.1) {
        after.currentTime = before.currentTime;
      }
    };

    before.addEventListener('seeked', syncAfterToBefore);
    before.addEventListener('timeupdate', syncAfterToBefore);

    return () => {
      before.removeEventListener('seeked', syncAfterToBefore);
      before.removeEventListener('timeupdate', syncAfterToBefore);
    };
  }, []);

  return { beforeRef, afterRef };
}

interface SplitViewProps {
  beforeUrl: string;
  afterUrl: string;
  splitPosition: number;
  onSplitChange: (position: number) => void;
  isPlaying: boolean;
}

function SplitView({
  beforeUrl,
  afterUrl,
  splitPosition,
  onSplitChange,
  isPlaying,
}: SplitViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { beforeRef, afterRef } = useSyncedVideos(isPlaying);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      onSplitChange(Math.max(5, Math.min(95, percentage)));
    },
    [isDragging, onSplitChange]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full cursor-ew-resize"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <video
        ref={afterRef}
        src={afterUrl}
        className="absolute inset-0 w-full h-full object-contain"
        loop
        muted
        playsInline
      />

      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - splitPosition}% 0 0)` }}
      >
        <video
          ref={beforeRef}
          src={beforeUrl}
          className="absolute inset-0 w-full h-full object-contain"
          loop
          muted
          playsInline
        />
      </div>

      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-lg"
        style={{ left: `${splitPosition}%`, transform: 'translateX(-50%)' }}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
          <div className="flex gap-0.5">
            <div className="w-0.5 h-4 bg-gray-400" />
            <div className="w-0.5 h-4 bg-gray-400" />
          </div>
        </div>
      </div>

      <div className="absolute top-4 left-4 px-2 py-1 bg-black/70 text-white text-xs rounded">
        Before
      </div>
      <div className="absolute top-4 right-4 px-2 py-1 bg-black/70 text-white text-xs rounded">
        After
      </div>
    </div>
  );
}

interface OverlayViewProps {
  beforeUrl: string;
  afterUrl: string;
  opacity: number;
  isPlaying: boolean;
}

function OverlayView({
  beforeUrl,
  afterUrl,
  opacity,
  isPlaying,
}: OverlayViewProps) {
  const { beforeRef, afterRef } = useSyncedVideos(isPlaying);

  return (
    <div className="relative w-full h-full">
      <video
        ref={beforeRef}
        src={beforeUrl}
        className="absolute inset-0 w-full h-full object-contain"
        loop
        muted
        playsInline
      />

      <video
        ref={afterRef}
        src={afterUrl}
        className="absolute inset-0 w-full h-full object-contain"
        style={{ opacity: opacity / 100 }}
        loop
        muted
        playsInline
      />

      <div className="absolute top-4 left-4 px-2 py-1 bg-black/70 text-white text-xs rounded">
        Before (100%)
      </div>
      <div className="absolute top-4 right-4 px-2 py-1 bg-black/70 text-white text-xs rounded">
        After ({opacity}%)
      </div>
    </div>
  );
}

interface SideBySideViewProps {
  beforeUrl: string;
  afterUrl: string;
  isPlaying: boolean;
}

function SideBySideView({ beforeUrl, afterUrl, isPlaying }: SideBySideViewProps) {
  const { beforeRef, afterRef } = useSyncedVideos(isPlaying);

  return (
    <div className="flex w-full h-full gap-2">
      <div className="flex-1 relative min-w-0">
        <video
          ref={beforeRef}
          src={beforeUrl}
          className="w-full h-full object-contain"
          loop
          muted
          playsInline
        />
        <div className="absolute top-4 left-4 px-2 py-1 bg-black/70 text-white text-xs rounded">
          Before
        </div>
      </div>

      <div className="w-px bg-gray-300" />

      <div className="flex-1 relative min-w-0">
        <video
          ref={afterRef}
          src={afterUrl}
          className="w-full h-full object-contain"
          loop
          muted
          playsInline
        />
        <div className="absolute top-4 right-4 px-2 py-1 bg-black/70 text-white text-xs rounded">
          After
        </div>
      </div>
    </div>
  );
}
