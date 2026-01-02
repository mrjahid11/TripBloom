import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const ReviewModal = ({ isOpen, booking, onClose, onSubmitted }) => {
  const { user } = useAuth();
  if (!isOpen || !booking) return null;

  const [error, setError] = useState('');
  const MIN_COMMENT_LENGTH = 10;

  const isBookingCompleted = (b) => {
    if (!b) return false;
    const status = (b.status || (b.booking && b.booking.status) || '').toString().toUpperCase();
    if (status === 'COMPLETED') return true;
    if (b.isOngoing === false) return true;
    const endDate = b.endDate || (b.booking && b.booking.endDate) || b.endedAt || (b.booking && b.booking.endedAt);
    if (endDate) {
      try {
        const d = new Date(endDate);
        if (!isNaN(d.getTime()) && d.getTime() <= Date.now()) return true;
      } catch (e) { /* ignore parse errors */ }
    }
    return false;
  };

  const submitReview = async ({ booking, rating, comment }) => {
    if (!booking) return;
    const pkgId = booking.packageId?._id || booking.packageId || (booking.package?._id || booking.package);
    const userId = (user && user.id) || localStorage.getItem('userId');
    if (!userId) return alert('Please login to submit a review.');
    if (!pkgId) return alert('Package information missing for this booking.');

    if (!comment || comment.length < MIN_COMMENT_LENGTH) {
      setError(`Please write at least ${MIN_COMMENT_LENGTH} characters.`);
      return;
    }

    // Ensure booking is completed before submitting
    if (!isBookingCompleted(booking)) {
      const msg = 'You can only review after the trip has ended';
      setError(msg);
      alert('Failed to submit review: ' + msg);
      return;
    }

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: userId, packageId: pkgId, bookingId: booking._id || booking.id, rating, comment })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Thanks — your review was submitted and is pending moderation.');
        if (onSubmitted) onSubmitted(booking);
        if (onClose) onClose();
      } else {
        const msg = data && data.message ? data.message : (data && JSON.stringify(data)) || 'Unknown error';
        // If backend reports user has already reviewed, treat as a soft success to update UI
        if (typeof msg === 'string' && msg.toLowerCase().includes('already reviewed')) {
          alert(msg);
          if (onSubmitted) onSubmitted(booking);
          if (onClose) onClose();
          return;
        }
        alert('Failed to submit review: ' + msg);
      }
    } catch (err) {
      console.error('Review submit error', err);
      alert('Failed to submit review');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Write a Review</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{booking.packageId?.title || booking.package?.title || 'Package'}</p>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const form = e.target;
          const rating = Number(form.rating.value);
          const comment = form.comment.value.trim();
          setError('');
          if (!rating || rating < 1 || rating > 5) { alert('Please provide a rating between 1 and 5'); return; }
          if (!comment || comment.length < MIN_COMMENT_LENGTH) { setError(`Please write at least ${MIN_COMMENT_LENGTH} characters.`); return; }
          await submitReview({ booking, rating, comment });
        }}>
          <div className="mb-3">
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Rating</label>
            <select name="rating" defaultValue="5" className="px-3 py-2 rounded-lg w-32 bg-white dark:bg-gray-700 border">
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Very good</option>
              <option value="3">3 - Good</option>
              <option value="2">2 - Fair</option>
              <option value="1">1 - Poor</option>
            </select>
          </div>
                <div className="mb-3">
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Comment</label>
                  <textarea name="comment" rows="4" minLength={MIN_COMMENT_LENGTH} className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border" required></textarea>
                  {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700">Cancel</button>
              <button type="submit" disabled={!isBookingCompleted(booking)} className="px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-60 disabled:cursor-not-allowed">Submit Review</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
