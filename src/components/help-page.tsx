import {
  HelpCircle,
  Wand2,
  SlidersHorizontal,
  Layers,
  Upload,
  Keyboard,
  MessageCircle,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#056cb8]/10 rounded-lg flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-[#056cb8]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#056cb8]">Help & Guide</h1>
          <p className="text-sm text-blue-900/50">Learn how to use the AI Video Editor</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <QuickStartCard
          icon={<Upload className="w-5 h-5" />}
          title="Upload Video"
          description="Drag and drop or click to upload MP4, MOV, AVI, or WebM files up to 500MB."
        />
        <QuickStartCard
          icon={<Wand2 className="w-5 h-5" />}
          title="AI Mode"
          description="Describe your edit in natural language and let AI generate an execution plan."
        />
        <QuickStartCard
          icon={<SlidersHorizontal className="w-5 h-5" />}
          title="Manual Mode"
          description="Select AI models and configure parameters step by step for full control."
        />
        <QuickStartCard
          icon={<Layers className="w-5 h-5" />}
          title="Compare Results"
          description="Use split, overlay, or side-by-side views to compare before and after."
        />
      </div>

      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-[#056cb8]">
            <BookOpen className="w-4 h-4" />
            Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-900/70">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-[#056cb8] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
            <p><strong className="text-blue-900">Upload a video</strong> &mdash; Use the upload area on the Editor page to add your video file.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-[#056cb8] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
            <p><strong className="text-blue-900">Choose a mode</strong> &mdash; Switch between AI Assist (describe what you want) or Manual (pick models yourself).</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-[#056cb8] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
            <p><strong className="text-blue-900">Configure your edit</strong> &mdash; In AI mode, type a prompt. In Manual mode, add and configure processing steps.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-[#056cb8] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
            <p><strong className="text-blue-900">Review and execute</strong> &mdash; Approve the plan and watch as each step processes your video.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-[#056cb8] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">5</span>
            <p><strong className="text-blue-900">Compare and download</strong> &mdash; Use the comparison tool and download your finished video.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-[#056cb8]">
            <Keyboard className="w-4 h-4" />
            Keyboard Shortcuts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <ShortcutRow keys="Space" action="Play / Pause video" />
            <ShortcutRow keys="Left Arrow" action="Skip back 5 seconds" />
            <ShortcutRow keys="Right Arrow" action="Skip forward 5 seconds" />
            <ShortcutRow keys="F" action="Toggle fullscreen" />
            <ShortcutRow keys="M" action="Toggle mute" />
            <ShortcutRow keys="Cmd + Enter" action="Generate AI plan" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-[#056cb8]">
            <MessageCircle className="w-4 h-4" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="formats">
              <AccordionTrigger className="text-sm text-blue-900">What video formats are supported?</AccordionTrigger>
              <AccordionContent className="text-sm text-blue-900/60">
                We support MP4, MOV, AVI, WebM, and MKV formats. The maximum file size is 500MB.
                For best results, we recommend using MP4 with H.264 encoding.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="ai-mode">
              <AccordionTrigger className="text-sm text-blue-900">How does AI mode work?</AccordionTrigger>
              <AccordionContent className="text-sm text-blue-900/60">
                AI mode analyzes your natural language prompt and automatically generates an execution
                plan with the best combination of AI models for your task. You can review, modify,
                reorder, or remove steps before approving.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="models">
              <AccordionTrigger className="text-sm text-blue-900">What AI models are available?</AccordionTrigger>
              <AccordionContent className="text-sm text-blue-900/60">
                We offer 8 AI models: Video Inpainting, Object Removal, Object Replacement,
                SAM 3 Segmentation, Object Insertion, Background Removal, Style Transfer,
                and Color Correction. Each model is optimized for specific editing tasks.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="quality">
              <AccordionTrigger className="text-sm text-blue-900">Can I adjust processing quality?</AccordionTrigger>
              <AccordionContent className="text-sm text-blue-900/60">
                Yes. Each model has configurable parameters. You can adjust quality settings
                in the step details. Higher quality takes longer to process but produces
                better results. You can also set defaults in the Settings page.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="privacy">
              <AccordionTrigger className="text-sm text-blue-900">Is my video data private?</AccordionTrigger>
              <AccordionContent className="text-sm text-blue-900/60">
                All processing is done locally in your browser. Your video files are never
                uploaded to external servers. Project data is stored in your browser&apos;s
                local storage and can be cleared at any time from the Settings page.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

interface QuickStartCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function QuickStartCard({ icon, title, description }: QuickStartCardProps) {
  return (
    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 bg-[#056cb8]/10 rounded-lg flex items-center justify-center text-[#056cb8]">
          {icon}
        </div>
        <h3 className="font-medium text-[#056cb8]">{title}</h3>
      </div>
      <p className="text-sm text-blue-900/60 pl-11">{description}</p>
    </div>
  );
}

interface ShortcutRowProps {
  keys: string;
  action: string;
}

function ShortcutRow({ keys, action }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-blue-50">
      <span className="text-blue-900/60">{action}</span>
      <kbd className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs font-mono text-[#056cb8]">
        {keys}
      </kbd>
    </div>
  );
}
