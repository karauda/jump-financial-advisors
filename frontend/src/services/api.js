import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  withCredentials: true,
});

// Auth
export const checkAuthStatus = () => api.get('/auth/status');
export const logout = () => api.post('/auth/logout');

// Conversations
export const getConversations = () => api.get('/api/conversations');
export const createConversation = (title) => api.post('/api/conversations', { title });
export const getMessages = (conversationId) => api.get(`/api/conversations/${conversationId}/messages`);
export const sendMessage = (conversationId, message) =>
  api.post(`/api/conversations/${conversationId}/messages`, { message });
export const deleteConversation = (conversationId) =>
  api.delete(`/api/conversations/${conversationId}`);

// Sync
export const triggerSync = () => api.post('/api/sync');
export const getSyncStatus = () => api.get('/api/sync/status');

// Instructions
export const getInstructions = () => api.get('/api/instructions');
export const createInstruction = (instruction) => api.post('/api/instructions', { instruction });
export const toggleInstruction = (id) => api.patch(`/api/instructions/${id}/toggle`);
export const deleteInstruction = (id) => api.delete(`/api/instructions/${id}`);

export default api;
