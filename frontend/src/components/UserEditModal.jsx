import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { FaTimes, FaUser, FaEnvelope, FaPhone, FaKey, FaUserShield, FaCheck } from 'react-icons/fa';

const UserEditModal = ({ isOpen, onClose, user, onUserUpdated }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    roles: [],
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      // Editing existing user - normalize roles to uppercase for UI consistency
      const normalizedRoles = (user.roles || ['CUSTOMER']).map(role => role.toUpperCase());
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '', // Don't populate password for security
        roles: normalizedRoles,
        isActive: user.isActive !== undefined ? user.isActive : true
      });
    } else {
      // Adding new user
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        roles: ['CUSTOMER'],
        isActive: true
      });
    }
    setError('');
  }, [user, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleRole = (role) => {
    setFormData(prev => {
      // Normalize role to uppercase for consistent comparison
      const normalizedRole = role.toUpperCase();
      
      // Check if role exists (case-insensitive)
      const hasRole = prev.roles.some(r => r.toUpperCase() === normalizedRole);
      
      const roles = hasRole
        ? prev.roles.filter(r => r.toUpperCase() !== normalizedRole)
        : [...prev.roles, normalizedRole];
      
      // Ensure at least one role is selected
      return {
        ...prev,
        roles: roles.length > 0 ? roles : prev.roles
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate
      if (!formData.fullName || !formData.email) {
        setError('Name and email are required');
        setLoading(false);
        return;
      }

      if (!user && !formData.password) {
        setError('Password is required for new users');
        setLoading(false);
        return;
      }

      if (formData.roles.length === 0) {
        setError('At least one role must be selected');
        setLoading(false);
        return;
      }

      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        roles: formData.roles,
        isActive: formData.isActive
      };

      // Only include password if it's provided
      if (formData.password) {
        payload.password = formData.password;
      }

      if (user) {
        // Update existing user
        await axios.put(`/api/admin/users/${user._id}`, payload);
      } else {
        // Create new user
        await axios.post('/api/admin/users', payload);
      }

      onUserUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to save user:', err);
      setError(err.response?.data?.message || 'Failed to save user. Please try again.');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <h2 className="text-2xl font-bold flex items-center">
            <FaUser className="mr-3" />
            {user ? 'Edit User' : 'Add New User'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Full Name *
            </label>
            <div className="relative">
              <FaUser className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full name"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="user@example.com"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <FaPhone className="absolute left-3 top-3 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="+1234567890"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Password {!user && '*'}
            </label>
            <div className="relative">
              <FaKey className="absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!user}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder={user ? "Leave blank to keep current" : "Enter password"}
              />
            </div>
            {user && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave blank to keep current password
              </p>
            )}
          </div>

          {/* Roles */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              User Roles * (Select at least one)
            </label>
            <div className="space-y-2">
              {['CUSTOMER', 'TOUR_OPERATOR', 'ADMIN'].map(role => (
                <label
                  key={role}
                  className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={formData.roles.some(r => r.toUpperCase() === role.toUpperCase())}
                    onChange={() => toggleRole(role)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      {formData.roles.some(r => r.toUpperCase() === role.toUpperCase()) && (
                        <FaCheck className="mr-2 text-green-600 dark:text-green-400" />
                      )}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {role === 'TOUR_OPERATOR' ? 'Tour Operator' : role.charAt(0) + role.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {role === 'CUSTOMER' && 'Can book tours and manage their bookings'}
                      {role === 'TOUR_OPERATOR' && 'Can manage tour operations and departures'}
                      {role === 'ADMIN' && 'Full system access and management capabilities'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="ml-3">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Active Account
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Inactive accounts cannot login to the system
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
            </button>
          </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default UserEditModal;
