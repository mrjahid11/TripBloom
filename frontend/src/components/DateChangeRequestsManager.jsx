import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaCheck, FaTimes, FaClock, FaUser, FaInfoCircle } from 'react-icons/fa';

const DateChangeRequestsManager = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDateChangeRequests();
  }, []);

  const fetchDateChangeRequests = async () => {
    setLoading(true);
    try {
      // Fetch all bookings and filter for those with date change requests
      const res = await axios.get('/api/bookings');
      const allBookings = res.data.bookings || [];
      
      // Filter bookings that have date change requests
      const withRequests = allBookings.filter(b => b.dateChangeRequest);
      
      setRequests(withRequests);
    } catch (err) {
      console.error('Failed to fetch date change requests:', err);
    }
    setLoading(false);
  };

  const handleApprove = async (bookingId, requestedDate) => {
    if (!window.confirm('Are you sure you want to approve this date change request?')) {
      return;
    }

    setProcessing(true);
    try {
      const adminId = localStorage.getItem('userId');
      const res = await axios.post(`/api/admin/bookings/${bookingId}/approve-date-change`, {
        adminId,
        newStartDate: requestedDate
      });

      if (res.data.success) {
        alert('Date change request approved successfully!');
        fetchDateChangeRequests(); // Refresh the list
        setShowDetailModal(false);
      }
    } catch (err) {
      console.error('Failed to approve request:', err);
      alert('Failed to approve request: ' + (err.response?.data?.message || err.message));
    }
    setProcessing(false);
  };

  const handleReject = async (bookingId) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    
    setProcessing(true);
    try {
      const adminId = localStorage.getItem('userId');
      const res = await axios.post(`/api/admin/bookings/${bookingId}/reject-date-change`, {
        adminId,
        reviewNotes: reason || 'Request rejected by admin'
      });

      if (res.data.success) {
        alert('Date change request rejected.');
        fetchDateChangeRequests(); // Refresh the list
        setShowDetailModal(false);
      }
    } catch (err) {
      console.error('Failed to reject request:', err);
      alert('Failed to reject request: ' + (err.response?.data?.message || err.message));
    }
    setProcessing(false);
  };

  const filteredRequests = requests.filter(req => {
    if (statusFilter === 'all') return true;
    return req.dateChangeRequest?.status === statusFilter.toUpperCase();
  });

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
      APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Date Change Requests
        </h2>
        <button
          onClick={fetchDateChangeRequests}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">All Requests</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="text-sm text-yellow-600 dark:text-yellow-400">Pending</div>
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
            {requests.filter(r => r.dateChangeRequest?.status === 'PENDING').length}
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-sm text-green-600 dark:text-green-400">Approved</div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {requests.filter(r => r.dateChangeRequest?.status === 'APPROVED').length}
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-sm text-red-600 dark:text-red-400">Rejected</div>
          <div className="text-2xl font-bold text-red-700 dark:text-red-300">
            {requests.filter(r => r.dateChangeRequest?.status === 'REJECTED').length}
          </div>
        </div>
      </div>

      {/* Requests Table */}
      {loading ? (
        <p>Loading requests...</p>
      ) : filteredRequests.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No date change requests found.</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Booking ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Current Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Requested Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRequests.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {booking._id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {booking.customerId?.fullName || booking.customerId?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {booking.packageId?.title || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {formatDate(booking.startDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 font-semibold">
                    {formatDate(booking.dateChangeRequest.requestedDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.dateChangeRequest.status)}`}>
                      {booking.dateChangeRequest.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => {
                        setSelectedRequest(booking);
                        setShowDetailModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                    >
                      <FaInfoCircle className="inline mr-1" />
                      View
                    </button>
                    {booking.dateChangeRequest.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleApprove(booking._id, booking.dateChangeRequest.requestedDate)}
                          disabled={processing}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 mr-3 disabled:opacity-50"
                        >
                          <FaCheck className="inline mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(booking._id)}
                          disabled={processing}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                        >
                          <FaTimes className="inline mr-1" />
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Date Change Request Details
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Booking ID</label>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedRequest._id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Status</label>
                  <p>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedRequest.dateChangeRequest.status)}`}>
                      {selectedRequest.dateChangeRequest.status}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Customer</label>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedRequest.customerId?.fullName || selectedRequest.customerId?.name || 'N/A'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedRequest.customerId?.email || 'N/A'}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Package</label>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedRequest.packageId?.title || 'N/A'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div>
                  <label className="text-sm text-blue-600 dark:text-blue-400">Current Start Date</label>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {formatDate(selectedRequest.startDate)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-blue-600 dark:text-blue-400">Requested New Date</label>
                  <p className="font-bold text-green-600 dark:text-green-400">
                    {formatDate(selectedRequest.dateChangeRequest.requestedDate)}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Reason for Change</label>
                <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded">
                  {selectedRequest.dateChangeRequest.reason || 'No reason provided'}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Requested On</label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(selectedRequest.dateChangeRequest.requestedAt).toLocaleString()}
                </p>
              </div>

              {selectedRequest.dateChangeRequest.reviewedAt && (
                <>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Reviewed On</label>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(selectedRequest.dateChangeRequest.reviewedAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedRequest.dateChangeRequest.reviewNotes && (
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Review Notes</label>
                      <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded">
                        {selectedRequest.dateChangeRequest.reviewNotes}
                      </p>
                    </div>
                  )}
                </>
              )}

              {selectedRequest.dateChangeRequest.status === 'PENDING' && (
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => handleApprove(selectedRequest._id, selectedRequest.dateChangeRequest.requestedDate)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                  >
                    {processing ? 'Processing...' : 'Approve Request'}
                  </button>
                  <button
                    onClick={() => handleReject(selectedRequest._id)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                  >
                    {processing ? 'Processing...' : 'Reject Request'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateChangeRequestsManager;
