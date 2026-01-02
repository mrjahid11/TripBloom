// review.service.js
import { Review } from '../model/review.model.js';
import Booking from '../model/booking.model.js';
import { TourPackage } from '../model/tourPackage.model.js';

// Create a new review
export async function createReview({ customerId, packageId, bookingId, rating, comment }) {
  try {
    // Validate package exists
    const tourPackage = await TourPackage.findById(packageId);
    if (!tourPackage) {
      return { error: 'Tour package not found' };
    }

    // Check if customer has already reviewed this package
    const existingReview = await Review.findOne({ customerId, packageId });
    if (existingReview) {
      return { error: 'You have already reviewed this tour package' };
    }

    // If bookingId provided, validate booking exists and is completed
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return { error: 'Booking not found' };
      }

      // Verify booking belongs to customer
      if (booking.customerId.toString() !== customerId.toString()) {
        return { error: 'This booking does not belong to you' };
      }

      // Verify booking is for the same package
      if (booking.packageId.toString() !== packageId.toString()) {
        return { error: 'Booking does not match the package being reviewed' };
      }

      // Allow review if booking has been explicitly marked COMPLETED
      // Otherwise require the booking endDate to be in the past
      if (booking.status !== 'COMPLETED') {
        if (!booking.endDate || new Date() < new Date(booking.endDate)) {
          return { error: 'You can only review after the trip has ended' };
        }
      }
    }

    // Create the review
    const review = new Review({
      customerId,
      packageId,
      bookingId: bookingId || null,
      rating,
      comment,
      verified: !!bookingId, // Mark as verified if linked to a booking
      status: 'PENDING' // Reviews need approval by default
    });

    await review.save();

    // Populate references
    await review.populate('customerId', 'fullName email');
    await review.populate('packageId', 'title destination');

    return { review };
  } catch (err) {
    console.error('Error creating review:', err);
    return { error: err.message || 'Failed to create review' };
  }
}

// Get review by ID
export async function getReviewById(reviewId) {
  try {
    const review = await Review.findById(reviewId)
      .populate('customerId', 'fullName email')
      .populate('packageId', 'title destination type category')
      .populate('bookingId', 'startDate endDate status');

    if (!review) {
      return { error: 'Review not found' };
    }

    return { review };
  } catch (err) {
    console.error('Error fetching review:', err);
    return { error: 'Failed to fetch review' };
  }
}

// List reviews with filters
export async function listReviews({ packageId, customerId, status, minRating, maxRating }) {
  try {
    const filter = {};

    if (packageId) filter.packageId = packageId;
    if (customerId) filter.customerId = customerId;
    
    if (status) {
      if (typeof status === 'string' && status.includes(',')) {
        filter.status = { $in: status.split(',').map(s => s.trim().toUpperCase()) };
      } else {
        filter.status = status.toUpperCase();
      }
    }

    // Rating range filter
    if (minRating || maxRating) {
      filter.rating = {};
      if (minRating) filter.rating.$gte = parseInt(minRating);
      if (maxRating) filter.rating.$lte = parseInt(maxRating);
    }

    const reviews = await Review.find(filter)
      .populate('customerId', 'fullName email')
      .populate('packageId', 'title destination type category')
      .populate('bookingId', 'startDate endDate status')
      .sort({ createdAt: -1 });

    return { reviews };
  } catch (err) {
    console.error('Error listing reviews:', err);
    return { error: 'Failed to list reviews' };
  }
}

// Update review (customer can only edit pending reviews)
export async function updateReview({ reviewId, customerId, rating, comment }) {
  try {
    const review = await Review.findById(reviewId);
    if (!review) {
      return { error: 'Review not found' };
    }

    // Verify ownership
    if (review.customerId.toString() !== customerId.toString()) {
      return { error: 'You can only edit your own reviews' };
    }

    // Only allow editing pending reviews
    if (review.status !== 'PENDING') {
      return { error: `Cannot edit ${review.status.toLowerCase()} reviews` };
    }

    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await review.save();

    await review.populate('customerId', 'fullName email');
    await review.populate('packageId', 'title destination');

    return { review };
  } catch (err) {
    console.error('Error updating review:', err);
    return { error: 'Failed to update review' };
  }
}

// Delete review (customer can only delete their own pending reviews)
export async function deleteReview({ reviewId, customerId }) {
  try {
    const review = await Review.findById(reviewId);
    if (!review) {
      return { error: 'Review not found' };
    }

    // Verify ownership
    if (review.customerId.toString() !== customerId.toString()) {
      return { error: 'You can only delete your own reviews' };
    }

    // Only allow deleting pending reviews
    if (review.status !== 'PENDING') {
      return { error: `Cannot delete ${review.status.toLowerCase()} reviews` };
    }

    await review.deleteOne();

    return { success: true };
  } catch (err) {
    console.error('Error deleting review:', err);
    return { error: 'Failed to delete review' };
  }
}

// Moderate review (admin/moderator only)
export async function moderateReview({ reviewId, status, moderatorNote }) {
  try {
    const review = await Review.findById(reviewId);
    if (!review) {
      return { error: 'Review not found' };
    }

    const validStatuses = ['APPROVED', 'REJECTED', 'PENDING'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return { error: 'Invalid status. Must be APPROVED, REJECTED, or PENDING' };
    }

    review.status = status.toUpperCase();
    if (moderatorNote) review.moderatorNote = moderatorNote;

    await review.save();

    await review.populate('customerId', 'fullName email');
    await review.populate('packageId', 'title destination');

    return { review };
  } catch (err) {
    console.error('Error moderating review:', err);
    return { error: 'Failed to moderate review' };
  }
}

// Mark review as helpful (increment helpful count)
export async function markReviewHelpful(reviewId) {
  try {
    const review = await Review.findById(reviewId);
    if (!review) {
      return { error: 'Review not found' };
    }

    review.helpful += 1;
    await review.save();

    return { review };
  } catch (err) {
    console.error('Error marking review helpful:', err);
    return { error: 'Failed to mark review helpful' };
  }
}

// Get package rating statistics
export async function getPackageRatingStats(packageId) {
  try {
    const reviews = await Review.find({
      packageId,
      status: 'APPROVED'
    });

    if (reviews.length === 0) {
      return {
        stats: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        }
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = (totalRating / reviews.length).toFixed(1);

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating] += 1;
    });

    return {
      stats: {
        averageRating: parseFloat(averageRating),
        totalReviews: reviews.length,
        ratingDistribution
      }
    };
  } catch (err) {
    console.error('Error fetching package rating stats:', err);
    return { error: 'Failed to fetch rating statistics' };
  }
}

// Get customer's review for a specific package
export async function getCustomerReviewForPackage({ customerId, packageId }) {
  try {
    const review = await Review.findOne({ customerId, packageId })
      .populate('customerId', 'fullName email')
      .populate('packageId', 'title destination')
      .populate('bookingId', 'startDate endDate status');

    if (!review) {
      return { review: null };
    }

    return { review };
  } catch (err) {
    console.error('Error fetching customer review:', err);
    return { error: 'Failed to fetch review' };
  }
}
