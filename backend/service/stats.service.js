// stats.service.js - Global statistics for homepage
import Booking from '../model/booking.model.js';
import { TourPackage } from '../model/tourPackage.model.js';
import { Review } from '../model/review.model.js';
import { User } from '../model/user.model.js';

// Get overall platform statistics
export async function getPlatformStats() {
  try {
    // Count active tour packages
    const totalPackages = await TourPackage.countDocuments({ isActive: true });

    // Count happy travelers (unique customers with completed bookings)
    const completedBookings = await Booking.find({ 
      status: { $in: ['COMPLETED', 'CONFIRMED'] } 
    }).distinct('customerId');
    const happyTravelers = completedBookings.length;

    // Count 5-star reviews
    const fiveStarReviews = await Review.countDocuments({ 
      rating: 5,
      status: 'APPROVED'
    });

    // Count unique destinations from active packages
    const packages = await TourPackage.find({ isActive: true }, 'destinations');
    const uniqueDestinations = new Set();
    packages.forEach(pkg => {
      if (pkg.destinations && Array.isArray(pkg.destinations)) {
        pkg.destinations.forEach(dest => {
          if (dest.name) uniqueDestinations.add(dest.name);
          if (dest.city) uniqueDestinations.add(dest.city);
          if (dest.country) uniqueDestinations.add(dest.country);
        });
      }
    });
    const totalDestinations = uniqueDestinations.size;

    // Additional useful stats
    const totalBookings = await Booking.countDocuments();
    const totalCustomers = await User.countDocuments({ roles: 'CUSTOMER' });
    const totalReviews = await Review.countDocuments({ status: 'APPROVED' });
    
    // Calculate average rating
    const reviews = await Review.find({ status: 'APPROVED' }, 'rating');
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    return {
      stats: {
        totalPackages,
        happyTravelers,
        fiveStarReviews,
        totalDestinations,
        totalBookings,
        totalCustomers,
        totalReviews,
        averageRating: parseFloat(avgRating)
      }
    };
  } catch (err) {
    console.error('Error fetching platform stats:', err);
    return { error: 'Failed to fetch statistics' };
  }
}

// Get detailed booking statistics
export async function getBookingStats() {
  try {
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalTravelers: { $sum: '$numTravelers' }
        }
      }
    ]);

    const byStatus = {};
    let totalRevenue = 0;
    let totalTravelers = 0;

    stats.forEach(stat => {
      byStatus[stat._id] = {
        count: stat.count,
        totalAmount: stat.totalAmount,
        totalTravelers: stat.totalTravelers
      };
      totalRevenue += stat.totalAmount;
      totalTravelers += stat.totalTravelers;
    });

    return {
      stats: {
        byStatus,
        totalRevenue,
        totalTravelers
      }
    };
  } catch (err) {
    console.error('Error fetching booking stats:', err);
    return { error: 'Failed to fetch booking statistics' };
  }
}
