// booking.controller.js
import {
  createBooking,
  getBookingById,
  listBookings,
  updateBooking,
  cancelBooking,
  addPayment,
  getCustomerBookingStats,
  completeBooking
} from '../service/booking.service.js';

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
