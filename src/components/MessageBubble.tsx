import { Message } from '../App';  // ← THIS WAS MISSING

export function MessageBubble({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className="max-w-2xl mx-auto my-8">
        <div className="bg-cyan-600/20 border border-cyan-500/30 rounded-2xl p-6">
          <p className="text-cyan-100">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-12">
      {/* Final answer */}
      <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-700/50 rounded-2xl p-8 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">MAIRE Final Response</h2>
        <p className="text-gray-100 whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </div>

      {/* Header Stack – Model 1, Model 2, etc. */}
      {message.headerStack && message.headerStack.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-300 text-center">Full Reasoning Trace</h3>
          {message.headerStack.map((layer, i) => (  // ← i is fine here
            <div key={i} className="bg-gray-900/80 border border-gray-700 rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 px-6 py-3 border-b border-gray-700">
                <span className="text-lg font-bold text-cyan-300">
                  {layer.model}
                </span>
              </div>
              <div className="p-6 font-mono text-sm text-gray-200 whitespace-pre-wrap max-h-96 overflow-y-auto">
                {layer.response}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}