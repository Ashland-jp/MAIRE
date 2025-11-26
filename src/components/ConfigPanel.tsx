// src/components/ConfigPanel.tsx
import type { Topology, AvailableModel, ModelSlot } from '../App';
import { GripVertical, Workflow, Network, Star } from 'lucide-react';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface ConfigPanelProps {
  isOpen: boolean;
  topology: Topology;
  onTopologyChange: (t: Topology) => void;
  availableModels: AvailableModel[];
  modelSlots: ModelSlot[];
  onModelSlotsChange: (slots: ModelSlot[]) => void;
}

export function ConfigPanel({
  isOpen,
  topology,
  onTopologyChange,
  availableModels,
  modelSlots,
  onModelSlotsChange,
}: ConfigPanelProps) {
  if (!isOpen) return null;

  const handleToggleSlot = (id: string) => {
    onModelSlotsChange(
      modelSlots.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleSelectModel = (id: string, modelId: string) => {
    onModelSlotsChange(
      modelSlots.map((s) => (s.id === id ? { ...s, selectedModelId: modelId } : s))
    );
  };

  const handleReorder = (dragIndex: number, dropIndex: number) => {
    const newSlots = [...modelSlots];
    const [moved] = newSlots.splice(dragIndex, 1);
    newSlots.splice(dropIndex, 0, moved);
    onModelSlotsChange(newSlots);
  };

  const topologies = [
    { value: 'standard-chain' as const, label: 'Standard Chain', icon: Workflow },
    { value: 'double-helix' as const, label: 'Double Helix', icon: Network },
    { value: 'star-topology' as const, label: 'Star Topology', icon: Star, badge: 'v3' },
  ];

  return (
    <aside className="w-96 border-r border-gray-800 bg-gray-950/95 backdrop-blur-xl overflow-y-auto">
      <div className="p-8 space-y-12">

        {/* Topology Selector */}
        <section>
          <h2 className="text-2xl font-black text-white mb-6 tracking-tight">Topology</h2>
          <div className="space-y-3">
            {topologies.map((t) => {
              const Icon = t.icon;
              const active = topology === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => onTopologyChange(t.value)}
                  className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                    active
                      ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Icon className={`w-6 h-6 ${active ? 'text-orange-400' : 'text-gray-500'}`} />
                    <div>
                      <div className="font-bold text-white">{t.label}</div>
                      {t.badge && <span className="text-xs text-orange-400">← {t.badge}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Model Slots */}
        <section>
          <h2 className="text-2xl font-black text-white mb-6 tracking-tight">
            Model Assignment
          </h2>
          <div className="space-y-5">
            {modelSlots.map((slot, index) => (
              <div
                key={slot.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('index', index.toString())}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = Number(e.dataTransfer.getData('index'));
                  if (from !== index) handleReorder(from, index);
                }}
                className="bg-gray-900/70 border border-gray-700 rounded-xl p-6 hover:border-orange-500/50 transition-all group"
              >
                <div className="flex items-center gap-5">
                  <GripVertical className="w-5 h-5 text-gray-600 group-hover:text-orange-400 cursor-grab active:cursor-grabbing" />

                  <div className="flex-1">
                    <h3 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                      Model {index + 1}
                    </h3>
                    <p className="text-xs text-gray-500">Drag to reorder</p>
                  </div>

                  <Select
                    value={slot.selectedModelId}
                    onValueChange={(value: string) => handleSelectModel(slot.id, value)}
                  >
                    <SelectTrigger className="w-64 bg-gray-800 border-gray-600 text-gray-100">
                      <SelectValue>
                        {availableModels.find((m) => m.id === slot.selectedModelId)?.name || 'Choose model'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Switch
                    checked={slot.enabled}
                    onCheckedChange={() => handleToggleSlot(slot.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="text-center text-xs text-gray-500 pt-8 border-t border-gray-800">
          Immutable provenance • Full ledger • Truth over speed
        </footer>
      </div>
    </aside>
  );
}