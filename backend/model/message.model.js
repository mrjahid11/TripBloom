import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  tourId: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupDeparture' },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null for broadcast
  content: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  isBroadcast: { type: Boolean, default: false }
});

export const Message = mongoose.model('Message', messageSchema);
