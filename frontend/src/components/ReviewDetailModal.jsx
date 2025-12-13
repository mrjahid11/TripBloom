import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { 
  FaTimes, FaStar, FaUser, FaEnvelope, FaCalendar, FaCheck, 
  FaBan, FaExclamationTriangle, FaMapMarkerAlt, FaPhone
} from 'react-icons/fa';

const ReviewDetailModal = ({ review, onClose, onModerate }) => {
  const [moderatorNote, setModeratorNote] = useState('');

  const handleModerate = (status) => {
    if (onModerate) {
      onModerate(status, moderatorNote);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map(star => (
          <FaStar
            key={star}
            className={`text-xl ${
              star <= rating 
                ? 'text-yellow-400' 
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-2xl z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FaTimes size={24} />
          </button>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <FaStar className="mr-3 text-yellow-400" />
            Review Details
          </h3>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Review Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Customer Info */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6">
              <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-3 flex items-center">
                <FaUser className="mr-2" />
                Customer Information
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Name</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {review.customerId?.fullName || 'Anonymous'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                    <FaEnvelope className="mr-1" />
                    Email
                  </div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {review.customerId?.email || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Package Info */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6">
              <div className="text-sm text-green-600 dark:text-green-400 font-semibold mb-3 flex items-center">
                <FaMapMarkerAlt className="mr-2" />
                Package Information
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Title</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {review.packageId?.title || 'Unknown Package'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Destination</div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {review.packageId?.destination || 'N/A'}
                  </div>
                </div>
                {review.packageId?.category && (
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Category</div>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {review.packageId.category}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rating & Status */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Rating</div>
                <div className="flex justify-center mb-2">
                  {renderStars(review.rating)}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {review.rating}/5
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Status</div>
                <div className="mt-3">
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(review.status)}`}>
                    {review.status}
                  </span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center justify-center">
                  <FaCalendar className="mr-1" />
                  Submitted
                </div>
                <div className="text-sm text-gray-900 dark:text-white mt-3">
                  {formatDate(review.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Full Comment */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Review Comment</div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <p className="text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                {review.comment || 'No comment provided'}
              </p>
            </div>
          </div>

          {/* Booking Details if available */}
          {review.bookingId && (
            <div className="mb-6">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Booking Details</div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  {review.bookingId.startDate && (
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Start Date</div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(review.bookingId.startDate)}
                      </div>
                    </div>
                  )}
                  {review.bookingId.endDate && (
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">End Date</div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(review.bookingId.endDate)}
                      </div>
                    </div>
                  )}
                  {review.bookingId.status && (
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Booking Status</div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {review.bookingId.status}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Moderator Note if exists */}
          {review.moderatorNote && (
            <div className="mb-6">
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-start">
                  <FaExclamationTriangle className="text-orange-600 dark:text-orange-400 mt-1 mr-3" />
                  <div className="flex-1">
                    <div className="font-semibold text-orange-900 dark:text-orange-300 mb-1">
                      Moderator Note
                    </div>
                    <div className="text-sm text-orange-700 dark:text-orange-400">
                      {review.moderatorNote}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Moderation Actions - Only show for pending reviews */}
          {review.status === 'PENDING' && onModerate && (
            <div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Moderation Actions</div>
              
              {/* Optional moderator note */}
              <div className="mb-4">
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Moderator Note (optional)
                </label>
                <textarea
                  value={moderatorNote}
                  onChange={(e) => setModeratorNote(e.target.value)}
                  placeholder="Add a note explaining your decision..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to approve this review?')) {
                      handleModerate('APPROVED');
                    }
                  }}
                  className="flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <FaCheck className="mr-2" />
                  Approve Review
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reject this review?')) {
                      handleModerate('REJECTED');
                    }
                  }}
                  className="flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <FaBan className="mr-2" />
                  Reject Review
                </button>
              </div>
            </div>
          )}

          {/* Already moderated message */}
          {review.status !== 'PENDING' && (
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400">
                This review has already been {review.status.toLowerCase()}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ReviewDetailModal;
