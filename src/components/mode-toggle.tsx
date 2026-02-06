import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store';
import { ExecutionMode } from '@/types';
import { Sparkles, SlidersHorizontal } from 'lucide-react';

interface ModeToggleProps {
  className?: string;
}

export function ModeToggle({ className }: ModeToggleProps) {
  const { mode, setMode, plan, manualSteps } = useEditorStore();

  const handleModeChange = (newMode: ExecutionMode) => {
    if (newMode === mode) return;

    if (newMode === ExecutionMode.MANUAL && plan && plan.steps.length > 0) {
      const confirmed = window.confirm(
        'Switching to Manual mode will clear your AI-generated plan. Continue?'
      );
      if (!confirmed) return;
    }

    if (newMode === ExecutionMode.AI && manualSteps.length > 0) {
      const confirmed = window.confirm(
        'Switching to AI mode will clear your manual pipeline. Continue?'
      );
      if (!confirmed) return;
    }

    setMode(newMode);
  };

  return (
    <div
      className={cn(
        'inline-flex items-center p-1 bg-blue-50 rounded-lg border border-blue-100',
        className
      )}
    >
      <button
        onClick={() => handleModeChange(ExecutionMode.MANUAL)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
          mode === ExecutionMode.MANUAL
            ? 'bg-white text-[#056cb8] shadow-sm'
            : 'text-blue-400 hover:text-[#056cb8]'
        )}
      >
        <SlidersHorizontal className="w-4 h-4" />
        Manual
      </button>
      <button
        onClick={() => handleModeChange(ExecutionMode.AI)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
          mode === ExecutionMode.AI
            ? 'bg-white text-[#056cb8] shadow-sm'
            : 'text-blue-400 hover:text-[#056cb8]'
        )}
      >
        <Sparkles className="w-4 h-4" />
        AI Assist
      </button>
    </div>
  );
}
