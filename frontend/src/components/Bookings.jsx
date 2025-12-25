import React, { useEffect, useState } from 'react';
import BookingDetailModal from './BookingDetailModal';
import { useAuth } from '../context/AuthContext';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      const auth = localStorage.getItem('userId');
      const userId = (user && user.id) ? user.id : auth;
      if (!userId) {
        setBookings([]);
        setLoading(false);
        setError('Please log in to view your bookings.');
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/bookings?customerId=${userId}`);
        if (!res.ok) {
          const text = await res.text();
          console.error('Bookings fetch error', res.status, text);
          setError(`HTTP ${res.status}`);
          setBookings([]);
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data && data.success && data.bookings) setBookings(data.bookings);
        else if (Array.isArray(data)) setBookings(data);
        else setError(data?.message || 'Failed to load bookings');
      } catch (err) {
        console.error('Bookings fetch error', err);
        setError('Failed to load bookings');
        setBookings([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const checkPaymentStatus = (booking) => {
    const totalPaid = (booking.payments || []).filter(p => 
      p.status === 'SUCCESS' || p.status === 'COMPLETED' || p.status === 'CONFIRMED'
    ).reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalAmount = booking.totalAmount || 0;
    const isPaid = totalPaid >= totalAmount;
    const startDate = booking.startDate ? new Date(booking.startDate) : null;
    const now = new Date();
    const daysUntilStart = startDate ? Math.ceil((startDate - now) / (1000 * 60 * 60 * 24)) : null;
    
    return { totalPaid, totalAmount, isPaid, daysUntilStart, startDate };
  };

  // Separate bookings into three categories
  const categorizeBookings = () => {
    const paymentDue = [];
    const completed = [];
    const cancelled = [];

    bookings.forEach(b => {
      if (b.status === 'CANCELLED') {
        cancelled.push(b);
      } else {
        const paymentInfo = checkPaymentStatus(b);
        if (paymentInfo.isPaid || b.status === 'CONFIRMED' || b.status === 'COMPLETED') {
          completed.push(b);
        } else {
          paymentDue.push(b);
        }
      }
    });

    return { paymentDue, completed, cancelled };
  };

  const renderBookingCard = (b) => {
    const paymentInfo = checkPaymentStatus(b);
    const showWarning = b.status !== 'CANCELLED' && !paymentInfo.isPaid && paymentInfo.daysUntilStart !== null && paymentInfo.daysUntilStart <= 7 && paymentInfo.daysUntilStart >= 0;
    const isCancelledDueToNonPayment = b.status === 'CANCELLED' && b.cancellation?.reason?.includes('payment');
    
    return (
      <div key={b._id || b.id} className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow ${showWarning ? 'border-2 border-red-500' : ''}`}>
        {showWarning && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-3 rounded">
            <div className="flex items-start">
              <span className="text-red-500 text-xl mr-2">⚠️</span>
              <div>
                <p className="font-semibold text-red-800">Payment Required!</p>
                <p className="text-sm text-red-700">
                  {paymentInfo.daysUntilStart === 0 
                    ? 'Tour starts today! Complete payment immediately or booking will be cancelled.'
                    : `Tour starts in ${paymentInfo.daysUntilStart} day${paymentInfo.daysUntilStart > 1 ? 's' : ''}. Complete payment to confirm your spot.`
                  }
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Unpaid: {b.currency || 'BDT'} {paymentInfo.totalAmount - paymentInfo.totalPaid}
                </p>
              </div>
            </div>
          </div>
        )}
        {isCancelledDueToNonPayment && (
          <div className="bg-red-100 border-l-4 border-red-600 p-3 mb-3 rounded">
            <div className="flex items-start">
              <span className="text-red-600 text-xl mr-2">❌</span>
              <div>
                <p className="font-semibold text-red-900">Booking Cancelled</p>
                <p className="text-sm text-red-800">{b.cancellation?.reason || 'Cancelled due to non-payment'}</p>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{b.packageId?.title || b.package?.title || b.packageTitle || 'Package'}</h3>
            <p className="text-sm text-gray-500">{b.startDate ? new Date(b.startDate).toLocaleDateString() : 'TBD'} → {b.endDate ? new Date(b.endDate).toLocaleDateString() : 'TBD'}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-primary">{b.currency || '$'}{b.totalAmount || b.amount || 0}</p>
            <p className={`mt-1 text-sm font-semibold ${
              b.status === 'CONFIRMED' || b.status === 'Confirmed' ? 'text-green-600' : 
              b.status === 'CANCELLED' ? 'text-red-600' : 'text-yellow-600'
            }`}>{b.status || 'Pending'}</p>
            {b.payments && b.payments.length > 0 && (
              <p className={`text-sm ${
                paymentInfo.isPaid ? 'text-green-600 font-semibold' : 'text-gray-500'
              }`}>Paid: {b.currency || 'BDT'} {paymentInfo.totalPaid}</p>
            )}
          </div>
        </div>
        <div className="mt-4">
          <button onClick={() => setSelected(b)} className="px-4 py-2 rounded-lg bg-primary text-white">View</button>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Bookings</h2>
      {loading ? (
        <p>Loading bookings…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        <>
          {(() => {
            const { paymentDue, completed, cancelled } = categorizeBookings();
            
            return (
              <>
                {/* Payment Due Section */}
                {paymentDue.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center">
                      <span className="mr-2">⚠️</span> Payment Due ({paymentDue.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {paymentDue.map(renderBookingCard)}
                    </div>
                  </div>
                )}

                {/* Confirmed/Completed Section */}
                {completed.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-4 flex items-center">
                      <span className="mr-2">✓</span> Confirmed & Completed ({completed.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {completed.map(renderBookingCard)}
                    </div>
                  </div>
                )}

                {/* Cancelled Section */}
                {cancelled.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-4 flex items-center">
                      <span className="mr-2">✕</span> Cancelled ({cancelled.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cancelled.map(renderBookingCard)}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </>
      )}

      {selected && (
        <BookingDetailModal booking={selected} onClose={() => setSelected(null)} onUpdate={(updated) => {
          setBookings((prev) => prev.map(p => (p._id === updated._id ? updated : p)));
          setSelected(updated);
        }} />
      )}
    </div>
  );
};

export default Bookings;
