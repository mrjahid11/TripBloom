import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlane, FaHeart, FaHistory, FaUser, FaSignOutAlt, FaMapMarkedAlt, FaCalendarAlt, FaStar } from 'react-icons/fa';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  // Get user's name from localStorage or props (to be implemented with auth)
  const userName = localStorage.getItem('userName') || 'Traveler';
  const firstName = userName.split(' ')[0];
  
  const upcomingTrips = [
    {
      destination: 'Paris, France',
      date: 'Dec 15-20, 2025',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
      status: 'Confirmed',
    },
    {
      destination: 'Tokyo, Japan',
      date: 'Jan 5-12, 2026',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
      status: 'Pending',
    },
  ];

  const [savedTours, setSavedTours] = useState([]);

  useEffect(() => {
    const loadSaved = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;
        const res = await fetch(`/api/users/${userId}/saved`);
        const data = await res.json();
        if (data && data.packages) {
          setSavedTours(data.packages.map(p => ({ name: p.title, price: `$${p.basePrice}`, rating: (p.rating || 4.5) })));
        }
      } catch (err) {
        console.error('Failed to load saved tours', err);
      }
    };
    loadSaved();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary via-green-500 to-emerald-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
              >
                Home
              </button>
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, {firstName}! ✈️</h1>
                <p className="text-green-100">Your next adventure awaits</p>
              </div>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('userName');
                localStorage.removeItem('userRole');
                navigate('/');
              }}
              className="flex items-center space-x-2 px-6 py-3 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30 transition-all"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-8 overflow-x-auto pb-2">
          {[
            { icon: FaPlane, label: 'My Trips', active: true, path: '/customer' },
            { icon: FaStar, label: 'My Reviews', active: false, path: '/customer/reviews' },
            { icon: FaHeart, label: 'Saved Tours', active: false, path: '/customer/saved' },
            { icon: FaHistory, label: 'History', active: false, path: '/customer/history' },
            { icon: FaUser, label: 'Profile', active: false, path: '/customer/profile' },
          ].map((tab, index) => (
            <button
              key={index}
              onClick={() => tab.path && navigate(tab.path)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
                tab.active
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md'
              }`}
            >
              <tab.icon />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Upcoming Trips */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <FaCalendarAlt className="mr-3 text-primary" />
            Upcoming Trips
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingTrips.map((trip, index) => (
              <div
                key={index}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-1"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={trip.image}
                    alt={trip.destination}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-2xl font-bold">{trip.destination}</h3>
                    <p className="text-green-200 flex items-center mt-1">
                      <FaCalendarAlt className="mr-2" />
                      {trip.date}
                    </p>
                  </div>
                  <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold ${
                    trip.status === 'Confirmed' ? 'bg-green-500 text-white' : 'bg-yellow-400 text-gray-900'
                  }`}>
                    {trip.status}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex space-x-3">
                    <button className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold">
                      View Details
                    </button>
                    <button className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <FaMapMarkedAlt className="text-primary" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Saved Tours */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <FaHeart className="mr-3 text-red-500" />
            Saved Tours
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {savedTours.map((tour, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{tour.name}</h3>
                  <button className="text-red-500 hover:scale-110 transition-transform">
                    <FaHeart size={20} />
                  </button>
                </div>
                <div className="flex items-center text-yellow-500 mb-3">
                  <FaStar />
                  <span className="ml-2 text-gray-700 dark:text-gray-300 font-semibold">{tour.rating}</span>
                </div>
                <p className="text-2xl font-bold text-primary mb-4">{tour.price}</p>
                <button className="w-full bg-gradient-to-r from-primary to-green-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all">
                  Book Now
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
            <p className="text-blue-100 mb-2">Total Trips</p>
            <p className="text-4xl font-bold">12</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg">
            <p className="text-green-100 mb-2">Countries Visited</p>
            <p className="text-4xl font-bold">8</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg">
            <p className="text-purple-100 mb-2">Rewards Points</p>
            <p className="text-4xl font-bold">2,450</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
