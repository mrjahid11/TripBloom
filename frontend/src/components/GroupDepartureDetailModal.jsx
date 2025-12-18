import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { 
  FaTimes, FaCalendarAlt, FaUsers, FaUserTie, FaMapMarkerAlt, 
  FaDollarSign, FaPlus, FaTrash, FaExclamationTriangle 
} from 'react-icons/fa';

const GroupDepartureDetailModal = ({ isOpen, onClose, departure, onDepartureUpdated }) => {
  const [operators, setOperators] = useState([]);
  const [availableOperators, setAvailableOperators] = useState([]);
  const [showAddOperator, setShowAddOperator] = useState(false);
  const [selectedOperatorId, setSelectedOperatorId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && departure) {
      setOperators(departure.operators || []);
      fetchAvailableOperators();
    }
  }, [isOpen, departure]);

  const fetchAvailableOperators = async () => {
    try {
      const res = await axios.get('/api/admin/users');
      const allUsers = res.data.users || [];
      const operatorUsers = allUsers.filter(user => 
        user.isActive && user.roles?.some(r => {
          const roleUpper = r.toUpperCase();
          return roleUpper === 'TOUR_OPERATOR' || roleUpper === 'OPERATOR';
        })
      );
      setAvailableOperators(operatorUsers);
    } catch (err) {
      console.error('Failed to fetch operators:', err);
    }
  };

  const handleAddOperator = async () => {
    if (!selectedOperatorId) return;

    // Check if operator already assigned
    if (operators.some(op => op.operatorId?._id === selectedOperatorId || op.operatorId === selectedOperatorId)) {
      alert('This operator is already assigned to this departure');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`/api/admin/group-departures/${departure._id}/operators`, {
        operatorId: selectedOperatorId
      });
      
      setShowAddOperator(false);
      setSelectedOperatorId('');
      
      if (onDepartureUpdated) {
        onDepartureUpdated();
      }
      
      // Refresh the departure data
      const res = await axios.get(`/api/admin/group-departures/${departure._id}`);
      setOperators(res.data.departure?.operators || []);
    } catch (err) {
      console.error('Failed to add operator:', err);
      alert(err.response?.data?.message || 'Failed to add operator');
    }
    setLoading(false);
  };

  const handleRemoveOperator = async (operatorId) => {
    // Prevent removing the last operator
    if (operators.length <= 1) {
      alert('Cannot remove the last operator. A departure must have at least one operator assigned.');
      return;
    }

    if (!confirm('Are you sure you want to remove this operator from the departure?')) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`/api/admin/group-departures/${departure._id}/operators/${operatorId}`);
      
      if (onDepartureUpdated) {
        onDepartureUpdated();
      }
      
      // Refresh the departure data
      const res = await axios.get(`/api/admin/group-departures/${departure._id}`);
      setOperators(res.data.departure?.operators || []);
    } catch (err) {
      console.error('Failed to remove operator:', err);
      alert(err.response?.data?.message || 'Failed to remove operator');
    }
    setLoading(false);
  };

  if (!isOpen || !departure) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      OPEN: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      FULL: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
      CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
      CLOSED: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
    };
    return colors[status] || 'bg-blue-100 text-blue-700';
  };

  const occupancyPercentage = ((departure.bookedSeats / departure.totalSeats) * 100).toFixed(0);

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
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-8 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  {departure.packageId?.title || 'Group Departure'}
                </h2>
                <div className="flex items-center space-x-4 text-purple-100">
                  <span className="flex items-center">
                    <FaCalendarAlt className="mr-2" />
                    {formatDate(departure.startDate)} - {formatDate(departure.endDate)}
                  </span>
                  <span className="flex items-center">
                    <FaMapMarkerAlt className="mr-2" />
                    {departure.packageId?.destinations?.[0]?.name || 'N/A'}
                  </span>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(departure.status)}`}>
                {departure.status}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 max-h-[70vh] overflow-y-auto">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Capacity</div>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                      {departure.bookedSeats}/{departure.totalSeats}
                    </div>
                  </div>
                  <FaUsers className="text-3xl text-blue-600 dark:text-blue-400" />
                </div>
                <div className="mt-2 w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${occupancyPercentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">{occupancyPercentage}% Full</div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-600 dark:text-green-400">Price per Person</div>
                    <div className="text-2xl font-bold text-green-900 dark:text-green-300">
                      ${departure.pricePerPerson}
                    </div>
                  </div>
                  <FaDollarSign className="text-3xl text-green-600 dark:text-green-400" />
                </div>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-purple-600 dark:text-purple-400">Operators</div>
                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                      {operators.length}
                    </div>
                  </div>
                  <FaUserTie className="text-3xl text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            {/* Assigned Operators Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Assigned Operators</h3>
                <button
                  onClick={() => setShowAddOperator(!showAddOperator)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <FaPlus />
                  <span>Add Operator</span>
                </button>
              </div>

              {/* Add Operator Form */}
              {showAddOperator && (
                <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Select Operator to Add
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={selectedOperatorId}
                      onChange={(e) => setSelectedOperatorId(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">-- Select an operator --</option>
                      {availableOperators.map(op => (
                        <option key={op._id} value={op._id}>
                          {op.fullName} ({op.email})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddOperator}
                      disabled={!selectedOperatorId || loading}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                    >
                      {loading ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddOperator(false);
                        setSelectedOperatorId('');
                      }}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Operators List */}
              {operators.length > 0 ? (
                <div className="space-y-3">
                  {operators.map((op, index) => {
                    const operatorData = op.operatorId;
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                            {operatorData?.fullName?.charAt(0) || 'O'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {operatorData?.fullName || 'Unknown Operator'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {operatorData?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveOperator(operatorData?._id || op.operatorId)}
                          disabled={operators.length <= 1 || loading}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={operators.length <= 1 ? "Cannot remove the last operator" : "Remove operator"}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 bg-red-50 dark:bg-red-900/20 rounded-lg text-center border border-red-200 dark:border-red-800">
                  <FaExclamationTriangle className="mx-auto text-4xl text-red-600 dark:text-red-400 mb-3" />
                  <div className="font-semibold text-red-800 dark:text-red-300 mb-2">
                    No Operators Assigned!
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-400">
                    This departure cannot proceed without at least one operator. Please assign an operator immediately.
                  </div>
                </div>
              )}
            </div>

            {/* Warning if only one operator */}
            {operators.length === 1 && (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-600 rounded">
                <div className="flex items-start">
                  <FaExclamationTriangle className="text-yellow-600 dark:text-yellow-400 mt-1 mr-3" />
                  <div>
                    <div className="font-semibold text-yellow-800 dark:text-yellow-300">Notice</div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                      This departure has only one operator assigned. You cannot remove this operator unless you add another one first.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default GroupDepartureDetailModal;
