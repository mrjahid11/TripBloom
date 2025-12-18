import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { FaTimes, FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaStar, FaExclamationTriangle, FaUsersCog } from 'react-icons/fa';

const OperatorDetailModal = ({ isOpen, onClose, operator, onEdit }) => {
    const [activeTab, setActiveTab] = useState('profile');
    useEffect(() => {
      if (isOpen) setActiveTab('profile');
    }, [isOpen]);
  const [departures, setDepartures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  // Add callback for viewing departure details
  const onViewDeparture = typeof window !== 'undefined' && window.onViewDeparture ? window.onViewDeparture : null;

  useEffect(() => {
    if (isOpen && operator) {
      console.log('[OperatorDetailModal] Modal opened with operator:', {
        id: operator._id,
        name: operator.fullName,
        upcomingDepartures: operator.upcomingDepartures,
        assignedPackages: operator.assignedPackages
      });
      fetchOperatorDepartures();
    }
  }, [isOpen, operator]);

  const fetchOperatorDepartures = async () => {
    setLoading(true);
    try {
      console.log(`[OperatorDetailModal] Fetching departures for operator: ${operator._id}`);
      const res = await axios.get(`/api/group-departure/operator/${operator._id}/future`);
      console.log(`[OperatorDetailModal] API Response:`, res.data);
      // Sort departures by upcoming close event date (startDate ascending)
      const sortedDepartures = (res.data.departures || []).sort((a, b) => {
        return new Date(a.startDate) - new Date(b.startDate);
      });
      console.log(`[OperatorDetailModal] Sorted departures (${sortedDepartures.length}):`, sortedDepartures);
      setDepartures(sortedDepartures);
    } catch (err) {
      console.error('[OperatorDetailModal] Failed to fetch departures:', err);
    }
    setLoading(false);
  };

  const handleReassignAll = async () => {
    try {
      await axios.post(`/api/group-departure/operator/${operator._id}/remove-future`);
      setShowReassignModal(false);
      onClose();
      // Refresh parent list
    } catch (err) {
      console.error('Failed to reassign departures:', err);
    }
  };

  if (!isOpen || !operator) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      OPEN: 'text-green-600 bg-green-100 dark:bg-green-900/20',
      FULL: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
      CANCELLED: 'text-red-600 bg-red-100 dark:bg-red-900/20',
      CLOSED: 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    };
    return colors[status] || 'text-blue-600 bg-blue-100';
  };

  // Mock performance data
  const performanceStats = {
    averageRating: 4.7,
    totalToursCompleted: 28,
    totalCustomersServed: 342,
    onTimePercentage: 96
  };

  const modalContent = (
    <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 99999 }}>
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        ></div>
        
        {/* Modal Content */}
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-scale-in" style={{ zIndex: 99999 }}>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10"
          >
            <FaTimes size={24} />
          </button>

          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-8 text-white">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                {operator.fullName.charAt(0)}
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1">{operator.fullName}</h2>
                <p className="text-orange-100">Tour Operator</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 flex items-center">
            <button
              className={`px-6 py-4 font-semibold focus:outline-none transition-colors ${activeTab === 'profile' ? 'border-b-4 border-orange-600 text-orange-700 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button
              className={`px-6 py-4 font-semibold focus:outline-none transition-colors ${activeTab === 'assignments' ? 'border-b-4 border-green-600 text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}
              onClick={() => setActiveTab('assignments')}
            >
              Operator Assignments
            </button>
          </div>

          <div className="p-8 max-h-[70vh] overflow-y-auto">
            {activeTab === 'profile' && (
              <>
                {/* Contact Info Section */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <FaEnvelope className="text-primary text-xl" />
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Email</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{operator.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <FaPhone className="text-primary text-xl" />
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Phone</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{operator.phone || 'Not provided'}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <FaUsersCog className="text-primary text-xl" />
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Roles</div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {operator.roles?.join(', ') || 'Operator'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${operator.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {operator.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Past Performance</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg text-center">
                      <FaStar className="text-yellow-600 dark:text-yellow-400 text-2xl mx-auto mb-2" />
                      <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
                        {performanceStats.averageRating}
                      </div>
                      <div className="text-sm text-yellow-700 dark:text-yellow-400">Avg Rating</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                        {performanceStats.totalToursCompleted}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-400">Tours Completed</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-900 dark:text-green-300">
                        {performanceStats.totalCustomersServed}
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-400">Customers Served</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                        {performanceStats.onTimePercentage}%
                      </div>
                      <div className="text-sm text-purple-700 dark:text-purple-400">On-Time Rate</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'assignments' && (
              <>
                {/* Assigned Departures */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Assigned Group Departures</h3>
                    {!operator.isActive && departures.length > 0 && (
                      <button
                        onClick={() => setShowReassignModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                      >
                        <FaExclamationTriangle />
                        <span>Reassign All</span>
                      </button>
                    )}
                  </div>

                  {loading ? (
                    <div className="text-center py-8 text-primary">Loading departures...</div>
                  ) : departures.length > 0 ? (
                    <div className="space-y-3">
                      {departures.map((departure) => (
                        <button
                          key={departure._id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow w-full text-left"
                          onClick={() => {
                            if (onViewDeparture) {
                              onViewDeparture(departure);
                            }
                          }}
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-white mb-1">
                              {departure.packageId?.title || departure.packageId?.name || 'Package'}
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
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No upcoming departures assigned
                    </div>
                  )}
                </div>

                {/* Warning for inactive operator with departures */}
                {!operator.isActive && departures.length > 0 && (
                  <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-600 rounded">
                    <div className="flex items-start">
                      <FaExclamationTriangle className="text-yellow-600 dark:text-yellow-400 mt-1 mr-3" />
                      <div>
                        <div className="font-semibold text-yellow-800 dark:text-yellow-300">Warning</div>
                        <div className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                          This operator is inactive but still has {departures.length} upcoming departure(s) assigned. 
                          Consider reassigning these departures to active operators.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Actions */}
            <div className="flex space-x-4">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (onEdit) {
                    onEdit(operator);
                  }
                }}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
              >
                Edit Operator
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reassign Confirmation Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 100000 }}>
          <div className="fixed inset-0 bg-black/80" onClick={() => setShowReassignModal(false)}></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Reassign All Departures</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This will remove <strong>{operator.fullName}</strong> from all {departures.length} upcoming departure(s). 
              You'll need to manually assign new operators to these departures.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={handleReassignAll}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
              >
                Confirm Reassign
              </button>
              <button
                onClick={() => setShowReassignModal(false)}
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

export default OperatorDetailModal;
