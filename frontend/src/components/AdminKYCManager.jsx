import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaIdCard, FaCheckCircle, FaTimesCircle, FaClock, FaEye, 
  FaUser, FaCalendar, FaFileAlt, FaFilter, FaSearch, FaSpinner
} from 'react-icons/fa';

const AdminKYCManager = () => {
  const [kycRequests, setKycRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [pendingActionKYC, setPendingActionKYC] = useState(null);

  useEffect(() => {
    fetchKYCRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [kycRequests, statusFilter, searchQuery]);

  // Body scroll lock for detail modal
  useEffect(() => {
    if (showDetailModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDetailModal]);

  // Body scroll lock for reject modal
  useEffect(() => {
    if (showRejectModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showRejectModal]);

  const fetchKYCRequests = async () => {
    setLoading(true);
    try {
      const role = localStorage.getItem('userRole') || '';
      const response = await axios.get('/api/admin/kyc', {
        headers: { 
          'x-user-role': role
        }
      });
      
      if (response.data.success) {
        setKycRequests(response.data.kycs || []);
      }
    } catch (error) {
      console.error('Failed to fetch KYC requests:', error);
      alert('Failed to load KYC requests. Make sure you are authenticated as admin.');
    }
    setLoading(false);
  };

  const filterRequests = () => {
    let filtered = [...kycRequests];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(kyc => kyc.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(kyc => 
        ((kyc.userFullName || kyc.user?.fullName || kyc.user?.name || '')).toLowerCase().includes(query) ||
        kyc.user?.email?.toLowerCase().includes(query) ||
        (kyc.userEmail || '').toLowerCase().includes(query) ||
        kyc.documentNumber?.toLowerCase().includes(query)
      );
    }

    setFilteredRequests(filtered);
  };

  // Keep selectedKYC updated when data refreshes
  useEffect(() => {
    if (selectedKYC && kycRequests.length > 0) {
      const updated = kycRequests.find(k => k._id === selectedKYC._id);
      if (updated) {
        setSelectedKYC(updated);
      }
    }
  }, [kycRequests]);

  const handleViewDetails = (kyc) => {
    setSelectedKYC(kyc);
    setShowDetailModal(true);
  };

  const handleApprove = async (kycId) => {
    if (!window.confirm('Are you sure you want to approve this KYC submission?')) {
      return;
    }

    setActionLoading(true);
    try {
      const role = localStorage.getItem('userRole') || '';
      const response = await axios.put(
        `/api/admin/kyc/${kycId}/verify`,
        { status: 'approved', remarks: 'Approved by admin' },
        {
          headers: { 
            'x-user-role': role
          }
        }
      );

      if (response.data.success) {
        alert('KYC approved successfully');
        fetchKYCRequests();
        setShowDetailModal(false);
        setSelectedKYC(null);
      }
    } catch (error) {
      console.error('Failed to approve KYC:', error);
      alert(error.response?.data?.message || 'Failed to approve KYC');
    }
    setActionLoading(false);
  };

  const handleRejectClick = (kyc) => {
    setPendingActionKYC(kyc);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      const role = localStorage.getItem('userRole') || '';
      const response = await axios.put(
        `/api/admin/kyc/${pendingActionKYC._id}/verify`,
        { status: 'rejected', remarks: rejectionReason },
        {
          headers: { 
            'x-user-role': role
          }
        }
      );

      if (response.data.success) {
        alert('KYC rejected successfully');
        fetchKYCRequests();
        setShowRejectModal(false);
        setShowDetailModal(false);
        setSelectedKYC(null);
        setPendingActionKYC(null);
        setRejectionReason('');
      }
    } catch (error) {
      console.error('Failed to reject KYC:', error);
      alert(error.response?.data?.message || 'Failed to reject KYC');
    }
    setActionLoading(false);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-800 dark:text-yellow-300',
        icon: FaClock,
        label: 'Pending'
      },
      approved: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-800 dark:text-green-300',
        icon: FaCheckCircle,
        label: 'Approved'
      },
      rejected: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-800 dark:text-red-300',
        icon: FaTimesCircle,
        label: 'Rejected'
      }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="mr-1.5" />
        {badge.label}
      </span>
    );
  };

  const getDocumentTypeLabel = (type) => {
    const labels = {
      passport: 'Passport',
      national_id: 'National ID',
      driving_license: 'Driving License'
    };
    return labels[type] || type;
  };

  const stats = {
    total: kycRequests.length,
    pending: kycRequests.filter(k => k.status === 'pending').length,
    approved: kycRequests.filter(k => k.status === 'approved').length,
    rejected: kycRequests.filter(k => k.status === 'rejected').length
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">KYC Management</h1>
          <p className="text-gray-400">Review and manage customer KYC submissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Submissions</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <FaIdCard className="text-blue-400 text-3xl" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.pending}</p>
              </div>
              <FaClock className="text-yellow-400 text-3xl" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Approved</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{stats.approved}</p>
              </div>
              <FaCheckCircle className="text-green-400 text-3xl" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Rejected</p>
                <p className="text-2xl font-bold text-red-400 mt-1">{stats.rejected}</p>
              </div>
              <FaTimesCircle className="text-red-400 text-3xl" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <FaFilter className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or document number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-4 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* KYC List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <FaSpinner className="animate-spin text-blue-400 text-4xl" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
            <FaIdCard className="mx-auto text-gray-600 text-6xl mb-4" />
            <p className="text-gray-400 text-lg">No KYC submissions found</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-750">
                  <tr className="border-b border-gray-700">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Customer</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Document Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Document #</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Submitted</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredRequests.map((kyc) => (
                    <tr key={kyc._id} className="hover:bg-gray-750 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold mr-3">
                            {((kyc.userFullName || kyc.user?.fullName || kyc.user?.name || 'U').charAt(0) || 'U').toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">{kyc.userFullName || kyc.user?.fullName || kyc.user?.name || 'Unknown User'}</p>
                            <p className="text-gray-400 text-sm">{kyc.userEmail || kyc.user?.email || 'No email'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {getDocumentTypeLabel(kyc.documentType)}
                      </td>
                      <td className="px-6 py-4 text-gray-300 font-mono text-sm">
                        {kyc.documentNumber}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {new Date(kyc.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(kyc.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(kyc)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition"
                          >
                            <FaEye />
                            <span>View</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedKYC && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-xl">
                      {((selectedKYC.userFullName || selectedKYC.user?.fullName || selectedKYC.user?.name || 'U').charAt(0) || 'U').toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">KYC Submission Details</h2>
                      <p className="text-blue-100">{selectedKYC.userFullName || selectedKYC.user?.fullName || selectedKYC.user?.name || 'Unknown User'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-white hover:bg-white/20 rounded-lg p-2 transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Status */}
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Current Status</label>
                  {getStatusBadge(selectedKYC.status)}
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block flex items-center">
                      <FaUser className="mr-2" /> Customer Name
                    </label>
                    <p className="text-white bg-gray-700 px-4 py-2 rounded-lg">
                      {selectedKYC.userFullName || selectedKYC.user?.fullName || selectedKYC.user?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block flex items-center">
                      <FaCalendar className="mr-2" /> Email
                    </label>
                    <p className="text-white bg-gray-700 px-4 py-2 rounded-lg">
                      {selectedKYC.user?.email || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Document Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block flex items-center">
                      <FaFileAlt className="mr-2" /> Document Type
                    </label>
                    <p className="text-white bg-gray-700 px-4 py-2 rounded-lg">
                      {getDocumentTypeLabel(selectedKYC.documentType)}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block flex items-center">
                      <FaIdCard className="mr-2" /> Document Number
                    </label>
                    <p className="text-white bg-gray-700 px-4 py-2 rounded-lg font-mono">
                      {selectedKYC.documentNumber}
                    </p>
                  </div>
                </div>

                {/* Submission Date */}
                <div>
                  <label className="text-gray-400 text-sm mb-2 block flex items-center">
                    <FaCalendar className="mr-2" /> Submitted On
                  </label>
                  <p className="text-white bg-gray-700 px-4 py-2 rounded-lg">
                    {new Date(selectedKYC.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {/* Document Image */}
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Document Image</label>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <img
                      src={`/${selectedKYC.documentImage}`}
                      alt="KYC Document"
                      className="max-w-full h-auto rounded-lg border-2 border-gray-600"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/600x400?text=Document+Not+Available';
                      }}
                    />
                  </div>
                </div>

                {/* Verification Details (if verified) */}
                {selectedKYC.status !== 'pending' && (
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Admin Remarks</label>
                    <p className="text-white bg-gray-700 px-4 py-3 rounded-lg">
                      {selectedKYC.remarks || 'No remarks provided'}
                    </p>
                  </div>
                )}

                {selectedKYC.verifiedAt && (
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Verified At</label>
                    <p className="text-white bg-gray-700 px-4 py-2 rounded-lg">
                      {new Date(selectedKYC.verifiedAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              {selectedKYC.status === 'pending' && (
                <div className="bg-gray-750 p-6 rounded-b-2xl flex justify-end space-x-3 border-t border-gray-700">
                  <button
                    onClick={() => handleRejectClick(selectedKYC)}
                    disabled={actionLoading}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition disabled:opacity-50"
                  >
                    {actionLoading ? <FaSpinner className="animate-spin" /> : <FaTimesCircle />}
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleApprove(selectedKYC._id)}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition disabled:opacity-50"
                  >
                    {actionLoading ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                    <span>Approve</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
              <div className="bg-red-600 p-6 rounded-t-2xl">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <FaTimesCircle className="mr-2" />
                  Reject KYC Submission
                </h3>
              </div>
              <div className="p-6">
                <p className="text-gray-300 mb-4">
                  Please provide a reason for rejecting this KYC submission. This will be visible to the customer.
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  rows={4}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
              <div className="bg-gray-750 p-6 rounded-b-2xl flex justify-end space-x-3 border-t border-gray-700">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setPendingActionKYC(null);
                    setRejectionReason('');
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectConfirm}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition disabled:opacity-50"
                >
                  {actionLoading ? <FaSpinner className="animate-spin" /> : <FaTimesCircle />}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminKYCManager;
