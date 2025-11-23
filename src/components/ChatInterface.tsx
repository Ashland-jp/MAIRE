import { useState, useRef, useEffect } from 'react';
import { Message, Topology } from '../App';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Network } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  topology: Topology;
  activeModels: number;
}

export function ChatInterface({
  messages,
  onSendMessage,
  topology,
  activeModels,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const topologyLabels = {
    'standard-chain': 'Standard Chain',
    'double-helix': 'Double Helix',
    'star-topology': 'Star Topology',
  };

  return (
    <main className="flex-1 flex flex-col relative">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-transparent to-gray-900/50 pointer-events-none" />
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 relative">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4 max-w-md">
              <div className="inline-flex p-4 rounded-2xl bg-gray-800/40 backdrop-blur-sm border border-gray-700/50">
                <Network className="size-12 text-gray-400" />
              </div>
              <div>
                <h2 className="text-gray-100 mb-2">Welcome to MAIRE</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Multi-Anchor Immutable Reasoning Engine
                </p>
                <p className="text-gray-500 text-xs mt-4">
                  Using <span className="text-gray-300">{topologyLabels[topology]}</span> with{' '}
                  <span className="text-gray-300">{activeModels} models</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-700/50 backdrop-blur-xl bg-gray-900/60 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-800/20 to-transparent pointer-events-none" />
        
        <div className="relative px-6 py-4">
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            disabled={activeModels === 0}
          />
          
          {activeModels === 0 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Please enable at least one LLM model to continue
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
