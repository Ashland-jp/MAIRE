import { Settings, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

import type { Topology, AvailableModel, ModelSlot, Message } from '../App';

interface HeaderProps {
  isConfigOpen: boolean;
  onToggleConfig: () => void;
}

export function Header({ isConfigOpen, onToggleConfig }: HeaderProps) {
  return (
    <header className="relative border-b-2 border-[#FF6B35]/30 bg-black">
      {/* Technical grid pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, #FF6B35 1px, #FF6B35 2px),
                         repeating-linear-gradient(90deg, transparent, transparent 1px, #FF6B35 1px, #FF6B35 2px)`,
        backgroundSize: '20px 20px'
      }} />
      
      <div className="relative px-6 py-4">
        {/* Top label bar */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#FF6B35]/20">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 bg-[#FF6B35] text-black text-[10px] tracking-widest uppercase">
              ASHLAND-JP
            </div>
            <span className="text-[10px] text-gray-500 tracking-wider uppercase">
              SKUNKWORKS
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 border border-[#FF6B35]/30 text-[#FF6B35] text-[10px] tracking-wider">
              v1.0
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-600">
              <AlertTriangle className="size-3" />
              <span className="tracking-wider">FIELD TESTING</span>
            </div>
          </div>
        </div>
        
        {/* Main header content */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-white tracking-wider mb-1">
                MAIRE
              </h1>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Multi-Anchor Immutable Reasoning Engine
              </p>
            </div>
            
            {/* Technical specs */}
            <div className="flex items-center gap-3 pl-6 border-l border-[#FF6B35]/20">
              <div className="text-[10px]">
                <div className="text-gray-600 uppercase tracking-wider">Protocol</div>
                <div className="text-[#FF6B35]">MAIRE_v.05</div>
              </div>
              <div className="text-[10px]">
                <div className="text-gray-600 uppercase tracking-wider">Status</div>
                <div className="text-green-500">TESTING</div>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleConfig}
            className="text-gray-400 hover:text-[#FF6B35] hover:bg-[#FF6B35]/10 border border-[#FF6B35]/20"
          >
            <Settings className="size-4" />
            <span className="ml-2 text-[10px] uppercase tracking-wider">Config</span>
          </Button>
        </div>
      </div>
    </header>
  );
}