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
              <div className="mt-2 space-y-2 p-4 rounded-lg bg-gray-800/20 border border-gray-700/50">
                {message.headerStack.map((layer, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-gray-900/40 border border-gray-700/30"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs text-gray-400">
                        Layer {index + 1}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-300">
                        {layer.model}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {layer.response}
                    </p>
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
