const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  
  const reviews = await db.collection('reviews').find({}).toArray();
  console.log('Total reviews found:', reviews.length);
  reviews.forEach(r => console.log('Review appointmentId:', r.appointmentId));

  for (const r of reviews) {
    const result = await db.collection('appointments').updateOne(
      { _id: r.appointmentId },
      { $set: { isReviewed: true } }
    );
    console.log('Updated:', r.appointmentId, '— matched:', result.matchedCount, 'modified:', result.modifiedCount);
  }

  const stillUndefined = await db.collection('appointments').countDocuments({ isReviewed: { $exists: false } });
  console.log('Appointments still missing isReviewed:', stillUndefined);

  await db.collection('appointments').updateMany(
    { isReviewed: { $exists: false } },
    { $set: { isReviewed: false } }
  );
  console.log('Set isReviewed: false on all remaining appointments');

  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });