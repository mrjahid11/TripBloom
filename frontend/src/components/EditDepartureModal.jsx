import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const EditDepartureModal = ({ isOpen, onClose, departure, onDepartureUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    totalSeats: 40,
    pricePerPerson: '',
    status: 'OPEN'
  });

  useEffect(() => {
    if (isOpen && departure) {
      setFormData({
        startDate: departure.startDate ? new Date(departure.startDate).toISOString().split('T')[0] : '',
        endDate: departure.endDate ? new Date(departure.endDate).toISOString().split('T')[0] : '',
        totalSeats: departure.totalSeats || 40,
        pricePerPerson: departure.pricePerPerson || '',
        status: departure.status || 'OPEN'
      });
      setError('');
    }
  }, [isOpen, departure]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
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
    if (formData.totalSeats < departure.bookedSeats) {
      setError(`Total seats cannot be less than booked seats (${departure.bookedSeats})`);
      return;
    }
    if (!formData.pricePerPerson || formData.pricePerPerson < 0) {
      setError('Please enter a valid price per person');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalSeats: parseInt(formData.totalSeats),
        pricePerPerson: parseFloat(formData.pricePerPerson),
        status: formData.status
      };

      await axios.put(`/api/admin/group-departures/${departure._id}`, updateData);

      if (onDepartureUpdated) {
        onDepartureUpdated();
      }

      onClose();
    } catch (err) {
      console.error('Failed to update departure:', err);
      setError(err.response?.data?.message || 'Failed to update departure');
    }
    setLoading(false);
  };

  if (!isOpen || !departure) return null;

  const modalContent = (
    <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 99999 }}>
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        ></div>
        
        {/* Modal Content */}
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in" style={{ zIndex: 99999 }}>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10"
          >
            <FaTimes size={24} />
          </button>

          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
            <h2 className="text-2xl font-bold">Edit Departure</h2>
            <p className="text-green-100 mt-1">{departure.packageId?.title || 'Tour Package'}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
                <FaExclamationTriangle className="text-red-600 dark:text-red-400 mt-1 mr-3 flex-shrink-0" />
                <div className="text-red-800 dark:text-red-300">{error}</div>
              </div>
            )}

            {/* Package Info (Read-only) */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Package</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {departure.packageId?.title || 'Unknown Package'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {departure.packageId?.defaultDays || 'N/A'} days trip
              </div>
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
                {departure.bookedSeats > 0 && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                    {departure.bookedSeats} seats already booked
                  </p>
                )}
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

            {/* Status */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="OPEN">Open</option>
                <option value="FULL">Full</option>
                <option value="CLOSED">Closed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-semibold"
              >
                {loading ? 'Updating...' : 'Update Departure'}
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

export default EditDepartureModal;
