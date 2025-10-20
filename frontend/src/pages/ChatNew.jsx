import { useState, useEffect } from 'react';
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage as sendMessageAPI,
  logout as logoutAPI,
  triggerSync,
  getSyncStatus,
} from '../services/api';
import TopBar from '../components/TopBar';
import ChatHeader from '../components/ChatHeader';
import ChatMessages from '../components/ChatMessages';
import ChatInput from '../components/ChatInput';
import ConversationHistory from '../components/ConversationHistory';

export default function ChatNew({ user, onLogout }) {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [contextFilter, setContextFilter] = useState('all_meetings');

  useEffect(() => {
    loadConversations();
    loadSyncStatus();
  }, []);

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    }
  }, [currentConversation]);


  const loadConversations = async () => {
    try {
      const response = await getConversations();
      setConversations(response.data.conversations);

      if (response.data.conversations.length > 0) {
        setCurrentConversation(response.data.conversations[0]);
      } else {
        handleNewConversation();
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const response = await getMessages(conversationId);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const response = await getSyncStatus();
      setSyncStatus(response.data);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const handleNewConversation = async () => {
    try {
      const response = await createConversation('New Conversation');
      const newConv = response.data.conversation;
      setConversations([newConv, ...conversations]);
      setCurrentConversation(newConv);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleSendMessage = async (message) => {
    if (!message.trim() || loading || !currentConversation) return;

    setLoading(true);
    const userMessage = { role: 'user', content: message, created_at: new Date().toISOString() };
    setMessages([...messages, userMessage]);

    try {
      const response = await sendMessageAPI(currentConversation.id, message);
      const assistantMessage = {
        role: 'assistant',
        content: response.data.content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      await loadConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conv) => {
    setCurrentConversation(conv);
    setActiveTab('chat');
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await triggerSync();
      await loadSyncStatus();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleConnectHubSpot = () => {
    window.location.href = '/auth/hubspot';
  };

  const handleLogout = async () => {
    try {
      await logoutAPI();
      onLogout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const contextOptions = [
    { value: 'all_meetings', label: 'All meetings' },
    { value: 'upcoming', label: 'Upcoming meetings' },
    { value: 'past', label: 'Past meetings' },
    { value: 'contacts', label: 'All contacts' },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <TopBar
        user={user}
        hasHubSpot={user.hasHubSpot}
        syncStatus={syncStatus}
        syncing={syncing}
        onConnectHubSpot={handleConnectHubSpot}
        onSync={handleSync}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <ChatHeader
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onNewConversation={handleNewConversation}
            contextFilter={contextFilter}
            contextOptions={contextOptions}
          />

          <ChatMessages
            messages={messages}
            loading={loading}
            onSendMessage={handleSendMessage}
          />

          <ChatInput
            onSendMessage={handleSendMessage}
            loading={loading}
            contextFilter={contextFilter}
            setContextFilter={setContextFilter}
            contextOptions={contextOptions}
          />
        </div>

        {activeTab === 'history' && (
          <ConversationHistory
            conversations={conversations}
            currentConversation={currentConversation}
            onSelectConversation={handleSelectConversation}
            onClose={() => setActiveTab('chat')}
          />
        )}
      </div>
    </div>
  );
}

