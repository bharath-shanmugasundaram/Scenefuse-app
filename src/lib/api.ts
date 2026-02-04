// Mock API Layer

import {
  JobStatus,
  StepStatus,
  AIModelType,
} from '@/types';
import type {
  APIResponse,
  ExecutionPlan,
  ExecutionStep,
  PlanGenerationRequest,
  VideoFile,
} from '@/types';
import { generatePlanFromPrompt } from './ai-planner';
import { v4 as uuidv4 } from 'uuid';

class APIClient {
  private async delay(min = 200, max = 800): Promise<void> {
    const delayTime = min + Math.random() * (max - min);
    return new Promise((resolve) => setTimeout(resolve, delayTime));
  }

  private createResponse<T>(data: T, success = true): APIResponse<T> {
    return {
      success,
      data,
      message: success ? 'Success' : 'Error',
    };
  }

  private createError<T>(error: string): APIResponse<T> {
    return {
      success: false,
      error,
    };
  }

  async uploadVideo(file: File): Promise<APIResponse<VideoFile>> {
    await this.delay(500, 1500);

    const videoUrl = URL.createObjectURL(file);
    
    const video: VideoFile = {
      id: uuidv4(),
      file,
      url: videoUrl,
      name: file.name,
      duration: 30 + Math.random() * 120,
      width: 1920,
      height: 1080,
      fps: 30,
      thumbnailUrl: videoUrl,
    };

    return this.createResponse(video);
  }

  async getVideoMetadata(): Promise<APIResponse<Partial<VideoFile>>> {
    await this.delay();

    return this.createResponse({
      duration: 60,
      width: 1920,
      height: 1080,
      fps: 30,
    });
  }

  async extractFrame(timestamp: number): Promise<APIResponse<string>> {
    await this.delay(100, 300);
    return this.createResponse(`frame_${timestamp}.jpg`);
  }

  async generatePlan(request: PlanGenerationRequest): Promise<APIResponse<ExecutionPlan>> {
    await this.delay(800, 2000);

    try {
      const mockVideo: VideoFile = {
        id: request.videoId,
        file: new File([], 'mock.mp4'),
        url: '',
        name: 'mock.mp4',
        duration: 60,
        width: 1920,
        height: 1080,
        fps: 30,
      };

      const plan = await generatePlanFromPrompt(request.prompt, mockVideo);
      
      return this.createResponse(plan);
    } catch {
      return this.createError<ExecutionPlan>('Failed to generate plan');
    }
  }

  async refinePlan(
    planId: string,
    feedback: string
  ): Promise<APIResponse<ExecutionPlan>> {
    await this.delay(600, 1500);

    return this.createResponse({
      id: planId,
      prompt: feedback,
      steps: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      totalEstimatedTime: 0,
      status: JobStatus.PENDING_APPROVAL,
      currentStepIndex: 0,
    } as ExecutionPlan);
  }

  async executePlan(): Promise<APIResponse<{ jobId: string }>> {
    await this.delay(300, 800);
    return this.createResponse({ jobId: uuidv4() });
  }

  async executeStep(): Promise<APIResponse<ExecutionStep>> {
    await this.delay(500, 2000);

    const step: ExecutionStep = {
      id: uuidv4(),
      order: 0,
      modelType: AIModelType.VIDEO_INPAINTING,
      modelName: 'Video Inpainting',
      status: StepStatus.COMPLETED,
      parameters: {},
      explanation: 'Step executed successfully',
      estimatedTime: 45,
      actualTime: 42,
      dependencies: [],
      isOptional: false,
      isRecommended: true,
      result: {
        success: true,
        processingTime: 42,
        outputUrl: 'output.mp4',
        previewUrl: 'preview.jpg',
      },
    };

    return this.createResponse(step);
  }

  async getExecutionStatus(): Promise<APIResponse<{
    status: JobStatus;
    progress: number;
    currentStep?: ExecutionStep;
    completedSteps: number;
    totalSteps: number;
  }>> {
    await this.delay(100, 300);

    return this.createResponse({
      status: JobStatus.EXECUTING,
      progress: 45,
      completedSteps: 2,
      totalSteps: 5,
    });
  }

  async cancelExecution(): Promise<APIResponse<void>> {
    await this.delay();
    return this.createResponse(undefined);
  }

  async updateStep(): Promise<APIResponse<ExecutionStep>> {
    await this.delay();

    const step: ExecutionStep = {
      id: uuidv4(),
      order: 0,
      modelType: AIModelType.VIDEO_INPAINTING,
      modelName: 'Video Inpainting',
      status: StepStatus.PENDING,
      parameters: {},
      explanation: 'Updated step',
      estimatedTime: 45,
      dependencies: [],
      isOptional: false,
      isRecommended: true,
    };

    return this.createResponse(step);
  }

  async rollbackStep(): Promise<APIResponse<void>> {
    await this.delay(500, 1000);
    return this.createResponse(undefined);
  }

  async skipStep(): Promise<APIResponse<void>> {
    await this.delay();
    return this.createResponse(undefined);
  }

  async getResult(): Promise<APIResponse<{
    outputUrl: string;
    previewUrl: string;
    metadata: {
      processingTime: number;
      resolution: string;
      format: string;
    };
  }>> {
    await this.delay();

    return this.createResponse({
      outputUrl: 'output.mp4',
      previewUrl: 'preview.jpg',
      metadata: {
        processingTime: 120,
        resolution: '1920x1080',
        format: 'mp4',
      },
    });
  }

  async exportVideo(
    jobId: string,
    format: 'mp4' | 'mov' | 'webm' = 'mp4'
  ): Promise<APIResponse<{ downloadUrl: string; expiresAt: string }>> {
    await this.delay(1000, 3000);

    return this.createResponse({
      downloadUrl: `https://api.aivideoeditor.com/exports/${jobId}.${format}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  async getSystemStatus(): Promise<APIResponse<{
    status: 'healthy' | 'degraded' | 'maintenance';
    models: { name: string; status: 'available' | 'busy' | 'offline' }[];
    queueLength: number;
  }>> {
    await this.delay(50, 150);

    return this.createResponse({
      status: 'healthy',
      models: [
        { name: 'ProPainter', status: 'available' },
        { name: 'SAM 3', status: 'available' },
        { name: 'Object Removal', status: 'busy' },
        { name: 'Object Insertion', status: 'available' },
      ],
      queueLength: 3,
    });
  }
}

export const api = new APIClient();

export const queryKeys = {
  video: (id: string) => ['video', id],
  plan: (id: string) => ['plan', id],
  execution: (jobId: string) => ['execution', jobId],
  systemStatus: ['systemStatus'],
} as const;
