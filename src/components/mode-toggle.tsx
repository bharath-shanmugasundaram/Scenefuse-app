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
        'inline-flex items-center p-1 bg-gray-100 rounded-lg',
        className
      )}
    >
      <button
        onClick={() => handleModeChange(ExecutionMode.MANUAL)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
          mode === ExecutionMode.MANUAL
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
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
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        )}
      >
        <Sparkles className="w-4 h-4" />
        AI Assist
      </button>
    </div>
  );
}
