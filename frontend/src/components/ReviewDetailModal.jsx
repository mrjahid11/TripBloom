import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  FaTimes, FaStar, FaUser, FaEnvelope, FaCalendar, FaFlag, 
  FaEyeSlash, FaCheckCircle, FaBan, FaExclamationTriangle,
  FaHistory, FaChartLine
} from 'react-icons/fa';

const ReviewDetailModal = ({ review, onClose, onUpdateStatus, onFlagReview, allReviews }) => {
  const [confirmAction, setConfirmAction] = useState(null);

  // Get user's review history
  const userReviews = allReviews.filter(r => r.userId === review.userId);
  const userStats = {
    totalReviews: userReviews.length,
    avgRating: userReviews.length > 0 
      ? (userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length).toFixed(1)
      : 0,
    flaggedCount: userReviews.filter(r => r.isFlagged).length,
    hiddenCount: userReviews.filter(r => r.status === 'HIDDEN').length,
    lowRatingsCount: userReviews.filter(r => r.rating <= 2).length
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
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAction = (action) => {
    setConfirmAction(action);
  };

  const executeAction = () => {
    switch (confirmAction) {
      case 'hide':
        onUpdateStatus(review._id, 'HIDDEN');
        break;
      case 'spam':
        onUpdateStatus(review._id, 'HIDDEN');
        onFlagReview(review._id, true);
        break;
      case 'visible':
        onUpdateStatus(review._id, 'VISIBLE');
        onFlagReview(review._id, false);
        break;
      default:
        break;
    }
    setConfirmAction(null);
    onClose();
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
          {/* Review Info Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-2">Customer</div>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {review.user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-lg">
                      {review.user?.fullName || 'Unknown User'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <FaEnvelope className="mr-1" />
                      {review.user?.email || 'No email'}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-2">Package</div>
                <div className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                  {review.package?.title || 'Package'}
                </div>
                {review.package?.bookings && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {review.package.bookings.length} total bookings
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Rating</div>
                <div className="flex justify-center mb-1">
                  {renderStars(review.rating)}
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {review.rating}/5
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Status</div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-2 ${
                  review.status === 'VISIBLE' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                  review.status === 'HIDDEN' ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400' :
                  'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {review.status}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Created</div>
                <div className="text-xs text-gray-900 dark:text-white mt-2">
                  {formatDate(review.createdAt)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Flagged</div>
                <div className="text-2xl mt-1">
                  {review.isFlagged ? (
                    <FaFlag className="inline text-red-600 dark:text-red-400" />
                  ) : (
                    <FaCheckCircle className="inline text-green-600 dark:text-green-400" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Suspicious Alert */}
          {review.isSuspicious && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <FaExclamationTriangle className="text-orange-600 dark:text-orange-400 mt-1 mr-3" />
                <div>
                  <div className="font-semibold text-orange-900 dark:text-orange-300 mb-1">
                    Suspicious Review Detected
                  </div>
                  <div className="text-sm text-orange-700 dark:text-orange-400">
                    This review has a low rating ({review.rating} stars) but the package has {review.package?.bookings?.length || 0} bookings. 
                    This could indicate a fake review or competitor sabotage. Please investigate.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full Comment */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Comment</div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-gray-900 dark:text-white leading-relaxed">
              {review.comment || 'No comment provided'}
            </div>
          </div>

          {/* User History */}
          <div className="mb-6">
            <div className="flex items-center text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <FaHistory className="mr-2 text-blue-600 dark:text-blue-400" />
              User Review History
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3 text-center">
                <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Total Reviews</div>
                <div className="text-xl font-bold text-blue-900 dark:text-blue-300">{userStats.totalReviews}</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-3 text-center">
                <div className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">Avg Rating</div>
                <div className="text-xl font-bold text-yellow-900 dark:text-yellow-300 flex items-center justify-center">
                  <FaStar className="mr-1 text-sm" />
                  {userStats.avgRating}
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-3 text-center">
                <div className="text-xs text-red-600 dark:text-red-400 font-semibold">Flagged</div>
                <div className="text-xl font-bold text-red-900 dark:text-red-300">{userStats.flaggedCount}</div>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Hidden</div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-300">{userStats.hiddenCount}</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-3 text-center">
                <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold">Low Ratings</div>
                <div className="text-xl font-bold text-orange-900 dark:text-orange-300">{userStats.lowRatingsCount}</div>
              </div>
            </div>

            {/* User's Other Reviews */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {userReviews
                .filter(r => r._id !== review._id)
                .slice(0, 5)
                .map(r => (
                  <div key={r._id} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-900 dark:text-white">
                          {r.package?.title || 'Package'}
                        </div>
                        <div className="flex items-center mt-1">
                          {renderStars(r.rating)}
                          <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                            {formatDate(r.createdAt)}
                          </span>
                        </div>
                      </div>
                      {r.isFlagged && (
                        <FaFlag className="text-red-600 dark:text-red-400 text-sm" />
                      )}
                    </div>
                    <div className="text-xs text-gray-700 dark:text-gray-300">
                      {r.comment?.substring(0, 100)}{r.comment?.length > 100 ? '...' : ''}
                    </div>
                  </div>
                ))}
              {userReviews.length === 1 && (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                  This is the user's only review
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {review.status !== 'HIDDEN' && (
              <button
                onClick={() => handleAction('hide')}
                className="flex items-center justify-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
              >
                <FaEyeSlash className="mr-2" />
                Hide Review
              </button>
            )}
            <button
              onClick={() => handleAction('spam')}
              className="flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              <FaBan className="mr-2" />
              Mark as Spam
            </button>
            {review.status !== 'VISIBLE' && (
              <button
                onClick={() => handleAction('visible')}
                className="flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
              >
                <FaCheckCircle className="mr-2" />
                Keep Visible
              </button>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        {confirmAction && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4 shadow-2xl">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Confirm Action
              </h4>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                {confirmAction === 'hide' && 'Are you sure you want to hide this review? It will no longer be visible to customers.'}
                {confirmAction === 'spam' && 'Are you sure you want to mark this as spam? The review will be hidden and the user will be flagged.'}
                {confirmAction === 'visible' && 'Are you sure you want to make this review visible? It will be shown to all customers.'}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={executeAction}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors font-semibold ${
                    confirmAction === 'spam' || confirmAction === 'hide'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ReviewDetailModal;
