import { format } from 'date-fns';
import { useRef, useEffect } from 'react';

export default function ChatMessages({ messages, loading, onSendMessage }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center py-12 sm:py-16">
            <div className="text-gray-900 text-base sm:text-lg font-medium mb-3 px-2">
              I can answer questions about any meeting. What do you want to know?
            </div>
            <div className="mt-8 sm:mt-10 flex flex-wrap gap-2.5 sm:gap-3 justify-center px-2">
              <button
                onClick={() => onSendMessage('Show me my recent meetings')}
                className="px-4 sm:px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Show me my recent meetings
              </button>
              <button
                onClick={() => onSendMessage('Who have I met with this month?')}
                className="px-4 sm:px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Who have I met with this month?
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6">
      <div className="max-w-3xl mx-auto space-y-3.5 sm:space-y-5">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[88%] sm:max-w-[80%] md:max-w-2xl rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}
            >
              <div className="text-[13px] sm:text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</div>
              <div
                className={`text-[11px] sm:text-xs mt-1.5 sm:mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {format(new Date(message.created_at), 'h:mm a')}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex gap-2">
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

