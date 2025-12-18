import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaStar, FaCheck, FaTimes, FaEye, FaFilter, FaSearch, FaFlag, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import ReviewDetailModal from './ReviewDetailModal';

const ReviewsModerationList = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [statusFilter, ratingFilter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:5000/api/reviews';
      const params = [];
      
      if (statusFilter !== 'all') {
        params.push(`status=${statusFilter}`);
      }
      
      if (ratingFilter !== 'all') {
        if (ratingFilter === 'low') {
          params.push('maxRating=2');
        } else if (ratingFilter === 'high') {
          params.push('minRating=4');
        }
      }

      if (params.length > 0) {
        url += '?' + params.join('&');
      }

      const response = await axios.get(url);
      
      if (response.data.success) {
        setReviews(response.data.reviews);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (reviewId, status, note = '') => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/reviews/${reviewId}/moderate`,
        { status, moderatorNote: note }
      );

      if (response.data.success) {
        fetchReviews();
        alert(`Review ${status.toLowerCase()} successfully!`);
      }
    } catch (error) {
      alert('Failed to moderate review: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleApprove = (reviewId) => {
    if (window.confirm('Are you sure you want to approve this review?')) {
      handleModerate(reviewId, 'APPROVED');
    }
  };

  const handleReject = (reviewId) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason !== null) {
      handleModerate(reviewId, 'REJECTED', reason || 'Does not meet guidelines');
    }
  };

  const handleViewDetails = (review) => {
    setSelectedReview(review);
    setShowDetailModal(true);
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FaStar
        key={index}
        className={index < rating ? 'text-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  const getStatusBadge = (status) => {
    const config = {
      PENDING: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-400', icon: FaClock },
      APPROVED: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400', icon: FaCheckCircle },
      REJECTED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-400', icon: FaTimesCircle }
    };

    const { bg, text, icon: Icon } = config[status] || config.PENDING;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
        <Icon className="mr-1" />
        {status}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.customerId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.packageId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <FaStar className="mr-3 text-yellow-400" />
          Review Moderation
        </h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-4">
          <div className="text-sm text-yellow-600 dark:text-yellow-400 font-semibold mb-1">Pending</div>
          <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-300">
            {reviews.filter(r => r.status === 'PENDING').length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4">
          <div className="text-sm text-green-600 dark:text-green-400 font-semibold mb-1">Approved</div>
          <div className="text-3xl font-bold text-green-900 dark:text-green-300">
            {reviews.filter(r => r.status === 'APPROVED').length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-4">
          <div className="text-sm text-red-600 dark:text-red-400 font-semibold mb-1">Rejected</div>
          <div className="text-3xl font-bold text-red-900 dark:text-red-300">
            {reviews.filter(r => r.status === 'REJECTED').length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4">
          <div className="text-sm text-purple-600 dark:text-purple-400 font-semibold mb-1">Avg Rating</div>
          <div className="text-3xl font-bold text-purple-900 dark:text-purple-300">
            {reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0'}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Ratings</option>
            <option value="high">High (4-5 ⭐)</option>
            <option value="low">Low (1-2 ⭐)</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <FaStar className="mx-auto text-6xl mb-4 opacity-20" />
          <p>No reviews found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div
              key={review._id}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {review.packageId?.title || 'Unknown Package'}
                    </h3>
                    {getStatusBadge(review.status)}
                    {review.verified && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    By {review.customerId?.fullName || 'Anonymous'} • {formatDate(review.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {renderStars(review.rating)}
                  <span className="ml-2 font-bold text-gray-900 dark:text-white">{review.rating}.0</span>
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
                {review.comment}
              </p>

              {review.moderatorNote && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-800 dark:text-red-300">
                    <strong>Moderator Note:</strong> {review.moderatorNote}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewDetails(review)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  <FaEye />
                  View Details
                </button>
                {review.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleApprove(review._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                    >
                      <FaCheck />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(review._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                    >
                      <FaTimes />
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedReview && (
        <ReviewDetailModal
          review={selectedReview}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedReview(null);
          }}
          onModerate={(status, note) => {
            handleModerate(selectedReview._id, status, note);
            setShowDetailModal(false);
            setSelectedReview(null);
          }}
        />
      )}
    </div>
  );
};

export default ReviewsModerationList;
