import React, { useState } from 'react';

const PaymentForm = ({ booking, onSuccess, onCancel }) => {
  const [amount, setAmount] = useState(booking.totalAmount || booking.amount || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [method, setMethod] = useState('CARD');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const transactionRef = `tx_${Date.now()}`;
    
    try {
      const res = await fetch(`/api/bookings/${booking._id || booking.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, method, transactionRef })
      });
      
      if (!res.ok) {
        const text = await res.text();
        console.error('Payment API error', res.status, text);
        setError(`HTTP ${res.status}`);
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      setLoading(false);
      
      if (data && data.success) {
        onSuccess(data);
      } else {
        setError(data?.message || 'Payment failed');
      }
    } catch (err) {
      console.error('Payment error', err);
      setError('Network error');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
      <div className="mb-3">
        <label className="block text-sm text-gray-600">Amount</label>
        <input type="number" min="0" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="mt-1 w-full p-2 rounded border" />
      </div>

      <div className="mb-3">
        <label className="block text-sm text-gray-600">Payment Method</label>
        <select className="mt-1 w-full p-2 rounded border" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="CARD">Card</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
          <option value="BKASH">Bkash</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

      <div className="flex space-x-2">
        <button disabled={loading} type="submit" className="px-4 py-2 bg-green-600 text-white rounded">{loading ? 'Processing…' : 'Pay'}</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded">Cancel</button>
      </div>
    </form>
  );
};

export default PaymentForm;
