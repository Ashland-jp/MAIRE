import { useState } from 'react';
import { Message } from '../App';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';

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
          className={`px-5 py-3 rounded-2xl backdrop-blur-sm border ${
            isUser
              ? 'bg-gray-700/40 border-gray-600/50 text-gray-100'
              : 'bg-gray-800/40 border-gray-700/50 text-gray-200'
          }`}
        >
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>

        {/* Header Stack (only for assistant messages) */}
        {!isUser && message.headerStack && message.headerStack.length > 0 && (
          <div className="w-full">
            <button
              onClick={() => setIsStackExpanded(!isStackExpanded)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/50 transition-all text-gray-300 hover:text-gray-100 text-sm"
            >
              <Layers className="size-4" />
              <span>Reasoning Chain ({message.headerStack.length} layers)</span>
              {isStackExpanded ? (
                <ChevronUp className="size-4 ml-auto" />
              ) : (
                <ChevronDown className="size-4 ml-auto" />
              )}
            </button>

            {isStackExpanded && (
              <div className="mt-2 space-y-3 p-4 rounded-lg bg-gray-800/20 border border-gray-700/50">
  {message.headerStack.map((layer, index) => (
    <div
      key={index}
      className="rounded-xl bg-gray-900/60 border border-gray-700/50 overflow-hidden shadow-md"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/70 border-b border-gray-700/50">
        <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
        <span className="text-sm font-semibold text-gray-200">
          Layer {index + 1}
        </span>
        <span className="text-sm font-mono px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          {layer.model}
        </span>
      </div>

      {/* Full scrollable response – no more cutting off */}
      <div className="max-h-96 overflow-y-auto p-4 font-mono text-sm leading-relaxed text-gray-200 whitespace-pre-wrap bg-black/30">
        {layer.response || "thinking..."}
      </div>
    </div>
  ))}

                
                <div className="pt-2 border-t border-gray-700/30">
                  <p className="text-xs text-gray-500 italic">
                    Immutable audit trail • {new Date(message.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-gray-500 px-2">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
