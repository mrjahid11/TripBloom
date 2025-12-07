const mongoose = require('mongoose');

const travelerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 0
  },
  phone: {
    type: String,
    trim: true
  }
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  method: {
    type: String,
    required: true,
    enum: ['BKASH', 'NAGAD', 'ROCKET', 'CARD', 'BANK_TRANSFER', 'CASH'],
    uppercase: true
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
    default: 'PENDING',
    uppercase: true
  },
  transactionRef: {
    type: String,
    trim: true
  },
  paidAt: {
    type: Date
  }
}, { timestamps: true });

const cancellationSchema = new mongoose.Schema({
  isCancelled: {
    type: Boolean,
    default: false
  },
  reason: {
    type: String,
    trim: true
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: {
    type: Date
  },
  refundAmount: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TourPackage',
    required: true,
    index: true
  },
  bookingType: {
    type: String,
    required: true,
    enum: ['GROUP', 'PRIVATE', 'CUSTOM'],
    default: 'GROUP',
    uppercase: true
  },
  groupDepartureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupDeparture'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  numTravelers: {
    type: Number,
    required: true,
    min: 1
  },
  travelers: {
    type: [travelerSchema],
    required: true,
    validate: {
      validator: function(v) {
        return v.length === this.numTravelers;
      },
      message: 'Number of travelers must match numTravelers field'
    }
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'BDT',
    uppercase: true
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'REFUNDED'],
    default: 'PENDING',
    uppercase: true,
    index: true
  },
  payments: {
    type: [paymentSchema],
    default: []
  },
  cancellation: {
    type: cancellationSchema,
    default: () => ({})
  },
  reservedSeats: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ packageId: 1, status: 1 });
bookingSchema.index({ groupDepartureId: 1 });
bookingSchema.index({ startDate: 1 });
bookingSchema.index({ createdAt: -1 });

// Virtual for checking if booking is active
bookingSchema.virtual('isActive').get(function() {
  return this.status === 'CONFIRMED' && !this.cancellation.isCancelled;
});

// Virtual for total paid amount
bookingSchema.virtual('totalPaid').get(function() {
  return this.payments
    .filter(p => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amount, 0);
});

// Virtual for remaining amount
bookingSchema.virtual('remainingAmount').get(function() {
  return this.totalAmount - this.totalPaid;
});

// Pre-save middleware to validate dates
bookingSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  next();
});

// Method to cancel booking
bookingSchema.methods.cancelBooking = function(userId, reason, refundAmount = 0) {
  this.cancellation.isCancelled = true;
  this.cancellation.reason = reason;
  this.cancellation.cancelledBy = userId;
  this.cancellation.cancelledAt = new Date();
  this.cancellation.refundAmount = refundAmount;
  this.status = 'CANCELLED';
  return this.save();
};

// Method to add payment
bookingSchema.methods.addPayment = function(paymentData) {
  this.payments.push(paymentData);
  
  // Update status if fully paid
  if (this.totalPaid >= this.totalAmount) {
    this.status = 'CONFIRMED';
  }
  
  return this.save();
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
