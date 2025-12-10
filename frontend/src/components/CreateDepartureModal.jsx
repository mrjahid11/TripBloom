import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { FaTimes, FaCalendarAlt, FaUsers, FaUserTie, FaExclamationTriangle } from 'react-icons/fa';

const CreateDepartureModal = ({ isOpen, onClose, onDepartureCreated }) => {
  const [groupPackages, setGroupPackages] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    packageId: '',
    startDate: '',
    endDate: '',
    totalSeats: 40,
    pricePerPerson: '',
    selectedOperators: []
  });

  useEffect(() => {
    if (isOpen) {
      fetchGroupPackages();
      fetchOperators();
      setError('');
    }
  }, [isOpen]);

  const fetchGroupPackages = async () => {
    try {
      const res = await axios.get('/api/admin/packages');
      const packages = res.data.packages || [];
      // Filter for GROUP type packages (category is null or undefined for GROUP packages)
      const groupOnly = packages.filter(pkg => pkg.category === null || pkg.category === undefined || pkg.type === 'GROUP');
      setGroupPackages(groupOnly);
    } catch (err) {
      console.error('Failed to fetch packages:', err);
      setError('Failed to load tour packages');
    }
  };

  const fetchOperators = async () => {
    try {
      const res = await axios.get('/api/admin/users');
      const allUsers = res.data.users || [];
      const operatorUsers = allUsers.filter(user => 
        user.isActive && user.roles?.some(r => {
          const roleUpper = r.toUpperCase();
          return roleUpper === 'TOUR_OPERATOR' || roleUpper === 'OPERATOR';
        })
      );
      setOperators(operatorUsers);
    } catch (err) {
      console.error('Failed to fetch operators:', err);
    }
  };

  const handlePackageChange = (packageId) => {
    setFormData(prev => ({ ...prev, packageId }));
    
    // Auto-populate dates and price based on selected package
    const selectedPkg = groupPackages.find(pkg => pkg._id === packageId);
    if (selectedPkg) {
      const days = selectedPkg.defaultDays || 7;
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + 7); // Default: 1 week from now
      
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + days);
      
      setFormData(prev => ({
        ...prev,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        pricePerPerson: selectedPkg.basePrice || ''
      }));
    }
  };

  const handleOperatorToggle = (operatorId) => {
    setFormData(prev => ({
      ...prev,
      selectedOperators: prev.selectedOperators.includes(operatorId)
        ? prev.selectedOperators.filter(id => id !== operatorId)
        : [...prev.selectedOperators, operatorId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.packageId) {
      setError('Please select a tour package');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      setError('Please select start and end dates');
      return;
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError('End date must be after start date');
      return;
    }
    if (!formData.totalSeats || formData.totalSeats < 1) {
      setError('Total seats must be at least 1');
      return;
    }
    if (!formData.pricePerPerson || formData.pricePerPerson < 0) {
      setError('Please enter a valid price per person');
      return;
    }
    if (formData.selectedOperators.length === 0) {
      setError('Please assign at least one operator to this departure');
      return;
    }

    setLoading(true);
    try {

      // Create the departure and assign operators in one request
      const departureData = {
        packageId: formData.packageId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalSeats: parseInt(formData.totalSeats),
        pricePerPerson: parseFloat(formData.pricePerPerson),
        operatorIds: formData.selectedOperators
      };

      const res = await axios.post('/api/admin/group-departures', departureData);
      const newDeparture = res.data.departure;

      if (onDepartureCreated) {
        onDepartureCreated();
      }

      // Reset form
      setFormData({
        packageId: '',
        startDate: '',
        endDate: '',
        totalSeats: 40,
        pricePerPerson: '',
        selectedOperators: []
      });

      onClose();
    } catch (err) {
      console.error('Failed to create departure:', err);
      setError(err.response?.data?.message || 'Failed to create departure');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 99999 }}>
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        ></div>
        
        {/* Modal Content */}
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-scale-in" style={{ zIndex: 99999 }}>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10"
          >
            <FaTimes size={24} />
          </button>

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <h2 className="text-2xl font-bold">Create New Group Departure</h2>
            <p className="text-blue-100 mt-1">Set up a new departure for a group tour package</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
                <FaExclamationTriangle className="text-red-600 dark:text-red-400 mt-1 mr-3 flex-shrink-0" />
                <div className="text-red-800 dark:text-red-300">{error}</div>
              </div>
            )}

            {/* Select Package */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Tour Package *
              </label>
              <select
                value={formData.packageId}
                onChange={(e) => handlePackageChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Select a GROUP tour package --</option>
                {groupPackages.map(pkg => (
                  <option key={pkg._id} value={pkg._id}>
                    {pkg.title} ({pkg.defaultDays || 'N/A'} days)
                  </option>
                ))}
              </select>
              {groupPackages.length === 0 && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                  No GROUP packages found. Create a GROUP tour package first.
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Capacity and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Total Seats *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalSeats}
                  onChange={(e) => setFormData({ ...formData, totalSeats: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Price Per Person ($) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pricePerPerson}
                  onChange={(e) => setFormData({ ...formData, pricePerPerson: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Assign Operators */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Assign Operators * (Select at least one)
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50">
                {operators.length > 0 ? (
                  operators.map(op => (
                    <label
                      key={op._id}
                      className="flex items-center p-3 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedOperators.includes(op._id)}
                        onChange={() => handleOperatorToggle(op._id)}
                        className="mr-3 w-5 h-5 text-blue-600"
                      />
                      <div className="flex items-center flex-1">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                          {op.fullName?.charAt(0) || 'O'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {op.fullName || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {op.email}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                    No operators available. Add tour operators first.
                  </p>
                )}
              </div>
              {formData.selectedOperators.length > 0 && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  {formData.selectedOperators.length} operator(s) selected
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-semibold"
              >
                {loading ? 'Creating...' : 'Create Departure'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default CreateDepartureModal;
