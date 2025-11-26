import { Topology, LLMModel } from '../App';
import { GripVertical, Network, Workflow, Star, Database } from 'lucide-react';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { useEffect, useState } from 'react';

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
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Fetch available models from API on mount
  useEffect(() => {
    const fetchAvailableModels = async () => {
      setIsLoadingModels(true);
      try {
        const response = await fetch('/maire/models');
        if (response.ok) {
          const data = await response.json();
          // Expect format: { models: [{ id: string, name: string, enabled?: boolean }] }
          if (data.models && Array.isArray(data.models)) {
            const formattedModels = data.models.map((m: any) => ({
              id: m.id || m.name.toLowerCase().replace(/\s+/g, '-'),
              name: m.name,
              enabled: m.enabled !== undefined ? m.enabled : false,
            }));
            onModelsChange(formattedModels);
          }
        }
      } catch (error) {
        console.log('Using default model configuration');
        // Keep existing models if API is not available
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchAvailableModels();
  }, []);

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
      version: 'v1.0',
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
    <aside className="w-80 border-r-2 border-[#FF6B35]/30 bg-black overflow-y-auto">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, #FF6B35 1px, #FF6B35 2px),
                         repeating-linear-gradient(90deg, transparent, transparent 1px, #FF6B35 1px, #FF6B35 2px)`,
        backgroundSize: '20px 20px'
      }} />
      
      <div className="relative p-6 space-y-6">
        {/* Section header */}
        <div className="border-l-2 border-[#FF6B35] pl-3">
          <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Configuration Panel</div>
          <div className="text-xs text-[#FF6B35]">SYSTEM PARAMETERS</div>
        </div>

        {/* Topology Selection */}
        <div className="space-y-3">
          <div className="border-b border-[#FF6B35]/20 pb-2">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-xs uppercase tracking-wider">Reasoning Topology</h3>
              <div className="text-[9px] text-gray-600 uppercase tracking-wider">Mode Select</div>
            </div>
          </div>

          <div className="space-y-2">
            {topologyOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = topology === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => onTopologyChange(option.value)}
                  className={`w-full p-3 border transition-all ${
                    isSelected
                      ? 'bg-[#FF6B35]/10 border-[#FF6B35]'
                      : 'bg-black border-[#FF6B35]/20 hover:border-[#FF6B35]/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`size-4 mt-0.5 ${isSelected ? 'text-[#FF6B35]' : 'text-gray-600'}`} />
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs uppercase tracking-wider ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                          {option.label}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 border border-[#FF6B35]/30 text-[#FF6B35]">
                          {option.badge || option.version}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-600 uppercase tracking-wide">{option.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* LLM Configuration */}
        <div className="space-y-3">
          <div className="border-b border-[#FF6B35]/20 pb-2">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-xs uppercase tracking-wider">LLM Configuration</h3>
              <div className="text-[9px] text-gray-600 uppercase tracking-wider">
                <Database className="size-3 inline mr-1" />
                {models.filter((m) => m.enabled).length} / {models.length} Active
              </div>
            </div>
          </div>

          {isLoadingModels ? (
            <div className="p-4 border border-[#FF6B35]/20 bg-black">
              <div className="text-xs text-gray-600 uppercase tracking-wide">Loading models...</div>
            </div>
          ) : (
            <div className="space-y-2">
              {models.map((model, index) => (
                <div
                  key={model.id}
                  className="group p-3 border border-[#FF6B35]/20 bg-black hover:border-[#FF6B35]/40 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <button
                      className="cursor-grab active:cursor-grabbing text-gray-700 hover:text-[#FF6B35]"
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
                        <div className={`w-1.5 h-1.5 ${model.enabled ? 'bg-[#FF6B35]' : 'bg-gray-700'}`} style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
                        <div>
                          <Label htmlFor={`model-${model.id}`} className="text-white text-xs uppercase tracking-wider cursor-pointer">
                            {model.name}
                          </Label>
                          <p className="text-[9px] text-gray-600 uppercase tracking-wider">Slot {index + 1}</p>
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
          )}
        </div>

        {/* Info Panel */}
        <div className="p-3 bg-black border-2 border-[#FF6B35]/20">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#FF6B35]/20">
            <div className="w-1 h-1 bg-[#FF6B35]" />
            <h4 className="text-[#FF6B35] text-[10px] uppercase tracking-widest">Core Philosophy</h4>
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-wide">
            Immutable Audit Trail • Full Context Preservation • Zero Compression • Truth Over Speed
          </p>
        </div>
      </div>
    </aside>
  );
}