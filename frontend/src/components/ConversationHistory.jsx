import { formatDistanceToNow } from 'date-fns';

export default function ConversationHistory({
  conversations,
  currentConversation,
  onSelectConversation,
  onClose,
}) {
  return (
    <div className="absolute sm:relative inset-0 sm:w-80 md:w-96 bg-white sm:border-l border-gray-200 overflow-y-auto z-20">
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h3 className="text-base sm:text-sm font-semibold text-gray-900">Conversation History</h3>
          <button 
            onClick={onClose} 
            className="sm:hidden p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-2.5 sm:space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-2">Start chatting to create one</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className={`w-full text-left p-3.5 sm:p-3 rounded-lg transition-colors ${
                  currentConversation?.id === conv.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50 border border-gray-200 sm:border-transparent'
                }`}
              >
                <div className="font-medium text-gray-900 text-sm sm:text-sm truncate">
                  {conv.title || 'Untitled'}
                </div>
                <div className="text-xs text-gray-500 mt-1.5 sm:mt-1">
                  {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

