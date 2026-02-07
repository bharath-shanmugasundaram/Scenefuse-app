// Object Removal Backend API
// Connects to your Python/FastAPI backend for SAM segmentation + ProPainter inpainting

import type {
  TouchPoint,
  SegmentationResult,
  ObjectRemovalResult,
  BrushStroke,
} from '@/types';

// Configure this to point to your backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ObjectRemovalAPI {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Extract a frame from the video at the given timestamp.
   * Sends the video file and timestamp, gets back a JPEG image URL.
   */
  async extractFrame(videoFile: File, timestamp: number): Promise<string> {
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('timestamp', timestamp.toString());

    const result = await this.request<{ image_url: string; width: number; height: number }>(
      '/api/v1/extract-frame',
      { method: 'POST', body: formData }
    );

    return result.image_url;
  }

  /**
   * Run SAM segmentation on a frame image using touch point prompts.
   * The backend runs SAM3 and returns masks for the touched objects.
   */
  async segmentWithPoints(
    imageUrl: string,
    points: TouchPoint[],
    imageWidth: number,
    imageHeight: number
  ): Promise<SegmentationResult[]> {
    const result = await this.request<{ segments: SegmentationResult[] }>(
      '/api/v1/segment',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          points: points.map((p) => ({
            x: Math.round(p.x * imageWidth),
            y: Math.round(p.y * imageHeight),
            label: p.label,
          })),
          image_width: imageWidth,
          image_height: imageHeight,
        }),
      }
    );

    return result.segments;
  }

  /**
   * Run SAM segmentation using brush strokes as a mask prompt.
   */
  async segmentWithBrush(
    imageUrl: string,
    strokes: BrushStroke[],
    imageWidth: number,
    imageHeight: number
  ): Promise<SegmentationResult[]> {
    const result = await this.request<{ segments: SegmentationResult[] }>(
      '/api/v1/segment-brush',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          strokes: strokes.map((s) => ({
            points: s.points.map((p) => ({
              x: Math.round(p.x * imageWidth),
              y: Math.round(p.y * imageHeight),
            })),
            size: s.size,
          })),
          image_width: imageWidth,
          image_height: imageHeight,
        }),
      }
    );

    return result.segments;
  }

  /**
   * Remove the masked objects from the image using inpainting.
   * Sends the original image + mask, gets back the clean image.
   */
  async removeObjects(
    imageUrl: string,
    maskUrl: string,
    options: {
      quality?: 'draft' | 'standard' | 'high';
      feather?: number;
    } = {}
  ): Promise<ObjectRemovalResult> {
    const result = await this.request<ObjectRemovalResult>(
      '/api/v1/inpaint',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          mask_url: maskUrl,
          quality: options.quality || 'high',
          feather: options.feather ?? 0.3,
        }),
      }
    );

    return result;
  }

  /**
   * Process full video object removal across frames.
   * This is the ProPainter pipeline: propagate mask across frames + inpaint.
   */
  async removeObjectsFromVideo(
    videoFile: File,
    maskUrl: string,
    frameTimestamp: number,
    options: {
      startTime?: number;
      endTime?: number;
      quality?: 'draft' | 'standard' | 'high';
      temporalConsistency?: number;
    } = {}
  ): Promise<{ jobId: string; statusUrl: string }> {
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('mask_url', maskUrl);
    formData.append('frame_timestamp', frameTimestamp.toString());
    if (options.startTime !== undefined) formData.append('start_time', options.startTime.toString());
    if (options.endTime !== undefined) formData.append('end_time', options.endTime.toString());
    formData.append('quality', options.quality || 'high');
    formData.append('temporal_consistency', (options.temporalConsistency ?? 0.8).toString());

    return this.request<{ jobId: string; statusUrl: string }>(
      '/api/v1/remove-video-objects',
      { method: 'POST', body: formData }
    );
  }

  /**
   * Poll for video processing job status.
   */
  async getJobStatus(jobId: string): Promise<{
    status: 'queued' | 'processing' | 'completed' | 'failed';
    progress: number;
    outputUrl?: string;
    error?: string;
  }> {
    return this.request(`/api/v1/jobs/${jobId}`);
  }

  /**
   * Health check for the backend.
   */
  async healthCheck(): Promise<{ status: string; models: string[] }> {
    return this.request('/api/v1/health');
  }
}

export const objectRemovalApi = new ObjectRemovalAPI();

// ============================================
// Mock implementation for development without backend
// ============================================

class MockObjectRemovalAPI {
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async extractFrame(_videoFile: File, _timestamp: number): Promise<string> {
    await this.delay(300);
    // In dev mode, we extract frame from canvas directly, so this is a fallback
    return '';
  }

  async segmentWithPoints(
    _imageUrl: string,
    points: TouchPoint[],
    imageWidth: number,
    imageHeight: number
  ): Promise<SegmentationResult[]> {
    await this.delay(800);

    // Generate mock segmentation masks around each foreground point
    return points
      .filter((p) => p.label === 1)
      .map((point) => {
        const cx = point.x * imageWidth;
        const cy = point.y * imageHeight;
        const radius = Math.min(imageWidth, imageHeight) * 0.1;

        // Create a mock mask as a canvas data URL
        const canvas = document.createElement('canvas');
        canvas.width = imageWidth;
        canvas.height = imageHeight;
        const ctx = canvas.getContext('2d')!;

        // Draw an elliptical mask around the touch point
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(cx, cy, radius * 1.5, radius, 0, 0, Math.PI * 2);
        ctx.fill();

        return {
          maskDataUrl: canvas.toDataURL('image/png'),
          score: 0.92 + Math.random() * 0.06,
          boundingBox: {
            x: cx - radius * 1.5,
            y: cy - radius,
            width: radius * 3,
            height: radius * 2,
          },
        };
      });
  }

  async segmentWithBrush(
    _imageUrl: string,
    strokes: BrushStroke[],
    imageWidth: number,
    imageHeight: number
  ): Promise<SegmentationResult[]> {
    await this.delay(800);

    const canvas = document.createElement('canvas');
    canvas.width = imageWidth;
    canvas.height = imageHeight;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'white';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const stroke of strokes) {
      ctx.lineWidth = stroke.size;
      ctx.strokeStyle = 'white';
      ctx.beginPath();
      for (let i = 0; i < stroke.points.length; i++) {
        const x = stroke.points[i].x * imageWidth;
        const y = stroke.points[i].y * imageHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    return [
      {
        maskDataUrl: canvas.toDataURL('image/png'),
        score: 0.95,
        boundingBox: { x: 0, y: 0, width: imageWidth, height: imageHeight },
      },
    ];
  }

  async removeObjects(
    imageUrl: string,
    _maskUrl: string,
    _options: { quality?: string; feather?: number } = {}
  ): Promise<ObjectRemovalResult> {
    await this.delay(2000);

    // In mock mode, return the original image (real backend would inpaint)
    return {
      outputImageUrl: imageUrl,
      processingTime: 2.0,
    };
  }

  async removeObjectsFromVideo(
    _videoFile: File,
    _maskUrl: string,
    _frameTimestamp: number,
    _options: Record<string, unknown> = {}
  ): Promise<{ jobId: string; statusUrl: string }> {
    await this.delay(500);
    const jobId = `mock-job-${Date.now()}`;
    return { jobId, statusUrl: `/api/v1/jobs/${jobId}` };
  }

  async getJobStatus(_jobId: string): Promise<{
    status: 'queued' | 'processing' | 'completed' | 'failed';
    progress: number;
    outputUrl?: string;
  }> {
    return { status: 'completed', progress: 100, outputUrl: '' };
  }

  async healthCheck(): Promise<{ status: string; models: string[] }> {
    return { status: 'mock', models: ['SAM3-mock', 'ProPainter-mock'] };
  }
}

// Use the real API if VITE_API_BASE_URL is set, otherwise use mock
export const removalApi: ObjectRemovalAPI | MockObjectRemovalAPI =
  import.meta.env.VITE_API_BASE_URL
    ? new ObjectRemovalAPI()
    : new MockObjectRemovalAPI();
