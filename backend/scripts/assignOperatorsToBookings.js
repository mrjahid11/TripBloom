// Script to assign operators to existing bookings from their group departures
import mongoose from 'mongoose';
import Booking from '../model/booking.model.js';
import { GroupDeparture } from '../model/groupDeparture.model.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tripbloom';

async function assignOperatorsToBookings() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all GROUP bookings that don't have an assigned operator
    const bookings = await Booking.find({
      bookingType: 'GROUP',
      groupDepartureId: { $exists: true, $ne: null },
      assignedOperator: { $exists: false }
    }).populate('groupDepartureId');

    console.log(`Found ${bookings.length} GROUP bookings without assigned operators`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const booking of bookings) {
      if (!booking.groupDepartureId) {
        console.log(`⚠️  Booking ${booking._id} has no group departure, skipping`);
        skippedCount++;
        continue;
      }

      const departure = booking.groupDepartureId;
      
      if (departure.operators && departure.operators.length > 0) {
        const operatorId = departure.operators[0].operatorId;
        
        // Use updateOne to bypass validation
        await Booking.updateOne(
          { _id: booking._id },
          { $set: { assignedOperator: operatorId } }
        );
        
        console.log(`✅ Assigned operator ${operatorId} to booking ${booking._id}`);
        updatedCount++;
      } else {
        console.log(`⚠️  Booking ${booking._id}'s departure has no operators, skipping`);
        skippedCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`Total bookings processed: ${bookings.length}`);
    console.log(`Updated with operators: ${updatedCount}`);
    console.log(`Skipped (no operators): ${skippedCount}`);

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

assignOperatorsToBookings();
