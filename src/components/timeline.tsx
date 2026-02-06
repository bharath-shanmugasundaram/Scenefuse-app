import * as React from 'react';
import { useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store';
import { formatDuration } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';

interface TimelineProps {
  className?: string;
}

const waveformHeights = Array.from({ length: 100 }, () => 20 + Math.random() * 60);

export function Timeline({ className }: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  const {
    video,
    currentTime,
    duration,
    timelineSegments,
    frameSelections,
    setCurrentTime,
    addTimelineSegment,
    removeTimelineSegment,
    addFrameSelection,
  } = useEditorStore();

  const getTimeFromX = useCallback(
    (x: number): number => {
      if (!timelineRef.current) return 0;
      const rect = timelineRef.current.getBoundingClientRect();
      const ratio = (x - rect.left) / rect.width;
      return Math.max(0, Math.min(ratio * duration, duration));
    },
    [duration]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!timelineRef.current || isDragging) return;
      const time = getTimeFromX(e.clientX);
      setCurrentTime(time);
    },
    [getTimeFromX, setCurrentTime, isDragging]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const time = getTimeFromX(e.clientX);
      setIsDragging(true);
      setDragStart(time);
      setDragEnd(time);
    },
    [getTimeFromX]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const time = getTimeFromX(e.clientX);
      setHoverTime(time);

      if (isDragging && dragStart !== null) {
        setDragEnd(time);
      }
    },
    [getTimeFromX, isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStart !== null && dragEnd !== null) {
      const start = Math.min(dragStart, dragEnd);
      const end = Math.max(dragStart, dragEnd);

      if (end - start > 0.5) {
        addTimelineSegment({
          id: uuidv4(),
          startTime: start,
          endTime: end,
          label: `Segment ${timelineSegments.length + 1}`,
          color: `hsl(${(timelineSegments.length * 60) % 360}, 70%, 60%)`,
        });
      }
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, addTimelineSegment, timelineSegments.length]);

  const handleAddFrameSelection = useCallback(() => {
    const frameNumber = Math.floor(currentTime * 30);
    addFrameSelection({
      frameNumber,
      timestamp: currentTime,
    });
  }, [currentTime, addFrameSelection]);

  const timeMarkers = React.useMemo(() => {
    if (!duration) return [];
    const markers = [];
    const interval = duration > 60 ? 10 : 5;
    for (let i = 0; i <= duration; i += interval) {
      markers.push(i);
    }
    return markers;
  }, [duration]);

  if (!video) {
    return (
      <div
        className={cn(
          'h-32 bg-blue-50 rounded-lg flex items-center justify-center',
          className
        )}
      >
        <p className="text-blue-400 text-sm">Upload a video to see timeline</p>
      </div>
    );
  }

  const selectionStart = dragStart !== null && dragEnd !== null
    ? Math.min(dragStart, dragEnd)
    : null;
  const selectionEnd = dragStart !== null && dragEnd !== null
    ? Math.max(dragStart, dragEnd)
    : null;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddFrameSelection}
            className="text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Mark Frame
          </Button>
          <span className="text-xs text-blue-900/50">
            {frameSelections.length} frames selected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-900/50">
            Drag to create segments
          </span>
        </div>
      </div>

      <div
        ref={timelineRef}
        className="relative h-24 bg-blue-50 rounded-lg overflow-hidden cursor-crosshair select-none"
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="absolute top-0 left-0 right-0 h-6 border-b border-blue-100">
          {timeMarkers.map((time) => (
            <div
              key={time}
              className="absolute top-0 h-full flex flex-col items-center"
              style={{ left: `${(time / duration) * 100}%` }}
            >
              <div className="w-px h-2 bg-blue-300" />
              <span className="text-[10px] text-blue-900/50 mt-0.5">
                {formatDuration(time)}
              </span>
            </div>
          ))}
        </div>

        <div className="absolute top-6 left-0 right-0 h-12 flex items-center px-1">
          {waveformHeights.map((h, i) => (
            <div
              key={i}
              className="flex-1 mx-px bg-blue-200 rounded-sm"
              style={{
                height: `${h}%`,
              }}
            />
          ))}
        </div>

        {timelineSegments.map((segment) => (
          <div
            key={segment.id}
            className="absolute top-6 h-12 rounded flex items-center px-2 text-xs text-white font-medium overflow-hidden group"
            style={{
              left: `${(segment.startTime / duration) * 100}%`,
              width: `${((segment.endTime - segment.startTime) / duration) * 100}%`,
              backgroundColor: segment.color,
            }}
          >
            <span className="truncate">{segment.label}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTimelineSegment(segment.id);
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 bg-black/30 rounded"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}

        {selectionStart !== null && selectionEnd !== null && (
          <div
            className="absolute top-6 h-12 bg-blue-500/30 border border-blue-500 rounded"
            style={{
              left: `${(selectionStart / duration) * 100}%`,
              width: `${((selectionEnd - selectionStart) / duration) * 100}%`,
            }}
          />
        )}

        <div
          className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        >
          <div className="absolute -top-1 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full" />
          <div className="absolute bottom-0 -translate-x-1/2 text-[10px] text-red-500 font-mono bg-white px-1 rounded">
            {formatDuration(currentTime)}
          </div>
        </div>

        {hoverTime !== null && !isDragging && (
          <div
            className="absolute top-0 bottom-0 w-px bg-blue-300/50 pointer-events-none"
            style={{ left: `${(hoverTime / duration) * 100}%` }}
          >
            <div className="absolute -top-1 -translate-x-1/2 text-[10px] text-blue-900/50 bg-white px-1 rounded">
              {formatDuration(hoverTime)}
            </div>
          </div>
        )}

        {frameSelections.map((frame) => (
          <div
            key={frame.frameNumber}
            className="absolute top-[90%] -translate-x-1/2"
            style={{ left: `${(frame.timestamp / duration) * 100}%` }}
          >
            <div className="w-2 h-2 bg-green-500 rounded-full" />
          </div>
        ))}
      </div>

      {timelineSegments.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-blue-900">Segments</p>
          <div className="flex flex-wrap gap-2">
            {timelineSegments.map((segment) => (
              <div
                key={segment.id}
                className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-xs"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span>{segment.label}</span>
                <span className="text-blue-900/50">
                  ({formatDuration(segment.startTime)} - {formatDuration(segment.endTime)})
                </span>
                <button
                  onClick={() => removeTimelineSegment(segment.id)}
                  className="ml-1 text-blue-400 hover:text-red-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
