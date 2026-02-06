import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Plus,
  Play,
  Trash2,
  GripVertical,
  Settings,
  Wand2,
  Eraser,
  Replace,
  Scissors,
  PlusCircle,
  ImageOff,
  Palette,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useEditorStore, AVAILABLE_MODELS, formatEstimatedTime } from '@/store';
import type { ExecutionStep } from '@/types';
import { StepStatus, AIModelType } from '@/types';
import { Reorder } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

interface ManualPipelineProps {
  className?: string;
}

const modelIcons: Record<AIModelType, React.ReactNode> = {
  [AIModelType.VIDEO_INPAINTING]: <Wand2 className="w-5 h-5" />,
  [AIModelType.OBJECT_REMOVAL]: <Eraser className="w-5 h-5" />,
  [AIModelType.OBJECT_REPLACEMENT]: <Replace className="w-5 h-5" />,
  [AIModelType.SEGMENTATION_SAM3]: <Scissors className="w-5 h-5" />,
  [AIModelType.OBJECT_INSERTION]: <PlusCircle className="w-5 h-5" />,
  [AIModelType.BACKGROUND_REMOVAL]: <ImageOff className="w-5 h-5" />,
  [AIModelType.COLOR_CORRECTION]: <Palette className="w-5 h-5" />,
  [AIModelType.STYLE_TRANSFER]: <Sparkles className="w-5 h-5" />,
};

export function ManualPipeline({ className }: ManualPipelineProps) {
  const {
    video,
    manualSteps,
    addManualStep,
    removeManualStep,
    reorderManualSteps,
    updateManualStep,
    executeStep,
  } = useEditorStore();

  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  if (!video) {
    return (
      <div className={cn('p-6 bg-blue-50 rounded-lg text-center', className)}>
        <Settings className="w-8 h-8 text-blue-400 mx-auto mb-2" />
        <p className="text-blue-900/50">Upload a video to build your pipeline</p>
      </div>
    );
  }

  const handleAddStep = (modelType: AIModelType) => {
    const model = AVAILABLE_MODELS.find((m) => m.id === modelType);
    if (!model) return;

    const parameters: Record<string, unknown> = {};
    model.parameters.forEach((param) => {
      parameters[param.id] = param.defaultValue;
    });

    const newStep: ExecutionStep = {
      id: uuidv4(),
      order: manualSteps.length,
      modelType,
      modelName: model.name,
      status: StepStatus.PENDING,
      parameters,
      explanation: `Apply ${model.name} to the video`,
      estimatedTime: model.estimatedTime,
      dependencies: [],
      isOptional: false,
      isRecommended: true,
    };

    addManualStep(newStep);
    setIsModelDialogOpen(false);
  };

  const handleExecuteAll = async () => {
    setIsExecuting(true);
    for (const step of manualSteps) {
      if (step.status === StepStatus.PENDING) {
        await executeStep(step.id);
      }
    }
    setIsExecuting(false);
  };

  const handleReorder = (newOrder: string[]) => {
    reorderManualSteps(newOrder);
  };

  const totalEstimatedTime = manualSteps.reduce(
    (sum, step) => sum + step.estimatedTime,
    0
  );

  const allCompleted = manualSteps.every(
    (s) => s.status === StepStatus.COMPLETED || s.status === StepStatus.SKIPPED
  );

  const hasPendingSteps = manualSteps.some((s) => s.status === StepStatus.PENDING);

  return (
    <div className={cn('space-y-4', className)}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-900/60" />
                Manual Pipeline
              </CardTitle>
              <p className="text-sm text-blue-900/50 mt-1">
                Build your own editing workflow step by step
              </p>
            </div>
            <div className="flex items-center gap-3">
              {manualSteps.length > 0 && (
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-900">
                    {formatEstimatedTime(totalEstimatedTime)}
                  </p>
                  <p className="text-xs text-blue-900/50">
                    {manualSteps.length} steps
                  </p>
                </div>
              )}
              <Dialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Step
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Processing Step</DialogTitle>
                    <DialogDescription>
                      Select an AI model to add to your pipeline
                    </DialogDescription>
                  </DialogHeader>
                  <ModelSelector onSelect={handleAddStep} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {manualSteps.length === 0 ? (
            <div className="text-center py-12 bg-blue-50 rounded-lg border-2 border-dashed">
              <Settings className="w-12 h-12 text-blue-300 mx-auto mb-3" />
              <p className="text-blue-900/50 mb-2">Your pipeline is empty</p>
              <p className="text-sm text-blue-400">
                Click &ldquo;Add Step&rdquo; to start building your workflow
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Reorder.Group
                axis="y"
                values={manualSteps.map((s) => s.id)}
                onReorder={handleReorder}
                className="space-y-2"
              >
                {manualSteps.map((step, index) => (
                  <Reorder.Item
                    key={step.id}
                    value={step.id}
                    className="relative"
                  >
                    <ManualStepCard
                      step={step}
                      index={index}
                      onRemove={() => removeManualStep(step.id)}
                      onUpdate={(updates) => updateManualStep(step.id, updates)}
                      onExecute={() => executeStep(step.id)}
                    />
                  </Reorder.Item>
                ))}
              </Reorder.Group>

              {hasPendingSteps && (
                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={handleExecuteAll}
                    disabled={isExecuting}
                    className="gap-2"
                  >
                    {isExecuting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {isExecuting ? 'Running...' : 'Execute Pipeline'}
                  </Button>
                </div>
              )}

              {allCompleted && manualSteps.length > 0 && (
                <div className="pt-4 flex justify-end">
                  <Button variant="outline" className="gap-2 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    All Steps Completed
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ModelSelectorProps {
  onSelect: (modelType: AIModelType) => void;
}

function ModelSelector({ onSelect }: ModelSelectorProps) {
  const categories = {
    inpainting: 'Inpainting & Removal',
    segmentation: 'Segmentation',
    generation: 'Generation & Insertion',
    correction: 'Color & Style',
  };

  const modelsByCategory = AVAILABLE_MODELS.reduce((acc, model) => {
    if (!acc[model.category]) {
      acc[model.category] = [];
    }
    acc[model.category].push(model);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_MODELS>);

  return (
    <div className="space-y-6">
      {Object.entries(modelsByCategory).map(([category, models]) => (
        <div key={category}>
          <h4 className="text-sm font-medium text-blue-900 mb-3">
            {categories[category as keyof typeof categories]}
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => onSelect(model.id)}
                className="flex items-start gap-3 p-3 text-left border rounded-lg hover:border-blue-500 hover:bg-blue-50/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  {modelIcons[model.id]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-blue-900">
                      {model.name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      ~{formatEstimatedTime(model.estimatedTime)}
                    </Badge>
                  </div>
                  <p className="text-sm text-blue-900/50 mt-0.5">
                    {model.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {model.requiresMask && (
                      <Badge variant="secondary" className="text-xs">
                        Requires mask
                      </Badge>
                    )}
                    {model.requiresPrompt && (
                      <Badge variant="secondary" className="text-xs">
                        Requires prompt
                      </Badge>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ManualStepCardProps {
  step: ExecutionStep;
  index: number;
  onRemove: () => void;
  onUpdate: (updates: Partial<ExecutionStep>) => void;
  onExecute: () => void;
}

function ManualStepCard({
  step,
  index,
  onRemove,
  onUpdate,
  onExecute,
}: ManualStepCardProps) {
  const model = AVAILABLE_MODELS.find((m) => m.id === step.modelType);
  const isPending = step.status === StepStatus.PENDING;
  const isRunning = step.status === StepStatus.RUNNING;
  const isCompleted = step.status === StepStatus.COMPLETED;

  return (
    <div
      className={cn(
        'border rounded-lg bg-white transition-all',
        isRunning && 'border-blue-500 ring-1 ring-blue-500',
        isCompleted && 'border-green-200 bg-green-50/30'
      )}
    >
      <Accordion type="single" collapsible>
        <AccordionItem value={step.id} className="border-0">
          <div className="flex items-center gap-3 p-3">
            <div className="cursor-grab active:cursor-grabbing text-blue-400">
              <GripVertical className="w-4 h-4" />
            </div>

            <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-xs font-medium text-blue-900/60">
              {index + 1}
            </div>

            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              {modelIcons[step.modelType]}
            </div>

            <div className="flex-1 min-w-0">
              <span className="font-medium text-blue-900">{step.modelName}</span>
              <p className="text-sm text-blue-900/50 truncate">
                {formatEstimatedTime(step.estimatedTime)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isPending && (
                <Button size="sm" onClick={onExecute}>
                  <Play className="w-4 h-4" />
                </Button>
              )}
              {isRunning && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Running</span>
                </div>
              )}
              {isCompleted && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">Done</span>
                </div>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:text-red-600"
                onClick={onRemove}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <AccordionTrigger className="py-0 hover:no-underline" />
            </div>
          </div>

          <AccordionContent className="px-3 pb-3">
            <div className="pt-3 border-t space-y-4">
              {model && model.parameters.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Parameters
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {model.parameters.map((param) => (
                      <div key={param.id} className="space-y-1">
                        <label className="text-xs text-blue-900/50">
                          {param.name}
                        </label>
                        <ParameterInput
                          param={param}
                          value={step.parameters[param.id]}
                          onChange={(value) =>
                            onUpdate({
                              parameters: { ...step.parameters, [param.id]: value },
                            })
                          }
                          disabled={!isPending}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-blue-900/50 block mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={step.explanation}
                  onChange={(e) => onUpdate({ explanation: e.target.value })}
                  disabled={!isPending}
                  className="w-full px-2 py-1 text-sm border rounded"
                  placeholder="Add notes about this step..."
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

interface ParameterInputProps {
  param: {
    id: string;
    name: string;
    type: string;
    defaultValue: unknown;
    min?: number;
    max?: number;
    step?: number;
    options?: { label: string; value: string }[];
  };
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

function ParameterInput({
  param,
  value,
  onChange,
  disabled,
}: ParameterInputProps) {
  const currentValue = value !== undefined ? value : param.defaultValue;

  switch (param.type) {
    case 'boolean':
      return (
        <input
          type="checkbox"
          checked={currentValue as boolean}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="w-4 h-4"
        />
      );

    case 'select':
      return (
        <select
          value={currentValue as string}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-2 py-1 text-sm border rounded"
        >
          {param.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case 'slider':
      return (
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={param.min}
            max={param.max}
            step={param.step}
            value={currentValue as number}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            disabled={disabled}
            className="flex-1"
          />
          <span className="text-xs text-blue-900/50 w-10 text-right">
            {currentValue as number}
          </span>
        </div>
      );

    case 'text':
      return (
        <input
          type="text"
          value={(currentValue as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-2 py-1 text-sm border rounded"
          placeholder={param.name}
        />
      );

    default:
      return (
        <input
          type="number"
          value={currentValue as number}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full px-2 py-1 text-sm border rounded"
        />
      );
  }
}
