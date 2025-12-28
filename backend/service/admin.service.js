// admin.service.js
import { User } from '../model/user.model.js';
import Booking from '../model/booking.model.js';
import { TourPackage } from '../model/tourPackage.model.js';
import { Review } from '../model/review.model.js';
import { ContactMessage as Contact } from '../model/contact.model.js';
import { ActivityLog, SystemSettings, Announcement } from '../model/admin.model.js';

// ==================== DASHBOARD ====================

// Get admin dashboard overview
export async function getAdminDashboard() {
  try {
    const [
      totalUsers,
      activeUsers,
      totalOperators,
      totalBookings,
      totalPackages,
      totalRevenue,
      pendingContacts,
      recentBookings
    ] = await Promise.all([
      User.countDocuments({ roles: { $in: ['customer', 'CUSTOMER'] } }),
      User.countDocuments({ roles: { $in: ['customer', 'CUSTOMER'] }, isActive: true }),
      User.countDocuments({ roles: { $in: ['tour_operator', 'TOUR_OPERATOR'] } }),
      Booking.countDocuments(),
      TourPackage.countDocuments(),
      Booking.aggregate([
        { $match: { paymentStatus: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      Contact.countDocuments({ status: 'PENDING' }),
      Booking.find()
        .populate('customerId', 'fullName email')
        .populate('packageId', 'title')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    return {
      dashboard: {
        totalUsers,
        activeUsers,
        totalOperators,
        totalBookings,
        totalPackages,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingContacts,
        recentBookings
      }
    };
  } catch (error) {
    return { error: error.message };
  }
}

// Get recent activity logs
export async function getActivityLogs({ limit = 50, adminId, action, startDate, endDate }) {
  try {
    const filter = {};
    
    if (adminId) filter.adminId = adminId;
    if (action) filter.action = action;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const activities = await ActivityLog.find(filter)
      .populate('adminId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    return { activities };
  } catch (error) {
    return { error: error.message };
  }
}

// Log admin activity
export async function logActivity({ adminId, action, targetType, targetId, description, metadata, ipAddress }) {
  try {
    // Allow logging even when adminId is not provided (system / unauthenticated actions)
    const logPayload = {
      action,
      targetType,
      targetId,
      description,
      metadata: metadata || {},
      ipAddress
    };

    if (adminId) logPayload.adminId = adminId;

    const log = new ActivityLog(logPayload);

    await log.save();
    return { log };
  } catch (error) {
    console.error('Failed to log activity:', error);
    return { error: error.message };
  }
}

// ==================== USER MANAGEMENT ====================

// Update user role (promote/demote)
export async function updateUserRole({ userId, newRoles, adminId, ipAddress }) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { error: 'User not found' };
    }

    const oldRoles = [...user.roles];
    user.roles = newRoles;
    await user.save();

    // Log activity
    await logActivity({
      adminId,
      action: 'ROLE_CHANGED',
      targetType: 'User',
      targetId: userId,
      description: `Changed user role from ${oldRoles.join(', ')} to ${newRoles.join(', ')}`,
      metadata: { oldRoles, newRoles },
      ipAddress
    });

    return { user };
  } catch (error) {
    return { error: error.message };
  }
}

// Suspend/Unsuspend user account
export async function toggleUserSuspension({ userId, suspend, adminId, reason, ipAddress }) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { error: 'User not found' };
    }

    user.isActive = !suspend;
    await user.save();

    // Log activity
    await logActivity({
      adminId,
      action: suspend ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
      targetType: 'User',
      targetId: userId,
      description: suspend 
        ? `Suspended user: ${user.fullName} - Reason: ${reason || 'Not specified'}`
        : `Activated user: ${user.fullName}`,
      metadata: { reason, email: user.email },
      ipAddress
    });

    return { user, message: suspend ? 'User suspended' : 'User activated' };
  } catch (error) {
    return { error: error.message };
  }
}

// Get all operators with their package counts
export async function getOperatorsWithStats() {
  try {
    const operators = await User.find({
      roles: { $in: ['tour_operator', 'TOUR_OPERATOR'] }
    }).select('fullName email phone isActive createdAt');

    const operatorsWithStats = await Promise.all(
      operators.map(async (operator) => {
        const packages = await TourPackage.find({ operatorId: operator._id }).select('_id');
        const packageIds = packages.map(p => p._id);
        const packageCount = packages.length;
        const bookingCount = await Booking.countDocuments({ packageId: { $in: packageIds } });
        const totalRevenue = await Booking.aggregate([
          { $match: { packageId: { $in: packageIds }, paymentStatus: 'PAID' } },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        
        return {
          ...operator.toObject(),
          packageCount,
          bookingCount,
          totalRevenue: totalRevenue[0]?.total || 0
        };
      })
    );

    return { operators: operatorsWithStats };
  } catch (error) {
    return { error: error.message };
  }
}

// ==================== CONTENT MODERATION ====================

// Approve or reject tour package (content moderation)
export async function moderateTourPackage({ packageId, approved, rejectionReason, adminId, ipAddress }) {
  try {
    const tourPackage = await TourPackage.findById(packageId);
    if (!tourPackage) {
      return { error: 'Package not found' };
    }

    if (approved) {
      tourPackage.status = 'APPROVED';
      tourPackage.rejectionReason = undefined;
    } else {
      tourPackage.status = 'REJECTED';
      tourPackage.rejectionReason = rejectionReason;
    }

    await tourPackage.save();

    // Log activity
    await logActivity({
      adminId,
      action: approved ? 'PACKAGE_APPROVED' : 'PACKAGE_REJECTED',
      targetType: 'TourPackage',
      targetId: packageId,
      description: approved 
        ? `Approved package: ${tourPackage.title}`
        : `Rejected package: ${tourPackage.title} - Reason: ${rejectionReason}`,
      metadata: { packageTitle: tourPackage.title, rejectionReason },
      ipAddress
    });

    return { package: tourPackage };
  } catch (error) {
    return { error: error.message };
  }
}

// Delete inappropriate review
export async function deleteReview({ reviewId, reason, adminId, ipAddress }) {
  try {
    const review = await Review.findById(reviewId).populate('userId', 'fullName').populate('packageId', 'title');
    if (!review) {
      return { error: 'Review not found' };
    }

    const reviewDetails = {
      userId: review.userId?._id,
      userName: review.userId?.fullName,
      packageId: review.packageId?._id,
      packageTitle: review.packageId?.title,
      rating: review.rating,
      comment: review.comment
    };

    await Review.findByIdAndDelete(reviewId);

    // Log activity
    await logActivity({
      adminId,
      action: 'REVIEW_DELETED',
      targetType: 'Review',
      targetId: reviewId,
      description: `Deleted review by ${reviewDetails.userName} for ${reviewDetails.packageTitle} - Reason: ${reason}`,
      metadata: { ...reviewDetails, reason },
      ipAddress
    });

    return { message: 'Review deleted', reason };
  } catch (error) {
    return { error: error.message };
  }
}

// ==================== ANALYTICS ====================

// Get platform metrics for specific date range
export async function getPlatformMetrics({ startDate, endDate }) {
  try {
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const [newUsers, newBookings, revenue, newPackages, newReviews] = await Promise.all([
      User.countDocuments(dateFilter),
      Booking.countDocuments(dateFilter),
      Booking.aggregate([
        { $match: { ...dateFilter, paymentStatus: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      TourPackage.countDocuments(dateFilter),
      Review.countDocuments(dateFilter)
    ]);

    return {
      metrics: {
        newUsers,
        newBookings,
        newPackages,
        newReviews,
        revenue: revenue[0]?.total || 0,
        period: { startDate, endDate }
      }
    };
  } catch (error) {
    return { error: error.message };
  }
}

// ==================== SYSTEM SETTINGS ====================

// Get system setting by key
export async function getSystemSetting({ key }) {
  try {
    const setting = await SystemSettings.findOne({ key });
    if (!setting) {
      return { error: 'Setting not found' };
    }
    return { setting };
  } catch (error) {
    return { error: error.message };
  }
}

// Get all system settings
export async function getAllSystemSettings({ category }) {
  try {
    const filter = category ? { category } : {};
    const settings = await SystemSettings.find(filter).populate('lastUpdatedBy', 'fullName email');
    return { settings };
  } catch (error) {
    return { error: error.message };
  }
}

// Update or create system setting
export async function updateSystemSetting({ key, value, category, description, adminId, ipAddress }) {
  try {
    let setting = await SystemSettings.findOne({ key });
    
    if (setting) {
      setting.value = value;
      setting.category = category || setting.category;
      setting.description = description || setting.description;
      setting.lastUpdatedBy = adminId;
      setting.updatedAt = new Date();
    } else {
      setting = new SystemSettings({
        key,
        value,
        category,
        description,
        lastUpdatedBy: adminId
      });
    }

    await setting.save();

    // Log activity
    await logActivity({
      adminId,
      action: 'SETTINGS_UPDATED',
      targetType: 'Settings',
      targetId: setting._id,
      description: `Updated system setting: ${key}`,
      metadata: { key, value, category },
      ipAddress
    });

    return { setting };
  } catch (error) {
    return { error: error.message };
  }
}

// ==================== ANNOUNCEMENTS ====================

// Create announcement
export async function createAnnouncement({ title, message, type, targetAudience, priority, startDate, endDate, adminId, ipAddress }) {
  try {
    const announcement = new Announcement({
      title,
      message,
      type: type || 'INFO',
      targetAudience: targetAudience || ['ALL'],
      priority: priority || 'MEDIUM',
      startDate: startDate || new Date(),
      endDate,
      createdBy: adminId || null
    });

    await announcement.save();

    // Log activity (only if adminId exists)
    if (adminId) {
      await logActivity({
        adminId,
        action: 'ANNOUNCEMENT_CREATED',
        targetType: 'Announcement',
        targetId: announcement._id,
        description: `Created announcement: ${title}`,
        metadata: { title, type, targetAudience, priority },
        ipAddress
      });
    }

    return { announcement };
  } catch (error) {
    console.error('Failed to create announcement:', error);
    return { error: error.message };
  }
}

// Get active announcements
export async function getActiveAnnouncements({ audience }) {
  try {
    const now = new Date();
    const filter = {
      isActive: true,
      startDate: { $lte: now },
      $or: [
        { endDate: { $gte: now } },
        { endDate: null }
      ]
    };

    if (audience) {
      filter.targetAudience = { $in: [audience, 'ALL'] };
    }

    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'fullName')
      .sort({ priority: -1, createdAt: -1 });

    return { announcements };
  } catch (error) {
    return { error: error.message };
  }
}

// Update announcement
export async function updateAnnouncement({ announcementId, updates, adminId, ipAddress }) {
  try {
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return { error: 'Announcement not found' };
    }

    Object.assign(announcement, updates);
    announcement.updatedAt = new Date();
    await announcement.save();

    // Log activity
    await logActivity({
      adminId,
      action: 'ANNOUNCEMENT_CREATED',
      targetType: 'Announcement',
      targetId: announcementId,
      description: `Updated announcement: ${announcement.title}`,
      metadata: { updates },
      ipAddress
    });

    return { announcement };
  } catch (error) {
    return { error: error.message };
  }
}

// Delete announcement
export async function deleteAnnouncement({ announcementId, adminId, ipAddress }) {
  try {
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return { error: 'Announcement not found' };
    }

    await Announcement.findByIdAndDelete(announcementId);

    // Log activity
    await logActivity({
      adminId,
      action: 'ANNOUNCEMENT_CREATED',
      targetType: 'Announcement',
      targetId: announcementId,
      description: `Deleted announcement: ${announcement.title}`,
      ipAddress
    });

    return { message: 'Announcement deleted' };
  } catch (error) {
    return { error: error.message };
  }
}
