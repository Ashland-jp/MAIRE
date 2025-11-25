import { useState, useEffect } from "react";
import { ChatInterface } from './components/ChatInterface';
import { ConfigPanel } from './components/ConfigPanel';
import { Header } from './components/Header';

export type Topology = 'standard-chain' | 'double-helix' | 'star-topology';

export interface AvailableModel {
  id: string;
  name: string;
}

export interface ModelSlot {
  id: string;
  selectedModelId: string;
  enabled: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  headerStack?: Array<{
    model: string;
    response: string;
  }>;
}

export default function App() {
  const [topology, setTopology] = useState<Topology>('star-topology');
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [modelSlots, setModelSlots] = useState<ModelSlot[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(true);

  // Fetch real connected models from backend
  useEffect(() => {
    fetch("/maire/models")
      .then(r => r.json())
      .then((data: AvailableModel[]) => {
        const models = data.length > 0 ? data : [
          { id: "grok", name: "Grok (Stub)" },
          { id: "claude", name: "Claude (Stub)" },
          { id: "gpt-4", name: "GPT-4 (Stub)" },
        ];
        setAvailableModels(models);
      })
      .catch(() => {
        setAvailableModels([
          { id: "grok", name: "Grok (Stub)" },
          { id: "claude", name: "Claude (Stub)" },
          { id: "gpt-4", name: "GPT-4 (Stub)" },
        ]);
      });
  }, []);

  // Initialize exactly 5 slots when models load
  useEffect(() => {
    if (availableModels.length > 0 && modelSlots.length === 0) {
      const slots = Array.from({ length: 5 }, (_, i) => ({
        id: `slot${i + 1}`,
        selectedModelId: availableModels[0].id,
        enabled: i < 3, // first 3 on by default
      }));
      setModelSlots(slots);
    }
  }, [availableModels, modelSlots.length]);

  const handleSendMessage = async (content: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    const activeModelIds = modelSlots
      .filter(s => s.enabled)
      .map(s => s.selectedModelId);

    try {
      const res = await fetch('/maire/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_prompt: content,
          topology,
          models: activeModelIds,
        }),
      });

      const data = await res.json();

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.final_response || 'MAIRE complete',
        timestamp: new Date(),
        headerStack: data.header_stack,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      console.error(e);
      // graceful mock fallback
      const mockStack = activeModelIds.map(id => ({
        model: `Model ${modelSlots.findIndex(s => s.selectedModelId === id) + 1}`,
        response: `[${id}] ${content.slice(0, 80)}…`
      }));
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Running in mock mode',
        timestamp: new Date(),
        headerStack: mockStack,
      }]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex flex-col text-white">
      <Header isConfigOpen={isConfigOpen} onToggleConfig={() => setIsConfigOpen(!isConfigOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <ConfigPanel
          isOpen={isConfigOpen}
          topology={topology}
          onTopologyChange={setTopology}
          availableModels={availableModels}
          modelSlots={modelSlots}
          onModelSlotsChange={setModelSlots}
        />
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          topology={topology}
          activeModels={modelSlots.filter(s => s.enabled).length}
        />
      </div>
    </div>
  );
}