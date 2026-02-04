import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Send, Loader2, Lightbulb } from 'lucide-react';
import { useEditorStore } from '@/store';
import { generatePlanFromPrompt } from '@/lib/ai-planner';
import type { ExecutionPlan } from '@/types';

interface AIPromptInputProps {
  onPlanGenerated?: (plan: ExecutionPlan) => void;
}

const EXAMPLE_PROMPTS = [
  'Remove the person walking in the background',
  'Replace the car with a red sports car',
  'Remove the logo from the building',
  'Fix the color of the sky to be more vibrant',
  'Remove the wires and poles from the scene',
  'Add a sunset in the background',
];

export function AIPromptInput({ onPlanGenerated }: AIPromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { video, setPlan } = useEditorStore();

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!prompt.trim() || !video) return;

    setIsGenerating(true);
    
    try {
      const plan = await generatePlanFromPrompt(prompt.trim(), video);
      setPlan(plan);
      onPlanGenerated?.(plan);
    } catch (error) {
      console.error('Failed to generate plan:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
    setShowExamples(false);
    textareaRef.current?.focus();
  };

  if (!video) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg text-center">
        <Sparkles className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">Upload a video to use AI mode</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">AI Assistant</h3>
        </div>
        <span className="text-xs text-gray-500">
          Describe what you want to edit
        </span>
      </div>

      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., Remove the person walking in the background..."
          className="min-h-[120px] resize-none pr-12"
          disabled={isGenerating}
        />
        <div className="absolute bottom-3 right-3">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!prompt.trim() || isGenerating}
            className="h-8 w-8 p-0"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-right">
        Press Cmd+Enter to generate
      </p>

      {showExamples && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Lightbulb className="w-4 h-4" />
            <span>Try these examples:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                onClick={() => handleExampleClick(example)}
                className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-left"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Tip:</strong> Be specific about what you want to remove, replace, or add. 
          The AI works best with clear descriptions.
        </p>
      </div>
    </div>
  );
}
