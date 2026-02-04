import { useRef, useState, useCallback, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEditorStore } from '@/store';
import { formatDuration } from '@/lib/utils';

interface VideoPlayerProps {
  url: string;
  className?: string;
}

export function VideoPlayer({ url, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    currentTime,
    duration,
    isPlaying,
    setCurrentTime,
    setIsPlaying,
    setDuration,
  } = useEditorStore();

  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [setCurrentTime, setDuration, setIsPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      video.pause();
    }
  }, [isPlaying, setIsPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackRate;
  }, [playbackRate]);

  const handleSeek = useCallback(
    (value: number[]) => {
      const time = value[0];
      setCurrentTime(time);
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    },
    [setCurrentTime]
  );

  const togglePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying, setIsPlaying]);

  const skip = useCallback(
    (seconds: number) => {
      const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
      setCurrentTime(newTime);
      if (videoRef.current) {
        videoRef.current.currentTime = newTime;
      }
    },
    [currentTime, duration, setCurrentTime]
  );

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          skip(-5);
          break;
        case 'ArrowRight':
          skip(5);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          setIsMuted(!isMuted);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, skip, toggleFullscreen, isMuted]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-black rounded-lg overflow-hidden group',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={url}
        className="w-full h-full object-contain"
        onClick={togglePlay}
      />

      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0'
        )}
      >
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
              <Play className="w-10 h-10 text-white ml-1" fill="white" />
            </div>
          </button>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <div className="relative group/progress">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => skip(-5)}
                className="text-white hover:bg-white/20"
              >
                <SkipBack className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => skip(5)}
                className="text-white hover:bg-white/20"
              >
                <SkipForward className="w-5 h-5" />
              </Button>

              <div className="flex items-center gap-2 group/volume">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </Button>
                <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all">
                  <Slider
                    value={[isMuted ? 0 : volume * 100]}
                    max={100}
                    step={1}
                    onValueChange={(v) => {
                      setVolume(v[0] / 100);
                      setIsMuted(v[0] === 0);
                    }}
                    className="w-20"
                  />
                </div>
              </div>

              <span className="text-sm text-white font-mono">
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    {playbackRate}x
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <DropdownMenuItem
                      key={rate}
                      onClick={() => setPlaybackRate(rate)}
                      className={cn(
                        playbackRate === rate && 'bg-accent'
                      )}
                    >
                      {rate}x
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                <Maximize className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
