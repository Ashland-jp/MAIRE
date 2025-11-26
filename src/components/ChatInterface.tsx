import { useState, useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Network } from 'lucide-react';

import type { Topology, AvailableModel, ModelSlot, Message } from '../App';

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
    <main className="flex-1 flex flex-col relative bg-[#0a0a0a]">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, #FF6B35 1px, #FF6B35 2px),
                         repeating-linear-gradient(90deg, transparent, transparent 1px, #FF6B35 1px, #FF6B35 2px)`,
        backgroundSize: '20px 20px'
      }} />
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 relative">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-6 max-w-md">
              <div className="inline-flex p-6 bg-black border-2 border-[#FF6B35]/20">
                <Network className="size-16 text-[#FF6B35]" />
              </div>
              <div>
                <h2 className="text-white mb-2 tracking-wider">WELCOME TO MAIRE</h2>
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-4">
                  Multi-Anchor Immutable Reasoning Engine
                </p>
                <div className="p-3 bg-black border border-[#FF6B35]/20">
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider">
                    Active Configuration
                  </p>
                  <p className="text-xs text-[#FF6B35] mt-1 uppercase tracking-wider">
                    {topologyLabels[topology]} • {activeModels} Models
                  </p>
                </div>
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
      <div className="border-t-2 border-[#FF6B35]/30 bg-black relative">
        <div className="relative px-6 py-4">
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            disabled={activeModels === 0}
          />
          
          {activeModels === 0 && (
            <p className="text-[10px] text-gray-600 mt-2 text-center uppercase tracking-wider">
              ⚠ Enable at least one LLM model to continue
            </p>
          )}
        </div>
      </div>
    </main>
  );
}