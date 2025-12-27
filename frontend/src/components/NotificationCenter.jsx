import React, { useState, useEffect } from 'react';
import { FaBell, FaTimes, FaComments, FaUser, FaCheckCircle, FaTimesCircle, FaClock, FaDollarSign, FaExclamationTriangle } from 'react-icons/fa';

const NotificationCenter = ({ userId, userRole, onOpenChat }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [viewedNotifications, setViewedNotifications] = useState(() => {
    // Load viewed notifications from localStorage
    const saved = localStorage.getItem(`viewedNotifications_${userId}`);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      
      // Auto-refresh every 10 seconds
      const interval = setInterval(() => {
        fetchNotifications();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [userId, viewedNotifications]);

  const fetchNotifications = async () => {
    try {
      if (userRole === 'CUSTOMER') {
        await fetchCustomerNotifications();
      } else if (userRole === 'TOUR_OPERATOR' || userRole === 'OPERATOR') {
        await fetchOperatorNotifications();
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchCustomerNotifications = async () => {
    const res = await fetch(`/api/bookings?customerId=${userId}`);
    const data = await res.json();
    const bookings = Array.isArray(data) ? data : (data.bookings || []);
    
    const notifs = [];
    
    // Date change request notifications
    bookings.forEach(booking => {
      if (booking.dateChangeRequest && booking.dateChangeRequest.status) {
        const request = booking.dateChangeRequest;
        notifs.push({
          id: `datechange-${booking._id}-${request.status}`,
          type: 'datechange',
          title: request.status === 'APPROVED' ? 'Date Change Approved' : 
                 request.status === 'REJECTED' ? 'Date Change Rejected' : 
                 'Date Change Request Pending',
          message: request.status === 'APPROVED' 
            ? `Your tour has been rescheduled to ${new Date(request.requestedDate).toLocaleDateString()}`
            : request.status === 'REJECTED'
            ? request.reviewNotes || 'Your date change request was rejected'
            : `Requested new date: ${new Date(request.requestedDate).toLocaleDateString()}`,
          timestamp: new Date(request.reviewedAt || request.requestedAt),
          status: request.status,
          icon: request.status === 'APPROVED' ? FaCheckCircle : 
                request.status === 'REJECTED' ? FaTimesCircle : FaClock,
          color: request.status === 'APPROVED' ? 'green' : 
                 request.status === 'REJECTED' ? 'red' : 'yellow',
          booking: booking
        });
      }
      
      // Refund notifications
      if (booking.status === 'REFUNDED' || booking.cancellation?.refundProcessed) {
        const refundAmount = booking.cancellation?.refundAmount || 0;
        notifs.push({
          id: `refund-${booking._id}`,
          type: 'refund',
          title: 'Refund Processed',
          message: `Your refund of $${refundAmount.toLocaleString()} has been processed`,
          timestamp: new Date(booking.cancellation?.refundProcessedAt || booking.updatedAt),
          icon: FaDollarSign,
          color: 'green',
          booking: booking
        });
      }
      
      // Booking confirmation notifications
      if (booking.status === 'CONFIRMED' && new Date(booking.createdAt) > new Date(Date.now() - 24*60*60*1000)) {
        notifs.push({
          id: `confirmed-${booking._id}`,
          type: 'confirmed',
          title: 'Booking Confirmed',
          message: `Your booking for ${booking.packageId?.title || 'Tour Package'} is confirmed`,
          timestamp: new Date(booking.updatedAt),
          icon: FaCheckCircle,
          color: 'green',
          booking: booking
        });
      }
      
      // Payment pending notifications
      if (booking.status === 'PENDING') {
        const totalPaid = booking.payments
          ?.filter(p => p.status === 'SUCCESS')
          ?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const remaining = booking.finalAmount - totalPaid;
        
        if (remaining > 0) {
          notifs.push({
            id: `payment-${booking._id}`,
            type: 'payment',
            title: 'Payment Pending',
            message: `Complete your payment of $${remaining.toLocaleString()} for ${booking.packageId?.title || 'Tour Package'}`,
            timestamp: new Date(booking.createdAt),
            icon: FaExclamationTriangle,
            color: 'orange',
            booking: booking
          });
        }
      }
    });
    
    // Message notifications
    for (const booking of bookings) {
      if (booking.assignedOperator && booking._id) {
        const msgRes = await fetch(`/api/messages/booking/${booking._id}`);
        const msgData = await msgRes.json();
        
        if (msgData.success && msgData.messages && msgData.messages.length > 0) {
          const unreadMessages = msgData.messages.filter(
            msg => (msg.senderId?._id || msg.senderId) !== userId
          );
          
          if (unreadMessages.length > 0) {
            const lastMsg = msgData.messages[msgData.messages.length - 1];
            notifs.push({
              id: `message-${booking._id}`,
              type: 'message',
              title: `Message from ${booking.assignedOperator?.fullName || 'Tour Operator'}`,
              message: lastMsg.content,
              timestamp: new Date(lastMsg.sentAt),
              booking: booking,
              operator: booking.assignedOperator,
              unreadCount: unreadMessages.length,
              icon: FaComments,
              color: 'blue'
            });
          }
        }
      }
    }
    
    // Sort by timestamp descending
    notifs.sort((a, b) => b.timestamp - a.timestamp);
    
    setNotifications(notifs);
    
    // Calculate unread count - notifications not in viewedNotifications list
    const unread = notifs.filter(n => !viewedNotifications.includes(n.id)).length;
    setUnreadCount(unread);
  };

  const fetchOperatorNotifications = async () => {
    const res = await fetch(`/api/bookings?assignedOperator=${userId}`);
    const data = await res.json();
    const bookings = Array.isArray(data) ? data : (data.bookings || []);
    
    const notifs = [];
    
    // New booking notifications
    bookings.forEach(booking => {
      const bookingAge = Date.now() - new Date(booking.createdAt).getTime();
      if (bookingAge < 24*60*60*1000) { // Last 24 hours
        notifs.push({
          id: `newbooking-${booking._id}`,
          type: 'newbooking',
          title: 'New Booking Assigned',
          message: `New booking for ${booking.packageId?.title || 'Tour Package'} - ${booking.numTravelers} travelers`,
          timestamp: new Date(booking.createdAt),
          icon: FaCheckCircle,
          color: 'green',
          booking: booking,
          customer: booking.customerId
        });
      }
      
      // Date change requests
      if (booking.dateChangeRequest && booking.dateChangeRequest.status === 'PENDING') {
        notifs.push({
          id: `datechange-${booking._id}`,
          type: 'datechange',
          title: 'Date Change Request',
          message: `${booking.customerId?.fullName || 'Customer'} requested date change to ${new Date(booking.dateChangeRequest.requestedDate).toLocaleDateString()}`,
          timestamp: new Date(booking.dateChangeRequest.requestedAt),
          icon: FaClock,
          color: 'yellow',
          booking: booking,
          customer: booking.customerId
        });
      }
    });
    
    // Message notifications
    for (const booking of bookings) {
      if (booking._id && booking.customerId) {
        const msgRes = await fetch(`/api/messages/booking/${booking._id}`);
        const msgData = await msgRes.json();
        
        if (msgData.success && msgData.messages && msgData.messages.length > 0) {
          const unreadMessages = msgData.messages.filter(
            msg => (msg.senderId?._id || msg.senderId) !== userId
          );
          
          if (unreadMessages.length > 0) {
            const lastMsg = msgData.messages[msgData.messages.length - 1];
            notifs.push({
              id: `message-${booking._id}`,
              type: 'message',
              title: `Message from ${booking.customerId?.fullName || booking.customerId?.name || 'Customer'}`,
              message: lastMsg.content,
              timestamp: new Date(lastMsg.sentAt),
              booking: booking,
              customer: booking.customerId,
              unreadCount: unreadMessages.length,
              icon: FaComments,
              color: 'blue'
            });
          }
        }
      }
    }
    
    // Sort by timestamp descending
    notifs.sort((a, b) => b.timestamp - a.timestamp);
    
    setNotifications(notifs);
    
    // Calculate unread count - notifications not in viewedNotifications list
    const unread = notifs.filter(n => !viewedNotifications.includes(n.id)).length;
    setUnreadCount(unread);
  };

  const markAsViewed = (notificationId) => {
    if (!viewedNotifications.includes(notificationId)) {
      const updated = [...viewedNotifications, notificationId];
      setViewedNotifications(updated);
      localStorage.setItem(`viewedNotifications_${userId}`, JSON.stringify(updated));
    }
  };

  const handleNotificationClick = (notif) => {
    // Mark notification as viewed
    markAsViewed(notif.id);
    if (notif.type === 'message' && onOpenChat && notif.booking) {
      onOpenChat(notif.booking, notif.operator || notif.customer);
      setIsOpen(false);
    } else {
      // For other notification types, could navigate to relevant page
      setIsOpen(false);
    }
  };

  const getNotificationStyle = (color) => {
    const styles = {
      blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300',
      green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300',
      red: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300',
      yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300',
      orange: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300'
    };
    return styles[color] || styles.blue;
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleToggleDropdown = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    
    // When opening dropdown, mark all current notifications as viewed
    if (newState && notifications.length > 0) {
      const allNotifIds = notifications.map(n => n.id);
      const updated = [...new Set([...viewedNotifications, ...allNotifIds])];
      setViewedNotifications(updated);
      localStorage.setItem(`viewedNotifications_${userId}`, JSON.stringify(updated));
      setUnreadCount(0);
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={handleToggleDropdown}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <FaTimes />
              </button>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-80">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <FaBell size={40} className="mx-auto mb-2 opacity-50" />
                  <p>No new notifications</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`p-2 rounded-full ${getNotificationStyle(notif.color)}`}>
                          <notif.icon size={16} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                            {notif.title}
                          </p>
                          {notif.unreadCount > 0 && (
                            <span className="bg-blue-500 text-white text-xs font-bold rounded-full px-2 py-0.5 ml-2">
                              {notif.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatTime(notif.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
