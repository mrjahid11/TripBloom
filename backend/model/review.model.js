const mongoose = require('mongoose');

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

// Pre-save middleware to auto-verify if linked to a booking
reviewSchema.pre('save', async function(next) {
  if (this.isNew && this.bookingId) {
    try {
      const Booking = mongoose.model('Booking');
      const booking = await Booking.findOne({
        _id: this.bookingId,
        customerId: this.customerId,
        packageId: this.packageId,
        status: 'COMPLETED'
      });
      
      if (booking) {
        this.verified = true;
      }
    } catch (error) {
      console.error('Error verifying review:', error);
    }
  }
  next();
});

// Static method to get average rating for a package
reviewSchema.statics.getPackageAverageRating = async function(packageId) {
  const result = await this.aggregate([
    {
      $match: {
        packageId: mongoose.Types.ObjectId(packageId),
        status: 'APPROVED'
      }
    },
    {
      $group: {
        _id: '$packageId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  
  return result.length > 0 
    ? { averageRating: Math.round(result[0].averageRating * 10) / 10, totalReviews: result[0].totalReviews }
    : { averageRating: 0, totalReviews: 0 };
};

// Static method to get rating distribution
reviewSchema.statics.getRatingDistribution = async function(packageId) {
  const distribution = await this.aggregate([
    {
      $match: {
        packageId: mongoose.Types.ObjectId(packageId),
        status: 'APPROVED'
      }
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: -1 }
    }
  ]);
  
  const result = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  distribution.forEach(d => {
    result[d._id] = d.count;
  });
  
  return result;
};

// Method to approve review
reviewSchema.methods.approve = function(moderatorNote = '') {
  this.status = 'APPROVED';
  if (moderatorNote) {
    this.moderatorNote = moderatorNote;
  }
  return this.save();
};

// Method to reject review
reviewSchema.methods.reject = function(moderatorNote) {
  this.status = 'REJECTED';
  this.moderatorNote = moderatorNote;
  return this.save();
};

// Method to increment helpful count
reviewSchema.methods.markHelpful = function() {
  this.helpful += 1;
  return this.save();
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
