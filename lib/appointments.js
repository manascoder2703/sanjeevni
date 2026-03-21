import Appointment from '@/models/Appointment';

/**
 * Frees stale appointments after their 60-minute consultation window.
 * Pending appointments become cancelled; confirmed appointments become completed.
 * @returns {Promise<number>} The number of appointments updated.
 */
export async function cleanupExpiredAppointments() {
  try {
    const consultationWindowMs = 60 * 60 * 1000; // 60 minutes
    const expiryThreshold = new Date(Date.now() - consultationWindowMs);
    const todayStr = new Date().toISOString().split('T')[0];

    const pendingByTimestamp = await Appointment.updateMany(
      {
        status: 'pending',
        scheduledDateTime: { $lt: expiryThreshold }
      },
      { $set: { status: 'cancelled' } }
    );

    const confirmedByTimestamp = await Appointment.updateMany(
      {
        status: 'confirmed',
        scheduledDateTime: { $lt: expiryThreshold }
      },
      { $set: { status: 'completed' } }
    );

    const pendingLegacy = await Appointment.updateMany(
      {
        status: 'pending',
        scheduledDateTime: { $exists: false },
        date: { $lt: todayStr }
      },
      { $set: { status: 'cancelled' } }
    );

    const confirmedLegacy = await Appointment.updateMany(
      {
        status: 'confirmed',
        scheduledDateTime: { $exists: false },
        date: { $lt: todayStr }
      },
      { $set: { status: 'completed' } }
    );

    const totalModified =
      pendingByTimestamp.modifiedCount +
      confirmedByTimestamp.modifiedCount +
      pendingLegacy.modifiedCount +
      confirmedLegacy.modifiedCount;

    if (totalModified > 0) {
      console.log(
        `Auto-freed ${totalModified} stale appointments (` +
        `${pendingByTimestamp.modifiedCount} pending via timestamp, ` +
        `${confirmedByTimestamp.modifiedCount} confirmed via timestamp, ` +
        `${pendingLegacy.modifiedCount} pending via date string, ` +
        `${confirmedLegacy.modifiedCount} confirmed via date string).`
      );
    }

    return totalModified;
  } catch (error) {
    console.error('Auto-expiry cleanup failed:', error);
    return 0;
  }
}
