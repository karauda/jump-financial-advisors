import { useState } from 'react';

export default function ChatInput({
  onSendMessage,
  loading,
  contextFilter,
  setContextFilter,
  contextOptions,
}) {
  const [inputMessage, setInputMessage] = useState('');
  const [showContextMenu, setShowContextMenu] = useState(false);

  const handleSubmit = () => {
    if (inputMessage.trim() && !loading) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 px-3 sm:px-6 py-3 sm:py-4 safe-area-bottom">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 sm:gap-3 bg-gray-50 rounded-2xl border border-gray-200 p-2 sm:p-2.5">
          {/* Input */}
          <div className="flex-1 min-w-0">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Ask anything about your clients..."
              className="w-full bg-transparent border-none focus:outline-none resize-none text-sm text-gray-900 placeholder-gray-400"
              rows="1"
              style={{ maxHeight: '120px' }}
              disabled={loading}
            />
            <div className="text-xs text-gray-400 mt-1 hidden sm:block">
              Press Enter to send, Shift + Enter for new line
            </div>
          </div>

          {/* Context dropdown */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowContextMenu(!showContextMenu)}
              className="px-2 sm:px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap min-w-0"
            >
              <span className="hidden md:inline truncate">
                {contextOptions.find((o) => o.value === contextFilter)?.label}
              </span>
              <span className="md:hidden text-[11px] sm:text-xs">All</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showContextMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-10">
                {contextOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setContextFilter(option.value);
                      setShowContextMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors ${
                      contextFilter === option.value ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Send button - visible on mobile */}
          <button
            onClick={handleSubmit}
            disabled={loading || !inputMessage.trim()}
            className="sm:hidden p-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

