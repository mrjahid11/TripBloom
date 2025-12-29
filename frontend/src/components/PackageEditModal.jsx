import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { FaTimes, FaBox, FaMapMarkerAlt, FaDollarSign, FaClock, FaUsers, FaImage, FaFileAlt, FaPlus, FaTrash } from 'react-icons/fa';

// Destinations Manager Component
const DestinationsManager = ({ destinations, onChange }) => {
  const addDestination = () => {
    onChange([...destinations, { name: '', country: '', city: '', order: destinations.length + 1 }]);
  };

  const removeDestination = (index) => {
    const updated = destinations.filter((_, i) => i !== index);
    // Reorder
    updated.forEach((dest, idx) => {
      dest.order = idx + 1;
    });
    onChange(updated);
  };

  const updateDestination = (index, field, value) => {
    const updated = [...destinations];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Destinations</h3>
        <button
          type="button"
          onClick={addDestination}
          className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
        >
          <FaPlus size={12} />
          <span>Add Destination</span>
        </button>
      </div>

      {destinations.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No destinations added. Click "Add Destination" to add locations.
        </p>
      ) : (
        <div className="space-y-3">
          {destinations.map((dest, index) => (
            <div key={index} className="flex items-start space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {dest.order}
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={dest.name}
                  onChange={(e) => updateDestination(index, 'name', e.target.value)}
                  placeholder="Place Name"
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
                <input
                  type="text"
                  value={dest.city || ''}
                  onChange={(e) => updateDestination(index, 'city', e.target.value)}
                  placeholder="City"
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
                <input
                  type="text"
                  value={dest.country || ''}
                  onChange={(e) => updateDestination(index, 'country', e.target.value)}
                  placeholder="Country"
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => removeDestination(index)}
                className="flex-shrink-0 p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                <FaTrash size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PackageEditModal = ({ isOpen, onClose, package: packageData, onPackageUpdated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'PERSONAL',
    category: 'SILVER',
    basePrice: '',
    defaultDays: '',
    defaultNights: '',
    // Inclusions object
    inclusionsTransport: '',
    inclusionsHotel: '',
    inclusionsMeals: '',
    inclusionsGuide: false,
    // Destinations array (as JSON string for editing)
    destinations: [],
    // Extras array
    extras: '',
    // Photos array
    photos: [],
    isActive: true,
    isInternational: false,
    // Map location
    mapLat: '',
    mapLng: '',
    mapZoom: 12
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (packageData) {
      // Editing existing package
      setFormData({
        title: packageData.title || '',
        description: packageData.description || '',
        type: packageData.type || 'PERSONAL',
        category: packageData.type === 'GROUP' ? '' : (packageData.category || 'SILVER'),
        basePrice: packageData.basePrice || '',
        defaultDays: packageData.defaultDays || '',
        defaultNights: packageData.defaultNights || '',
        inclusionsTransport: packageData.inclusions?.transport || '',
        inclusionsHotel: packageData.inclusions?.hotel || '',
        inclusionsMeals: packageData.inclusions?.meals || '',
        inclusionsGuide: packageData.inclusions?.guide || false,
        destinations: packageData.destinations || [],
        extras: Array.isArray(packageData.extras) ? packageData.extras.join('\n') : '',
        photos: packageData.photos || [],
        isActive: packageData.isActive !== undefined ? packageData.isActive : true,
        isInternational: packageData.isInternational || false,
        mapLat: packageData.mapLocation?.lat || '',
        mapLng: packageData.mapLocation?.lng || '',
        mapZoom: packageData.mapLocation?.zoom || 12
      });
    } else {
      // Creating new package
      setFormData({
        title: '',
        description: '',
        type: 'PERSONAL',
        category: 'SILVER',
        basePrice: '',
        defaultDays: '',
        defaultNights: '',
        inclusionsTransport: '',
        inclusionsHotel: '',
        inclusionsMeals: '',
        inclusionsGuide: false,
        destinations: [],
        extras: '',
        photos: [],
        isActive: true,
        isInternational: false,
        mapLat: '',
        mapLng: '',
        mapZoom: 12
      });
    }
    setError('');
  }, [packageData, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate
      if (!formData.title || !formData.description) {
        setError('Title and description are required');
        setLoading(false);
        return;
      }

      if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
        setError('Valid price is required');
        setLoading(false);
        return;
      }

      if (!formData.defaultDays || parseInt(formData.defaultDays) <= 0) {
        setError('Default days must be at least 1');
        setLoading(false);
        return;
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        basePrice: parseFloat(formData.basePrice),
        defaultDays: parseInt(formData.defaultDays),
        defaultNights: parseInt(formData.defaultNights) || 0,
        inclusions: {
          transport: formData.inclusionsTransport || '',
          hotel: formData.inclusionsHotel || '',
          meals: formData.inclusionsMeals || '',
          guide: formData.inclusionsGuide
        },
        destinations: formData.destinations || [],
        extras: formData.extras.split('\n').filter(e => e.trim()),
        photos: formData.photos || [],
        isActive: formData.isActive,
        isInternational: formData.isInternational
      };

      // Add map location if coordinates are provided
      if (formData.mapLat && formData.mapLng) {
        payload.mapLocation = {
          lat: parseFloat(formData.mapLat),
          lng: parseFloat(formData.mapLng),
          zoom: parseInt(formData.mapZoom) || 12
        };
      }

      // Only include category for PERSONAL type packages
      if (formData.type === 'PERSONAL') {
        payload.category = formData.category;
      }

      if (packageData) {
        // Update existing package
        await axios.put(`/api/admin/packages/${packageData._id}`, payload);
      } else {
        // Create new package
        await axios.post('/api/admin/packages', payload);
      }

      onPackageUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to save package:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to save package. Please try again.');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full my-8 flex flex-col" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-2xl flex items-center justify-between flex-shrink-0">
          <h2 className="text-2xl font-bold flex items-center">
            <FaBox className="mr-3" />
            {packageData ? 'Edit Package' : 'Create New Package'}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Package Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Amazing Bali Adventure"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Base Price (USD) *
              </label>
              <div className="relative">
                <FaDollarSign className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="number"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  placeholder="999.99"
                />
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Package Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              >
                <option value="PERSONAL">Personal Tour</option>
                <option value="GROUP">Group Tour</option>
              </select>
            </div>

            {/* Category - Only for PERSONAL type */}
            {formData.type === 'PERSONAL' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                >
                  <option value="SILVER">Silver</option>
                  <option value="GOLD">Gold</option>
                  <option value="PLATINUM">Platinum</option>
                  <option value="DIAMOND">Diamond</option>
                </select>
              </div>
            )}

            {/* Default Days */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Default Days *
              </label>
              <div className="relative">
                <FaClock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="number"
                  name="defaultDays"
                  value={formData.defaultDays}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  placeholder="7"
                />
              </div>
            </div>

            {/* Default Nights */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Default Nights *
              </label>
              <div className="relative">
                <FaClock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="number"
                  name="defaultNights"
                  value={formData.defaultNights}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  placeholder="6"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              placeholder="Describe the package..."
            />
          </div>

          {/* Inclusions Section */}
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inclusions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Transport */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Transport
                </label>
                <input
                  type="text"
                  name="inclusionsTransport"
                  value={formData.inclusionsTransport}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., AC Vehicle, Airport Transfer"
                />
              </div>

              {/* Hotel */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Hotel/Accommodation
                </label>
                <input
                  type="text"
                  name="inclusionsHotel"
                  value={formData.inclusionsHotel}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 4-Star Hotel, Twin Sharing"
                />
              </div>

              {/* Meals */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Meals
                </label>
                <input
                  type="text"
                  name="inclusionsMeals"
                  value={formData.inclusionsMeals}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Breakfast & Dinner"
                />
              </div>

              {/* Guide */}
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="inclusionsGuide"
                    checked={formData.inclusionsGuide}
                    onChange={handleChange}
                    className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Professional Tour Guide Included
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Destinations Section */}
          <DestinationsManager 
            destinations={formData.destinations}
            onChange={(newDestinations) => setFormData(prev => ({ ...prev, destinations: newDestinations }))}
          />

          {/* Extras */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Extras (one per line)
            </label>
            <textarea
              name="extras"
              value={formData.extras}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              placeholder="Photo Album&#10;Welcome Drink&#10;Souvenir T-shirt"
            />
          </div>

          {/* Photos Section */}
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FaImage className="text-blue-500" />
                Package Photos (Optional)
              </h3>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, photos: [...prev.photos, ''] }))}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <FaPlus size={12} />
                <span>Add Photo URL</span>
              </button>
            </div>

            {formData.photos.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No photos added. Click "Add Photo URL" to add images.
              </p>
            ) : (
              <div className="space-y-3">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="url"
                        value={photo}
                        onChange={(e) => {
                          const newPhotos = [...formData.photos];
                          newPhotos[index] = e.target.value;
                          setFormData(prev => ({ ...prev, photos: newPhotos }));
                        }}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {photo && (
                      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                        <img
                          src={photo}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const newPhotos = formData.photos.filter((_, i) => i !== index);
                        setFormData(prev => ({ ...prev, photos: newPhotos }));
                      }}
                      className="flex-shrink-0 p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              💡 Tip: Use high-quality images from URLs. Recommended size: 800x500px or similar aspect ratio.
            </p>
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
              />
              <div className="ml-3">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Active Package
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Inactive packages won't be visible to customers
                </p>
              </div>
            </label>
          </div>

          {/* International Package */}
          <div>
            <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input
                type="checkbox"
                name="isInternational"
                checked={formData.isInternational}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="ml-3">
                <span className="font-semibold text-gray-900 dark:text-white">
                  International Package ✈️
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Check if this is an international tour (requires KYC for booking)
                </p>
              </div>
            </label>
          </div>

          {/* Map Location */}
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FaMapMarkerAlt className="mr-2 text-red-500" />
              Map Location (Optional)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Add coordinates to show this package location on the map. Customers can view it by clicking the map button.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  name="mapLat"
                  value={formData.mapLat}
                  onChange={handleChange}
                  step="any"
                  placeholder="e.g., 23.8103"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  name="mapLng"
                  value={formData.mapLng}
                  onChange={handleChange}
                  step="any"
                  placeholder="e.g., 90.4125"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Zoom Level
                </label>
                <input
                  type="number"
                  name="mapZoom"
                  value={formData.mapZoom}
                  onChange={handleChange}
                  min="1"
                  max="18"
                  placeholder="12"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              💡 Tip: You can find coordinates using <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Maps</a>. Right-click on a location and copy the coordinates.
            </p>
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
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (packageData ? 'Update Package' : 'Create Package')}
            </button>
          </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default PackageEditModal;
