import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { 
  FaTimes, FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaShoppingCart, 
  FaDollarSign, FaUserTie, FaExclamationTriangle, FaClock, FaMapMarkerAlt,
  FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';

const UserDetailModal = ({ isOpen, onClose, user, onEdit }) => {
  const [activeTab, setActiveTab] = useState('profile'); // profile, bookings, payments, assignments
  const [bookings, setBookings] = useState([]);
  const [departures, setDepartures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      // Determine default tab based on roles
      const isOperator = user.roles?.some(r => 
        r.toLowerCase() === 'tour_operator' || r.toLowerCase() === 'operator'
      );
      const isCustomer = user.roles?.some(r => r.toUpperCase() === 'CUSTOMER');
      
      if (isOperator && !isCustomer) {
        setActiveTab('assignments');
      } else {
        setActiveTab('profile');
      }

      if (activeTab === 'bookings') {
        fetchBookings();
      } else if (activeTab === 'assignments') {
        fetchDepartures();
      }
    }
  }, [isOpen, user, activeTab]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/bookings', {
        params: { customerId: user._id }
      });
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      // Mock data for demo
      setBookings([]);
    }
    setLoading(false);
  };

  const fetchDepartures = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/group-departure/operator/${user._id}/future`);
      setDepartures(res.data.departures || []);
    } catch (err) {
      console.error('Failed to fetch departures:', err);
      setDepartures([]);
    }
    setLoading(false);
  };

  const handleDeactivate = async () => {
    try {
      await axios.put(`/api/admin/users/${user._id}`, {
        isActive: false
      });
      setShowDeactivateModal(false);
      onClose();
      // Refresh parent list
    } catch (err) {
      console.error('Failed to deactivate user:', err);
    }
  };

  if (!isOpen || !user) return null;

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
      CONFIRMED: 'text-green-600 bg-green-100 dark:bg-green-900/20',
      CANCELLED: 'text-red-600 bg-red-100 dark:bg-red-900/20',
      COMPLETED: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
      REFUNDED: 'text-gray-600 bg-gray-100 dark:bg-gray-900/20',
      OPEN: 'text-green-600 bg-green-100 dark:bg-green-900/20',
      FULL: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
      CLOSED: 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const isOperator = user.roles?.some(r => 
    r.toLowerCase() === 'tour_operator' || r.toLowerCase() === 'operator'
  );
  const isCustomer = user.roles?.some(r => r.toUpperCase() === 'CUSTOMER');
  const isAdmin = user.roles?.some(r => r.toUpperCase() === 'ADMIN');

  // Calculate active items
  const activeBookings = bookings.filter(b => ['PENDING', 'CONFIRMED'].includes(b.status));
  const futureDepartures = departures.filter(d => new Date(d.startDate) > new Date());

  // Mock payment history
  const payments = [
    { id: 1, date: new Date('2024-11-01'), amount: 1200, method: 'CARD', status: 'SUCCESS', bookingId: 'BK001' },
    { id: 2, date: new Date('2024-10-15'), amount: 850, method: 'BKASH', status: 'SUCCESS', bookingId: 'BK002' },
    { id: 3, date: new Date('2024-09-20'), amount: 2100, method: 'BANK_TRANSFER', status: 'SUCCESS', bookingId: 'BK003' },
  ];

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FaUser },
  ];

  if (isCustomer) {
    tabs.push(
      { id: 'bookings', label: 'Bookings', icon: FaShoppingCart, badge: bookings.length },
      { id: 'payments', label: 'Payments', icon: FaDollarSign, badge: payments.length }
    );
  }

  if (isOperator) {
    tabs.push({ 
      id: 'assignments', 
      label: 'Operator Assignments', 
      icon: FaUserTie, 
      badge: departures.length 
    });
  }

  const modalContent = (
    <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 99999 }}>
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        ></div>
        
        {/* Modal Content */}
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-scale-in" style={{ zIndex: 99999 }}>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10"
          >
            <FaTimes size={24} />
          </button>

          {/* Header */}
          <div className={`p-8 text-white ${
            isAdmin 
              ? 'bg-gradient-to-r from-red-600 to-red-700'
              : isOperator 
                ? 'bg-gradient-to-r from-orange-600 to-orange-700' 
                : 'bg-gradient-to-r from-blue-600 to-blue-700'
          }`}>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                {user.fullName?.charAt(0) || 'U'}
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1">{user.fullName}</h2>
                <div className="flex items-center space-x-2 text-sm">
                  {user.roles?.map((role, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white/20 rounded-full">
                      {role.toUpperCase() === 'TOUR_OPERATOR' || role.toLowerCase() === 'operator' ? 'Tour Operator' : role}
                    </span>
                  ))}
                  {!user.isActive && (
                    <span className="px-3 py-1 bg-red-500 rounded-full flex items-center">
                      <FaTimesCircle className="mr-1" /> Blocked
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Warning Banner for Deactivation */}
          {user.isActive && (activeBookings.length > 0 || futureDepartures.length > 0) && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 p-4">
              <div className="flex items-start text-yellow-800 dark:text-yellow-300">
                <FaExclamationTriangle className="mt-1 mr-2 flex-shrink-0" />
                <div className="text-sm">
                  <strong>Warning:</strong> This user has {activeBookings.length} active booking(s) 
                  {futureDepartures.length > 0 && ` and ${futureDepartures.length} future group departure(s)`}. 
                  Deactivating will prevent login but retain data for history.
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex space-x-1 px-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 font-semibold border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary bg-white dark:bg-gray-800'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <tab.icon />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8 max-h-[60vh] overflow-y-auto">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <FaEnvelope className="text-primary text-xl" />
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Email</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <FaPhone className="text-primary text-xl" />
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Phone</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{user.phone || 'Not provided'}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <FaCalendarAlt className="text-primary text-xl" />
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Member Since</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{formatDate(user.createdAt)}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Account Status</div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {user.isActive ? 'Active' : 'Blocked/Inactive'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {isCustomer && (
                    <>
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                          {user.bookingsCount || 0}
                        </div>
                        <div className="text-sm text-blue-700 dark:text-blue-400">Total Bookings</div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-900 dark:text-green-300">
                          {user.activeBookingsCount || 0}
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-400">Active Bookings</div>
                      </div>
                    </>
                  )}
                  {isOperator && (
                    <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-900 dark:text-orange-300">
                        {user.futureDepartures || 0}
                      </div>
                      <div className="text-sm text-orange-700 dark:text-orange-400">Future Departures</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Booking History</h3>
                {loading ? (
                  <div className="text-center py-8 text-primary">Loading bookings...</div>
                ) : bookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Booking ID</th>
                          <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Package</th>
                          <th className="text-center py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Travelers</th>
                          <th className="text-center py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Start Date</th>
                          <th className="text-center py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                          <th className="text-center py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => (
                          <tr key={booking._id} className="border-b border-gray-100 dark:border-gray-700">
                            <td className="py-3 px-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                              #{booking._id?.slice(-6) || 'N/A'}
                            </td>
                            <td className="py-3 px-3 text-sm text-gray-900 dark:text-white">
                              {booking.packageId?.title || 'Package'}
                            </td>
                            <td className="py-3 px-3 text-center text-sm text-gray-900 dark:text-white">
                              {booking.numTravelers}
                            </td>
                            <td className="py-3 px-3 text-center text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(booking.startDate)}
                            </td>
                            <td className="py-3 px-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                              ${booking.totalAmount?.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                                {booking.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No bookings found
                  </div>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Payment History</h3>
                {payments.length > 0 ? (
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <FaDollarSign className="text-green-600 dark:text-green-400 text-2xl" />
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              ${payment.amount.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(payment.date)} • {payment.method} • Booking #{payment.bookingId}
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center ${getStatusColor(payment.status)}`}>
                          {payment.status === 'SUCCESS' && <FaCheckCircle className="mr-1" />}
                          {payment.status}
                        </span>
                      </div>
                    ))}
                    
                    {/* Payment Summary */}
                    <div className="mt-6 p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-green-700 dark:text-green-400 font-semibold">Total Paid</div>
                        <div className="text-2xl font-bold text-green-900 dark:text-green-300">
                          ${payments.reduce((sum, p) => sum + (p.status === 'SUCCESS' ? p.amount : 0), 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No payment history
                  </div>
                )}
              </div>
            )}

            {/* Operator Assignments Tab */}
            {activeTab === 'assignments' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Assigned Group Departures</h3>
                {loading ? (
                  <div className="text-center py-8 text-primary">Loading assignments...</div>
                ) : departures.length > 0 ? (
                  <div className="space-y-3">
                    {departures.map((departure) => (
                      <button
                        key={departure._id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow w-full text-left"
                        onClick={() => {
                          if (window.onViewDeparture) {
                            window.onViewDeparture(departure);
                          }
                        }}
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white mb-2">
                            {departure.packageId?.title || 'Package'}
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 space-x-4">
                            <span className="flex items-center">
                              <FaCalendarAlt className="mr-2" />
                              {formatDate(departure.startDate)} - {formatDate(departure.endDate)}
                            </span>
                            <span>
                              Seats: {departure.bookedSeats}/{departure.totalSeats}
                            </span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(departure.status)}`}>
                          {departure.status}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No group departures assigned
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 dark:bg-gray-900 px-8 py-4 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-semibold"
            >
              Close
            </button>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  if (onEdit) {
                    onEdit(user);
                  }
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Edit User
              </button>
              {user.isActive && (
                <button
                  onClick={() => setShowDeactivateModal(true)}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  Deactivate User
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 100000 }}>
          <div className="fixed inset-0 bg-black/80" onClick={() => setShowDeactivateModal(false)}></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirm Deactivation</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Are you sure you want to deactivate <strong>{user.fullName}</strong>?
            </p>
            
            {(activeBookings.length > 0 || futureDepartures.length > 0) && (
              <div className="my-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start text-yellow-800 dark:text-yellow-300 text-sm">
                  <FaExclamationTriangle className="mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    This user has:
                    <ul className="list-disc ml-5 mt-1">
                      {activeBookings.length > 0 && <li>{activeBookings.length} active booking(s)</li>}
                      {futureDepartures.length > 0 && <li>{futureDepartures.length} future group departure(s)</li>}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Deactivated users cannot log in but their data will be retained for history and reporting.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={handleDeactivate}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Confirm Deactivate
              </button>
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default UserDetailModal;
