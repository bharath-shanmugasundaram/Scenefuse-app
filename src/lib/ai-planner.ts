// AI Planner - Mock SLM (Small Language Model) Logic

import {
  AIModelType,
  JobStatus,
  StepStatus,
} from '@/types';
import type {
  ExecutionPlan,
  ExecutionStep,
  PlannerAnalysis,
  PlannerIntent,
  VideoFile,
} from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { AVAILABLE_MODELS } from '@/store';

// Intent Recognition Patterns
interface IntentPattern {
  patterns: RegExp[];
  intent: PlannerIntent['action'];
  confidence: number;
  extractTarget?: (prompt: string) => string | undefined;
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    patterns: [
      /remove\s+(?:the\s+)?(.+)/i,
      /delete\s+(?:the\s+)?(.+)/i,
      /erase\s+(?:the\s+)?(.+)/i,
      /get\s+rid\s+of\s+(?:the\s+)?(.+)/i,
      /take\s+out\s+(?:the\s+)?(.+)/i,
    ],
    intent: 'remove',
    confidence: 0.9,
    extractTarget: (prompt) => {
      const match = prompt.match(/(?:remove|delete|erase|get rid of|take out)\s+(?:the\s+)?(.+)/i);
      return match?.[1]?.trim();
    },
  },
  {
    patterns: [
      /replace\s+(?:the\s+)?(.+?)\s+with\s+(.+)/i,
      /swap\s+(?:the\s+)?(.+?)\s+for\s+(.+)/i,
      /change\s+(?:the\s+)?(.+?)\s+to\s+(.+)/i,
    ],
    intent: 'replace',
    confidence: 0.92,
    extractTarget: (prompt) => {
      const match = prompt.match(/(?:replace|swap|change)\s+(?:the\s+)?(.+?)\s+(?:with|for|to)\s+(.+)/i);
      return match?.[1]?.trim();
    },
  },
  {
    patterns: [
      /add\s+(?:a\s+)?(.+)/i,
      /insert\s+(?:a\s+)?(.+)/i,
      /put\s+(?:a\s+)?(.+)/i,
      /place\s+(?:a\s+)?(.+)/i,
    ],
    intent: 'insert',
    confidence: 0.85,
    extractTarget: (prompt) => {
      const match = prompt.match(/(?:add|insert|put|place)\s+(?:a\s+)?(.+)/i);
      return match?.[1]?.trim();
    },
  },
  {
    patterns: [
      /inpaint\s+(?:the\s+)?(.+)/i,
      /fill\s+(?:the\s+)?(.+)/i,
      /fix\s+(?:the\s+)?(.+)/i,
      /repair\s+(?:the\s+)?(.+)/i,
    ],
    intent: 'inpaint',
    confidence: 0.88,
    extractTarget: (prompt) => {
      const match = prompt.match(/(?:inpaint|fill|fix|repair)\s+(?:the\s+)?(.+)/i);
      return match?.[1]?.trim();
    },
  },
  {
    patterns: [
      /segment\s+(?:the\s+)?(.+)/i,
      /isolate\s+(?:the\s+)?(.+)/i,
      /mask\s+(?:the\s+)?(.+)/i,
      /select\s+(?:the\s+)?(.+)/i,
    ],
    intent: 'segment',
    confidence: 0.87,
    extractTarget: (prompt) => {
      const match = prompt.match(/(?:segment|isolate|mask|select)\s+(?:the\s+)?(.+)/i);
      return match?.[1]?.trim();
    },
  },
  {
    patterns: [
      /correct\s+(?:the\s+)?(.+)/i,
      /adjust\s+(?:the\s+)?(.+)/i,
      /fix\s+(?:the\s+)?color/i,
      /enhance\s+(?:the\s+)?(.+)/i,
      /improve\s+(?:the\s+)?(.+)/i,
    ],
    intent: 'correct',
    confidence: 0.82,
    extractTarget: (prompt) => {
      const match = prompt.match(/(?:correct|adjust|enhance|improve)\s+(?:the\s+)?(.+)/i);
      return match?.[1]?.trim();
    },
  },
  {
    patterns: [
      /composite\s+(?:the\s+)?(.+)/i,
      /combine\s+(?:the\s+)?(.+)/i,
      /merge\s+(?:the\s+)?(.+)/i,
      /blend\s+(?:the\s+)?(.+)/i,
    ],
    intent: 'composite',
    confidence: 0.8,
    extractTarget: (prompt) => {
      const match = prompt.match(/(?:composite|combine|merge|blend)\s+(?:the\s+)?(.+)/i);
      return match?.[1]?.trim();
    },
  },
];

const COMMON_OBJECTS = [
  'person', 'people', 'man', 'woman', 'child', 'car', 'vehicle', 'truck',
  'building', 'house', 'tree', 'sky', 'ground', 'road', 'water', 'sign',
  'pole', 'wire', 'shadow', 'reflection', 'logo', 'text', 'glare', 'noise',
  'background', 'foreground', 'subject', 'object', 'item', 'product',
];

// AI Planner Class
export class AIPlanner {
  private video: VideoFile;

  constructor(video: VideoFile) {
    this.video = video;
  }

  analyzePrompt(prompt: string): PlannerAnalysis {
    // Video metadata available for analysis
    void this.video.duration;
    void this.video.width;
    void this.video.height;
    
    const normalizedPrompt = prompt.toLowerCase().trim();
    
    let bestMatch: { intent: PlannerIntent['action']; confidence: number; target?: string } | null = null;
    
    for (const pattern of INTENT_PATTERNS) {
      for (const regex of pattern.patterns) {
        if (regex.test(normalizedPrompt)) {
          const target = pattern.extractTarget?.(normalizedPrompt);
          if (!bestMatch || pattern.confidence > bestMatch.confidence) {
            bestMatch = {
              intent: pattern.intent,
              confidence: pattern.confidence,
              target,
            };
          }
        }
      }
    }

    const detectedObjects = COMMON_OBJECTS.filter((obj) =>
      normalizedPrompt.includes(obj)
    );

    let complexity: PlannerAnalysis['complexity'] = 'low';
    if (normalizedPrompt.length > 100 || detectedObjects.length > 3) {
      complexity = 'high';
    } else if (normalizedPrompt.length > 50 || detectedObjects.length > 1) {
      complexity = 'medium';
    }

    const reasoning = this.generateReasoning(
      bestMatch?.intent || 'inpaint',
      bestMatch?.target,
      detectedObjects,
      complexity
    );

    return {
      intent: {
        action: bestMatch?.intent || 'inpaint',
        target: bestMatch?.target,
        confidence: bestMatch?.confidence || 0.6,
      },
      detectedObjects: detectedObjects.length > 0 ? detectedObjects : undefined,
      complexity,
      reasoning,
    };
  }

  private generateReasoning(
    action: PlannerIntent['action'],
    target: string | undefined,
    objects: string[],
    complexity: PlannerAnalysis['complexity']
  ): string {
    const actionDescriptions: Record<string, string> = {
      remove: 'remove an object from the video',
      replace: 'replace one object with another',
      insert: 'add a new object to the scene',
      inpaint: 'fill in or repair a region',
      segment: 'isolate and mask specific objects',
      correct: 'adjust colors or exposure',
      composite: 'combine multiple elements',
    };

    let reasoning = `I detected intent to ${actionDescriptions[action] || 'process the video'}.`;
    
    if (target) {
      reasoning += ` Target: "${target}".`;
    }
    
    if (objects.length > 0) {
      reasoning += ` Detected objects: ${objects.join(', ')}.`;
    }
    
    reasoning += ` Complexity: ${complexity} (based on prompt length and object count).`;
    
    return reasoning;
  }

  generatePlan(prompt: string, analysis: PlannerAnalysis): ExecutionPlan {
    const steps: ExecutionStep[] = [];
    const { intent } = analysis;

    switch (intent.action) {
      case 'remove':
        steps.push(...this.buildRemovalPlan(intent));
        break;
      case 'replace':
        steps.push(...this.buildReplacementPlan(intent));
        break;
      case 'insert':
        steps.push(...this.buildInsertionPlan(intent));
        break;
      case 'inpaint':
        steps.push(...this.buildInpaintingPlan(intent));
        break;
      case 'segment':
        steps.push(...this.buildSegmentationPlan(intent));
        break;
      case 'correct':
        steps.push(...this.buildCorrectionPlan(intent));
        break;
      case 'composite':
        steps.push(...this.buildCompositePlan());
        break;
      default:
        steps.push(...this.buildDefaultPlan());
    }

    const totalEstimatedTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0);

    return {
      id: uuidv4(),
      prompt,
      steps,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalEstimatedTime,
      status: JobStatus.PENDING_APPROVAL,
      currentStepIndex: 0,
    };
  }

  private buildRemovalPlan(intent: PlannerIntent): ExecutionStep[] {
    const steps: ExecutionStep[] = [];

    steps.push(this.createStep({
      modelType: AIModelType.SEGMENTATION_SAM3,
      explanation: `First, I'll use SAM 3 to precisely segment "${intent.target}". This creates an accurate mask for removal.`,
      parameters: {
        mode: 'auto',
        refine_edges: true,
      },
      isRecommended: true,
    }));

    steps.push(this.createStep({
      modelType: AIModelType.OBJECT_REMOVAL,
      explanation: `Now I'll remove the segmented object using intelligent inpainting to fill the background naturally.`,
      parameters: {
        auto_detect: false,
        feather: 0.3,
      },
      dependencies: [steps[0].id],
      isRecommended: true,
    }));

    return steps;
  }

  private buildReplacementPlan(intent: PlannerIntent): ExecutionStep[] {
    const steps: ExecutionStep[] = [];

    steps.push(this.createStep({
      modelType: AIModelType.SEGMENTATION_SAM3,
      explanation: `I'll start by segmenting "${intent.target}" to create a precise mask for replacement.`,
      parameters: {
        mode: 'auto',
        refine_edges: true,
      },
      isRecommended: true,
    }));

    const replacement = intent.replacement || 'new object';
    
    steps.push(this.createStep({
      modelType: AIModelType.OBJECT_REPLACEMENT,
      explanation: `Now I'll replace the segmented area with "${replacement}" while preserving lighting and perspective.`,
      parameters: {
        prompt: replacement,
        preserve_lighting: true,
      },
      dependencies: [steps[0].id],
      isRecommended: true,
    }));

    return steps;
  }

  private buildInsertionPlan(intent: PlannerIntent): ExecutionStep[] {
    const steps: ExecutionStep[] = [];

    steps.push(this.createStep({
      modelType: AIModelType.SEGMENTATION_SAM3,
      explanation: `I'll analyze the scene structure to determine optimal placement for "${intent.target}".`,
      parameters: {
        mode: 'auto',
        refine_edges: true,
      },
      isOptional: true,
      isRecommended: true,
    }));

    steps.push(this.createStep({
      modelType: AIModelType.OBJECT_INSERTION,
      explanation: `I'll insert "${intent.target}" into the scene with realistic lighting and shadows.`,
      parameters: {
        prompt: intent.target || '',
        position: 'center',
      },
      dependencies: [steps[0].id],
      isRecommended: true,
    }));

    return steps;
  }

  private buildInpaintingPlan(intent: PlannerIntent): ExecutionStep[] {
    const steps: ExecutionStep[] = [];

    steps.push(this.createStep({
      modelType: AIModelType.VIDEO_INPAINTING,
      explanation: `I'll use ProPainter to inpaint "${intent.target || 'the specified region'}" with high-quality, temporally consistent results.`,
      parameters: {
        quality: 'standard',
        temporal_consistency: 0.8,
      },
      isRecommended: true,
    }));

    return steps;
  }

  private buildSegmentationPlan(intent: PlannerIntent): ExecutionStep[] {
    const steps: ExecutionStep[] = [];

    steps.push(this.createStep({
      modelType: AIModelType.SEGMENTATION_SAM3,
      explanation: `I'll segment "${intent.target || 'the specified objects'}" using SAM 3 for precise isolation.`,
      parameters: {
        mode: intent.target ? 'text' : 'auto',
        refine_edges: true,
      },
      isRecommended: true,
    }));

    return steps;
  }

  private buildCorrectionPlan(intent: PlannerIntent): ExecutionStep[] {
    const steps: ExecutionStep[] = [];

    steps.push(this.createStep({
      modelType: AIModelType.COLOR_CORRECTION,
      explanation: `I'll apply color correction to adjust ${intent.target || 'the video'} with fine-tuned parameters.`,
      parameters: {
        exposure: 0,
        contrast: 0.1,
        saturation: 0,
      },
      isRecommended: true,
    }));

    return steps;
  }

  private buildCompositePlan(): ExecutionStep[] {
    const steps: ExecutionStep[] = [];

    steps.push(this.createStep({
      modelType: AIModelType.SEGMENTATION_SAM3,
      explanation: `I'll start by segmenting the elements that need to be composited.`,
      parameters: {
        mode: 'auto',
        refine_edges: true,
      },
      isRecommended: true,
    }));

    steps.push(this.createStep({
      modelType: AIModelType.VIDEO_INPAINTING,
      explanation: `Then I'll blend the composited elements with the background for seamless integration.`,
      parameters: {
        quality: 'high',
        temporal_consistency: 0.9,
      },
      dependencies: [steps[0].id],
      isRecommended: true,
    }));

    return steps;
  }

  private buildDefaultPlan(): ExecutionStep[] {
    return [
      this.createStep({
        modelType: AIModelType.VIDEO_INPAINTING,
        explanation: `I'll apply general video inpainting to address your request.`,
        parameters: {
          quality: 'standard',
          temporal_consistency: 0.7,
        },
        isRecommended: true,
      }),
    ];
  }

  private createStep({
    modelType,
    explanation,
    parameters,
    dependencies = [],
    isOptional = false,
    isRecommended = false,
  }: {
    modelType: AIModelType;
    explanation: string;
    parameters: Record<string, unknown>;
    dependencies?: string[];
    isOptional?: boolean;
    isRecommended?: boolean;
  }): ExecutionStep {
    const model = AVAILABLE_MODELS.find((m) => m.id === modelType)!;
    
    return {
      id: uuidv4(),
      order: 0,
      modelType,
      modelName: model.name,
      status: StepStatus.PENDING,
      parameters,
      explanation,
      estimatedTime: model.estimatedTime,
      dependencies,
      isOptional,
      isRecommended,
    };
  }
}

// Utility Functions
export function createPlanner(video: VideoFile): AIPlanner {
  return new AIPlanner(video);
}

export async function generatePlanFromPrompt(
  prompt: string,
  video: VideoFile
): Promise<ExecutionPlan> {
  const planner = createPlanner(video);
  const analysis = planner.analyzePrompt(prompt);
  
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700));
  
  return planner.generatePlan(prompt, analysis);
}

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
