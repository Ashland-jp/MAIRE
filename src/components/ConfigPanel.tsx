import { Topology, LLMModel } from '../App';
import { GripVertical, Network, Workflow, Star } from 'lucide-react';
import { Label } from './ui/label';
import { Switch } from './ui/switch';

interface ConfigPanelProps {
  isOpen: boolean;
  topology: Topology;
  onTopologyChange: (topology: Topology) => void;
  models: LLMModel[];
  onModelsChange: (models: LLMModel[]) => void;
}

export function ConfigPanel({
  isOpen,
  topology,
  onTopologyChange,
  models,
  onModelsChange,
}: ConfigPanelProps) {
  const handleToggleModel = (id: string) => {
    onModelsChange(
      models.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  };

  const handleReorderModel = (fromIndex: number, toIndex: number) => {
    const newModels = [...models];
    const [removed] = newModels.splice(fromIndex, 1);
    newModels.splice(toIndex, 0, removed);
    onModelsChange(newModels);
  };

  if (!isOpen) return null;

  const topologyOptions = [
    {
      value: 'standard-chain' as Topology,
      label: 'Standard Chain',
      icon: Workflow,
      description: 'Forward → Reverse pass',
    },
    {
      value: 'double-helix' as Topology,
      label: 'Double Helix',
      icon: Network,
      description: 'Simultaneous chains',
      badge: 'v2.0',
    },
    {
      value: 'star-topology' as Topology,
      label: 'Star Topology',
      icon: Star,
      description: 'N parallel chains',
      badge: 'v3.0',
    },
  ];

  return (
    <aside className="w-80 border-r border-gray-700/50 backdrop-blur-xl bg-gray-900/40 overflow-y-auto">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-800/10 to-transparent pointer-events-none" />
      
      <div className="relative p-6 space-y-8">
        {/* Topology Selection */}
        <div className="space-y-4">
          <div>
            <h3 className="text-gray-100 mb-1">Reasoning Topology</h3>
            <p className="text-xs text-gray-400">Choose execution pattern</p>
          </div>

          <div className="space-y-2">
            {topologyOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = topology === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => onTopologyChange(option.value)}
                  className={`w-full p-4 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-gray-800/60 border-gray-600 shadow-lg shadow-gray-900/50'
                      : 'bg-gray-800/20 border-gray-700/50 hover:bg-gray-800/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`size-5 mt-0.5 ${isSelected ? 'text-gray-200' : 'text-gray-400'}`} />
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className={`${isSelected ? 'text-gray-100' : 'text-gray-300'}`}>
                          {option.label}
                        </span>
                        {option.badge && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-400">
                            {option.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* LLM Configuration */}
        <div className="space-y-4">
          <div>
            <h3 className="text-gray-100 mb-1">LLM Configuration</h3>
            <p className="text-xs text-gray-400">
              Active: {models.filter((m) => m.enabled).length} / {models.length}
            </p>
          </div>

          <div className="space-y-2">
            {models.map((model, index) => (
              <div
                key={model.id}
                className="group p-4 rounded-lg border border-gray-700/50 bg-gray-800/20 hover:bg-gray-800/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <button
                    className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', index.toString());
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                      handleReorderModel(fromIndex, index);
                    }}
                  >
                    <GripVertical className="size-4" />
                  </button>

                  <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${model.enabled ? 'bg-green-500' : 'bg-gray-600'}`} />
                      <div>
                        <Label htmlFor={`model-${model.id}`} className="text-gray-200 cursor-pointer">
                          {model.name}
                        </Label>
                        <p className="text-xs text-gray-500">Position {index + 1}</p>
                      </div>
                    </div>

                    <Switch
                      id={`model-${model.id}`}
                      checked={model.enabled}
                      onCheckedChange={() => handleToggleModel(model.id)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Panel */}
        <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/50">
          <h4 className="text-gray-200 text-sm mb-2">Immutable Audit Trail</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Every LLM response is preserved forever. Full context maintained with zero compression.
            Truth wins, not speed.
          </p>
        </div>
      </div>
    </aside>
  );
}
