/**
 * Utility to determine if a video call window is currently open.
 * Returns: 'early' | 'open' | 'expired' | 'not-confirmed'
 */
export function getCallWindowStatus(appointment) {
  if (!appointment) return 'not-confirmed';
  if (appointment.status !== 'confirmed') return 'not-confirmed';

  const now = new Date();
  const scheduledTime = appointment.scheduledDateTime 
    ? new Date(appointment.scheduledDateTime) 
    : parseLegacyDateTime(appointment.date, appointment.timeSlot);

  const diffMinutes = (now - scheduledTime) / (1000 * 60);

  // Early: > 10 min before
  if (diffMinutes < -10) return 'early';
  
  // Open: 10 min before to 180 min after
  if (diffMinutes >= -10 && diffMinutes <= 60) return 'open';

  // Expired: > 180 min after
  return 'expired';
}

/**
 * Returns the number of seconds until the call window opens (10 min before start).
 * Returns 0 if already open or expired.
 */
export function secondsUntilWindow(appointment) {
  if (!appointment || appointment.status !== 'confirmed') return 0;

  const now = new Date();
  const scheduledTime = appointment.scheduledDateTime 
    ? new Date(appointment.scheduledDateTime) 
    : parseLegacyDateTime(appointment.date, appointment.timeSlot);

  const windowStartTime = new Date(scheduledTime.getTime() - 10 * 60 * 1000);
  const secondsLeft = Math.floor((windowStartTime - now) / 1000);

  return Math.max(0, secondsLeft);
}

/**
 * Fallback for appointments that don't have scheduledDateTime field yet.
 * date: "YYYY-MM-DD", timeSlot: "10:00 AM"
 */
export function parseLegacyDateTime(date, timeSlot) {
  try {
    let hours, minutes;
    if (timeSlot.includes(' ')) {
      const [time, modifier] = timeSlot.split(' ');
      [hours, minutes] = time.split(':');
      hours = parseInt(hours, 10);
      if (hours === 12) hours = 0;
      if (modifier === 'PM') hours += 12;
    } else {
      [hours, minutes] = timeSlot.split(':');
      hours = parseInt(hours, 10);
      minutes = parseInt(minutes, 10);
    }
    return new Date(`${date}T${String(hours).padStart(2, '0')}:${String(String(minutes).split(':')[0]).padStart(2, '0')}:00`);
  } catch (e) {
    return new Date(date); // Minimum fallback
  }
}

