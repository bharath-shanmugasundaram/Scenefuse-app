import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Play,
  RotateCcw,
  SkipForward,
  Trash2,
  GripVertical,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Settings,
} from 'lucide-react';
import { useEditorStore, AVAILABLE_MODELS, formatEstimatedTime } from '@/store';
import type { ExecutionStep } from '@/types';
import { StepStatus, JobStatus } from '@/types';
import { Reorder, motion } from 'framer-motion';

interface ExecutionPlanProps {
  className?: string;
}

const statusIcons: Record<StepStatus, React.ReactNode> = {
  [StepStatus.PENDING]: <div className="w-5 h-5 rounded-full border-2 border-blue-200" />,
  [StepStatus.RUNNING]: <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />,
  [StepStatus.COMPLETED]: <CheckCircle2 className="w-5 h-5 text-green-500" />,
  [StepStatus.FAILED]: <AlertCircle className="w-5 h-5 text-red-500" />,
  [StepStatus.SKIPPED]: <SkipForward className="w-5 h-5 text-blue-400" />,
  [StepStatus.ROLLBACK]: <RotateCcw className="w-5 h-5 text-yellow-500" />,
};

export function ExecutionPlanView({ className }: ExecutionPlanProps) {
  const {
    plan,
    mode,
    executeStep,
    rollbackStep,
    skipStep,
    updatePlanStep,
    removeStepFromPlan,
    reorderPlanSteps,
    approvePlan,
  } = useEditorStore();

  const [stepToDelete, setStepToDelete] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<string[]>([]);

  if (!plan) {
    return (
      <div className={cn('p-6 bg-blue-50 rounded-lg text-center', className)}>
        <Sparkles className="w-8 h-8 text-blue-400 mx-auto mb-2" />
        <p className="text-blue-900/50">
          {mode === 'ai'
            ? 'Enter a prompt to generate an execution plan'
            : 'Add steps to your manual pipeline'}
        </p>
      </div>
    );
  }

  const handleExecuteStep = async (stepId: string) => {
    await executeStep(stepId);
  };

  const handleRollback = async (stepId: string) => {
    await rollbackStep(stepId);
  };

  const handleSkip = (stepId: string) => {
    skipStep(stepId);
  };

  const handleDelete = (stepId: string) => {
    removeStepFromPlan(stepId);
    setStepToDelete(null);
  };

  const handleReorder = (newOrder: string[]) => {
    reorderPlanSteps(newOrder);
  };

  const toggleExpand = (stepId: string) => {
    setExpandedSteps((prev) =>
      prev.includes(stepId)
        ? prev.filter((id) => id !== stepId)
        : [...prev, stepId]
    );
  };

  const allCompleted = plan.steps.every(
    (s) => s.status === StepStatus.COMPLETED || s.status === StepStatus.SKIPPED
  );

  const runningStep = plan.steps.find((s) => s.status === StepStatus.RUNNING);

  return (
    <div className={cn('space-y-4', className)}>
      <Card>
        <CardHeader className="pb-3">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  Execution Plan
                </CardTitle>
                {plan.prompt && (
                  <p className="text-sm text-blue-900/50 mt-1 line-clamp-2">
                    &ldquo;{plan.prompt}&rdquo;
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-medium text-blue-900">
                  {formatEstimatedTime(plan.totalEstimatedTime)}
                </p>
                <p className="text-xs text-blue-900/50">Estimated time</p>
              </div>
            </div>
            <div>
              {plan.status === JobStatus.PENDING_APPROVAL && (
                <Button onClick={approvePlan} className="gap-2 w-full">
                  <Play className="w-4 h-4" />
                  Approve & Run
                </Button>
              )}
              {plan.status === JobStatus.EXECUTING && (
                <Button disabled className="gap-2 w-full">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running...
                </Button>
              )}
              {allCompleted && (
                <Button variant="outline" className="gap-2 w-full text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  Completed
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {plan.status === JobStatus.EXECUTING && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-blue-900/60">
                  {runningStep
                    ? `Running: ${runningStep.modelName}`
                    : 'Processing...'}
                </span>
                <span className="text-blue-900/50">
                  {plan.steps.filter((s) => s.status === StepStatus.COMPLETED).length} / {plan.steps.length}
                </span>
              </div>
              <div className="h-2 bg-blue-50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${
                      (plan.steps.filter((s) => s.status === StepStatus.COMPLETED).length /
                        plan.steps.length) *
                      100
                    }%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Reorder.Group
              axis="y"
              values={plan.steps.map((s) => s.id)}
              onReorder={handleReorder}
              className="space-y-2"
            >
              {plan.steps.map((step, index) => (
                <Reorder.Item
                  key={step.id}
                  value={step.id}
                  className="relative"
                >
                  <StepCard
                    step={step}
                    index={index}
                    isExpanded={expandedSteps.includes(step.id)}
                    onToggleExpand={() => toggleExpand(step.id)}
                    onExecute={() => handleExecuteStep(step.id)}
                    onRollback={() => handleRollback(step.id)}
                    onSkip={() => handleSkip(step.id)}
                    onDelete={() => setStepToDelete(step.id)}
                    onUpdate={(updates) => updatePlanStep(step.id, updates)}
                    canReorder={plan.status === JobStatus.PENDING_APPROVAL}
                  />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!stepToDelete}
        onOpenChange={() => setStepToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Step?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The step will be removed from the execution plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => stepToDelete && handleDelete(stepToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface StepCardProps {
  step: ExecutionStep;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onExecute: () => void;
  onRollback: () => void;
  onSkip: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<ExecutionStep>) => void;
  canReorder: boolean;
}

function StepCard({
  step,
  index,
  isExpanded,
  onToggleExpand,
  onExecute,
  onRollback,
  onSkip,
  onDelete,
  onUpdate,
  canReorder,
}: StepCardProps) {
  const model = AVAILABLE_MODELS.find((m) => m.id === step.modelType);
  const isRunning = step.status === StepStatus.RUNNING;
  const isCompleted = step.status === StepStatus.COMPLETED;
  const isPending = step.status === StepStatus.PENDING;

  return (
    <div
      className={cn(
        'border rounded-lg bg-white transition-all',
        isRunning && 'border-blue-500 ring-1 ring-blue-500',
        isCompleted && 'border-green-200 bg-green-50/30',
        step.isOptional && 'border-dashed'
      )}
    >
      <div
        className="p-3 cursor-pointer space-y-2"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          {canReorder && (
            <div className="cursor-grab active:cursor-grabbing text-blue-400">
              <GripVertical className="w-4 h-4" />
            </div>
          )}

          <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-xs font-medium text-blue-900/60 flex-shrink-0">
            {index + 1}
          </div>

          <div className="flex-shrink-0">{statusIcons[step.status]}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-blue-900">
                {step.modelName}
              </span>
              {step.isOptional && (
                <Badge variant="outline" className="text-xs">
                  Optional
                </Badge>
              )}
              {step.isRecommended && !isCompleted && (
                <Badge variant="secondary" className="text-xs">
                  Recommended
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 text-sm text-blue-900/50 flex-shrink-0">
            <Clock className="w-4 h-4" />
            {formatEstimatedTime(step.estimatedTime)}
          </div>

          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-blue-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-blue-400 flex-shrink-0" />
          )}
        </div>

        <div className="flex items-center justify-between pl-9">
          <p className="text-sm text-blue-900/50 line-clamp-2 flex-1 mr-3">{step.explanation}</p>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isPending && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onExecute();
                }}
              >
                <Play className="w-4 h-4" />
              </Button>
            )}
            {isCompleted && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onRollback();
                }}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            {isPending && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onSkip();
                }}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-red-500 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 border-t bg-blue-50/50">
          <div className="pt-3 space-y-4">
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">
                Why this step?
              </p>
              <p className="text-sm text-blue-900/60">{step.explanation}</p>
            </div>

            {model && model.parameters.length > 0 && (
              <div>
                <p className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-1">
                  <Settings className="w-3 h-3" />
                  Parameters
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            {step.dependencies.length > 0 && (
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Dependencies
                </p>
                <p className="text-sm text-blue-900/60">
                  Waits for steps: {step.dependencies.join(', ')}
                </p>
              </div>
            )}

            {step.result && (
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Result
                </p>
                <div className="text-sm text-blue-900/60 space-y-1">
                  <p>Status: {step.result.success ? 'Success' : 'Failed'}</p>
                  {step.result.processingTime && (
                    <p>Processing time: {step.result.processingTime}s</p>
                  )}
                  {step.result.error && (
                    <p className="text-red-500">Error: {step.result.error}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
        <Switch
          checked={currentValue as boolean}
          onCheckedChange={onChange}
          disabled={disabled}
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
