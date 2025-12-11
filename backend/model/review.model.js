import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
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
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000
  },
  helpful: {
    type: Number,
    default: 0,
    min: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
    uppercase: true,
    index: true
  },
  moderatorNote: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
reviewSchema.index({ packageId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ customerId: 1, packageId: 1 }, { unique: true });
reviewSchema.index({ rating: 1 });

// Virtual for checking if review is approved
reviewSchema.virtual('isApproved').get(function() {
  return this.status === 'APPROVED';
});

export const Review = mongoose.model('Review', reviewSchema);
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
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000
  },
  helpful: {
    type: Number,
    default: 0,
    min: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
    uppercase: true,
    index: true
  },
  moderatorNote: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
reviewSchema.index({ packageId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ customerId: 1, packageId: 1 }, { unique: true });
reviewSchema.index({ rating: 1 });

// Virtual for checking if review is approved
reviewSchema.virtual('isApproved').get(function() {
  return this.status === 'APPROVED';
});

export const Review = mongoose.model('Review', reviewSchema);
