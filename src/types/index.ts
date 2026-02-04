// AI Video Editor - Type Definitions

// ============================================
// Core Constants (replacing enums for erasableSyntaxOnly compatibility)
// ============================================

export const AIModelType = {
  VIDEO_INPAINTING: 'video_inpainting',
  OBJECT_REMOVAL: 'object_removal',
  OBJECT_REPLACEMENT: 'object_replacement',
  SEGMENTATION_SAM3: 'segmentation_sam3',
  OBJECT_INSERTION: 'object_insertion',
  BACKGROUND_REMOVAL: 'background_removal',
  STYLE_TRANSFER: 'style_transfer',
  COLOR_CORRECTION: 'color_correction',
} as const;

export type AIModelType = typeof AIModelType[keyof typeof AIModelType];

export const StepStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped',
  ROLLBACK: 'rollback',
} as const;

export type StepStatus = typeof StepStatus[keyof typeof StepStatus];

export const ExecutionMode = {
  MANUAL: 'manual',
  AI: 'ai',
} as const;

export type ExecutionMode = typeof ExecutionMode[keyof typeof ExecutionMode];

export const JobStatus = {
  IDLE: 'idle',
  PLANNING: 'planning',
  PENDING_APPROVAL: 'pending_approval',
  EXECUTING: 'executing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PAUSED: 'paused',
} as const;

export type JobStatus = typeof JobStatus[keyof typeof JobStatus];

// ============================================
// Model Definitions
// ============================================

export interface AIModel {
  id: AIModelType;
  name: string;
  description: string;
  icon: string;
  category: 'inpainting' | 'segmentation' | 'generation' | 'correction';
  parameters: ModelParameter[];
  estimatedTime: number;
  requiresMask: boolean;
  requiresPrompt: boolean;
}

export interface ModelParameter {
  id: string;
  name: string;
  type: 'number' | 'boolean' | 'select' | 'text' | 'slider';
  defaultValue: unknown;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
  description?: string;
}

// ============================================
// Video & Timeline
// ============================================

export interface VideoFile {
  id: string;
  file: File;
  url: string;
  name: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  thumbnailUrl?: string;
}

export interface TimelineSegment {
  id: string;
  startTime: number;
  endTime: number;
  label?: string;
  color?: string;
}

export interface FrameSelection {
  frameNumber: number;
  timestamp: number;
  thumbnailUrl?: string;
}

// ============================================
// Execution Plan & Steps
// ============================================

export interface ExecutionStep {
  id: string;
  order: number;
  modelType: AIModelType;
  modelName: string;
  status: StepStatus;
  parameters: Record<string, unknown>;
  maskData?: MaskData;
  prompt?: string;
  explanation: string;
  estimatedTime: number;
  actualTime?: number;
  dependencies: string[];
  isOptional: boolean;
  isRecommended: boolean;
  inputFrameRange?: { start: number; end: number };
  outputFrameRange?: { start: number; end: number };
  result?: StepResult;
}

export interface MaskData {
  id: string;
  type: 'rectangle' | 'polygon' | 'brush' | 'sam_auto';
  coordinates: number[][];
  frameRange: { start: number; end: number };
}

export interface StepResult {
  success: boolean;
  outputUrl?: string;
  previewUrl?: string;
  processingTime: number;
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface ExecutionPlan {
  id: string;
  prompt?: string;
  steps: ExecutionStep[];
  createdAt: Date;
  updatedAt: Date;
  totalEstimatedTime: number;
  status: JobStatus;
  currentStepIndex: number;
}

// ============================================
// AI Planner
// ============================================

export interface PlannerIntent {
  action: 'remove' | 'replace' | 'insert' | 'inpaint' | 'segment' | 'correct' | 'composite';
  target?: string;
  replacement?: string;
  parameters?: Record<string, unknown>;
  confidence: number;
}

export interface PlannerAnalysis {
  intent: PlannerIntent;
  detectedObjects?: string[];
  suggestedFrameRange?: { start: number; end: number };
  complexity: 'low' | 'medium' | 'high';
  reasoning: string;
}

// ============================================
// Job & Project
// ============================================

export interface EditingJob {
  id: string;
  name: string;
  video: VideoFile;
  mode: ExecutionMode;
  plan?: ExecutionPlan;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  history: JobHistoryEntry[];
}

export interface JobHistoryEntry {
  id: string;
  timestamp: Date;
  action: string;
  stepId?: string;
  details?: string;
}

// ============================================
// UI State
// ============================================

export interface UIState {
  sidebarOpen: boolean;
  activePanel: 'upload' | 'timeline' | 'preview' | 'plan' | 'settings';
  showComparison: boolean;
  comparisonMode: 'split' | 'overlay' | 'side-by-side';
  zoomLevel: number;
  isPlaying: boolean;
  currentTime: number;
  selectedTool: AIModelType | null;
}

// ============================================
// API Types
// ============================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PlanGenerationRequest {
  prompt: string;
  videoId: string;
  currentFrame?: number;
}

export interface ExecutePlanRequest {
  planId: string;
  stepIds?: string[];
}

export interface StepUpdateRequest {
  stepId: string;
  updates: Partial<ExecutionStep>;
}
