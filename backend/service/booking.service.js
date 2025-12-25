// booking.service.js
import Booking from '../model/booking.model.js';
import { TourPackage } from '../model/tourPackage.model.js';
import { GroupDeparture } from '../model/groupDeparture.model.js';
import { User } from '../model/user.model.js';

// Check and cancel unpaid bookings that have passed start date
export async function cancelUnpaidExpiredBookings() {
  const now = new Date();
  
  // Find bookings that:
  // 1. Have started (startDate <= now)
  // 2. Are not cancelled
  // 3. Are not fully paid
  const bookings = await Booking.find({
    startDate: { $lte: now },
    status: { $in: ['PENDING', 'CONFIRMED'] },
    'cancellation.isCancelled': false
  });

  const cancelledBookings = [];
  
  for (const booking of bookings) {
    const totalPaid = booking.payments
      .filter(p => p.status === 'SUCCESS' || p.status === 'COMPLETED' || p.status === 'CONFIRMED')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // If not fully paid, cancel the booking
    if (totalPaid < booking.totalAmount) {
      booking.status = 'CANCELLED';
      booking.cancellation = {
        isCancelled: true,
        reason: 'Tour started without full payment',
        cancelledAt: new Date(),
        refundAmount: totalPaid // Refund any partial payments
      };
      await booking.save();
      cancelledBookings.push(booking);
      
      // TODO: Send email/notification to customer about cancellation
    }
  }
  
  return { cancelledCount: cancelledBookings.length, bookings: cancelledBookings };
}

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
  reservedSeats = [],
  pointsToUse = 0
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

    // Get customer to check reward points
    const customer = await User.findById(customerId);
    if (!customer) {
      return { error: 'Customer not found' };
    }

    // Validate and apply reward points
    let discountAmount = 0;
    let pointsUsed = 0;
    
    if (pointsToUse > 0) {
      if (pointsToUse > customer.rewardPoints) {
        return { error: `You only have ${customer.rewardPoints} reward points available` };
      }
      
      // Calculate discount (max 20% of total)
      discountAmount = Booking.calculateDiscountFromPoints(pointsToUse, totalAmount);
      pointsUsed = Math.min(pointsToUse, discountAmount); // Only use points that give discount
      
      // Deduct points from customer
      customer.rewardPoints -= pointsUsed;
      customer.pointsHistory.push({
        amount: -pointsUsed,
        type: 'USED',
        reason: `Used for booking discount`,
        date: new Date()
      });
      await customer.save();
    }

    const finalAmount = totalAmount - discountAmount;

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
      pointsUsed,
      discountAmount,
      finalAmount,
      currency,
      status: 'PENDING',
      reservedSeats
    });

    // Store booking reference for points history
    if (pointsUsed > 0) {
      const lastHistoryEntry = customer.pointsHistory[customer.pointsHistory.length - 1];
      if (lastHistoryEntry) {
        lastHistoryEntry.bookingId = booking._id;
        await customer.save();
      }
    }

    await booking.save();

    // Populate references for response
    await booking.populate('customerId', 'fullName name email phone');
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
      .populate('customerId', 'fullName name email phone')
      .populate('packageId') // Populate all package fields
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
      .populate('customerId', 'fullName name email phone')
      .populate('packageId') // Populate all package fields for customer dashboard
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

    // Check if already cancelled or refunded
    if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED' || booking.cancellation.isCancelled) {
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

// Request date change for a booking
export async function requestDateChange({ bookingId, userId, requestedDate, reason }) {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return { error: 'Booking not found' };
    }

    // Check if already cancelled or refunded
    if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') {
      return { error: 'Cannot request date change for cancelled booking' };
    }

    // Check if booking is completed
    if (booking.status === 'COMPLETED') {
      return { error: 'Cannot request date change for completed booking' };
    }

    // Check if there's already a pending date change request
    if (booking.dateChangeRequest && booking.dateChangeRequest.status === 'PENDING') {
      return { error: 'There is already a pending date change request for this booking' };
    }

    // Validate the requested date
    const newDate = new Date(requestedDate);
    if (isNaN(newDate.getTime())) {
      return { error: 'Invalid date format' };
    }

    if (newDate < new Date()) {
      return { error: 'Requested date cannot be in the past' };
    }

    // Create date change request
    booking.dateChangeRequest = {
      requestedDate: newDate,
      reason,
      requestedBy: userId,
      requestedAt: new Date(),
      status: 'PENDING'
    };

    await booking.save();
    await booking.populate('customerId', 'name email phone');
    await booking.populate('packageId', 'title destination type category');

    return { booking, message: 'Date change request submitted successfully' };
  } catch (err) {
    console.error('Error requesting date change:', err);
    return { error: 'Failed to submit date change request' };
  }
}

// Approve date change request (Admin)
export async function approveDateChange({ bookingId, adminId, newStartDate }) {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('customerId', 'fullName email')
      .populate('packageId', 'title defaultDays defaultNights');
    
    if (!booking) {
      return { error: 'Booking not found' };
    }

    if (!booking.dateChangeRequest || booking.dateChangeRequest.status !== 'PENDING') {
      return { error: 'No pending date change request found' };
    }

    // Update the booking dates
    const oldStartDate = booking.startDate;
    booking.startDate = new Date(newStartDate);
    
    // Calculate new end date based on package duration
    if (booking.packageId) {
      const durationDays = booking.packageId.defaultDays || 1;
      const newEndDate = new Date(booking.startDate);
      newEndDate.setDate(newEndDate.getDate() + durationDays);
      booking.endDate = newEndDate;
    }

    // Update date change request status
    booking.dateChangeRequest.status = 'APPROVED';
    booking.dateChangeRequest.reviewedBy = adminId;
    booking.dateChangeRequest.reviewedAt = new Date();
    booking.dateChangeRequest.reviewNotes = `Date changed from ${oldStartDate.toDateString()} to ${booking.startDate.toDateString()}`;

    await booking.save();

    return { 
      success: true, 
      booking,
      message: 'Date change request approved successfully'
    };
  } catch (err) {
    console.error('Error approving date change:', err);
    return { error: 'Failed to approve date change request' };
  }
}

// Reject date change request (Admin)
export async function rejectDateChange({ bookingId, adminId, reviewNotes }) {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('customerId', 'fullName email')
      .populate('packageId', 'title');
    
    if (!booking) {
      return { error: 'Booking not found' };
    }

    if (!booking.dateChangeRequest || booking.dateChangeRequest.status !== 'PENDING') {
      return { error: 'No pending date change request found' };
    }

    // Update date change request status
    booking.dateChangeRequest.status = 'REJECTED';
    booking.dateChangeRequest.reviewedBy = adminId;
    booking.dateChangeRequest.reviewedAt = new Date();
    booking.dateChangeRequest.reviewNotes = reviewNotes || 'Request rejected by admin';

    await booking.save();

    return { 
      success: true, 
      booking,
      message: 'Date change request rejected'
    };
  } catch (err) {
    console.error('Error rejecting date change:', err);
    return { error: 'Failed to reject date change request' };
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

    if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') {
      return { error: 'Cannot add payment to cancelled or refunded booking' };
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
    const booking = await Booking.findById(bookingId).populate('packageId');
    if (!booking) {
      return { error: 'Booking not found' };
    }

    if (booking.status === 'CANCELLED') {
      return { error: 'Cannot complete a cancelled booking' };
    }

    booking.status = 'COMPLETED';
    
    // Award reward points to customer
    const customer = await User.findById(booking.customerId);
    if (customer && booking.packageId) {
      const pointsEarned = Booking.calculatePointsForCategory(
        booking.packageId.category, 
        booking.finalAmount
      );
      
      booking.pointsEarned = pointsEarned;
      customer.rewardPoints += pointsEarned;
      customer.pointsHistory.push({
        amount: pointsEarned,
        type: 'EARNED',
        bookingId: booking._id,
        reason: `Earned from completing ${booking.packageId.category} tour`,
        date: new Date()
      });
      
      await customer.save();
    }
    
    await booking.save();

    return { booking, pointsEarned: booking.pointsEarned };
  } catch (err) {
    console.error('Error completing booking:', err);
    return { error: 'Failed to complete booking' };
  }
}

// Process refund for a cancelled booking
export async function processRefund({ bookingId, adminId }) {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('customerId', 'fullName email')
      .populate('packageId', 'title');
    
    if (!booking) {
      return { error: 'Booking not found' };
    }

    if (booking.status !== 'CANCELLED' || !booking.cancellation.isCancelled) {
      return { error: 'Booking is not cancelled' };
    }

    if (booking.cancellation.refundProcessed) {
      return { error: 'Refund already processed' };
    }

    // Calculate total paid amount
    const totalPaid = booking.payments
      .filter(p => p.status === 'SUCCESS' || p.status === 'CONFIRMED')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Check if customer actually paid anything
    if (totalPaid === 0) {
      return { error: 'No refund applicable - customer did not make any payments' };
    }

    // Ensure finalAmount exists for old bookings
    if (!booking.finalAmount) {
      booking.finalAmount = booking.totalAmount;
    }

    // Calculate refund amount if not set or is 0
    let refundAmount = booking.cancellation.refundAmount || 0;
    if (refundAmount === 0) {
      // Use refund policy calculation based on days until start
      const now = new Date();
      const startDate = new Date(booking.startDate);
      const daysUntilStart = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
      
      let refundPercentage = 0;
      if (daysUntilStart > 30) {
        refundPercentage = 1.0;
      } else if (daysUntilStart >= 15) {
        refundPercentage = 0.75;
      } else if (daysUntilStart >= 7) {
        refundPercentage = 0.50;
      } else if (daysUntilStart >= 3) {
        refundPercentage = 0.25;
      } else if (daysUntilStart > 0) {
        refundPercentage = 0.10;
      }
      
      refundAmount = Math.round(totalPaid * refundPercentage);
      
      // Update the booking with calculated refund amount
      booking.cancellation.refundAmount = refundAmount;
    }

    // Mark refund as processed
    booking.cancellation.refundProcessed = true;
    booking.cancellation.refundProcessedAt = new Date();
    booking.cancellation.refundProcessedBy = adminId;
    booking.status = 'REFUNDED';
    
    // Create refund payment record
    booking.payments.push({
      amount: refundAmount,
      method: 'REFUND',
      status: 'SUCCESS',
      transactionRef: `REFUND-${booking._id}-${Date.now()}`,
      paidAt: new Date()
    });

    await booking.save();

    return { 
      success: true,
      booking,
      refundAmount: refundAmount,
      customer: booking.customerId
    };
  } catch (err) {
    console.error('Error processing refund:', err);
    return { error: 'Failed to process refund', details: err.message };
  }
}

