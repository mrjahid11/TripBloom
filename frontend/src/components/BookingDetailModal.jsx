import React, { useState } from 'react';
import PaymentForm from './PaymentForm';
import Invoice from './Invoice';

const BookingDetailModal = ({ booking, onClose, onUpdate }) => {
  const [showPayment, setShowPayment] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handlePaymentSuccess = (res) => {
    if (res && res.success && res.booking) {
      onUpdate(res.booking);
      setShowPayment(false);
    } else {
      // If backend returned an error, surface it via alert for now
      alert(res?.message || 'Payment failed');
    }
  };

  const handleCancelTour = async () => {
    // Calculate refund based on policy
    const calculateRefundAmount = () => {
      const now = new Date();
      const startDate = new Date(booking.startDate);
      const totalPaid = (booking.payments || [])
        .filter(p => p.status === 'SUCCESS' || p.status === 'Success')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      if (now >= startDate) return 0;

      const daysUntilStart = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
      
      let refundPercentage;
      let policy;
      if (daysUntilStart > 30) {
        refundPercentage = 1.0;
        policy = '100% refund (more than 30 days before tour)';
      } else if (daysUntilStart >= 15) {
        refundPercentage = 0.75;
        policy = '75% refund (15-30 days before tour)';
      } else if (daysUntilStart >= 7) {
        refundPercentage = 0.50;
        policy = '50% refund (7-14 days before tour)';
      } else if (daysUntilStart >= 3) {
        refundPercentage = 0.25;
        policy = '25% refund (3-6 days before tour)';
      } else {
        refundPercentage = 0.10;
        policy = '10% refund (less than 3 days before tour)';
      }

      return {
        amount: Math.round(totalPaid * refundPercentage),
        percentage: refundPercentage * 100,
        policy,
        totalPaid
      };
    };

    const refundInfo = calculateRefundAmount();
    
    const confirmMessage = refundInfo.totalPaid > 0 
      ? `Are you sure you want to cancel this tour?\n\nRefund Policy: ${refundInfo.policy}\n\nYou paid: ${booking.currency || 'BDT'} ${refundInfo.totalPaid}\nYou will receive: ${booking.currency || 'BDT'} ${refundInfo.amount} (${refundInfo.percentage}%)\n\nThis action cannot be undone.`
      : 'Are you sure you want to cancel this tour? This action cannot be undone.';
    
    const confirmCancel = window.confirm(confirmMessage);
    if (!confirmCancel) return;

    const reason = prompt('Please provide a reason for cancellation (optional):') || 'Customer requested cancellation';
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
      alert('User not logged in');
      return;
    }

    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${booking._id || booking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason })
      });

      const data = await res.json();
      
      if (data.success) {
        const successMessage = refundInfo.amount > 0 
          ? `Booking cancelled successfully!\n\nRefund amount: ${booking.currency || 'BDT'} ${refundInfo.amount}\nRefund will be processed within 7-10 business days.`
          : 'Booking cancelled successfully!';
        alert(successMessage);
        if (data.booking) {
          onUpdate(data.booking);
        }
        onClose();
      } else {
        alert(data.message || 'Failed to cancel booking');
      }
    } catch (err) {
      console.error('Cancel error:', err);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const paidAmount = (booking.payments || []).filter(p => (p.status === 'SUCCESS' || p.status === 'Success')).reduce((s, p) => s + (p.amount || 0), 0);
  const totalAmount = booking.totalAmount || booking.amount || 0;
  const isFullyPaid = paidAmount >= totalAmount && totalAmount > 0;
  const bookingConfirmed = (booking.status || '').toString().toUpperCase() === 'CONFIRMED' || (booking.status || '').toString().toUpperCase() === 'COMPLETED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">Booking Details</h3>
          <button onClick={onClose} className="text-gray-600">Close</button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Package</p>
            <p className="font-semibold">{booking.package?.title || booking.packageTitle || '—'}</p>

            <p className="mt-3 text-sm text-gray-500">Dates</p>
            <p className="font-semibold">{booking.startDate} → {booking.endDate}</p>

            <p className="mt-3 text-sm text-gray-500">Travelers</p>
            <p className="font-semibold">{booking.numTravelers || booking.travelers?.length || '-'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Amount</p>
            <p className="font-semibold">{booking.currency || '$'}{booking.totalAmount || booking.amount || 0}</p>

            <p className="mt-3 text-sm text-gray-500">Booking status</p>
            <p className="font-semibold">{booking.status || 'PENDING'}</p>

            {booking.status === 'CANCELLED' && booking.cancellation && (
              <div className="mt-3">
                <p className="text-sm text-gray-500">Cancellation Details</p>
                <p className="text-sm text-gray-700">
                  {booking.cancellation.reason || 'No reason provided'}
                </p>
                {booking.cancellation.refundAmount > 0 && (
                  <p className="text-sm font-semibold text-green-600 mt-1">
                    Refund: {booking.currency || 'BDT'} {booking.cancellation.refundAmount}
                  </p>
                )}
                {booking.cancellation.refundAmount === 0 && (
                  <p className="text-sm text-gray-600 mt-1">No refund (tour already started or policy applied)</p>
                )}
              </div>
            )}

            {booking.status !== 'CANCELLED' && (
              <div className="mt-3">
                <p className="text-sm text-gray-500">Payment status</p>
                <p className="font-semibold">
                  {(() => {
                    const paid = (booking.payments || []).filter(p => (p.status === 'SUCCESS' || p.status === 'Success')).reduce((s, p) => s + (p.amount || 0), 0);
                    const total = booking.totalAmount || booking.amount || 0;
                    if (paid <= 0) return `Not paid (${booking.currency || ''}${0} of ${booking.currency || ''}${total})`;
                    if (paid < total) return `Partially paid (${booking.currency || ''}${paid} of ${booking.currency || ''}${total})`;
                    return `Paid in full (${booking.currency || ''}${paid})`;
                  })()}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          {booking.status !== 'CANCELLED' && (
            <button 
              onClick={() => setShowInvoice(true)} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Invoice
            </button>
          )}
          {booking.status !== 'CANCELLED' && !isFullyPaid && !bookingConfirmed && (
            <button onClick={() => setShowPayment(true)} className="px-4 py-2 bg-primary text-white rounded-lg">Add Payment</button>
          )}
          {isFullyPaid && (
            <div className="px-4 py-2 rounded-lg bg-green-50 text-green-700 font-semibold">Paid in full</div>
          )}
          {bookingConfirmed && !isFullyPaid && (
            <div className="px-4 py-2 rounded-lg bg-yellow-50 text-yellow-700 font-semibold">Booking {booking.status}</div>
          )}
          {booking.status === 'CANCELLED' && (
            <div className="px-4 py-2 rounded-lg bg-red-50 text-red-700 font-semibold">Booking Cancelled</div>
          )}
          {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
            <button 
              onClick={handleCancelTour} 
              disabled={cancelling}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Tour'}
            </button>
          )}
        </div>

        {booking.payments && booking.payments.length > 0 && (
          <div className="mt-4 bg-gray-50 dark:bg-gray-900 p-4 rounded">
            <h4 className="font-semibold">Payments</h4>
            <ul className="text-sm text-gray-600 mt-2">
              {booking.payments.map((p, idx) => (
                <li key={idx} className="mb-1">{p.amount} {booking.currency || ''} — {p.method} — <span className="font-semibold">{p.status}</span></li>
              ))}
            </ul>
          </div>
        )}

        {showPayment && (
          <div className="mt-6">
            <PaymentForm booking={booking} onSuccess={handlePaymentSuccess} onCancel={() => setShowPayment(false)} />
          </div>
        )}

        <Invoice isOpen={showInvoice} onClose={() => setShowInvoice(false)} booking={booking} />
      </div>
    </div>
  );
};

export default BookingDetailModal;
