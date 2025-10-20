import { format } from 'date-fns';

export default function ChatHeader({
  activeTab,
  setActiveTab,
  onNewConversation,
  contextFilter,
  contextOptions,
}) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4 md:gap-8 min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 flex-shrink-0">Ask Anything</h2>
          <div className="flex gap-2 sm:gap-3 md:gap-6">
            <button
              onClick={() => setActiveTab('chat')}
              className={`pb-1 sm:pb-2 px-0.5 sm:px-1 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'chat'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-1 sm:pb-2 px-0.5 sm:px-1 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'history'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              History
            </button>
          </div>
        </div>
        <button
          onClick={onNewConversation}
          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 hover:text-gray-900 font-medium flex-shrink-0"
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">New thread</span>
          <span className="sm:hidden">+</span>
        </button>
      </div>

      {/* Context Indicator */}
      <div className="px-3 sm:px-6 pb-2 sm:pb-3">
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 flex-wrap">
          <span className="truncate">
            Context set to {contextOptions.find((o) => o.value === contextFilter)?.label.toLowerCase()}
          </span>
          <span className="text-gray-300 hidden sm:inline">•</span>
          <span className="hidden sm:inline">{format(new Date(), 'h:mm a – MMMM d, yyyy')}</span>
        </div>
      </div>
    </div>
  );
}

