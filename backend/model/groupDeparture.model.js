// groupDeparture.model.js
import mongoose from 'mongoose';

const DEPARTURE_STATUS = ['OPEN', 'FULL', 'CLOSED', 'CANCELLED'];

const operatorAssignmentSchema = new mongoose.Schema({
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  assignedAt: { type: Date, default: Date.now }
}, { _id: false });

const groupDepartureSchema = new mongoose.Schema({
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'TourPackage', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalSeats: { type: Number, required: true },
  bookedSeats: { type: Number, default: 0 },
  pricePerPerson: { type: Number, required: true },
  status: { type: String, enum: DEPARTURE_STATUS, default: 'OPEN' },
  operators: [operatorAssignmentSchema], // Operators assigned to this departure with tracking
  seatMap: [{
    seatNumber: { type: String, required: true },
    status: { type: String, enum: ['AVAILABLE', 'BOOKED', 'BLOCKED'], default: 'AVAILABLE' },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }
  }],
  createdAt: { type: Date, default: Date.now }
});

export const GroupDeparture = mongoose.model('GroupDeparture', groupDepartureSchema);
export const DEPARTURE_STATUS_ENUM = DEPARTURE_STATUS;
