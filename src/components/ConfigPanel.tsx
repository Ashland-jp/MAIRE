import { Topology, AvailableModel, ModelSlot } from '../App';
import { GripVertical, Workflow, Network, Star } from 'lucide-react';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface Props {
  isOpen: boolean;
  topology: Topology;
  onTopologyChange: (t: Topology) => void;
  availableModels: AvailableModel[];
  modelSlots: ModelSlot[];
  onModelSlotsChange: (s: ModelSlot[]) => void;
}

export function ConfigPanel({
  isOpen,
  topology,
  onTopologyChange,
  availableModels,
  modelSlots,
  onModelSlotsChange,
}: Props) {
  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    onModelSlotsChange(modelSlots.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const handleSelect = (id: string, modelId: string) => {
    onModelSlotsChange(modelSlots.map(s => s.id === id ? { ...s, selectedModelId: modelId } : s));
  };

  const handleReorder = (from: number, to: number) => {
    const newSlots = [...modelSlots];
    const [moved] = newSlots.splice(from, 1);
    newSlots.splice(to, 0, moved);
    onModelSlotsChange(newSlots);
  };

  const topologies = [
    { value: 'standard-chain', label: 'Standard Chain', icon: Workflow },
    { value: 'double-helix', label: 'Double Helix', icon: Network },
    { value: 'star-topology', label: 'Star Topology', icon: Star },
  ];

  return (
    <aside className="w-96 border-r border-gray-800 bg-gray-950/90 overflow-y-auto">
      <div className="p-8 space-y-12">

        {/* Topology */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Topology</h2>
          <div className="space-y-3">
            {topologies.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  onClick={() => onTopologyChange(t.value as Topology)}
                  className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                    topology === t.value
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Icon className="w-6 h-6" />
                    <span className="font-semibold">{t.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Model 1 – Model 5 */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Model Assignment</h2>
          <div className="space-y-5">
            {modelSlots.map((slot, i) => (
              <div
                key={slot.id}
                draggable
                onDragStart={e => e.dataTransfer.setData('idx', i.toString())}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const from = Number(e.dataTransfer.getData('idx'));
                  if (from !== i) handleReorder(from, i);
                }}
                className="bg-gray-900/70 border border-gray-700 rounded-xl p-6 hover:bg-gray-900"
              >
                <div className="flex items-center gap-5">
                  <GripVertical className="w-5 h-5 text-gray-500 cursor-grab" />

                  <div className="flex-1">
                    <h3 className="text-3xl font-black text-white">
                      Model {i + 1}
                    </h3>
                    <p className="text-xs text-gray-500">Drag to reorder</p>
                  </div>

                    <Select 
  value={slot.selectedModelId} 
  onValueChange={(value: string) => handleSelect(slot.id, value)}
>
  <SelectTrigger className="w-64 bg-gray-800 border-gray-600">
    <SelectValue>
      {availableModels.find(m => m.id === slot.selectedModelId)?.name || "Choose model"}
    </SelectValue>
  </SelectTrigger>
  <SelectContent>
    {availableModels.map(m => (
      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
    ))}
  </SelectContent>
</Select>

                  <Switch checked={slot.enabled} onCheckedChange={() => handleToggle(slot.id)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-gray-500">
          Immutable ledger • Full provenance • Truth over speed
        </p>
      </div>
    </aside>
  );
}