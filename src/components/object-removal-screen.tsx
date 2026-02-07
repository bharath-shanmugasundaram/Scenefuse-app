import { useRef, useState, useCallback, useEffect } from 'react';
import {
  ArrowLeft,
  MousePointer2,
  Paintbrush,
  Trash2,
  Undo2,
  Loader2,
  Check,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Hand,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store';
import { removalApi } from '@/lib/object-removal-api';
import { v4 as uuidv4 } from 'uuid';
import type { TouchPoint, BrushStroke } from '@/types';

export function ObjectRemovalScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    video,
    currentTime,
    objectRemoval,
    exitObjectRemoval,
    addTouchPoint,
    removeTouchPoint,
    clearTouchPoints,
    setSegments,
    setCombinedMask,
    setObjectRemovalPhase,
    setIsSegmenting,
    setIsRemoving,
    setResultImage,
    setObjectRemovalError,
    setFrameImage,
    setBrushMode,
    setBrushSize,
    addBrushStroke,
    clearBrushStrokes,
  } = useEditorStore();

  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingProgress, setTrackingProgress] = useState(0);
  const [trackingVideoUrl, setTrackingVideoUrl] = useState<string | null>(null);
  const [isInpaintingVideo, setIsInpaintingVideo] = useState(false);
  const [inpaintingProgress, setInpaintingProgress] = useState(0);
  const [inpaintingVideoUrl, setInpaintingVideoUrl] = useState<string | null>(null);

  const {
    phase,
    frameImageUrl,
    touchPoints,
    segments,
    combinedMaskUrl,
    resultImageUrl,
    isSegmenting,
    isRemoving,
    error,
    brushMode,
    brushSize,
    brushStrokes,
  } = objectRemoval;

  // Capture frame from video on mount
  useEffect(() => {
    if (!video || frameImageUrl) return;

    const captureFrame = () => {
      const vid = videoRef.current;
      if (!vid) return;

      vid.currentTime = currentTime;
      vid.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = vid.videoWidth || video.width;
        canvas.height = vid.videoHeight || video.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(vid, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setFrameImage(dataUrl, currentTime);
        setImageDimensions({ width: canvas.width, height: canvas.height });
      };
    };

    captureFrame();
  }, [video, currentTime, frameImageUrl, setFrameImage]);

  // Draw everything on canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !frameImageUrl) return;

    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      // Set canvas size to match container
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Fit image within container
      const scale = Math.min(
        containerWidth / img.width,
        containerHeight / img.height
      );
      const displayWidth = img.width * scale;
      const displayHeight = img.height * scale;

      canvas.width = containerWidth;
      canvas.height = containerHeight;

      setCanvasDimensions({ width: displayWidth, height: displayHeight });

      const offsetX = (containerWidth - displayWidth * zoom) / 2 + pan.x;
      const offsetY = (containerHeight - displayHeight * zoom) / 2 + pan.y;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      // Draw the frame image (or result if in done phase and showing after)
      if (phase === 'done' && resultImageUrl && !showBeforeAfter) {
        const resultImg = new Image();
        resultImg.onload = () => {
          ctx.drawImage(resultImg, offsetX, offsetY, displayWidth * zoom, displayHeight * zoom);
        };
        resultImg.src = resultImageUrl;
      } else {
        ctx.drawImage(img, offsetX, offsetY, displayWidth * zoom, displayHeight * zoom);
      }

      // Draw segmentation masks overlay
      if (segments.length > 0 && phase !== 'done') {
        for (const seg of segments) {
          const maskImg = new Image();
          maskImg.onload = () => {
            ctx.globalAlpha = 0.4;
            ctx.globalCompositeOperation = 'source-over';

            // Create colored mask overlay
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const tempCtx = tempCanvas.getContext('2d')!;
            tempCtx.drawImage(maskImg, 0, 0, img.width, img.height);

            // Colorize the mask
            const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              if (data[i] > 128 || data[i + 1] > 128 || data[i + 2] > 128) {
                // White pixels → red highlight
                data[i] = 255;     // R
                data[i + 1] = 60;  // G
                data[i + 2] = 60;  // B
                data[i + 3] = 140; // A
              } else {
                data[i + 3] = 0; // transparent
              }
            }
            tempCtx.putImageData(imageData, 0, 0);

            ctx.drawImage(tempCanvas, offsetX, offsetY, displayWidth * zoom, displayHeight * zoom);
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
          };
          maskImg.src = seg.maskDataUrl;
        }
      }

      // Draw touch points
      for (const point of touchPoints) {
        const px = offsetX + point.x * displayWidth * zoom;
        const py = offsetY + point.y * displayHeight * zoom;

        // Outer ring
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.strokeStyle = point.label === 1 ? '#22c55e' : '#ef4444';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Inner dot
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = point.label === 1 ? '#22c55e' : '#ef4444';
        ctx.fill();

        // Plus or minus sign
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(point.label === 1 ? '+' : '-', px, py - 22);
      }

      // Draw brush strokes preview
      if (brushStrokes.length > 0 && phase !== 'done') {
        ctx.strokeStyle = 'rgba(255, 60, 60, 0.6)';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (const stroke of brushStrokes) {
          ctx.lineWidth = stroke.size * scale * zoom;
          ctx.beginPath();
          for (let i = 0; i < stroke.points.length; i++) {
            const x = offsetX + stroke.points[i].x * displayWidth * zoom;
            const y = offsetY + stroke.points[i].y * displayHeight * zoom;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }

      // Draw active brush stroke
      if (isDrawing && currentStroke.length > 1) {
        ctx.strokeStyle = 'rgba(255, 60, 60, 0.6)';
        ctx.lineWidth = brushSize * scale * zoom;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i < currentStroke.length; i++) {
          const x = offsetX + currentStroke[i].x * displayWidth * zoom;
          const y = offsetY + currentStroke[i].y * displayHeight * zoom;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.restore();
    };
    img.src = frameImageUrl;
  }, [
    frameImageUrl,
    touchPoints,
    segments,
    brushStrokes,
    brushSize,
    currentStroke,
    isDrawing,
    phase,
    resultImageUrl,
    showBeforeAfter,
    zoom,
    pan,
  ]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Redraw on window resize
  useEffect(() => {
    const handleResize = () => drawCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawCanvas]);

  // Get normalized coordinates from mouse/touch event
  const getCanvasCoords = useCallback(
    (e: { clientX: number; clientY: number }) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const container = containerRef.current;
      if (!container) return null;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      const { width: displayWidth, height: displayHeight } = canvasDimensions;
      const offsetX = (containerWidth - displayWidth * zoom) / 2 + pan.x;
      const offsetY = (containerHeight - displayHeight * zoom) / 2 + pan.y;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Normalize to 0-1 within the image area
      const normalizedX = (mouseX - offsetX) / (displayWidth * zoom);
      const normalizedY = (mouseY - offsetY) / (displayHeight * zoom);

      if (normalizedX < 0 || normalizedX > 1 || normalizedY < 0 || normalizedY > 1) {
        return null;
      }

      return { x: normalizedX, y: normalizedY };
    },
    [canvasDimensions, zoom, pan]
  );

  // Handle canvas click (point mode)
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (brushMode || isPanning || phase === 'processing' || phase === 'done') return;

      const coords = getCanvasCoords(e);
      if (!coords) return;

      const point: TouchPoint = {
        id: uuidv4(),
        x: coords.x,
        y: coords.y,
        label: e.shiftKey ? 0 : 1, // Shift+click = exclude point
      };

      addTouchPoint(point);
    },
    [brushMode, isPanning, phase, getCanvasCoords, addTouchPoint]
  );

  // Handle brush drawing
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!brushMode) return;

      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        // Middle click or Alt+click = pan
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        return;
      }

      const coords = getCanvasCoords(e);
      if (!coords) return;

      setIsDrawing(true);
      setCurrentStroke([coords]);
    },
    [brushMode, getCanvasCoords, pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
        return;
      }

      if (!isDrawing || !brushMode) return;

      const coords = getCanvasCoords(e);
      if (!coords) return;

      setCurrentStroke((prev) => [...prev, coords]);
    },
    [isDrawing, brushMode, isPanning, panStart, getCanvasCoords]
  );

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing && currentStroke.length > 1) {
      const stroke: BrushStroke = {
        points: currentStroke,
        size: brushSize,
      };
      addBrushStroke(stroke);
    }
    setIsDrawing(false);
    setCurrentStroke([]);
  }, [isDrawing, currentStroke, brushSize, isPanning, addBrushStroke]);

  // Touch events for mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];

      if (brushMode) {
        const coords = getCanvasCoords(touch);
        if (!coords) return;
        setIsDrawing(true);
        setCurrentStroke([coords]);
      } else {
        const coords = getCanvasCoords(touch);
        if (!coords || phase === 'processing' || phase === 'done') return;
        const point: TouchPoint = {
          id: uuidv4(),
          x: coords.x,
          y: coords.y,
          label: 1,
        };
        addTouchPoint(point);
      }
    },
    [brushMode, getCanvasCoords, phase, addTouchPoint]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing || !brushMode) return;
      const touch = e.touches[0];
      const coords = getCanvasCoords(touch);
      if (!coords) return;
      setCurrentStroke((prev) => [...prev, coords]);
    },
    [isDrawing, brushMode, getCanvasCoords]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      handleMouseUp();
    },
    [handleMouseUp]
  );

  // Zoom with scroll wheel
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
    },
    []
  );

  // Run segmentation
  const handleSegment = useCallback(async () => {
    if (!frameImageUrl) return;

    setIsSegmenting(true);
    setObjectRemovalError(null);

    try {
      let results;

      if (brushStrokes.length > 0) {
        results = await removalApi.segmentWithBrush(
          frameImageUrl,
          brushStrokes,
          imageDimensions.width,
          imageDimensions.height
        );
      } else if (touchPoints.length > 0) {
        results = await removalApi.segmentWithPoints(
          frameImageUrl,
          touchPoints,
          imageDimensions.width,
          imageDimensions.height
        );
      } else {
        setObjectRemovalError('Tap on objects to select them, or paint over them with the brush.');
        setIsSegmenting(false);
        return;
      }

      setSegments(results);

      // Combine all masks into one
      if (results.length > 0) {
        const combinedCanvas = document.createElement('canvas');
        combinedCanvas.width = imageDimensions.width;
        combinedCanvas.height = imageDimensions.height;
        const combinedCtx = combinedCanvas.getContext('2d')!;

        for (const seg of results) {
          const maskImg = new Image();
          await new Promise<void>((resolve) => {
            maskImg.onload = () => {
              combinedCtx.drawImage(maskImg, 0, 0, imageDimensions.width, imageDimensions.height);
              resolve();
            };
            maskImg.src = seg.maskDataUrl;
          });
        }

        setCombinedMask(combinedCanvas.toDataURL('image/png'));
      }

      setObjectRemovalPhase('segmented');
    } catch (err) {
      setObjectRemovalError(
        err instanceof Error ? err.message : 'Segmentation failed. Check backend connection.'
      );
    } finally {
      setIsSegmenting(false);
    }
  }, [
    frameImageUrl,
    touchPoints,
    brushStrokes,
    imageDimensions,
    setIsSegmenting,
    setObjectRemovalError,
    setSegments,
    setCombinedMask,
    setObjectRemovalPhase,
  ]);

  // Run object removal
  const handleRemoveObjects = useCallback(async () => {
    if (!frameImageUrl || !combinedMaskUrl) return;

    setIsRemoving(true);
    setObjectRemovalError(null);

    try {
      const result = await removalApi.removeObjects(frameImageUrl, combinedMaskUrl, {
        quality: 'high',
        feather: 0.3,
      });

      setResultImage(result.outputImageUrl);
      setObjectRemovalPhase('done');
    } catch (err) {
      setObjectRemovalError(
        err instanceof Error ? err.message : 'Object removal failed. Check backend connection.'
      );
    } finally {
      setIsRemoving(false);
    }
  }, [
    frameImageUrl,
    combinedMaskUrl,
    setIsRemoving,
    setObjectRemovalError,
    setResultImage,
    setObjectRemovalPhase,
  ]);

  const pollJobStatus = useCallback(async (jobId: string, onProgress: (value: number) => void) => {
    let attempts = 0;
    while (attempts < 120) {
      const status = await removalApi.getJobStatus(jobId);
      onProgress(status.progress);
      if (status.status === 'completed') {
        return status.outputUrl ?? null;
      }
      if (status.status === 'failed') {
        throw new Error(status.error || 'Video processing failed.');
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts += 1;
    }
    throw new Error('Video processing timed out.');
  }, []);

  const handleTrackMasks = useCallback(async () => {
    if (!video?.file || !combinedMaskUrl) return;

    setIsTracking(true);
    setObjectRemovalError(null);
    setTrackingProgress(0);

    try {
      const job = await removalApi.trackMasksInVideo(
        video.file,
        combinedMaskUrl,
        objectRemoval.frameTimestamp,
        { startTime: 0, endTime: video.duration }
      );
      const outputUrl = await pollJobStatus(job.jobId, setTrackingProgress);
      setTrackingVideoUrl(outputUrl || video.url);
    } catch (err) {
      setObjectRemovalError(
        err instanceof Error ? err.message : 'Tracking failed. Check backend connection.'
      );
    } finally {
      setIsTracking(false);
    }
  }, [
    video,
    combinedMaskUrl,
    objectRemoval.frameTimestamp,
    pollJobStatus,
    setObjectRemovalError,
  ]);

  const handleInpaintVideo = useCallback(async () => {
    if (!video?.file || !combinedMaskUrl) return;

    setIsInpaintingVideo(true);
    setObjectRemovalError(null);
    setInpaintingProgress(0);

    try {
      const job = await removalApi.removeObjectsFromVideo(
        video.file,
        combinedMaskUrl,
        objectRemoval.frameTimestamp,
        { startTime: 0, endTime: video.duration }
      );
      const outputUrl = await pollJobStatus(job.jobId, setInpaintingProgress);
      setInpaintingVideoUrl(outputUrl || video.url);
    } catch (err) {
      setObjectRemovalError(
        err instanceof Error ? err.message : 'Video inpainting failed. Check backend connection.'
      );
    } finally {
      setIsInpaintingVideo(false);
    }
  }, [
    video,
    combinedMaskUrl,
    objectRemoval.frameTimestamp,
    pollJobStatus,
    setObjectRemovalError,
  ]);

  const handleUndo = useCallback(() => {
    if (brushStrokes.length > 0) {
      // Remove last brush stroke by clearing and re-adding all but last
      clearBrushStrokes();
    } else if (touchPoints.length > 0) {
      removeTouchPoint(touchPoints[touchPoints.length - 1].id);
    }
  }, [touchPoints, brushStrokes, removeTouchPoint, clearBrushStrokes]);

  const handleClearAll = useCallback(() => {
    clearTouchPoints();
    clearBrushStrokes();
    setSegments([]);
    setCombinedMask(null);
    setResultImage(null);
    setObjectRemovalPhase('select');
    setTrackingVideoUrl(null);
    setInpaintingVideoUrl(null);
    setTrackingProgress(0);
    setInpaintingProgress(0);
  }, [
    clearTouchPoints,
    clearBrushStrokes,
    setSegments,
    setCombinedMask,
    setResultImage,
    setObjectRemovalPhase,
    setTrackingVideoUrl,
    setInpaintingVideoUrl,
    setTrackingProgress,
    setInpaintingProgress,
  ]);

  const hasSelections = touchPoints.length > 0 || brushStrokes.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Hidden video element for frame capture */}
      {video && (
        <video
          ref={videoRef}
          src={video.url}
          className="hidden"
          preload="auto"
          crossOrigin="anonymous"
        />
      )}

      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-blue-100">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={exitObjectRemoval} className="text-blue-900">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Editor
          </Button>

          <div className="h-6 w-px bg-blue-200" />

          <h2 className="text-sm font-semibold text-[#056cb8]">Video Inpainting (ProPainter)</h2>

          <Badge variant="outline" className="text-xs">
            {phase === 'select' && 'Select Frame'}
            {phase === 'segmented' && 'Mask Ready'}
            {phase === 'processing' && 'Processing...'}
            {phase === 'done' && 'Frame Done'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-blue-600 min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>

          <div className="h-6 w-px bg-blue-200" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left tool panel */}
        <div className="w-64 bg-slate-50 border-r border-blue-100 p-4 space-y-4 overflow-y-auto">
          {/* Workflow status */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-blue-900 uppercase tracking-wider">
              Workflow
            </label>
            <div className="space-y-2">
              <WorkflowRow
                label="1. Upload Video"
                status={video ? 'done' : 'pending'}
              />
              <WorkflowRow
                label="2. Select Frame & Mask"
                status={combinedMaskUrl ? 'done' : frameImageUrl ? 'active' : 'pending'}
              />
              <WorkflowRow
                label="3. Track Masks"
                status={trackingVideoUrl ? 'done' : isTracking ? 'active' : 'pending'}
              />
              <WorkflowRow
                label="4. Inpaint Video"
                status={inpaintingVideoUrl ? 'done' : isInpaintingVideo ? 'active' : 'pending'}
              />
            </div>
          </div>

          {/* Tool mode selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-blue-900 uppercase tracking-wider">
              Selection Tool
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setBrushMode(false)}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors',
                  !brushMode
                    ? 'border-[#056cb8] bg-blue-50 text-[#056cb8]'
                    : 'border-blue-200 text-blue-400 hover:border-blue-300'
                )}
              >
                <MousePointer2 className="w-5 h-5" />
                <span className="text-xs font-medium">Tap</span>
              </button>
              <button
                onClick={() => setBrushMode(true)}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors',
                  brushMode
                    ? 'border-[#056cb8] bg-blue-50 text-[#056cb8]'
                    : 'border-blue-200 text-blue-400 hover:border-blue-300'
                )}
              >
                <Paintbrush className="w-5 h-5" />
                <span className="text-xs font-medium">Brush</span>
              </button>
            </div>
          </div>

          {/* Brush size slider */}
          {brushMode && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-medium text-blue-900">Brush Size</label>
                <span className="text-xs text-blue-500">{brushSize}px</span>
              </div>
              <Slider
                value={[brushSize]}
                min={5}
                max={100}
                step={1}
                onValueChange={([val]) => setBrushSize(val)}
              />
            </div>
          )}

          {/* Instructions */}
          <div className="p-3 bg-blue-50 rounded-lg space-y-2">
            <p className="text-xs font-medium text-[#056cb8]">How to use:</p>
            {!brushMode ? (
              <ul className="text-xs text-blue-800 space-y-1">
                <li className="flex items-start gap-1">
                  <span className="text-green-500 mt-0.5">+</span>
                  <span>Tap on objects to select them</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-red-500 mt-0.5">-</span>
                  <span>Shift+tap to exclude areas</span>
                </li>
                <li className="flex items-start gap-1">
                  <Hand className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>Alt+drag to pan the view</span>
                </li>
              </ul>
            ) : (
              <ul className="text-xs text-blue-800 space-y-1">
                <li>Paint over the objects you want to remove</li>
                <li>Use the brush size slider to adjust</li>
                <li>Scroll to zoom in for precision</li>
              </ul>
            )}
          </div>

          {/* Selection info */}
          {hasSelections && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-blue-900">
                  Selections ({touchPoints.length + brushStrokes.length})
                </label>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleUndo}
                  >
                    <Undo2 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500 hover:text-red-600"
                    onClick={handleClearAll}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Point list */}
              {touchPoints.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-xs p-2 bg-white rounded border border-blue-100"
                >
                  <span className="text-blue-800">
                    Point {i + 1} ({(p.x * 100).toFixed(0)}%, {(p.y * 100).toFixed(0)}%)
                  </span>
                  <Badge variant={p.label === 1 ? 'default' : 'destructive'} className="text-[10px] h-5">
                    {p.label === 1 ? 'include' : 'exclude'}
                  </Badge>
                </div>
              ))}

              {brushStrokes.length > 0 && (
                <div className="text-xs p-2 bg-white rounded border border-blue-100 text-blue-800">
                  {brushStrokes.length} brush stroke{brushStrokes.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            {(phase === 'select' || phase === 'segmented') && (
              <Button
                onClick={handleSegment}
                disabled={!hasSelections || isSegmenting}
                className="w-full bg-[#056cb8] hover:bg-[#045a9e]"
              >
                {isSegmenting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Segmenting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {phase === 'segmented' ? 'Re-Segment' : 'Segment Objects'}
                  </>
                )}
              </Button>
            )}

            {phase === 'segmented' && combinedMaskUrl && (
              <Button
                onClick={handleRemoveObjects}
                disabled={isRemoving}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {isRemoving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Objects
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={handleTrackMasks}
              disabled={!combinedMaskUrl || !video?.file || isTracking}
              variant="outline"
              className="w-full"
            >
              {isTracking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Tracking...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Track Masks (Preview)
                </>
              )}
            </Button>

            <Button
              onClick={handleInpaintVideo}
              disabled={!combinedMaskUrl || !video?.file || isInpaintingVideo || !trackingVideoUrl}
              className="w-full bg-[#056cb8] hover:bg-[#045a9e]"
            >
              {isInpaintingVideo ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Inpainting Video...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Inpaint Video
                </>
              )}
            </Button>

            {phase === 'done' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowBeforeAfter(!showBeforeAfter)}
                  className="w-full"
                >
                  {showBeforeAfter ? 'Show Result' : 'Show Original'}
                </Button>

                <Button
                  onClick={handleClearAll}
                  variant="outline"
                  className="w-full"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Start Over
                </Button>

                <Button
                  onClick={exitObjectRemoval}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Done
                </Button>
              </>
            )}
          </div>

          {(isTracking || isInpaintingVideo) && (
            <div className="space-y-3 rounded-lg border border-blue-100 bg-white p-3">
              <p className="text-xs font-medium text-blue-900">Processing Status</p>
              {isTracking && (
                <>
                  <div className="flex justify-between text-xs text-blue-600">
                    <span>Tracking masks</span>
                    <span>{Math.round(trackingProgress)}%</span>
                  </div>
                  <Progress value={trackingProgress} className="h-2" />
                </>
              )}
              {isInpaintingVideo && (
                <>
                  <div className="flex justify-between text-xs text-blue-600">
                    <span>Inpainting video</span>
                    <span>{Math.round(inpaintingProgress)}%</span>
                  </div>
                  <Progress value={inpaintingProgress} className="h-2" />
                </>
              )}
            </div>
          )}

          {(trackingVideoUrl || inpaintingVideoUrl) && (
            <div className="space-y-3 rounded-lg border border-blue-100 bg-white p-3">
              <p className="text-xs font-medium text-blue-900">Outputs</p>
              {trackingVideoUrl && (
                <div className="space-y-1">
                  <p className="text-[11px] text-blue-500">Tracking Preview</p>
                  <video
                    src={trackingVideoUrl}
                    controls
                    className="w-full rounded border border-blue-100"
                  />
                </div>
              )}
              {inpaintingVideoUrl && (
                <div className="space-y-1">
                  <p className="text-[11px] text-blue-500">Inpainted Result</p>
                  <video
                    src={inpaintingVideoUrl}
                    controls
                    className="w-full rounded border border-blue-100"
                  />
                </div>
              )}
            </div>
          )}

          {/* Phase progress */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <StepDot active={phase === 'select'} done={phase !== 'select'} />
              <span className={cn('text-xs', phase === 'select' ? 'text-[#056cb8] font-medium' : 'text-blue-400')}>
                Select Objects
              </span>
            </div>
            <div className="ml-[7px] h-4 w-px bg-blue-200" />
            <div className="flex items-center gap-2">
              <StepDot active={phase === 'segmented'} done={phase === 'processing' || phase === 'done'} />
              <span className={cn('text-xs', phase === 'segmented' ? 'text-[#056cb8] font-medium' : 'text-blue-400')}>
                Review Segments
              </span>
            </div>
            <div className="ml-[7px] h-4 w-px bg-blue-200" />
            <div className="flex items-center gap-2">
              <StepDot active={phase === 'processing'} done={phase === 'done'} />
              <span className={cn('text-xs', phase === 'processing' ? 'text-[#056cb8] font-medium' : 'text-blue-400')}>
                Remove & Inpaint
              </span>
            </div>
            <div className="ml-[7px] h-4 w-px bg-blue-200" />
            <div className="flex items-center gap-2">
              <StepDot active={phase === 'done'} done={false} />
              <span className={cn('text-xs', phase === 'done' ? 'text-green-600 font-medium' : 'text-blue-400')}>
                Done
              </span>
            </div>
          </div>
        </div>

        {/* Main canvas area */}
        <div
          ref={containerRef}
          className="flex-1 bg-slate-900 relative overflow-hidden"
        >
          {!frameImageUrl ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                <p className="text-sm text-blue-300">Capturing frame...</p>
              </div>
            </div>
          ) : (
            <>
              <canvas
                ref={canvasRef}
                className={cn(
                  'absolute inset-0 w-full h-full',
                  brushMode ? 'cursor-crosshair' : 'cursor-pointer',
                  isPanning && 'cursor-grabbing',
                  (phase === 'processing') && 'pointer-events-none opacity-50'
                )}
                onClick={handleCanvasClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
              />

              {/* Processing overlay */}
              {(isSegmenting || isRemoving) && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                  <div className="bg-white rounded-xl p-6 shadow-xl text-center space-y-3">
                    <Loader2 className="w-10 h-10 text-[#056cb8] animate-spin mx-auto" />
                    <p className="text-sm font-medium text-blue-900">
                      {isSegmenting ? 'Running SAM segmentation...' : 'Removing objects with inpainting...'}
                    </p>
                    <p className="text-xs text-blue-500">
                      {isSegmenting
                        ? 'Analyzing selected regions'
                        : 'Filling removed areas with AI-generated content'}
                    </p>
                  </div>
                </div>
              )}

              {/* Done overlay badge */}
              {phase === 'done' && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-green-600 text-white px-3 py-1">
                    <Check className="w-3 h-3 mr-1" />
                    {showBeforeAfter ? 'Original' : 'Objects Removed'}
                  </Badge>
                </div>
              )}

              {/* Hidden mask canvas for combining masks */}
              <canvas ref={maskCanvasRef} className="hidden" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div
      className={cn(
        'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
        active && 'border-[#056cb8] bg-[#056cb8]',
        done && !active && 'border-green-500 bg-green-500',
        !active && !done && 'border-blue-300 bg-white'
      )}
    >
      {done && !active && <Check className="w-2.5 h-2.5 text-white" />}
      {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
    </div>
  );
}

function WorkflowRow({
  label,
  status,
}: {
  label: string;
  status: 'pending' | 'active' | 'done';
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className={cn('text-blue-800', status === 'pending' && 'text-blue-300')}>
        {label}
      </span>
      <span
        className={cn(
          'px-2 py-0.5 rounded-full text-[10px] font-medium',
          status === 'done' && 'bg-green-100 text-green-700',
          status === 'active' && 'bg-blue-100 text-blue-700',
          status === 'pending' && 'bg-blue-50 text-blue-400'
        )}
      >
        {status === 'done' ? 'Done' : status === 'active' ? 'In Progress' : 'Pending'}
      </span>
    </div>
  );
}
