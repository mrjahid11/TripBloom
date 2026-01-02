// booking.controller.js
import {
  createBooking,
  getBookingById,
  listBookings,
  updateBooking,
  cancelBooking,
  addPayment,
  getCustomerBookingStats,
  completeBooking,
  cancelUnpaidExpiredBookings,
  processRefund,
  requestDateChange,
  approveDateChange,
  rejectDateChange
} from '../service/booking.service.js';
import { autoCompletePassedBookings } from '../service/booking.service.js';
import { checkInBooking } from '../service/booking.service.js';

// Create a new booking
export async function createBookingController(req, res) {
  const {
    customerId,
    packageId,
    bookingType,
    groupDepartureId,
    startDate,
    endDate,
    numTravelers,
    travelers,
    totalAmount,
    currency,
    reservedSeats
  } = req.body;

  // Validate required fields
  if (!customerId || !packageId || !bookingType || !startDate || !endDate || !numTravelers || !travelers || !totalAmount) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }

  const result = await createBooking({
    customerId,
    packageId,
    bookingType,
    groupDepartureId,
    startDate,
    endDate,
    numTravelers,
    travelers,
    totalAmount,
    currency,
    reservedSeats
  });

  if (result.error) {
    return res.status(400).json({
      success: false,
      message: result.error
    });
  }

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    booking: result.booking
  });
}

// Get booking by ID
export async function getBookingByIdController(req, res) {
  const { bookingId } = req.params;

  const result = await getBookingById(bookingId);

  if (result.error) {
    return res.status(404).json({
      success: false,
      message: result.error
    });
  }

  res.json({
    success: true,
    booking: result.booking
  });
}

// List bookings with filters
export async function listBookingsController(req, res) {
  const {
    customerId,
    packageId,
    groupDepartureId,
    status,
    bookingType,
    startDate,
    endDate
  } = req.query;

  const result = await listBookings({
    customerId,
    packageId,
    groupDepartureId,
    status,
    bookingType,
    startDate,
    endDate
  });

  if (result.error) {
    return res.status(500).json({
      success: false,
      message: result.error
    });
  }

  res.json({
    success: true,
    bookings: result.bookings,
    count: result.bookings.length
  });
}

// Update booking
export async function updateBookingController(req, res) {
  const { bookingId } = req.params;
  const { travelers, operatorNotes } = req.body;

  const result = await updateBooking({
    bookingId,
    travelers,
    operatorNotes
  });

  if (result.error) {
    return res.status(400).json({
      success: false,
      message: result.error
    });
  }

  res.json({
    success: true,
    message: 'Booking updated successfully',
    booking: result.booking
  });
}

// Cancel booking
export async function cancelBookingController(req, res) {
  const { bookingId } = req.params;
  const { userId, reason } = req.body;

  if (!userId || !reason) {
    return res.status(400).json({
      success: false,
      message: 'User ID and cancellation reason are required'
    });
  }

  const result = await cancelBooking({
    bookingId,
    userId,
    reason
  });

  if (result.error) {
    return res.status(400).json({
      success: false,
      message: result.error
    });
  }

  res.json({
    success: true,
    message: 'Booking cancelled successfully',
    booking: result.booking,
    refundAmount: result.refundAmount
  });
}

// Add payment to booking
export async function addPaymentController(req, res) {
  const { bookingId } = req.params;
  const { amount, method, transactionRef } = req.body;

  if (!amount || !method) {
    return res.status(400).json({
      success: false,
      message: 'Payment amount and method are required'
    });
  }

  const result = await addPayment({
    bookingId,
    amount,
    method,
    transactionRef
  });

  if (result.error) {
    return res.status(400).json({
      success: false,
      message: result.error
    });
  }

  res.json({
    success: true,
    message: 'Payment added successfully',
    booking: result.booking
  });
}

// Customer check-in for a booking
export async function checkInBookingController(req, res) {
  try {
    const { bookingId } = req.params;
    const { userId } = req.body;

    const result = await checkInBooking(bookingId, userId);
    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }

    res.json({ success: true, message: 'Checked in successfully', booking: result.booking });
  } catch (err) {
    console.error('Check-in controller error:', err);
    res.status(500).json({ success: false, message: 'Server error during check-in' });
  }
}
// Get customer booking statistics
export async function getCustomerStatsController(req, res) {
  const { customerId } = req.params;

  const result = await getCustomerBookingStats(customerId);

  if (result.error) {
    return res.status(500).json({
      success: false,
      message: result.error
    });
  }

  res.json({
    success: true,
    stats: result.stats
  });
}

// Complete a booking
export async function completeBookingController(req, res) {
  const { bookingId } = req.params;

  const result = await completeBooking(bookingId);

  if (result.error) {
    return res.status(400).json({
      success: false,
      message: result.error
    });
  }

  res.json({
    success: true,
    message: 'Booking marked as completed',
    booking: result.booking
  });
}

// Cancel unpaid bookings that have passed start date
export async function cancelUnpaidBookingsController(req, res) {
  try {
    const result = await cancelUnpaidExpiredBookings();
    res.json({ 
      success: true, 
      message: `${result.cancelledCount} unpaid booking(s) cancelled.`,
      cancelledBookings: result.bookings
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

// Admin: trigger auto-complete job on demand
export async function autoCompleteBookingsController(req, res) {
  try {
    const result = await autoCompletePassedBookings();
    if (result.error) {
      return res.status(500).json({ success: false, message: result.error });
    }
    res.json({ success: true, message: `Auto-complete processed ${result.completedCount || 0} bookings.`, result });
  } catch (err) {
    console.error('Error in autoCompleteBookingsController:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

// Process refund for a cancelled booking (Admin only)
export async function processRefundController(req, res) {
  try {
    const { bookingId } = req.params;
    const adminId = req.body.adminId || req.user?._id; // Get from auth middleware or body

    const result = await processRefund({ bookingId, adminId });

    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }

    res.json({
      success: true,
      message: `Refund of $${result.refundAmount} processed for ${result.customer.fullName}`,
      booking: result.booking,
      refundAmount: result.refundAmount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

// Request date change for a booking
export async function requestDateChangeController(req, res) {
  try {
    const { bookingId } = req.params;
    const { userId, requestedDate, reason } = req.body;

    if (!userId || !requestedDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId and requestedDate'
      });
    }

    const result = await requestDateChange({ bookingId, userId, requestedDate, reason });

    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }

    res.json({
      success: true,
      message: result.message,
      booking: result.booking
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

// Approve date change request (Admin)
export async function approveDateChangeController(req, res) {
  try {
    const { bookingId } = req.params;
    const { adminId, newStartDate } = req.body;

    if (!adminId || !newStartDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: adminId and newStartDate'
      });
    }

    const result = await approveDateChange({ bookingId, adminId, newStartDate });

    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }

    res.json({
      success: true,
      message: result.message,
      booking: result.booking
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}

// Reject date change request (Admin)
export async function rejectDateChangeController(req, res) {
  try {
    const { bookingId } = req.params;
    const { adminId, reviewNotes } = req.body;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: adminId'
      });
    }

    const result = await rejectDateChange({ bookingId, adminId, reviewNotes });

    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }

    res.json({
      success: true,
      message: result.message,
      booking: result.booking
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}
