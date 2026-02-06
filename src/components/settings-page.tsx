import { useState } from 'react';
import { Settings, Monitor, Bell, Shield, Palette, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SettingsPage() {
  const [autoSave, setAutoSave] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [highQualityPreview, setHighQualityPreview] = useState(false);
  const [autoProcess, setAutoProcess] = useState(false);
  const [outputFormat, setOutputFormat] = useState('mp4');
  const [outputQuality, setOutputQuality] = useState('high');
  const [maxResolution, setMaxResolution] = useState('4k');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#056cb8]/10 rounded-lg flex items-center justify-center">
          <Settings className="w-5 h-5 text-[#056cb8]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#056cb8]">Settings</h1>
          <p className="text-sm text-blue-900/50">Configure your editing preferences</p>
        </div>
      </div>

      <Card className="border-blue-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-[#056cb8]">
            <Monitor className="w-4 h-4" />
            General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            label="Auto-save projects"
            description="Automatically save your project every 5 minutes"
            checked={autoSave}
            onCheckedChange={setAutoSave}
          />
          <SettingRow
            label="High quality preview"
            description="Use full resolution for video preview (uses more memory)"
            checked={highQualityPreview}
            onCheckedChange={setHighQualityPreview}
          />
          <SettingRow
            label="Auto-process on plan approval"
            description="Start processing immediately when an execution plan is approved"
            checked={autoProcess}
            onCheckedChange={setAutoProcess}
          />
        </CardContent>
      </Card>

      <Card className="border-blue-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-[#056cb8]">
            <Palette className="w-4 h-4" />
            Output
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Output format</p>
              <p className="text-xs text-blue-900/50">Select the output video format</p>
            </div>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="px-3 py-1.5 text-sm border border-blue-200 rounded-md bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-[#056cb8]"
            >
              <option value="mp4">MP4</option>
              <option value="mov">MOV</option>
              <option value="webm">WebM</option>
              <option value="avi">AVI</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Output quality</p>
              <p className="text-xs text-blue-900/50">Higher quality means larger file sizes</p>
            </div>
            <select
              value={outputQuality}
              onChange={(e) => setOutputQuality(e.target.value)}
              className="px-3 py-1.5 text-sm border border-blue-200 rounded-md bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-[#056cb8]"
            >
              <option value="draft">Draft</option>
              <option value="standard">Standard</option>
              <option value="high">High</option>
              <option value="ultra">Ultra</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Max resolution</p>
              <p className="text-xs text-blue-900/50">Maximum output video resolution</p>
            </div>
            <select
              value={maxResolution}
              onChange={(e) => setMaxResolution(e.target.value)}
              className="px-3 py-1.5 text-sm border border-blue-200 rounded-md bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-[#056cb8]"
            >
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
              <option value="2k">2K</option>
              <option value="4k">4K</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-[#056cb8]">
            <Bell className="w-4 h-4" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow
            label="Processing notifications"
            description="Get notified when video processing is complete"
            checked={notifications}
            onCheckedChange={setNotifications}
          />
        </CardContent>
      </Card>

      <Card className="border-blue-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-[#056cb8]">
            <Shield className="w-4 h-4" />
            Privacy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-900/60">
            All video processing is done locally on your device. No video data is sent to external
            servers. Your projects and editing history are stored in your browser&apos;s local storage.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-2">
        <Button className="gap-2 bg-[#056cb8] hover:bg-[#045a9e]">
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}

interface SettingRowProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SettingRow({ label, description, checked, onCheckedChange }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-blue-900">{label}</p>
        <p className="text-xs text-blue-900/50">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
