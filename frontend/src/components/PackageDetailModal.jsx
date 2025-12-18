import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { 
  FaTimes, FaMapMarkerAlt, FaStar, FaDollarSign, FaCalendarAlt, 
  FaUsers, FaBed, FaUtensils, FaCar, FaUserTie, FaClock, FaRoute,
  FaExclamationTriangle, FaPercentage, FaChartLine
} from 'react-icons/fa';

const PackageDetailModal = ({ isOpen, onClose, packageData, onEdit }) => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, destinations, bookings, departures
  const [bookings, setBookings] = useState([]);
  const [departures, setDepartures] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && packageData) {
      if (activeTab === 'bookings') {
        fetchBookings();
      } else if (activeTab === 'departures' && packageData.type === 'GROUP') {
        fetchDepartures();
      }
    }
  }, [isOpen, packageData, activeTab]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/bookings', {
        params: { packageId: packageData._id }
      });
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      // Use mock data for demo if endpoint doesn't exist
      setBookings([]);
    }
    setLoading(false);
  };

  const fetchDepartures = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/group-departures', {
        params: { packageId: packageData._id }
      });
      setDepartures(res.data.departures || []);
    } catch (err) {
      console.error('Failed to fetch departures:', err);
    }
    setLoading(false);
  };

  if (!isOpen || !packageData) return null;

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
      CLOSED: 'text-gray-600 bg-gray-100 dark:bg-gray-900/20',
      PENDING: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
      CONFIRMED: 'text-green-600 bg-green-100 dark:bg-green-900/20',
      COMPLETED: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  // Check if package has active bookings
  const activeBookingsCount = bookings.filter(b => 
    ['PENDING', 'CONFIRMED'].includes(b.status)
  ).length;

  // Calculate profit margin (mock calculation)
  const calculateMargin = () => {
    const estimatedCost = packageData.basePrice * 0.7; // Assume 70% cost
    const margin = ((packageData.basePrice - estimatedCost) / packageData.basePrice * 100).toFixed(1);
    return parseFloat(margin);
  };

  const profitMargin = calculateMargin();
  const isLowMargin = profitMargin < 20;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaChartLine },
    { id: 'destinations', label: 'Destinations', icon: FaMapMarkerAlt },
    { id: 'bookings', label: 'Bookings', icon: FaUsers, badge: bookings.length },
  ];

  if (packageData.type === 'GROUP') {
    tabs.push({ 
      id: 'departures', 
      label: 'Group Departures', 
      icon: FaCalendarAlt, 
      badge: departures.length 
    });
  }

  const modalContent = (
    <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 99999 }}>
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        ></div>
        
        {/* Modal Content */}
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-scale-in" style={{ zIndex: 99999 }}>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10"
          >
            <FaTimes size={24} />
          </button>

          {/* Header */}
          <div className={`p-8 text-white ${
            packageData.type === 'GROUP' 
              ? 'bg-gradient-to-r from-blue-600 to-blue-700' 
              : 'bg-gradient-to-r from-purple-600 to-purple-700'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">{packageData.title}</h2>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="px-3 py-1 bg-white/20 rounded-full">
                    {packageData.type}
                  </span>
                  {packageData.category && (
                    <span className="px-3 py-1 bg-white/20 rounded-full">
                      {packageData.category}
                    </span>
                  )}
                  <span className="flex items-center">
                    <FaClock className="mr-1" />
                    {packageData.defaultDays}D/{packageData.defaultNights}N
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90">Base Price</div>
                <div className="text-4xl font-bold">${packageData.basePrice?.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Warnings Banner */}
          {(activeBookingsCount > 0 || isLowMargin) && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 p-4">
              {activeBookingsCount > 0 && (
                <div className="flex items-start text-yellow-800 dark:text-yellow-300 mb-2">
                  <FaExclamationTriangle className="mt-1 mr-2 flex-shrink-0" />
                  <div className="text-sm">
                    <strong>Warning:</strong> This package has {activeBookingsCount} active booking(s). 
                    Changes will only apply to future bookings after today's date.
                  </div>
                </div>
              )}
              {isLowMargin && (
                <div className="flex items-start text-orange-800 dark:text-orange-300">
                  <FaPercentage className="mt-1 mr-2 flex-shrink-0" />
                  <div className="text-sm">
                    <strong>Low Margin Alert:</strong> Profit margin is {profitMargin}% 
                    (below 20% threshold). Consider reviewing pricing or discounts.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex space-x-1 px-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 font-semibold border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary bg-white dark:bg-gray-800'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <tab.icon />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8 max-h-[60vh] overflow-y-auto">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Description</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {packageData.description || 'No description available.'}
                  </p>
                </div>

                {/* Inclusions */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Inclusions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {packageData.inclusions?.transport && (
                      <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <FaCar className="text-blue-600 dark:text-blue-400 text-xl mt-1" />
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">Transport</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{packageData.inclusions.transport}</div>
                        </div>
                      </div>
                    )}
                    {packageData.inclusions?.hotel && (
                      <div className="flex items-start space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <FaBed className="text-purple-600 dark:text-purple-400 text-xl mt-1" />
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">Hotel</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{packageData.inclusions.hotel}</div>
                        </div>
                      </div>
                    )}
                    {packageData.inclusions?.meals && (
                      <div className="flex items-start space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <FaUtensils className="text-orange-600 dark:text-orange-400 text-xl mt-1" />
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">Meals</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{packageData.inclusions.meals}</div>
                        </div>
                      </div>
                    )}
                    {packageData.inclusions?.guide && (
                      <div className="flex items-start space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <FaUserTie className="text-green-600 dark:text-green-400 text-xl mt-1" />
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">Tour Guide</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Professional guide included</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Extras */}
                {packageData.extras && packageData.extras.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Extras</h3>
                    <div className="flex flex-wrap gap-2">
                      {packageData.extras.map((extra, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                        >
                          {extra}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                      {packageData.bookingsCount || 0}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-400">Total Bookings</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
                      {packageData.avgRating || 0} <FaStar className="inline text-yellow-500" />
                    </div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-400">Avg Rating</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-900 dark:text-green-300">
                      {profitMargin}%
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-400">Profit Margin</div>
                  </div>
                </div>
              </div>
            )}

            {/* Destinations Tab */}
            {activeTab === 'destinations' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Trip Timeline</h3>
                {packageData.destinations && packageData.destinations.length > 0 ? (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary to-green-300"></div>
                    
                    <div className="space-y-6">
                      {packageData.destinations
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((dest, index) => (
                          <div key={index} className="relative pl-16">
                            {/* Timeline dot */}
                            <div className="absolute left-3 top-3 w-6 h-6 bg-primary rounded-full border-4 border-white dark:border-gray-800 shadow-lg flex items-center justify-center text-white text-xs font-bold">
                              {dest.order || index + 1}
                            </div>
                            
                            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                    {dest.name}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <FaMapMarkerAlt className="inline mr-1" />
                                    {dest.city && `${dest.city}, `}{dest.country}
                                  </p>
                                </div>
                                <span className="px-3 py-1 bg-primary text-white rounded-full text-xs font-semibold">
                                  Day {dest.order || index + 1}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No destinations configured
                  </div>
                )}
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Package Bookings</h3>
                {loading ? (
                  <div className="text-center py-8 text-primary">Loading bookings...</div>
                ) : bookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Booking ID</th>
                          <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Customer</th>
                          <th className="text-center py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Travelers</th>
                          <th className="text-center py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Start Date</th>
                          <th className="text-center py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                          <th className="text-center py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => (
                          <tr key={booking._id} className="border-b border-gray-100 dark:border-gray-700">
                            <td className="py-3 px-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                              #{booking._id.slice(-6)}
                            </td>
                            <td className="py-3 px-3 text-sm text-gray-900 dark:text-white">
                              {booking.customerId?.fullName || 'N/A'}
                            </td>
                            <td className="py-3 px-3 text-center text-sm text-gray-900 dark:text-white">
                              {booking.numTravelers}
                            </td>
                            <td className="py-3 px-3 text-center text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(booking.startDate)}
                            </td>
                            <td className="py-3 px-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                              ${booking.totalAmount?.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                                {booking.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No bookings found for this package
                  </div>
                )}
              </div>
            )}

            {/* Group Departures Tab */}
            {activeTab === 'departures' && packageData.type === 'GROUP' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Group Departures</h3>
                {loading ? (
                  <div className="text-center py-8 text-primary">Loading departures...</div>
                ) : departures.length > 0 ? (
                  <div className="space-y-3">
                    {departures.map((departure) => (
                      <div
                        key={departure._id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <FaCalendarAlt className="text-primary" />
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatDate(departure.startDate)} - {formatDate(departure.endDate)}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 space-x-4">
                            <span>
                              Seats: {departure.bookedSeats}/{departure.totalSeats}
                            </span>
                            <span>
                              Operators: {departure.operators?.length || 0}
                            </span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(departure.status)}`}>
                          {departure.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No group departures scheduled
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 dark:bg-gray-900 px-8 py-4 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-semibold"
            >
              Close
            </button>
            <button
              onClick={() => {
                if (onEdit) {
                  onEdit(packageData);
                }
              }}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Edit Package
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default PackageDetailModal;
