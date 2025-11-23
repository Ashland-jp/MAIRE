import { Settings } from 'lucide-react';
import { Button } from './ui/button';

interface HeaderProps {
  isConfigOpen: boolean;
  onToggleConfig: () => void;
}

export function Header({ isConfigOpen, onToggleConfig }: HeaderProps) {
  return (
    <header className="relative border-b border-gray-700/50 backdrop-blur-xl bg-gray-900/40">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-800/20 via-gray-700/20 to-gray-800/20" />
      
      <div className="relative px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-gray-100 tracking-tight">
              MAIRE
            </h1>
            <p className="text-sm text-gray-400">Multi-Anchor Immutable Reasoning Engine</p>
          </div>
          <div className="px-3 py-1 rounded-full bg-gray-800/60 backdrop-blur-sm border border-gray-700/50">
            <span className="text-xs text-gray-300">v1.0</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleConfig}
          className="text-gray-300 hover:text-gray-100 hover:bg-gray-800/60"
        >
          <Settings className="size-4" />
        </Button>
      </div>
    </header>
  );
}
