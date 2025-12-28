import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaDollarSign, FaSearch, FaEye, FaCheck, FaTimes, FaExclamationTriangle,
  FaFilter, FaUserCircle, FaUserShield, FaCalendarTimes, FaInfoCircle
} from 'react-icons/fa';

const CancellationsRefundQueue = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'refunded'
  const [initiatorFilter, setInitiatorFilter] = useState('all'); // 'all', 'customer', 'admin'
  const [reasonFilter, setReasonFilter] = useState('all'); // 'all', 'departure_cancelled', 'customer_request'
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      // Fetch all bookings and filter for cancelled ones
      const bookingsRes = await axios.get('/api/bookings').catch(() => ({ data: { bookings: [] } }));
      const allBookings = bookingsRes.data.bookings || [];

      // Filter cancelled bookings where customer actually paid money
      // Include both pending and already processed refunds for tracking
      const cancelledBookings = allBookings.filter(booking => {
        const hasCancellation = booking.status === 'CANCELLED' || booking.status === 'REFUNDED' || booking.cancellation?.isCancelled;
        if (!hasCancellation) return false;
        
        // Calculate total paid amount
        const totalPaid = (booking.payments || [])
          .filter(p => p.status === 'SUCCESS' || p.status === 'CONFIRMED')
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        
        // Only show if customer actually paid money
        return totalPaid > 0;
      });

      // Build package -> bookings map (all bookings) to compute sequence numbers (for display IDs)
      const byPackage = {};
      allBookings.forEach(b => {
        const pkgId = b.packageId?._id || b.packageId;
        if (!pkgId) return;
        const key = pkgId.toString();
        byPackage[key] = byPackage[key] || [];
        byPackage[key].push(b);
      });

      // Sort each package list by createdAt ascending so sequence is deterministic
      Object.keys(byPackage).forEach(k => {
        byPackage[k].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });

      // Fetch additional data for each cancelled booking
      const refundsWithData = await Promise.all(
        cancelledBookings.map(async (booking) => {
          try {
            // Calculate total paid
            const totalPaid = (booking.payments || [])
              .filter(p => p.status === 'SUCCESS' || p.status === 'CONFIRMED')
              .reduce((sum, p) => sum + (p.amount || 0), 0);
            
            const refundAmount = booking.cancellation?.refundAmount || 0;
            const isRefundProcessed = booking.status === 'REFUNDED' || booking.cancellation?.refundProcessed;
            
            // Calculate refunded so far from refund payments
            const refundedSoFar = isRefundProcessed ? refundAmount : 0;
            
            // Determine refund status
            let refundStatus = 'PENDING_REFUND';
            if (isRefundProcessed) {
              refundStatus = 'REFUNDED';
            }

            // Determine initiator (customer vs admin)
            const initiator = booking.cancellation?.cancelledBy 
              ? (booking.customerId === booking.cancellation.cancelledBy ? 'customer' : 'admin')
              : 'customer';

            // Determine cancellation reason
            let reason = booking.cancellation?.reason || 'Customer requested cancellation';
            let isDepartureCancelled = false;
            
            // Check if booking has group departure
            if (booking.groupDepartureId) {
              try {
                const depRes = await axios.get(`/api/admin/group-departures`);
                const departure = (depRes.data.departures || []).find(d => d._id === booking.groupDepartureId);
                if (departure?.status === 'CANCELLED') {
                  isDepartureCancelled = true;
                  reason = 'Departure cancelled by operator';
                }
              } catch (err) {
                // Departure fetch failed
              }
            }

            // compute display id per package (like operator dashboard)
            const pkg = booking.packageId || {};
            const pkgId = pkg._id || pkg;
            const list = pkgId ? byPackage[pkgId.toString()] || [] : [];
            const index = list.findIndex(x => (x._id || x).toString() === (booking._id || booking).toString());
            const seq = index >= 0 ? index + 1 : 1;

            const pkgCode = pkg.packageCode || pkg.code || pkg.shortCode || pkg.packageIdCode;
            let prefix;
            if (pkgCode) {
              prefix = pkgCode.toString().toUpperCase();
            } else if (pkg.title) {
              const words = pkg.title.split(/\s+/).filter(Boolean);
              const a = (words[0] || '').charAt(0) || 'X';
              const b = (words[1] || words[0] || '').charAt(0) || 'X';
              prefix = (a + b).toUpperCase() + '000';
            } else {
              prefix = 'TB000';
            }

            const displayId = `${prefix}${seq}`;

            return {
              ...booking,
              _displayId: displayId,
              totalPaid,
              totalAmount: booking.totalAmount || booking.finalAmount || totalPaid,
              refundAmount,
              refundedSoFar,
              isPartialRefund: false,
              refundStatus,
              initiator,
              isDepartureCancelled,
              cancellationReason: reason,
              requestedDate: booking.cancellation?.cancelledAt || booking.updatedAt,
              customer: booking.customerId // Will be populated if API returns it
            };
          } catch (err) {
            return null;
          }
        })
      );

      // Filter out null entries and sort by requested date (newest first)
      const validRefunds = refundsWithData
        .filter(r => r !== null)
        .sort((a, b) => new Date(b.requestedDate) - new Date(a.requestedDate));

      setRefunds(validRefunds);
    } catch (err) {
      console.error('Failed to fetch refunds:', err);
      // Generate mock data for demonstration
      generateMockRefunds();
    }
    setLoading(false);
  };

  const generateMockRefunds = () => {
    const mockData = [
      {
        _id: 'BK001',
        customerId: { fullName: 'John Doe', email: 'john@example.com' },
        packageId: { title: 'Paris Adventure 5D/4N' },
        totalAmount: 2500,
        refundAmount: 2000,
        refundedSoFar: 2000,
        refundStatus: 'REFUNDED',
        initiator: 'customer',
        isDepartureCancelled: false,
        isPartialRefund: false,
        cancellationReason: 'Personal emergency',
        requestedDate: new Date('2024-11-20'),
        startDate: new Date('2024-12-15')
      },
      {
        _id: 'BK002',
        customerId: { fullName: 'Sarah Smith', email: 'sarah@example.com' },
        packageId: { title: 'Bali Beach Retreat 7D/6N' },
        totalAmount: 3200,
        refundAmount: 2560,
        refundedSoFar: 1500,
        refundStatus: 'PARTIAL_REFUND',
        initiator: 'customer',
        isDepartureCancelled: false,
        isPartialRefund: true,
        cancellationReason: 'Schedule conflict',
        requestedDate: new Date('2024-11-22'),
        startDate: new Date('2024-12-20')
      },
      {
        _id: 'BK003',
        customerId: { fullName: 'Mike Johnson', email: 'mike@example.com' },
        packageId: { title: 'Thailand Explorer 6D/5N' },
        totalAmount: 1800,
        refundAmount: 1800,
        refundedSoFar: 0,
        refundStatus: 'PENDING_REFUND',
        initiator: 'admin',
        isDepartureCancelled: true,
        isPartialRefund: false,
        cancellationReason: 'Departure cancelled by operator',
        requestedDate: new Date('2024-11-23'),
        startDate: new Date('2024-12-10')
      },
      {
        _id: 'BK004',
        customerId: { fullName: 'Emma Wilson', email: 'emma@example.com' },
        packageId: { title: 'Dubai Luxury Tour 4D/3N' },
        totalAmount: 4500,
        refundAmount: 3600,
        refundedSoFar: 0,
        refundStatus: 'PENDING_REFUND',
        initiator: 'customer',
        isDepartureCancelled: false,
        isPartialRefund: false,
        cancellationReason: 'Medical reasons',
        requestedDate: new Date('2024-11-24'),
        startDate: new Date('2025-01-05')
      },
      {
        _id: 'BK005',
        customerId: { fullName: 'David Brown', email: 'david@example.com' },
        packageId: { title: 'Singapore City Break 3D/2N' },
        totalAmount: 1500,
        refundAmount: 1500,
        refundedSoFar: 0,
        refundStatus: 'PENDING_REFUND',
        initiator: 'admin',
        isDepartureCancelled: true,
        isPartialRefund: false,
        cancellationReason: 'Departure cancelled by operator',
        requestedDate: new Date('2024-11-24'),
        startDate: new Date('2024-12-05')
      }
    ];
    setRefunds(mockData);
  };

  const processRefund = async (bookingId, amount) => {
    try {
      // Call backend API to process refund
      const adminId = localStorage.getItem('userId');
      const res = await axios.post(`/api/admin/bookings/${bookingId}/refund`, { adminId });
      
      if (res.data.success) {
        // Update the refund status to REFUNDED instead of removing
        setRefunds(refunds.map(r => {
          if (r._id === bookingId) {
            return {
              ...r,
              refundStatus: 'REFUNDED',
              status: 'REFUNDED'
            };
          }
          return r;
        }));
        
        // Refresh to get updated data from backend
        fetchRefunds();
        
        alert(`Refund processed successfully! $${res.data.refundAmount} refunded to ${res.data.booking.customerId.fullName}`);
      }
    } catch (err) {
      console.error('Failed to process refund:', err);
      alert('Failed to process refund: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredRefunds = refunds.filter(refund => {
    const matchesSearch = 
      refund._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.customerId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.packageId?.title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'pending' && ['PENDING_REFUND', 'PARTIAL_REFUND'].includes(refund.refundStatus)) ||
      (statusFilter === 'refunded' && refund.refundStatus === 'REFUNDED');

    const matchesInitiator = initiatorFilter === 'all' || refund.initiator === initiatorFilter;

    const matchesReason = reasonFilter === 'all' ||
      (reasonFilter === 'departure_cancelled' && refund.isDepartureCancelled) ||
      (reasonFilter === 'customer_request' && !refund.isDepartureCancelled);

    return matchesSearch && matchesStatus && matchesInitiator && matchesReason;
  });

  const getStatusColor = (status) => {
    const colors = {
      PENDING_REFUND: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
      PARTIAL_REFUND: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
      REFUNDED: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const totalPendingAmount = filteredRefunds
    .filter(r => r.refundStatus !== 'REFUNDED')
    .reduce((sum, r) => sum + ((r.refundAmount || 0) - (r.refundedSoFar || 0)), 0);

  const totalRefundedAmount = filteredRefunds
    .reduce((sum, r) => sum + (r.refundedSoFar || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <FaDollarSign className="mr-3 text-red-600 dark:text-red-400" />
              Cancellations & Refund Queue
            </h2>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-xs text-gray-600 dark:text-gray-400">Pending Refunds</div>
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  ${totalPendingAmount.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Refunded</div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  ${totalRefundedAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, customer, package..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending/Partial</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              value={initiatorFilter}
              onChange={(e) => setInitiatorFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Initiators</option>
              <option value="customer">Customer Requested</option>
              <option value="admin">Admin Initiated</option>
            </select>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Reasons</option>
              <option value="departure_cancelled">Departure Cancelled</option>
              <option value="customer_request">Customer Request</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Booking ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Package</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Requested Refund</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Refunded</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Initiator</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRefunds.map((refund) => (
                  <tr
                    key={refund._id}
                    className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      refund.isDepartureCancelled ? 'bg-red-50/30 dark:bg-red-900/10' : ''
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                        #{refund._displayId || refund._id}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(refund.requestedDate)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {refund.customerId?.fullName || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {refund.customerId?.email || ''}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {refund.packageId?.title || 'Package'}
                      </div>
                      {refund.isDepartureCancelled && (
                        <div className="flex items-center text-xs text-red-600 dark:text-red-400 mt-1">
                          <FaCalendarTimes className="mr-1" />
                          Departure cancelled
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        ${(refund.totalAmount || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="font-semibold text-orange-600 dark:text-orange-400">
                        ${(refund.refundAmount || 0).toLocaleString()}
                      </div>
                      {refund.totalAmount > 0 && refund.refundAmount > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {((refund.refundAmount / refund.totalAmount) * 100).toFixed(0)}% of total
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="font-semibold text-green-600 dark:text-green-400">
                        ${(refund.refundedSoFar || 0).toLocaleString()}
                      </div>
                      {refund.isPartialRefund && (
                        <div className="text-xs text-orange-600 dark:text-orange-400">
                          ${((refund.refundAmount || 0) - (refund.refundedSoFar || 0)).toLocaleString()} pending
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(refund.refundStatus)}`}>
                        {refund.refundStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center">
                        {refund.initiator === 'customer' ? (
                          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-xs font-semibold">
                            <FaUserCircle className="mr-1" />
                            Customer
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 rounded-full text-xs font-semibold">
                            <FaUserShield className="mr-1" />
                            Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedRefund(refund);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        {refund.refundStatus !== 'REFUNDED' && (
                          <button
                            onClick={() => processRefund(refund._id, refund.refundAmount - refund.refundedSoFar)}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                            title="Process Refund"
                          >
                            <FaCheck />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredRefunds.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all' || initiatorFilter !== 'all' || reasonFilter !== 'all'
                  ? 'No refunds match your filters'
                  : 'No refund requests found'}
              </div>
            )}
          </div>

          {loading && (
            <div className="text-center py-8 text-primary font-semibold">Loading...</div>
          )}

          {/* Stats Summary */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
              <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold">Total Requests</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">{refunds.length}</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg">
              <div className="text-sm text-yellow-600 dark:text-yellow-400 font-semibold">Pending</div>
              <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
                {refunds.filter(r => r.refundStatus === 'PENDING_REFUND').length}
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
              <div className="text-sm text-orange-600 dark:text-orange-400 font-semibold">Partial</div>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-300">
                {refunds.filter(r => r.refundStatus === 'PARTIAL_REFUND').length}
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
              <div className="text-sm text-green-600 dark:text-green-400 font-semibold">Completed</div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-300">
                {refunds.filter(r => r.refundStatus === 'REFUNDED').length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => setShowDetailsModal(false)}></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full shadow-2xl">
            <button
              onClick={() => setShowDetailsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FaTimes size={20} />
            </button>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Refund Details</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Booking ID</div>
                  <div className="font-mono font-semibold text-gray-900 dark:text-white">#{selectedRefund._displayId || selectedRefund._id}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Customer</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{selectedRefund.customerId?.fullName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Original Amount</div>
                  <div className="font-semibold text-gray-900 dark:text-white">${selectedRefund.totalAmount?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Requested Refund</div>
                  <div className="font-semibold text-orange-600 dark:text-orange-400">${selectedRefund.refundAmount?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Refunded So Far</div>
                  <div className="font-semibold text-green-600 dark:text-green-400">${selectedRefund.refundedSoFar?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Remaining</div>
                  <div className="font-semibold text-red-600 dark:text-red-400">
                    ${(selectedRefund.refundAmount - selectedRefund.refundedSoFar).toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cancellation Reason</div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                  {selectedRefund.cancellationReason}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-semibold"
                >
                  Close
                </button>
                {selectedRefund.refundStatus !== 'REFUNDED' && (
                  <button
                    onClick={() => {
                      processRefund(selectedRefund._id, selectedRefund.refundAmount - selectedRefund.refundedSoFar);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    Process Full Refund
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CancellationsRefundQueue;
