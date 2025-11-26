import { Send } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="flex gap-3 items-end">
      <div className="flex-1 relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="INPUT QUERY..."
          disabled={disabled}
          className="min-h-[60px] max-h-[200px] resize-none bg-[#1a1a1a] border-[#FF6B35]/30 text-gray-300 placeholder:text-gray-700 placeholder:uppercase placeholder:tracking-wider focus:border-[#FF6B35] focus:ring-[#FF6B35]"
          rows={2}
        />
      </div>
      
      <Button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        size="lg"
        className="h-[60px] px-6 bg-[#FF6B35] hover:bg-[#FF8C42] text-black border border-[#FF6B35]"
      >
        <Send className="size-5" />
        <span className="ml-2 text-xs uppercase tracking-wider">Send</span>
      </Button>
    </div>
  );
}