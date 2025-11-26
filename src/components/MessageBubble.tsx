import { useState } from 'react';
import { Message } from '../App';
import { ChevronDown, ChevronUp, Layers, Lock } from 'lucide-react';
import type { Topology, AvailableModel, ModelSlot } from '../App';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [isStackExpanded, setIsStackExpanded] = useState(false);

  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Main Message */}
        <div
          className={`px-5 py-3 border transition-all ${
            isUser
              ? 'bg-[#1a1a1a] border-[#FF6B35]/30 text-gray-200'
              : 'bg-black border-[#FF6B35]/20 text-gray-300'
          }`}
        >
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>

        {/* Header Stack (only for assistant messages) */}
        {!isUser && message.headerStack && message.headerStack.length > 0 && (
          <div className="w-full">
            <button
              onClick={() => setIsStackExpanded(!isStackExpanded)}
              className="flex items-center gap-2 px-3 py-2 bg-black border border-[#FF6B35]/20 hover:border-[#FF6B35]/40 transition-all text-gray-400 hover:text-[#FF6B35] text-xs uppercase tracking-wider"
            >
              <Layers className="size-3" />
              <span>Reasoning Chain</span>
              <span className="text-[#FF6B35]">({message.headerStack.length})</span>
              {isStackExpanded ? (
                <ChevronUp className="size-3 ml-auto" />
              ) : (
                <ChevronDown className="size-3 ml-auto" />
              )}
            </button>

            {isStackExpanded && (
              <div className="mt-2 space-y-2 p-3 bg-black border-2 border-[#FF6B35]/20">
                {message.headerStack.map((layer, index) => (
                  <div
                    key={index}
                    className="p-3 bg-[#0a0a0a] border border-[#FF6B35]/20"
                  >
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#FF6B35]/10">
                      <div className="w-1.5 h-1.5 bg-[#FF6B35]" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
                      <span className="text-[9px] text-gray-600 uppercase tracking-wider">
                        Layer {index + 1}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 border border-[#FF6B35]/30 text-[#FF6B35] uppercase tracking-wider">
                        {layer.model}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">
                      {layer.response}
                    </p>
                  </div>
                ))}
                
                <div className="pt-2 border-t-2 border-[#FF6B35]/20">
                  <div className="flex items-center gap-2">
                    <Lock className="size-3 text-[#FF6B35]" />
                    <p className="text-[9px] text-gray-600 uppercase tracking-wider">
                      Immutable Audit Trail • {new Date(message.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[9px] text-gray-700 px-2 uppercase tracking-wider">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}