export async function getBookingsForCustomer(customerId) {
  try {
    const res = await fetch(`/api/bookings?customerId=${customerId}`);
    if (!res.ok) {
      const text = await res.text();
      console.error('getBookingsForCustomer non-OK response', res.status, text);
      return { success: false, bookings: [], message: `HTTP ${res.status}` };
    }
    return await res.json();
  } catch (err) {
    console.error('getBookingsForCustomer error', err);
    return { success: false, bookings: [] };
  }
}

export async function addPayment(bookingId, { amount, method = 'card', transactionRef = '' }) {
  try {
    const res = await fetch(`/api/bookings/${bookingId}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, method, transactionRef })
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('addPayment non-OK response', res.status, text);
      return { success: false, message: `HTTP ${res.status}` };
    }
    return await res.json();
  } catch (err) {
    console.error('addPayment error', err);
    return { success: false, message: 'Network error' };
  }
}
