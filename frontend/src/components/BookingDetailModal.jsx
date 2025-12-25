import React, { useState } from 'react';
import PaymentForm from './PaymentForm';
import Invoice from './Invoice';

const BookingDetailModal = ({ booking, onClose, onUpdate }) => {
  const [showPayment, setShowPayment] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const handlePaymentSuccess = (res) => {
    if (res && res.success && res.booking) {
      onUpdate(res.booking);
      setShowPayment(false);
    } else {
      // If backend returned an error, surface it via alert for now
      alert(res?.message || 'Payment failed');
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
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button 
            onClick={() => setShowInvoice(true)} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            View Invoice
          </button>
          {!isFullyPaid && !bookingConfirmed && (
            <button onClick={() => setShowPayment(true)} className="px-4 py-2 bg-primary text-white rounded-lg">Add Payment</button>
          )}
          {isFullyPaid && (
            <div className="px-4 py-2 rounded-lg bg-green-50 text-green-700 font-semibold">Paid in full</div>
          )}
          {bookingConfirmed && !isFullyPaid && (
            <div className="px-4 py-2 rounded-lg bg-yellow-50 text-yellow-700 font-semibold">Booking {booking.status}</div>
          )}
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">Close</button>
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
