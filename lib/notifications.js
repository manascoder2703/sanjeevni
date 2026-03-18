import axios from 'axios';

const SOCKET_INTERNAL_URL = 'http://localhost:3001/internal/notify';

/**
 * Sends a real-time notification to a specific user via the socket server.
 * @param {string} userId - The target user's ID.
 * @param {Object} notification - The notification payload.
 * @param {string} notification.title - Title of the notification.
 * @param {string} notification.content - Body of the notification.
 * @param {string} [notification.type] - Type (e.g., 'booking', 'approval', 'system').
 * @param {string} [notification.link] - Action link.
 */
export async function sendRealtimeNotification(userId, notification) {
  try {
    await axios.post(SOCKET_INTERNAL_URL, {
      userId: String(userId),
      notification
    });
  } catch (error) {
    console.error('Failed to send real-time notification:', error.message);
  }
}
