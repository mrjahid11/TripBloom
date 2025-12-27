import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaSave, FaToggleOn, FaToggleOff, FaStar, FaCalendarAlt } from 'react-icons/fa';

const OperatorProfile = () => {
  const operatorId = localStorage.getItem('userId');
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    languages: '',
    bio: '',
    availability: 'AVAILABLE'
  });
  const [stats, setStats] = useState({
    completedTours: 0,
    totalTravelers: 0,
    rating: 0,
    totalReviews: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [operatorId]);

  const fetchProfile = async () => {
    try {
      console.log('Fetching profile for operatorId:', operatorId);
      
      if (!operatorId) {
        console.error('No operatorId found in localStorage');
        alert('No operator ID found. Please log in again.');
        setLoading(false);
        return;
      }
      
      const res = await fetch(`/api/operator/${operatorId}/dashboard`);
      console.log('API Response status:', res.status, res.statusText);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', errorText);
        throw new Error('Failed to fetch profile');
      }
      
      const data = await res.json();
      
      console.log('Dashboard API Response:', data);
      console.log('Profile data:', data.profile);
      console.log('Profile keys:', data.profile ? Object.keys(data.profile) : 'NO PROFILE');
      
      // Only fetch existing fields from database (fullName, email, phone)
      if (data.profile) {
        const profileData = {
          fullName: data.profile.fullName || '',
          email: data.profile.email || '',
          phone: data.profile.phone || '',
          address: '', // Keep blank for now
          languages: '', // Keep blank for now
          bio: '', // Keep blank for now
          availability: 'AVAILABLE' // Default value, not stored in DB yet
        };
        
        console.log('Setting profile state:', profileData);
        setProfile(profileData);
      } else {
        console.error('No profile data received from API');
        alert('No profile data found for this operator. API returned: ' + JSON.stringify(data));
      }

      // Calculate stats from departures
      const completedCount = (data.groupDepartures || []).filter(d => 
        new Date(d.endDate) < new Date()
      ).length;
      
      const totalTravelers = (data.groupDepartures || []).reduce((sum, d) => 
        sum + (d.bookedSeats || 0), 0
      );

      setStats({
        completedTours: completedCount,
        totalTravelers: totalTravelers,
        rating: 0, // Not stored in DB yet
        totalReviews: 0 // Not stored in DB yet
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('Error loading profile: ' + error.message);
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const toggleAvailability = () => {
    const newStatus = profile.availability === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
    setProfile({ ...profile, availability: newStatus });
  };

  const handleSave = async () => {
    setSaving(true);
    
    // For now, just show a message that only basic info is editable
    // In future, this will save to database when new fields are added to schema
    alert('ℹ️ Currently only viewing profile data from database.\nFull edit functionality will be enabled when additional fields are added to the database schema.');
    
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <FaUser className="mr-3 text-orange-600" />
          Operator Profile
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Card */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <h2 className="text-xl font-bold mb-6">Performance Stats</h2>
          
          <div className="space-y-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-100">Completed Tours</p>
                  <p className="text-3xl font-bold">{stats.completedTours}</p>
                </div>
                <FaCalendarAlt className="text-4xl text-white/50" />
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-100">Total Travelers</p>
                  <p className="text-3xl font-bold">{stats.totalTravelers}</p>
                </div>
                <FaUser className="text-4xl text-white/50" />
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-100">Rating</p>
                  <p className="text-3xl font-bold flex items-center">
                    {stats.rating} <FaStar className="ml-2 text-yellow-300" />
                  </p>
                  <p className="text-xs text-orange-100">{stats.totalReviews} reviews</p>
                </div>
                <FaStar className="text-4xl text-white/50" />
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contact Information</h2>
          
          
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <div className="relative">
                  <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+1234567890"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Address <span className="text-xs text-gray-500">(Not in database yet)</span>
              </label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
                <textarea
                  value={profile.address}
                  placeholder="This field will be available when added to database schema"
                  rows="2"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                  disabled
                ></textarea>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Languages <span className="text-xs text-gray-500">(Not in database yet)</span>
              </label>
              <input
                type="text"
                value={profile.languages}
                placeholder="This field will be available when added to database schema"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Bio / About Me <span className="text-xs text-gray-500">(Not in database yet)</span>
              </label>
              <textarea
                value={profile.bio}
                rows="4"
                placeholder="This field will be available when added to database schema"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                disabled
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      {/* Availability Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Availability Status</h2>
        
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Current Status: 
              <span className={`ml-3 ${profile.availability === 'AVAILABLE' ? 'text-green-600' : 'text-red-600'}`}>
                {profile.availability === 'AVAILABLE' ? 'AVAILABLE' : 'UNAVAILABLE'}
              </span>
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {profile.availability === 'AVAILABLE' 
                ? 'You are available for new tour assignments'
                : 'You are currently unavailable for new assignments'
              }
            </p>
          </div>
          
          <button
            onClick={toggleAvailability}
            className={`flex items-center px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
              profile.availability === 'AVAILABLE'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {profile.availability === 'AVAILABLE' ? (
              <>
                <FaToggleOn className="mr-3 text-2xl" />
                Available
              </>
            ) : (
              <>
                <FaToggleOff className="mr-3 text-2xl" />
                Unavailable
              </>
            )}
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            ℹ️ <strong>Note:</strong> Availability status is not yet stored in database. When implemented, marking as unavailable will prevent new tour assignments.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaSave className="mr-3" />
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
};

export default OperatorProfile;
