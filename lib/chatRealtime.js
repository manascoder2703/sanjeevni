import axios from 'axios';

const SOCKET_SERVER = process.env.SOCKET_SERVER_INTERNAL || 'http://localhost:3001';

function swallowRealtimeError(label, error) {
  console.error(`${label} failed:`, error?.message || error);
}

export async function emitChatMessage(payload) {
  try {
    await axios.post(`${SOCKET_SERVER}/internal/chat-message`, payload);
  } catch (error) {
    swallowRealtimeError('emitChatMessage', error);
  }
}

export async function emitConversationUpdate(payload) {
  try {
    await axios.post(`${SOCKET_SERVER}/internal/chat-conversation`, payload);
  } catch (error) {
    swallowRealtimeError('emitConversationUpdate', error);
  }
}

export async function emitChatRead(payload) {
  try {
    await axios.post(`${SOCKET_SERVER}/internal/chat-read`, payload);
  } catch (error) {
    swallowRealtimeError('emitChatRead', error);
  }
}
