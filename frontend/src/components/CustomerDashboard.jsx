import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlane, FaHeart, FaHistory, FaUser, FaSignOutAlt, FaMapMarkedAlt, FaCalendarAlt, FaStar, FaBell, FaCheckCircle, FaTimesCircle, FaClock, FaDollarSign, FaComments } from 'react-icons/fa';
import Bookings from './Bookings';
import { useAuth } from '../context/AuthContext';
import CustomerPackageModal from './CustomerPackageModal';
import MapModal from './MapModal';
import BookingDetailModal from './BookingDetailModal';
import OperatorChatModal from './OperatorChatModal';
import NotificationCenter from './NotificationCenter';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  // Get user's name from auth context or localStorage
  const { user, logout } = useAuth();
  const userName = (user && user.name) || localStorage.getItem('userName') || 'Traveler';
  const firstName = userName.split(' ')[0];
  const [upcomingTrips, setUpcomingTrips] = React.useState([]);
  const [loadingTrips, setLoadingTrips] = React.useState(true);
  const [packageModalOpen, setPackageModalOpen] = React.useState(false);
  const [packageModalData, setPackageModalData] = React.useState(null);
  const [packageModalTab, setPackageModalTab] = React.useState('overview');
  const [mapOpen, setMapOpen] = React.useState(false);
  const [mapCoords, setMapCoords] = React.useState(null);
  const [mapTitle, setMapTitle] = React.useState('');
  const [bookingModalOpen, setBookingModalOpen] = React.useState(false);
  const [bookingModalData, setBookingModalData] = React.useState(null);
  const [tripsError, setTripsError] = React.useState(null);
  const [chatModalOpen, setChatModalOpen] = React.useState(false);
  const [chatBooking, setChatBooking] = React.useState(null);
  const [chatOperator, setChatOperator] = React.useState(null);
  const [stats, setStats] = React.useState({
    totalTrips: 0,
    countriesVisited: 0,
    rewardPoints: 0
  });

  React.useEffect(() => {
    const load = async () => {
      const userId = (user && user.id) || localStorage.getItem('userId');
      if (!userId) {
        setUpcomingTrips([]);
        setLoadingTrips(false);
        return;
      }

      setLoadingTrips(true);
      setTripsError(null);
      try {
        const res = await fetch(`/api/bookings?customerId=${userId}`);
        if (!res.ok) {
          const text = await res.text();
          console.error('Dashboard bookings fetch error', res.status, text);
          setTripsError(`HTTP ${res.status}`);
          setUpcomingTrips([]);
          setLoadingTrips(false);
          return;
        }
        const data = await res.json();
        console.debug('[CustomerDashboard] bookings API response:', data);
        let bookings = [];
        if (Array.isArray(data)) bookings = data;
        else if (data && data.success && data.bookings) bookings = data.bookings;
        else if (data && data.message) setTripsError(data.message);

        // Filter upcoming (startDate in future) and non-cancelled
        const now = new Date();
        const upcoming = bookings.filter(b => {
          const sd = b.startDate ? new Date(b.startDate) : null;
          return b.status !== 'CANCELLED' && (!sd || sd >= now) ;
        }).map(b => ({
          id: b._id || b.id,
          // backend populates package under `packageId`
          destination: b.packageId?.destination || b.packageId?.title || b.package?.destination || b.package?.title || b.packageTitle || 'Package',
          startDate: b.startDate,
          endDate: b.endDate,
          dateLabel: b.startDate ? `${new Date(b.startDate).toLocaleDateString()}${b.endDate ? ' - ' + new Date(b.endDate).toLocaleDateString() : ''}` : 'TBD',
          image: b.packageId?.photos?.[0] || b.package?.image || `https://source.unsplash.com/featured/?${encodeURIComponent((b.packageId?.destination || b.package?.destination || 'travel'))}`,
          status: b.status || 'PENDING',
          booking: b
        }));

        setUpcomingTrips(upcoming);
        console.debug('[CustomerDashboard] mapped upcomingTrips:', upcoming);
        console.debug('[CustomerDashboard] bookings with assignedOperator check:', 
          upcoming.map(t => ({
            id: t.id,
            hasOperator: !!t.booking?.assignedOperator,
            operator: t.booking?.assignedOperator
          }))
        );
        
        // Calculate stats from bookings
        const totalTrips = bookings.filter(b => b.status === 'COMPLETED').length;
        
        // Get unique countries from completed bookings
        const countries = new Set();
        bookings.filter(b => b.status === 'COMPLETED').forEach(b => {
          const destinations = b.packageId?.destinations || b.package?.destinations || [];
          destinations.forEach(dest => {
            if (dest.country) countries.add(dest.country);
          });
        });
        
        setStats(prev => ({
          ...prev,
          totalTrips,
          countriesVisited: countries.size
        }));
      } catch (err) {
        console.error('Dashboard bookings error', err);
        setTripsError('Failed to load trips');
        setUpcomingTrips([]);
      }
      setLoadingTrips(false);
    };
    load();
  }, [user]);

  // Fetch user reward points
  React.useEffect(() => {
    const fetchRewardPoints = async () => {
      const userId = (user && user.id) || localStorage.getItem('userId');
      console.log('[CustomerDashboard] Fetching reward points for userId:', userId);
      if (userId) {
        try {
          const res = await fetch(`/api/users/${userId}`);
          const data = await res.json();
          console.log('[CustomerDashboard] User data response:', data);
          if (data.success && data.user) {
            console.log('[CustomerDashboard] Setting reward points:', data.user.rewardPoints);
            setStats(prev => ({
              ...prev,
              rewardPoints: data.user.rewardPoints || 0
            }));
          }
        } catch (err) {
          console.error('Failed to fetch reward points:', err);
        }
      }
    };
    fetchRewardPoints();
  }, [user]);

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
            <div className="flex items-center space-x-4">
              <NotificationCenter
                userId={(user && user.id) || localStorage.getItem('userId')}
                userRole="CUSTOMER"
                onOpenChat={(booking, operator) => {
                  setChatBooking(booking);
                  setChatOperator(operator);
                  setChatModalOpen(true);
                }}
              />
              <button 
                onClick={() => {
                  logout();
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
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-8 overflow-x-auto pb-2">
          {[
            { icon: FaPlane, label: 'My Trips', active: true, path: '/customer' },
            { icon: FaStar, label: 'My Reviews', active: false, path: '/customer/reviews' },
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
            {loadingTrips ? (
              <p>Loading upcoming trips…</p>
            ) : tripsError ? (
              <p className="text-red-600">{tripsError}</p>
            ) : upcomingTrips.length === 0 ? (
              <p className="text-gray-600">You have no upcoming trips.</p>
            ) : (
              upcomingTrips.map((trip, index) => (
                <div
                  key={trip.id || index}
                  className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-1"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={trip.image || `https://source.unsplash.com/featured/?${encodeURIComponent(trip.destination || 'travel')}`}
                      alt={trip.destination}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://source.unsplash.com/featured/?${encodeURIComponent(trip.destination || 'travel')}`; }}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-2xl font-bold">{trip.destination}</h3>
                      <p className="text-green-200 flex items-center mt-1">
                        <FaCalendarAlt className="mr-2" />
                        {trip.dateLabel}
                      </p>
                    </div>
                    <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold ${
                      (trip.status && trip.status.toString().toUpperCase() === 'CONFIRMED') ? 'bg-green-500 text-white' : 'bg-yellow-400 text-gray-900'
                    }`}>
                      {trip.status}
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          // open package detail modal (prefer populated packageId)
                          const pkg = trip.booking?.packageId || trip.booking?.package || trip;
                          setPackageModalData(pkg);
                          setPackageModalTab('overview');
                          setPackageModalOpen(true);
                        }}
                        className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          console.log('Chat button clicked, booking:', trip.booking);
                          console.log('Assigned operator:', trip.booking?.assignedOperator);
                          if (!trip.booking?.assignedOperator) {
                            alert('No operator assigned to this tour yet. Please contact support.');
                            return;
                          }
                          setChatBooking(trip.booking);
                          setChatOperator(trip.booking.assignedOperator);
                          setChatModalOpen(true);
                        }}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                          trip.booking?.assignedOperator 
                            ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                            : 'bg-gray-300 hover:bg-gray-400 text-gray-600 cursor-not-allowed'
                        }`}
                        title={trip.booking?.assignedOperator ? 'Chat with Tour Operator' : 'No operator assigned yet'}
                      >
                        <FaComments />
                      </button>
                      <button
                        onClick={() => {
                          // attempt to open a map view focused on package coordinates
                          const pkg = trip.booking?.packageId || trip.booking?.package || trip;
                          console.log('[Map Button] Package data:', pkg);
                          console.log('[Map Button] Destinations:', pkg.destinations);
                          
                          // Fallback coordinates for common Bangladesh destinations
                          const destinationCoords = {
                            'sajek valley': { lat: 23.3817, lng: 92.2938, zoom: 13 },
                            'bandarban': { lat: 22.1953, lng: 92.2184, zoom: 12 },
                            'cox\'s bazar': { lat: 21.4272, lng: 92.0058, zoom: 12 },
                            'coxs bazar': { lat: 21.4272, lng: 92.0058, zoom: 12 },
                            'rangamati': { lat: 22.6533, lng: 92.1753, zoom: 12 },
                            'sylhet': { lat: 24.8949, lng: 91.8687, zoom: 12 },
                            'sundarbans': { lat: 21.9497, lng: 89.1833, zoom: 11 },
                            'kuakata': { lat: 21.8167, lng: 90.1167, zoom: 13 },
                            'srimangal': { lat: 24.3065, lng: 91.7296, zoom: 13 },
                            'saint martin': { lat: 20.6274, lng: 92.3233, zoom: 14 },
                            'dhaka': { lat: 23.8103, lng: 90.4125, zoom: 11 }
                          };
                          
                          // Try to find coordinates from destinations array
                          let coords = null;
                          if (pkg.destinations && Array.isArray(pkg.destinations)) {
                            // Look for main destination (skip first if it's departure city like Dhaka)
                            const mainDest = pkg.destinations.find((d, idx) => idx > 0 && d.name) || pkg.destinations[0];
                            if (mainDest && mainDest.name) {
                              const destName = mainDest.name.toLowerCase();
                              const cityName = mainDest.city?.toLowerCase();
                              
                              // Try exact match first
                              coords = destinationCoords[destName] || destinationCoords[cityName];
                              
                              // Try partial match
                              if (!coords) {
                                for (const [key, value] of Object.entries(destinationCoords)) {
                                  if (destName.includes(key) || key.includes(destName) || 
                                      (cityName && (cityName.includes(key) || key.includes(cityName)))) {
                                    coords = value;
                                    break;
                                  }
                                }
                              }
                              
                              if (coords) {
                                coords.label = mainDest.name;
                              }
                            }
                          }
                          
                          console.log('[Map Button] Found coords:', coords);
                          if (coords) {
                            setMapCoords(coords);
                            setMapTitle(coords.label || pkg.title || trip.destination || 'Location');
                            setMapOpen(true);
                            return;
                          }

                          console.log('[Map Button] No coords found, opening package modal');
                          // fallback: open the package modal on destinations tab
                          setPackageModalData(pkg);
                          setPackageModalTab('destinations');
                          setPackageModalOpen(true);
                        }}
                        className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <FaMapMarkedAlt className="text-primary" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {packageModalOpen && packageModalData && (
          <CustomerPackageModal
            isOpen={packageModalOpen}
            onClose={() => setPackageModalOpen(false)}
            packageData={packageModalData}
            initialTab={packageModalTab}
          />
        )}

        {bookingModalOpen && bookingModalData && (
          <BookingDetailModal booking={bookingModalData} onClose={() => setBookingModalOpen(false)} onUpdate={(u) => {}} />
        )}

        {mapOpen && (
          <MapModal isOpen={mapOpen} onClose={() => setMapOpen(false)} coords={mapCoords} title={mapTitle} />
        )}

        {chatModalOpen && chatBooking && (
          <OperatorChatModal
            isOpen={chatModalOpen}
            onClose={() => {
              setChatModalOpen(false);
              setChatBooking(null);
              setChatOperator(null);
            }}
            booking={chatBooking}
            operator={chatOperator}
          />
        )}

        {/* Bookings (from backend) */}
        <Bookings />

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
            <p className="text-4xl font-bold">{stats.totalTrips}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg">
            <p className="text-green-100 mb-2">Countries Visited</p>
            <p className="text-4xl font-bold">{stats.countriesVisited}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg">
            <p className="text-purple-100 mb-2">Rewards Points</p>
            <p className="text-4xl font-bold">{stats.rewardPoints.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
