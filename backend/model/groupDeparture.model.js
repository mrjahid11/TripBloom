// groupDeparture.model.js
import mongoose from 'mongoose';

const DEPARTURE_STATUS = ['OPEN', 'FULL', 'CLOSED', 'CANCELLED'];

const groupDepartureSchema = new mongoose.Schema({
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'TourPackage', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalSeats: { type: Number, required: true },
  bookedSeats: { type: Number, default: 0 },
  status: { type: String, enum: DEPARTURE_STATUS, default: 'OPEN' },
  createdAt: { type: Date, default: Date.now },
  assignedOperators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Operators assigned to this departure
});

export const GroupDeparture = mongoose.model('GroupDeparture', groupDepartureSchema);
export const DEPARTURE_STATUS_ENUM = DEPARTURE_STATUS;
