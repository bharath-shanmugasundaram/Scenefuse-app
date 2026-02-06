import { Layout } from '@/components/layout';
import { VideoUpload } from '@/components/video-upload';
import { VideoPlayer } from '@/components/video-player';
import { Timeline } from '@/components/timeline';
import { AIPromptInput } from '@/components/ai-prompt-input';
import { ExecutionPlanView } from '@/components/execution-plan';
import { ManualPipeline } from '@/components/manual-pipeline';
import { ComparisonView } from '@/components/comparison-view';
import { useEditorStore } from '@/store';
import { ExecutionMode } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Wand2, Settings, Layers } from 'lucide-react';

function App() {
  const { video, mode, ui, setShowComparison } = useEditorStore();

  return (
    <Layout>
      <div className="max-w-screen-2xl mx-auto space-y-6">
        {!video && (
          <div className="space-y-8">
            <div className="text-center space-y-4 py-12">
              <h1 className="text-4xl font-bold text-gray-900">
                AI-Powered Video Editing
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Remove objects, inpaint backgrounds, and enhance your videos with 
                state-of-the-art AI models. Choose between AI-assisted or manual workflow.
              </p>
            </div>

            <VideoUpload />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
              <FeatureCard
                icon={<Wand2 className="w-6 h-6" />}
                title="AI Mode"
                description="Describe what you want in natural language. Our AI planner will generate an optimized execution plan."
              />
              <FeatureCard
                icon={<Settings className="w-6 h-6" />}
                title="Manual Mode"
                description="Build your own pipeline by selecting and configuring AI models step by step."
              />
              <FeatureCard
                icon={<Layers className="w-6 h-6" />}
                title="Compare Results"
                description="Side-by-side, split-screen, or overlay comparison to see before and after."
              />
            </div>
          </div>
        )}

        {video && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0 space-y-4">
              <div className="bg-black rounded-lg overflow-hidden">
                <VideoPlayer url={video.url} className="aspect-video" />
              </div>

              <Timeline />
            </div>

            <div className="w-full lg:w-[480px] lg:flex-shrink-0 space-y-4">
              <ScrollArea className="h-[calc(100vh-8rem)]">
                <div className="space-y-4 pr-4">
                  {mode === ExecutionMode.AI ? (
                    <>
                      <AIPromptInput />

                      <Separator />

                      <ExecutionPlanView />
                    </>
                  ) : (
                    <>
                      <ManualPipeline />
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>

      <Dialog open={ui.showComparison} onOpenChange={setShowComparison}>
        <DialogContent className="w-[95vw] w-full max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Before & After Comparison
            </DialogTitle>
          </DialogHeader>
          <ComparisonView />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="p-6 bg-gray-50 rounded-lg text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-gray-700">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

export default App;
