import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import BookingDetailModal from './BookingDetailModal';
import OperatorChatModal from './OperatorChatModal';
import { FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaStar, FaComments } from 'react-icons/fa';

const CustomerHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [chatBooking, setChatBooking] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      const userId = (user && user.id) || localStorage.getItem('userId');
      if (!userId) {
        setHistory([]);
        setLoading(false);
        setError('Please log in to view your history.');
        return;
      }
      
      setLoading(true);
      try {
        const res = await fetch(`/api/bookings?customerId=${userId}`);
        if (!res.ok) {
          const text = await res.text();
          console.error('History fetch error', res.status, text);
          setError(`HTTP ${res.status}`);
          setHistory([]);
          setLoading(false);
          return;
        }
        const data = await res.json();
        let bookings = [];
        if (data && data.success && data.bookings) bookings = data.bookings;
        else if (Array.isArray(data)) bookings = data;
        else setError(data?.message || 'Failed to load history');

        // Filter for completed/cancelled bookings or past trips
        const now = new Date();
        const pastBookings = bookings.filter(b => {
          const endDate = b.endDate ? new Date(b.endDate) : null;
          return b.status === 'COMPLETED' || 
                 b.status === 'CANCELLED' || 
                 (endDate && endDate < now);
        }).sort((a, b) => new Date(b.endDate || b.createdAt) - new Date(a.endDate || a.createdAt));

        setHistory(pastBookings);
      } catch (err) {
        console.error('History fetch error', err);
        setError('Failed to load history');
        setHistory([]);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Travel History</h1>
          <p className="text-gray-600 dark:text-gray-400">Your past adventures and experiences</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-600">Loading your travel history...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🧳</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Travel History Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Start your journey and create unforgettable memories!</p>
            <button 
              onClick={() => window.location.href = '/packages'}
              className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Browse Packages
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((booking) => {
              const packageInfo = booking.packageId || {};
              const isPaid = (booking.payments || [])
                .filter(p => p.status === 'COMPLETED' || p.status === 'CONFIRMED' || p.status === 'SUCCESS')
                .reduce((sum, p) => sum + (p.amount || 0), 0) >= (booking.totalAmount || 0);
              
              return (
                <div
                  key={booking._id || booking.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="md:w-64 h-48 md:h-auto">
                      <img
                        src={packageInfo.photos?.[0] || `https://source.unsplash.com/featured/?${encodeURIComponent(packageInfo.title || 'travel')}`}
                        alt={packageInfo.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://source.unsplash.com/featured/?travel`;
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {packageInfo.title || 'Package'}
                          </h3>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 space-x-4">
                            <span className="flex items-center">
                              <FaCalendarAlt className="mr-2" />
                              {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                            </span>
                            <span>{booking.numTravelers || 1} traveler{booking.numTravelers > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            booking.status === 'COMPLETED' 
                              ? 'bg-green-100 text-green-800' 
                              : booking.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status === 'COMPLETED' && <FaCheckCircle className="mr-1" />}
                            {booking.status === 'CANCELLED' && <FaTimesCircle className="mr-1" />}
                            {booking.status}
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            {isPaid ? '✓ Paid' : 'Partially paid'}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Total Amount</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {booking.currency || 'BDT'} {booking.totalAmount || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Amount Paid</p>
                          <p className="font-semibold text-green-600">
                            {booking.currency || 'BDT'} {(booking.payments || [])
                              .filter(p => p.status === 'COMPLETED' || p.status === 'CONFIRMED' || p.status === 'SUCCESS')
                              .reduce((sum, p) => sum + (p.amount || 0), 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Booking Date</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formatDate(booking.createdAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Booking Type</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {booking.bookingType || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => setSelected(booking)}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          View Details
                        </button>
                        {isPaid && booking.assignedOperator && (
                          <button
                            onClick={() => setChatBooking(booking)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                          >
                            <FaComments className="mr-2" />
                            Chat with Operator
                          </button>
                        )}
                        {booking.status === 'COMPLETED' && (
                          <button
                            onClick={() => window.location.href = '/customer/reviews'}
                            className="px-4 py-2 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors flex items-center"
                          >
                            <FaStar className="mr-2" />
                            Write Review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selected && (
          <BookingDetailModal
            booking={selected}
            onClose={() => setSelected(null)}
            onUpdate={(updated) => {
              setHistory((prev) => prev.map(b => (b._id === updated._id ? updated : b)));
              setSelected(updated);
            }}
          />
        )}
        
        {chatBooking && (
          <OperatorChatModal
            isOpen={true}
            onClose={() => setChatBooking(null)}
            booking={chatBooking}
            operator={chatBooking.assignedOperator}
          />
        )}
      </div>
    </div>
  );
};

export default CustomerHistory;
