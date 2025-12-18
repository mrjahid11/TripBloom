// booking.service.js
import Booking from '../model/booking.model.js';
import { TourPackage } from '../model/tourPackage.model.js';
import { GroupDeparture } from '../model/groupDeparture.model.js';

// Create a new booking
export async function createBooking({ 
  customerId, 
  packageId, 
  bookingType, 
  groupDepartureId, 
  startDate, 
  endDate, 
  numTravelers, 
  travelers, 
  totalAmount, 
  currency = 'BDT',
  reservedSeats = []
}) {
  try {
    // Validate package exists
    const tourPackage = await TourPackage.findById(packageId);
    if (!tourPackage) {
      return { error: 'Tour package not found' };
    }

    // Validate package is active
    if (!tourPackage.isActive) {
      return { error: 'This tour package is not currently available' };
    }

    // For GROUP bookings, validate departure exists and has availability
    if (bookingType === 'GROUP') {
      if (!groupDepartureId) {
        return { error: 'Group departure ID is required for group bookings' };
      }

      const departure = await GroupDeparture.findById(groupDepartureId);
      if (!departure) {
        return { error: 'Group departure not found' };
      }

      // Check if departure is open for booking
      if (departure.status !== 'OPEN') {
        return { error: `This departure is ${departure.status.toLowerCase()} and not available for booking` };
      }

      // Check seat availability
      const availableSeats = departure.totalSeats - departure.bookedSeats;
      if (availableSeats < numTravelers) {
        return { error: `Only ${availableSeats} seats available. You requested ${numTravelers} seats.` };
      }

      // Validate seat selection if provided
      if (reservedSeats.length > 0) {
        if (reservedSeats.length !== numTravelers) {
          return { error: 'Number of reserved seats must match number of travelers' };
        }

        // Check if seats are already taken
        const existingBookings = await Booking.find({
          groupDepartureId,
          status: { $in: ['PENDING', 'CONFIRMED'] }
        });

        const takenSeats = existingBookings.flatMap(b => b.reservedSeats);
        const conflictingSeats = reservedSeats.filter(seat => takenSeats.includes(seat));

        if (conflictingSeats.length > 0) {
          return { error: `Seats ${conflictingSeats.join(', ')} are already reserved` };
        }
      }

      // Update departure booked seats
      departure.bookedSeats += numTravelers;
      if (departure.bookedSeats >= departure.totalSeats) {
        departure.status = 'FULL';
      }
      await departure.save();
    }

    // Validate travelers data
    if (travelers.length !== numTravelers) {
      return { error: 'Number of travelers must match traveler details provided' };
    }

    // Create the booking
    const booking = new Booking({
      customerId,
      packageId,
      bookingType,
      groupDepartureId: groupDepartureId || null,
      startDate,
      endDate,
      numTravelers,
      travelers,
      totalAmount,
      currency,
      status: 'PENDING',
      reservedSeats
    });

    await booking.save();

    // Populate references for response
    await booking.populate('customerId', 'name email phone');
    await booking.populate('packageId', 'title destination type category');
    if (groupDepartureId) {
      await booking.populate('groupDepartureId', 'startDate endDate totalSeats bookedSeats pricePerPerson');
    }

    return { booking };
  } catch (err) {
    console.error('Error creating booking:', err);
    return { error: err.message || 'Failed to create booking' };
  }
}

// Get booking by ID
export async function getBookingById(bookingId) {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('customerId', 'name email phone')
      .populate('packageId', 'title destination type category basePrice')
      .populate('groupDepartureId', 'startDate endDate totalSeats bookedSeats pricePerPerson');

    if (!booking) {
      return { error: 'Booking not found' };
    }

    return { booking };
  } catch (err) {
    console.error('Error fetching booking:', err);
    return { error: 'Failed to fetch booking' };
  }
}

// List bookings with filters
export async function listBookings({ 
  customerId, 
  packageId, 
  groupDepartureId, 
  status, 
  bookingType,
  startDate,
  endDate 
}) {
  try {
    const filter = {};

    if (customerId) filter.customerId = customerId;
    if (packageId) filter.packageId = packageId;
    if (groupDepartureId) filter.groupDepartureId = groupDepartureId;
    if (bookingType) filter.bookingType = bookingType;

    if (status) {
      if (typeof status === 'string' && status.includes(',')) {
        filter.status = { $in: status.split(',').map(s => s.trim().toUpperCase()) };
      } else {
        filter.status = status.toUpperCase();
      }
    }

    // Date range filters
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(filter)
      .populate('customerId', 'name email phone')
      .populate('packageId', 'title destination type category basePrice')
      .populate('groupDepartureId', 'startDate endDate totalSeats bookedSeats pricePerPerson')
      .sort({ createdAt: -1 });

    return { bookings };
  } catch (err) {
    console.error('Error listing bookings:', err);
    return { error: 'Failed to list bookings' };
  }
}

// Update booking (limited fields)
export async function updateBooking({ bookingId, travelers, operatorNotes }) {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return { error: 'Booking not found' };
    }

    // Only allow updates for PENDING bookings
    if (booking.status !== 'PENDING') {
      return { error: 'Only pending bookings can be updated' };
    }

    if (travelers) {
      if (travelers.length !== booking.numTravelers) {
        return { error: 'Number of travelers cannot be changed' };
      }
      booking.travelers = travelers;
    }

    if (operatorNotes !== undefined) {
      booking.operatorNotes = operatorNotes;
    }

    await booking.save();

    await booking.populate('customerId', 'name email phone');
    await booking.populate('packageId', 'title destination type category');
    if (booking.groupDepartureId) {
      await booking.populate('groupDepartureId', 'startDate endDate totalSeats bookedSeats pricePerPerson');
    }

    return { booking };
  } catch (err) {
    console.error('Error updating booking:', err);
    return { error: 'Failed to update booking' };
  }
}

// Cancel booking
export async function cancelBooking({ bookingId, userId, reason }) {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return { error: 'Booking not found' };
    }

    // Check if already cancelled
    if (booking.status === 'CANCELLED' || booking.cancellation.isCancelled) {
      return { error: 'Booking is already cancelled' };
    }

    // Check if booking can be cancelled (not completed)
    if (booking.status === 'COMPLETED') {
      return { error: 'Cannot cancel a completed booking' };
    }

    // Calculate refund amount based on cancellation policy
    const refundAmount = calculateRefund(booking);

    // For GROUP bookings, release the seats
    if (booking.bookingType === 'GROUP' && booking.groupDepartureId) {
      const departure = await GroupDeparture.findById(booking.groupDepartureId);
      if (departure) {
        departure.bookedSeats -= booking.numTravelers;
        if (departure.status === 'FULL' && departure.bookedSeats < departure.totalSeats) {
          departure.status = 'OPEN';
        }
        await departure.save();
      }
    }

    // Cancel the booking using the model method
    await booking.cancelBooking(userId, reason, refundAmount);

    // If there's a refund, create a refund payment record
    if (refundAmount > 0) {
      booking.payments.push({
        amount: refundAmount,
        method: 'REFUND',
        status: 'PENDING',
        transactionRef: `REFUND-${booking._id}`
      });
      await booking.save();
    }

    await booking.populate('customerId', 'name email phone');
    await booking.populate('packageId', 'title destination type category');

    return { booking, refundAmount };
  } catch (err) {
    console.error('Error cancelling booking:', err);
    return { error: 'Failed to cancel booking' };
  }
}

// Calculate refund based on cancellation policy
function calculateRefund(booking) {
  const now = new Date();
  const startDate = new Date(booking.startDate);
  const totalPaid = booking.totalPaid || 0;

  // Already started or completed - no refund
  if (now >= startDate) {
    return 0;
  }

  const daysUntilStart = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));

  // Refund policy:
  // - More than 30 days: 100% refund
  // - 15-30 days: 75% refund
  // - 7-14 days: 50% refund
  // - 3-6 days: 25% refund
  // - Less than 3 days: 10% refund

  let refundPercentage;
  if (daysUntilStart > 30) {
    refundPercentage = 1.0;
  } else if (daysUntilStart >= 15) {
    refundPercentage = 0.75;
  } else if (daysUntilStart >= 7) {
    refundPercentage = 0.50;
  } else if (daysUntilStart >= 3) {
    refundPercentage = 0.25;
  } else {
    refundPercentage = 0.10;
  }

  return Math.round(totalPaid * refundPercentage);
}

// Add payment to booking
export async function addPayment({ bookingId, amount, method, transactionRef }) {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return { error: 'Booking not found' };
    }

    if (booking.status === 'CANCELLED') {
      return { error: 'Cannot add payment to cancelled booking' };
    }

    const payment = {
      amount,
      method: method.toUpperCase(),
      status: 'SUCCESS', // In real app, this would be PENDING until verified
      transactionRef,
      paidAt: new Date()
    };

    await booking.addPayment(payment);

    await booking.populate('customerId', 'name email phone');
    await booking.populate('packageId', 'title destination type category');

    return { booking };
  } catch (err) {
    console.error('Error adding payment:', err);
    return { error: 'Failed to add payment' };
  }
}

// Get booking statistics for a customer
export async function getCustomerBookingStats(customerId) {
  try {
    const bookings = await Booking.find({ customerId });

    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'PENDING').length,
      confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
      completed: bookings.filter(b => b.status === 'COMPLETED').length,
      cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
      totalSpent: bookings
        .filter(b => b.status !== 'CANCELLED')
        .reduce((sum, b) => sum + (b.totalPaid || 0), 0),
      upcomingTrips: bookings.filter(b => 
        (b.status === 'CONFIRMED' || b.status === 'PENDING') && 
        new Date(b.startDate) > new Date()
      ).length
    };

    return { stats };
  } catch (err) {
    console.error('Error fetching customer stats:', err);
    return { error: 'Failed to fetch statistics' };
  }
}

// Mark booking as completed (usually called after end date)
export async function completeBooking(bookingId) {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return { error: 'Booking not found' };
    }

    if (booking.status === 'CANCELLED') {
      return { error: 'Cannot complete a cancelled booking' };
    }

    booking.status = 'COMPLETED';
    await booking.save();

    return { booking };
  } catch (err) {
    console.error('Error completing booking:', err);
    return { error: 'Failed to complete booking' };
  }
}
