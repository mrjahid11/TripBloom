import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaStar, FaSearch, FaFilter, FaEdit, FaTrash, FaClock, FaCheckCircle, FaTimesCircle, FaMapMarkerAlt } from 'react-icons/fa';

const MyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'PENDING', 'APPROVED', 'REJECTED'
  const [customerId, setCustomerId] = useState('');

  useEffect(() => {
    // Get customer ID from localStorage or use a test ID
    const userId = localStorage.getItem('userId') || '6756a1b2c3d4e5f6g7h8i9j0';
    setCustomerId(userId);
  }, []);

  useEffect(() => {
    if (customerId) {
      fetchReviews();
    }
  }, [customerId, statusFilter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      let url = `/api/reviews?customerId=${customerId}`;
      
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }

      const response = await axios.get(url);
      
      if (response.data.success) {
        setReviews(response.data.reviews);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/reviews/${reviewId}`, {
        data: { customerId }
      });

      if (response.data.success || response.data.message) {
        alert('Review deleted successfully');
        fetchReviews();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete review. You can only delete pending reviews.');
    }
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
    const statusConfig = {
      PENDING: { icon: FaClock, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', text: 'Pending Review' },
      APPROVED: { icon: FaCheckCircle, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', text: 'Approved' },
      REJECTED: { icon: FaTimesCircle, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', text: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        <Icon className="mr-1" />
        {config.text}
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
    const matchesSearch = review.packageId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          review.packageId?.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          review.comment?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
            <FaStar className="mr-3 text-yellow-400" />
            My Reviews
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all your tour package reviews
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4">
            <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-1">Total Reviews</div>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-300">{reviews.length}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4">
            <div className="text-sm text-green-600 dark:text-green-400 font-semibold mb-1">Approved</div>
            <div className="text-3xl font-bold text-green-900 dark:text-green-300">
              {reviews.filter(r => r.status === 'APPROVED').length}
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-4">
            <div className="text-sm text-yellow-600 dark:text-yellow-400 font-semibold mb-1">Pending</div>
            <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-300">
              {reviews.filter(r => r.status === 'PENDING').length}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4">
            <div className="text-sm text-purple-600 dark:text-purple-400 font-semibold mb-1">Average Rating</div>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-300">
              {reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0'}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviews by package or comment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400" />
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
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
            <FaStar className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Reviews Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters'
                : 'Start reviewing your completed trips to help other travelers!'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">
                Browse Tours
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div
                key={review._id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {review.packageId?.title || 'Package'}
                      </h3>
                      <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                        <FaMapMarkerAlt className="mr-2" />
                        {review.packageId?.destination || 'Unknown destination'}
                      </div>
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-2">
                      {getStatusBadge(review.status)}
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {review.rating}.0
                    </span>
                    {review.verified && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs rounded-full font-semibold">
                        Verified Purchase
                      </span>
                    )}
                  </div>

                  {/* Comment */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {review.comment}
                    </p>
                  </div>

                  {/* Moderator Note (if rejected) */}
                  {review.status === 'REJECTED' && review.moderatorNote && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <FaTimesCircle className="text-red-600 dark:text-red-400 mt-1 mr-3" />
                        <div>
                          <div className="font-semibold text-red-900 dark:text-red-300 mb-1">
                            Rejection Reason
                          </div>
                          <div className="text-sm text-red-700 dark:text-red-400">
                            {review.moderatorNote}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {review.status === 'PENDING' && (
                      <>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                          <FaEdit />
                          Edit Review
                        </button>
                        <button
                          onClick={() => handleDelete(review._id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                        >
                          <FaTrash />
                          Delete
                        </button>
                      </>
                    )}
                    {review.status === 'APPROVED' && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                        <FaCheckCircle className="text-green-500" />
                        This review is visible to other travelers
                      </div>
                    )}
                    {review.status === 'REJECTED' && review.status === 'PENDING' && (
                      <button className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors">
                        Resubmit Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">📝 Review Guidelines</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
            <li>• You can only review tours you've completed</li>
            <li>• Reviews need admin approval before being published</li>
            <li>• You can edit or delete pending reviews</li>
            <li>• Once approved, reviews cannot be edited or deleted</li>
            <li>• Be honest and constructive in your feedback</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MyReviews;
