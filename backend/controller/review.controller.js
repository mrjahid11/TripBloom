// review.controller.js
import {
  createReview,
  getReviewById,
  listReviews,
  updateReview,
  deleteReview,
  moderateReview,
  markReviewHelpful,
  getPackageRatingStats,
  getCustomerReviewForPackage
} from '../service/review.service.js';

// Create a new review
export async function createReviewController(req, res) {
  const { customerId, packageId, bookingId, rating, comment } = req.body;

  // Validate required fields
  if (!customerId || !packageId || !rating || !comment) {
    return res.status(400).json({
      success: false,
      message: 'Customer ID, package ID, rating, and comment are required'
    });
  }

  // Validate rating range
  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5'
    });
  }

  const result = await createReview({
    customerId,
    packageId,
    bookingId,
    rating,
    comment
  });

  if (result.error) {
    return res.status(400).json({
      success: false,
      message: result.error
    });
  }

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully. It will be published after moderation.',
    review: result.review
  });
}

// Get review by ID
export async function getReviewByIdController(req, res) {
  const { reviewId } = req.params;

  const result = await getReviewById(reviewId);

  if (result.error) {
    return res.status(404).json({
      success: false,
      message: result.error
    });
  }

  res.json({
    success: true,
    review: result.review
  });
}

// List reviews with filters
export async function listReviewsController(req, res) {
  const { packageId, customerId, status, minRating, maxRating } = req.query;

  const result = await listReviews({
    packageId,
    customerId,
    status,
    minRating,
    maxRating
  });

  if (result.error) {
    return res.status(500).json({
      success: false,
      message: result.error
    });
  }

  res.json({
    success: true,
    reviews: result.reviews,
    count: result.reviews.length
  });
}

// Update review
export async function updateReviewController(req, res) {
  const { reviewId } = req.params;
  const { customerId, rating, comment } = req.body;

  if (!customerId) {
    return res.status(400).json({
      success: false,
      message: 'Customer ID is required'
    });
  }

  // Validate rating if provided
  if (rating !== undefined && (rating < 1 || rating > 5)) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5'
    });
  }

  const result = await updateReview({
    reviewId,
    customerId,
    rating,
    comment
  });

  if (result.error) {
    return res.status(400).json({
      success: false,
      message: result.error
    });
  }

  res.json({
    success: true,
    message: 'Review updated successfully',
    review: result.review
  });
}

// Delete review
export async function deleteReviewController(req, res) {
  const { reviewId } = req.params;
  const { customerId } = req.body;

  if (!customerId) {
    return res.status(400).json({
      success: false,
      message: 'Customer ID is required'
    });
  }

  const result = await deleteReview({
    reviewId,
    customerId
  });

  if (result.error) {
    return res.status(400).json({
      success: false,
      message: result.error
    });
  }

  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
}

// Moderate review (admin only)
export async function moderateReviewController(req, res) {
  const { reviewId } = req.params;
  const { status, moderatorNote } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Status is required'
    });
  }

  const result = await moderateReview({
    reviewId,
    status,
    moderatorNote
  });

  if (result.error) {
    return res.status(400).json({
      success: false,
      message: result.error
    });
  }

  res.json({
    success: true,
    message: `Review ${status.toLowerCase()} successfully`,
    review: result.review
  });
}

// Mark review as helpful
export async function markReviewHelpfulController(req, res) {
  const { reviewId } = req.params;

  const result = await markReviewHelpful(reviewId);

  if (result.error) {
    return res.status(404).json({
      success: false,
      message: result.error
    });
  }

  res.json({
    success: true,
    message: 'Review marked as helpful',
    review: result.review
  });
}

// Get package rating statistics
export async function getPackageRatingStatsController(req, res) {
  const { packageId } = req.params;

  const result = await getPackageRatingStats(packageId);

  if (result.error) {
    return res.status(500).json({
      success: false,
      message: result.error
    });
  }

  res.json({
    success: true,
    stats: result.stats
  });
}

// Get customer's review for a specific package
export async function getCustomerReviewForPackageController(req, res) {
  const { customerId, packageId } = req.params;

  const result = await getCustomerReviewForPackage({
    customerId,
    packageId
  });

  if (result.error) {
    return res.status(500).json({
      success: false,
      message: result.error
    });
  }

  res.json({
    success: true,
    review: result.review
  });
}
