import { cn } from '@/lib/utils';
import { ModeToggle } from './mode-toggle';
import { useEditorStore } from '@/store';
import {
  Video,
  Settings,
  History,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Layers,
  Download,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { ui, setSidebarOpen, setShowComparison, video, processedVideoUrl } = useEditorStore();

  const handleDownload = () => {
    const url = processedVideoUrl || video?.url;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = processedVideoUrl
      ? `processed-${video?.name || 'video.mp4'}`
      : video?.name || 'video.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-white flex">
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 bg-gray-50 border-r border-gray-200 transition-all duration-300 z-50',
          ui.sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        <div className="h-16 flex items-center px-4 border-b border-gray-200">
          {ui.sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <Video className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">AI Editor</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center mx-auto">
              <Video className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        <nav className="p-3 space-y-1">
          <NavItem
            icon={<Video className="w-5 h-5" />}
            label="Editor"
            isActive
            collapsed={!ui.sidebarOpen}
          />
          <NavItem
            icon={<History className="w-5 h-5" />}
            label="History"
            collapsed={!ui.sidebarOpen}
          />
          <NavItem
            icon={<Settings className="w-5 h-5" />}
            label="Settings"
            collapsed={!ui.sidebarOpen}
          />
          <NavItem
            icon={<HelpCircle className="w-5 h-5" />}
            label="Help"
            collapsed={!ui.sidebarOpen}
          />
        </nav>

        <button
          onClick={() => setSidebarOpen(!ui.sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50"
        >
          {ui.sidebarOpen ? (
            <ChevronLeft className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>
      </aside>

      <main
        className={cn(
          'flex-1 transition-all duration-300',
          ui.sidebarOpen ? 'ml-64' : 'ml-16'
        )}
      >
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white">
          <div className="flex items-center gap-4">
            <ModeToggle />
            {video && (
              <>
                <button
                  onClick={() => setShowComparison(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <Layers className="w-4 h-4" />
                  Compare
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {video && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="truncate max-w-xs">{video.name}</span>
                <span className="text-gray-300">|</span>
                <span>{video.width}x{video.height}</span>
              </div>
            )}
          </div>
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  collapsed?: boolean;
}

function NavItem({ icon, label, isActive, collapsed }: NavItemProps) {
  return (
    <button
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
        isActive
          ? 'bg-gray-900 text-white'
          : 'text-gray-600 hover:bg-gray-100',
        collapsed && 'justify-center px-2'
      )}
    >
      {icon}
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}
