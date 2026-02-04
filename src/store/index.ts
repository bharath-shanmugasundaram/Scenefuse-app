import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  AIModelType,
  ExecutionMode,
  JobStatus,
  StepStatus,
} from '@/types';
import type {
  ExecutionPlan,
  ExecutionStep,
  VideoFile,
  EditingJob,
  UIState,
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// Available AI Models Configuration
// ============================================

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: AIModelType.VIDEO_INPAINTING,
    name: 'Video Inpainting',
    description: 'Remove unwanted objects and fill the background naturally using ProPainter',
    icon: 'Wand2',
    category: 'inpainting',
    estimatedTime: 45,
    requiresMask: true,
    requiresPrompt: false,
    parameters: [
      {
        id: 'quality',
        name: 'Quality',
        type: 'select',
        defaultValue: 'high',
        options: [
          { label: 'Draft (Fast)', value: 'draft' },
          { label: 'Standard', value: 'standard' },
          { label: 'High Quality', value: 'high' },
        ],
        description: 'Trade-off between quality and processing time',
      },
      {
        id: 'temporal_consistency',
        name: 'Temporal Consistency',
        type: 'slider',
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.1,
        description: 'Ensure consistency across frames',
      },
    ],
  },
  {
    id: AIModelType.OBJECT_REMOVAL,
    name: 'Object Removal',
    description: 'Detect and remove objects automatically',
    icon: 'Eraser',
    category: 'inpainting',
    estimatedTime: 30,
    requiresMask: true,
    requiresPrompt: false,
    parameters: [
      {
        id: 'auto_detect',
        name: 'Auto Detect',
        type: 'boolean',
        defaultValue: true,
        description: 'Automatically detect object boundaries',
      },
      {
        id: 'feather',
        name: 'Edge Feather',
        type: 'slider',
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.05,
        description: 'Smooth edges of removed area',
      },
    ],
  },
  {
    id: AIModelType.OBJECT_REPLACEMENT,
    name: 'Object Replacement',
    description: 'Replace objects with new content while maintaining lighting and perspective',
    icon: 'Replace',
    category: 'generation',
    estimatedTime: 60,
    requiresMask: true,
    requiresPrompt: true,
    parameters: [
      {
        id: 'prompt',
        name: 'Replacement Description',
        type: 'text',
        defaultValue: '',
        description: 'Describe what to replace the object with',
      },
      {
        id: 'preserve_lighting',
        name: 'Preserve Lighting',
        type: 'boolean',
        defaultValue: true,
        description: 'Match lighting of the original scene',
      },
    ],
  },
  {
    id: AIModelType.SEGMENTATION_SAM3,
    name: 'SAM 3 Segmentation',
    description: 'Advanced segmentation using Segment Anything Model 3',
    icon: 'Scissors',
    category: 'segmentation',
    estimatedTime: 15,
    requiresMask: false,
    requiresPrompt: false,
    parameters: [
      {
        id: 'mode',
        name: 'Segmentation Mode',
        type: 'select',
        defaultValue: 'auto',
        options: [
          { label: 'Auto (All Objects)', value: 'auto' },
          { label: 'Point Prompt', value: 'point' },
          { label: 'Box Prompt', value: 'box' },
          { label: 'Text Prompt', value: 'text' },
        ],
        description: 'How to select objects for segmentation',
      },
      {
        id: 'refine_edges',
        name: 'Refine Edges',
        type: 'boolean',
        defaultValue: true,
        description: 'Apply edge refinement',
      },
    ],
  },
  {
    id: AIModelType.OBJECT_INSERTION,
    name: 'Object Insertion',
    description: 'Insert new objects into the video with realistic blending',
    icon: 'PlusCircle',
    category: 'generation',
    estimatedTime: 90,
    requiresMask: true,
    requiresPrompt: true,
    parameters: [
      {
        id: 'prompt',
        name: 'Object Description',
        type: 'text',
        defaultValue: '',
        description: 'Describe the object to insert',
      },
      {
        id: 'position',
        name: 'Position',
        type: 'select',
        defaultValue: 'center',
        options: [
          { label: 'Center', value: 'center' },
          { label: 'Foreground', value: 'foreground' },
          { label: 'Background', value: 'background' },
        ],
        description: 'Depth placement of the object',
      },
    ],
  },
  {
    id: AIModelType.BACKGROUND_REMOVAL,
    name: 'Background Removal',
    description: 'Remove the background while keeping foreground subjects',
    icon: 'ImageOff',
    category: 'segmentation',
    estimatedTime: 25,
    requiresMask: false,
    requiresPrompt: false,
    parameters: [
      {
        id: 'subject',
        name: 'Subject Selection',
        type: 'select',
        defaultValue: 'auto',
        options: [
          { label: 'Auto-detect', value: 'auto' },
          { label: 'Person', value: 'person' },
          { label: 'Custom', value: 'custom' },
        ],
        description: 'What to keep as foreground',
      },
    ],
  },
  {
    id: AIModelType.COLOR_CORRECTION,
    name: 'Color Correction',
    description: 'Adjust colors, exposure, and tone',
    icon: 'Palette',
    category: 'correction',
    estimatedTime: 10,
    requiresMask: false,
    requiresPrompt: false,
    parameters: [
      {
        id: 'exposure',
        name: 'Exposure',
        type: 'slider',
        defaultValue: 0,
        min: -1,
        max: 1,
        step: 0.1,
        description: 'Adjust brightness',
      },
      {
        id: 'contrast',
        name: 'Contrast',
        type: 'slider',
        defaultValue: 0,
        min: -1,
        max: 1,
        step: 0.1,
        description: 'Adjust contrast',
      },
      {
        id: 'saturation',
        name: 'Saturation',
        type: 'slider',
        defaultValue: 0,
        min: -1,
        max: 1,
        step: 0.1,
        description: 'Adjust color saturation',
      },
    ],
  },
  {
    id: AIModelType.STYLE_TRANSFER,
    name: 'Style Transfer',
    description: 'Apply artistic styles to video',
    icon: 'Sparkles',
    category: 'generation',
    estimatedTime: 120,
    requiresMask: false,
    requiresPrompt: true,
    parameters: [
      {
        id: 'style',
        name: 'Style',
        type: 'select',
        defaultValue: 'cinematic',
        options: [
          { label: 'Cinematic', value: 'cinematic' },
          { label: 'Vintage', value: 'vintage' },
          { label: 'Noir', value: 'noir' },
          { label: 'Anime', value: 'anime' },
          { label: 'Custom', value: 'custom' },
        ],
        description: 'Choose a visual style',
      },
      {
        id: 'intensity',
        name: 'Intensity',
        type: 'slider',
        defaultValue: 0.7,
        min: 0,
        max: 1,
        step: 0.1,
        description: 'How strongly to apply the style',
      },
    ],
  },
];

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
// Store State Interface
// ============================================

interface EditorState {
  currentJob: EditingJob | null;
  ui: UIState;
  mode: ExecutionMode;
  video: VideoFile | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  frameSelections: FrameSelection[];
  timelineSegments: TimelineSegment[];
  plan: ExecutionPlan | null;
  manualSteps: ExecutionStep[];

  setMode: (mode: ExecutionMode) => void;
  setVideo: (video: VideoFile | null) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setDuration: (duration: number) => void;
  addFrameSelection: (selection: FrameSelection) => void;
  removeFrameSelection: (frameNumber: number) => void;
  clearFrameSelections: () => void;
  addTimelineSegment: (segment: TimelineSegment) => void;
  removeTimelineSegment: (id: string) => void;
  setPlan: (plan: ExecutionPlan | null) => void;
  updatePlanStep: (stepId: string, updates: Partial<ExecutionStep>) => void;
  reorderPlanSteps: (stepIds: string[]) => void;
  addStepToPlan: (step: ExecutionStep) => void;
  removeStepFromPlan: (stepId: string) => void;
  approvePlan: () => void;
  addManualStep: (step: ExecutionStep) => void;
  updateManualStep: (stepId: string, updates: Partial<ExecutionStep>) => void;
  removeManualStep: (stepId: string) => void;
  reorderManualSteps: (stepIds: string[]) => void;
  clearManualSteps: () => void;
  executePlan: () => Promise<void>;
  executeStep: (stepId: string) => Promise<void>;
  rollbackStep: (stepId: string) => Promise<void>;
  skipStep: (stepId: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setActivePanel: (panel: UIState['activePanel']) => void;
  setShowComparison: (show: boolean) => void;
  setComparisonMode: (mode: UIState['comparisonMode']) => void;
  setZoomLevel: (zoom: number) => void;
  setSelectedTool: (tool: AIModelType | null) => void;
  createJob: (name: string, video: VideoFile) => void;
  resetJob: () => void;
}

interface FrameSelection {
  frameNumber: number;
  timestamp: number;
  thumbnailUrl?: string;
}

interface TimelineSegment {
  id: string;
  startTime: number;
  endTime: number;
  label?: string;
  color?: string;
}

// ============================================
// Store Implementation
// ============================================

export const useEditorStore = create<EditorState>()(
  devtools(
    immer((set, get) => ({
      currentJob: null,
      ui: {
        sidebarOpen: true,
        activePanel: 'upload',
        showComparison: false,
        comparisonMode: 'split',
        zoomLevel: 1,
        isPlaying: false,
        currentTime: 0,
        selectedTool: null,
      },
      mode: ExecutionMode.MANUAL,
      video: null,
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      frameSelections: [],
      timelineSegments: [],
      plan: null,
      manualSteps: [],

      setMode: (mode) => {
        set((state) => {
          state.mode = mode;
          state.plan = null;
        });
      },

      setVideo: (video) => {
        set((state) => {
          state.video = video;
          if (video) {
            state.duration = video.duration;
            state.ui.activePanel = 'timeline';
          }
        });
      },

      setCurrentTime: (time) => {
        set((state) => {
          state.currentTime = Math.max(0, Math.min(time, state.duration));
        });
      },

      setIsPlaying: (playing) => {
        set((state) => {
          state.isPlaying = playing;
        });
      },

      setDuration: (duration) => {
        set((state) => {
          state.duration = duration;
        });
      },

      addFrameSelection: (selection) => {
        set((state) => {
          const exists = state.frameSelections.find(
            (fs: FrameSelection) => fs.frameNumber === selection.frameNumber
          );
          if (!exists) {
            state.frameSelections.push(selection);
          }
        });
      },

      removeFrameSelection: (frameNumber) => {
        set((state) => {
          state.frameSelections = state.frameSelections.filter(
            (fs: FrameSelection) => fs.frameNumber !== frameNumber
          );
        });
      },

      clearFrameSelections: () => {
        set((state) => {
          state.frameSelections = [];
        });
      },

      addTimelineSegment: (segment) => {
        set((state) => {
          state.timelineSegments.push(segment);
        });
      },

      removeTimelineSegment: (id) => {
        set((state) => {
          state.timelineSegments = state.timelineSegments.filter(
            (s: TimelineSegment) => s.id !== id
          );
        });
      },

      setPlan: (plan) => {
        set((state) => {
          state.plan = plan;
          if (plan) {
            state.ui.activePanel = 'plan';
          }
        });
      },

      updatePlanStep: (stepId, updates) => {
        set((state) => {
          if (state.plan) {
            const step = state.plan.steps.find((s: ExecutionStep) => s.id === stepId);
            if (step) {
              Object.assign(step, updates);
            }
          }
        });
      },

      reorderPlanSteps: (stepIds) => {
        set((state) => {
          if (state.plan) {
            const newSteps: ExecutionStep[] = [];
            stepIds.forEach((id, index) => {
              const step = state.plan!.steps.find((s: ExecutionStep) => s.id === id);
              if (step) {
                step.order = index;
                newSteps.push(step);
              }
            });
            state.plan.steps = newSteps;
          }
        });
      },

      addStepToPlan: (step) => {
        set((state) => {
          if (state.plan) {
            state.plan.steps.push(step);
            state.plan.totalEstimatedTime += step.estimatedTime;
          }
        });
      },

      removeStepFromPlan: (stepId) => {
        set((state) => {
          if (state.plan) {
            const step = state.plan.steps.find((s: ExecutionStep) => s.id === stepId);
            if (step) {
              state.plan.totalEstimatedTime -= step.estimatedTime;
              state.plan.steps = state.plan.steps.filter((s: ExecutionStep) => s.id !== stepId);
            }
          }
        });
      },

      approvePlan: () => {
        set((state) => {
          if (state.plan) {
            state.plan.status = JobStatus.EXECUTING;
          }
        });
      },

      addManualStep: (step) => {
        set((state) => {
          state.manualSteps.push(step);
        });
      },

      updateManualStep: (stepId, updates) => {
        set((state) => {
          const step = state.manualSteps.find((s: ExecutionStep) => s.id === stepId);
          if (step) {
            Object.assign(step, updates);
          }
        });
      },

      removeManualStep: (stepId) => {
        set((state) => {
          state.manualSteps = state.manualSteps.filter((s: ExecutionStep) => s.id !== stepId);
        });
      },

      reorderManualSteps: (stepIds) => {
        set((state) => {
          const newSteps: ExecutionStep[] = [];
          stepIds.forEach((id, index) => {
            const step = state.manualSteps.find((s: ExecutionStep) => s.id === id);
            if (step) {
              step.order = index;
              newSteps.push(step);
            }
          });
          state.manualSteps = newSteps;
        });
      },

      clearManualSteps: () => {
        set((state) => {
          state.manualSteps = [];
        });
      },

      executePlan: async () => {
        const { plan } = get();
        if (!plan) return;

        set((state) => {
          if (state.plan) {
            state.plan.status = JobStatus.EXECUTING;
          }
        });

        for (const step of plan.steps) {
          if (step.status === StepStatus.PENDING) {
            await get().executeStep(step.id);
          }
        }

        set((state) => {
          if (state.plan) {
            const allCompleted = state.plan.steps.every(
              (s: ExecutionStep) => s.status === StepStatus.COMPLETED || s.status === StepStatus.SKIPPED
            );
            state.plan.status = allCompleted ? JobStatus.COMPLETED : JobStatus.FAILED;
          }
        });
      },

      executeStep: async (stepId) => {
        set((state) => {
          const step =
            state.plan?.steps.find((s: ExecutionStep) => s.id === stepId) ||
            state.manualSteps.find((s: ExecutionStep) => s.id === stepId);
          if (step) {
            step.status = StepStatus.RUNNING;
          }
        });

        const step =
          get().plan?.steps.find((s: ExecutionStep) => s.id === stepId) ||
          get().manualSteps.find((s: ExecutionStep) => s.id === stepId);
        
        if (step) {
          await new Promise((resolve) =>
            setTimeout(resolve, step.estimatedTime * 100)
          );
        }

        set((state) => {
          const step =
            state.plan?.steps.find((s: ExecutionStep) => s.id === stepId) ||
            state.manualSteps.find((s: ExecutionStep) => s.id === stepId);
          if (step) {
            step.status = StepStatus.COMPLETED;
            step.actualTime = step.estimatedTime;
            step.result = {
              success: true,
              processingTime: step.estimatedTime,
              outputUrl: state.video?.url,
              previewUrl: state.video?.url,
            };
          }
        });
      },

      rollbackStep: async (stepId) => {
        set((state) => {
          const step =
            state.plan?.steps.find((s: ExecutionStep) => s.id === stepId) ||
            state.manualSteps.find((s: ExecutionStep) => s.id === stepId);
          if (step) {
            step.status = StepStatus.ROLLBACK;
            step.result = undefined;
          }
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));

        set((state) => {
          const step =
            state.plan?.steps.find((s: ExecutionStep) => s.id === stepId) ||
            state.manualSteps.find((s: ExecutionStep) => s.id === stepId);
          if (step) {
            step.status = StepStatus.PENDING;
          }
        });
      },

      skipStep: (stepId) => {
        set((state) => {
          const step =
            state.plan?.steps.find((s: ExecutionStep) => s.id === stepId) ||
            state.manualSteps.find((s: ExecutionStep) => s.id === stepId);
          if (step) {
            step.status = StepStatus.SKIPPED;
          }
        });
      },

      setSidebarOpen: (open) => {
        set((state) => {
          state.ui.sidebarOpen = open;
        });
      },

      setActivePanel: (panel) => {
        set((state) => {
          state.ui.activePanel = panel;
        });
      },

      setShowComparison: (show) => {
        set((state) => {
          state.ui.showComparison = show;
        });
      },

      setComparisonMode: (mode) => {
        set((state) => {
          state.ui.comparisonMode = mode;
        });
      },

      setZoomLevel: (zoom) => {
        set((state) => {
          state.ui.zoomLevel = Math.max(0.5, Math.min(3, zoom));
        });
      },

      setSelectedTool: (tool) => {
        set((state) => {
          state.ui.selectedTool = tool;
        });
      },

      createJob: (name, video) => {
        const job: EditingJob = {
          id: uuidv4(),
          name,
          video,
          mode: get().mode,
          status: JobStatus.IDLE,
          createdAt: new Date(),
          updatedAt: new Date(),
          history: [],
        };

        set((state) => {
          state.currentJob = job;
          state.video = video;
          state.duration = video.duration;
        });
      },

      resetJob: () => {
        set((state) => {
          state.currentJob = null;
          state.video = null;
          state.plan = null;
          state.manualSteps = [];
          state.frameSelections = [];
          state.timelineSegments = [];
          state.currentTime = 0;
          state.duration = 0;
          state.isPlaying = false;
          state.ui.activePanel = 'upload';
        });
      },
    })),
    { name: 'ai-video-editor-store' }
  )
);

// ============================================
// Utility Functions
// ============================================

export function formatEstimatedTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

// ============================================
// Selectors
// ============================================

export const selectCurrentStep = (state: EditorState) => {
  if (!state.plan) return null;
  return state.plan.steps[state.plan.currentStepIndex];
};

export const selectCompletedSteps = (state: EditorState) => {
  if (!state.plan) return [];
  return state.plan.steps.filter((s: ExecutionStep) => s.status === StepStatus.COMPLETED);
};

export const selectPendingSteps = (state: EditorState) => {
  if (!state.plan) return [];
  return state.plan.steps.filter((s: ExecutionStep) => s.status === StepStatus.PENDING);
};

export const selectPlanProgress = (state: EditorState) => {
  if (!state.plan || state.plan.steps.length === 0) return 0;
  const completed = state.plan.steps.filter(
    (s: ExecutionStep) => s.status === StepStatus.COMPLETED || s.status === StepStatus.SKIPPED
  ).length;
  return (completed / state.plan.steps.length) * 100;
};

export const selectModelById = (modelId: AIModelType) => {
  return AVAILABLE_MODELS.find((m) => m.id === modelId);
};
