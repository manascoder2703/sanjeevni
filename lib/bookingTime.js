export const CONSULTATION_DURATION_MINUTES = 60;
export const BOOKING_INTERVAL_MINUTES = 1;
export const SLOTS_PER_CONSULTATION = CONSULTATION_DURATION_MINUTES / BOOKING_INTERVAL_MINUTES;
const MINUTES_PER_DAY = 24 * 60;

export const DEFAULT_TIME_WINDOWS = Array.from({ length: 24 }, (_, index) =>
  formatMinutesToTimeLabel(index * 60)
);

export function parseTimeLabelToMinutes(timeLabel) {
  if (!timeLabel || typeof timeLabel !== 'string') return null;

  const trimmed = timeLabel.trim().toUpperCase();
  const meridiemMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
  if (meridiemMatch) {
    let hours = Number(meridiemMatch[1]);
    const minutes = Number(meridiemMatch[2]);
    const modifier = meridiemMatch[3];

    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    if (hours === 12) hours = 0;
    if (modifier === 'PM') hours += 12;

    return hours * 60 + minutes;
  }

  const twentyFourHourMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    const hours = Number(twentyFourHourMatch[1]);
    const minutes = Number(twentyFourHourMatch[2]);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    return hours * 60 + minutes;
  }

  return null;
}

export function formatMinutesToTimeLabel(totalMinutes) {
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;

  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export function formatMinutesToSlotKey(totalMinutes) {
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  return `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function slotKeyToTimeLabel(slotKey) {
  const minutes = parseTimeLabelToMinutes(slotKey);
  return minutes === null ? slotKey : formatMinutesToTimeLabel(minutes);
}

export function getSlotKeysForTimeLabel(timeLabel) {
  const startMinutes = parseTimeLabelToMinutes(timeLabel);
  if (startMinutes === null) return [];
  
  return Array.from({ length: SLOTS_PER_CONSULTATION }, (_, index) =>
    formatMinutesToSlotKey(startMinutes + index * BOOKING_INTERVAL_MINUTES)
  ).map(k => slotKeyToTimeLabel(k)); // Use AM/PM labels for consistency with UI slotStates
}

export function getConflictingStartTimeLabels(timeLabel) {
  const startMinutes = parseTimeLabelToMinutes(timeLabel);
  if (startMinutes === null) return [];

  return Array.from(
    { length: SLOTS_PER_CONSULTATION * 2 - 1 },
    (_, index) => formatMinutesToTimeLabel(startMinutes + (index - (SLOTS_PER_CONSULTATION - 1)) * BOOKING_INTERVAL_MINUTES)
  );
}

export function buildTimeOptionsForWindow(windowStartLabel) {
  const startMinutes = parseTimeLabelToMinutes(windowStartLabel);
  if (startMinutes === null) return [];

  return Array.from({ length: SLOTS_PER_CONSULTATION }, (_, index) => startMinutes + index * BOOKING_INTERVAL_MINUTES)
    .filter((minutes) => minutes + CONSULTATION_DURATION_MINUTES <= MINUTES_PER_DAY)
    .map((minutes) => formatMinutesToTimeLabel(minutes));
}

export function parseDateAndTimeSlot(date, timeSlot) {
  const slotMinutes = parseTimeLabelToMinutes(timeSlot);
  if (!date || slotMinutes === null) return null;

  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return null;

  const hours = Math.floor(slotMinutes / 60);
  const minutes = slotMinutes % 60;
  const parsed = new Date(year, month - 1, day, hours, minutes, 0, 0);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isAllowedBookingIncrement(timeLabel) {
  const minutes = parseTimeLabelToMinutes(timeLabel);
  return (
    minutes !== null &&
    minutes + CONSULTATION_DURATION_MINUTES <= MINUTES_PER_DAY
  );
}

export function doesTimeEntryOverlap(entry, candidateTimeLabel) {
  if (!entry) return false;

  const candidateSlotKeys = getSlotKeysForTimeLabel(candidateTimeLabel);
  if (!candidateSlotKeys.length) return false;

  const entrySlotKeys = entry.slotKeys?.length ? entry.slotKeys : getSlotKeysForTimeLabel(entry.timeSlot);
  return entrySlotKeys.some((slotKey) => candidateSlotKeys.includes(slotKey));
}
