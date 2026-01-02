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
import AnnouncementBanner from './AnnouncementBanner';
import AdminChat from './AdminChat';
import ReviewModal from './ReviewModal';

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
  const [reviewModalOpen, setReviewModalOpen] = React.useState(false);
  const [reviewTargetBooking, setReviewTargetBooking] = React.useState(null);
  const [reviewedPackages, setReviewedPackages] = React.useState(new Set());
  const [showSupportChat, setShowSupportChat] = React.useState(false);
  const [stats, setStats] = React.useState({
    totalTrips: 0,
    countriesVisited: 0,
    rewardPoints: 0
  });

  const checkPaymentStatus = (booking) => {
    const totalPaid = (booking.payments || []).filter(p => 
      p.status === 'SUCCESS' || p.status === 'COMPLETED' || p.status === 'CONFIRMED'
    ).reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalAmount = booking.totalAmount || booking.amount || 0;
    const isPaid = totalPaid >= totalAmount;
    const startDate = booking.startDate ? new Date(booking.startDate) : null;
    const now = new Date();
    const daysUntilStart = startDate ? Math.ceil((startDate - now) / (1000 * 60 * 60 * 24)) : null;
    return { totalPaid, totalAmount, isPaid, daysUntilStart, startDate };
  };

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

        // Filter upcoming and ongoing (include bookings where endDate is today or later)
        const now = new Date();
        const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const upcoming = bookings.filter(b => {
          const st = (b.status || '').toString().toUpperCase();
          if (st === 'CANCELLED' || st === 'COMPLETED') return false;
          const sd = b.startDate ? new Date(b.startDate) : null;
          const ed = b.endDate ? new Date(b.endDate) : sd;
          if (!sd && !ed) return true;
          const endDay = ed ? new Date(ed.getFullYear(), ed.getMonth(), ed.getDate()) : null;
          const startDay = sd ? new Date(sd.getFullYear(), sd.getMonth(), sd.getDate()) : null;
          // include if start is in the future, or the trip is ongoing (today between start and end)
          if (startDay && startDay >= todayDay) return true;
          if (startDay && endDay && todayDay >= startDay && todayDay <= endDay) return true;
          // also include if no start but end is in future
          if (!startDay && endDay && endDay >= todayDay) return true;
          return false;
        }).map(b => ({
          id: b._id || b.id,
          // backend populates package under `packageId`
          destination: b.packageId?.destination || b.packageId?.title || b.package?.destination || b.package?.title || b.packageTitle || 'Package',
          startDate: b.startDate,
          endDate: b.endDate,
          dateLabel: b.startDate ? `${new Date(b.startDate).toLocaleDateString()}${b.endDate ? ' - ' + new Date(b.endDate).toLocaleDateString() : ''}` : 'TBD',
          image: b.packageId?.photos?.[0] || b.package?.image || `https://source.unsplash.com/featured/?${encodeURIComponent((b.packageId?.destination || b.package?.destination || 'travel'))}`,
          status: b.status || 'PENDING',
          // determine if trip is currently ongoing
          isOngoing: (function() {
            try {
              // if booking already completed, do not treat as ongoing
              if (b.status === 'COMPLETED') return false;
              if (!b.startDate) return false;
              const sd = new Date(b.startDate);
              const ed = b.endDate ? new Date(b.endDate) : sd;
              const startDay = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate());
              const endDay = new Date(ed.getFullYear(), ed.getMonth(), ed.getDate());
              const nowDay = new Date((new Date()).getFullYear(), (new Date()).getMonth(), (new Date()).getDate());
              return nowDay >= startDay && nowDay <= endDay;
            } catch (err) { return false; }
          })(),
          booking: {
            ...b,
            checkedIn: b.checkedIn || (localStorage.getItem(`checkedIn_${b._id || b.id}`) === 'true')
          }
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
        // detect if any trip is happening today (start <= today <= end)
        try {
          const today = new Date();
          const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

          // prefer bookings that are CONFIRMED and paid that start today
          const confirmedPaidToday = bookings.find(b => {
            const st = (b.status || '').toString().toUpperCase();
            if (st !== 'CONFIRMED') return false;
            try {
              const paymentInfo = (function() {
                // reuse local helper checkPaymentStatus if available
                try { return checkPaymentStatus(b); } catch (e) { return { isPaid: false }; }
              })();
              if (!paymentInfo.isPaid) return false;
            } catch (e) { return false; }
            if (!b.startDate) return false;
            const sd = new Date(b.startDate);
            const startDay = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate());
            return startDay.getTime() === todayDay.getTime();
          });

          let chosen = null;
          if (confirmedPaidToday) chosen = confirmedPaidToday;
          else {
            // look through all bookings (not only upcoming) to find ongoing trips
            const ongoing = bookings.find(b => {
              const st = (b.status || '').toString().toUpperCase();
              if (st === 'COMPLETED' || st === 'CANCELLED') return false;
              if (!b.startDate) return false;
              // Require booking to be either explicitly CONFIRMED or have been paid
              try {
                const paymentInfo = checkPaymentStatus(b);
                if (!paymentInfo.isPaid && st !== 'CONFIRMED') return false;
              } catch (e) { return false; }
              const sd = new Date(b.startDate);
              const ed = b.endDate ? new Date(b.endDate) : sd;
              const startDay = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate());
              const endDay = new Date(ed.getFullYear(), ed.getMonth(), ed.getDate());
              return todayDay >= startDay && todayDay <= endDay;
            });
            chosen = ongoing;
          }

          if (chosen) {
            const t = {
              id: chosen._id || chosen.id,
              destination: chosen.packageId?.destination || chosen.packageId?.title || chosen.package?.destination || chosen.package?.title || chosen.packageTitle || 'Package',
              startDate: chosen.startDate,
              endDate: chosen.endDate,
              dateLabel: chosen.startDate ? `${new Date(chosen.startDate).toLocaleDateString()}${chosen.endDate ? ' - ' + new Date(chosen.endDate).toLocaleDateString() : ''}` : 'TBD',
              image: chosen.packageId?.photos?.[0] || chosen.package?.image || `https://source.unsplash.com/featured/?${encodeURIComponent((chosen.packageId?.destination || chosen.package?.destination || 'travel'))}`,
              status: chosen.status || 'PENDING',
              booking: {
                ...chosen,
                checkedIn: chosen.checkedIn || (localStorage.getItem(`checkedIn_${chosen._id || chosen.id}`) === 'true')
              }
            };
            setTodayTrip(t);
          } else {
            setTodayTrip(null);
          }
        } catch (err) {
          console.debug('Error detecting today trip', err);
        }
        
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
        // After loading bookings, check which packages the customer already reviewed
        (async () => {
          try {
            const userId = (user && user.id) || localStorage.getItem('userId');
            if (!userId) return;
            const uniquePkgIds = Array.from(new Set(bookings.map(b => (b.packageId?._id || b.packageId || b.package?._id || b.package)))).filter(Boolean);
            const reviewed = new Set();
            await Promise.all(uniquePkgIds.map(async (pkgId) => {
              try {
                const res = await fetch(`/api/customers/${userId}/packages/${pkgId}/review`);
                if (!res.ok) return;
                const data = await res.json();
                if (data && data.success && data.review) reviewed.add(pkgId.toString());
              } catch (err) {
                // ignore
              }
            }));
            setReviewedPackages(new Set(Array.from(reviewed)));
          } catch (err) {
            // ignore
          }
        })();
      } catch (err) {
        console.error('Dashboard bookings error', err);
        setTripsError('Failed to load trips');
        setUpcomingTrips([]);
      }
      setLoadingTrips(false);
    };
    load();
    // listen for cross-component booking updates (e.g., marked completed elsewhere)
    const onBookingUpdated = (e) => {
      try {
        const updated = e && e.detail ? e.detail : null;
        if (!updated) return;
        const idRaw = updated._id || updated.id;
        if (!idRaw) return;
        const idStr = (idRaw && typeof idRaw.toString === 'function') ? idRaw.toString() : idRaw;
        // remove from upcomingTrips if present (compare as strings)
        setUpcomingTrips(prev => prev.filter(t => {
          const tid = t.id || t._id || (t.booking && (t.booking._id || t.booking.id));
          const tidStr = (tid && typeof tid.toString === 'function') ? tid.toString() : tid;
          return tidStr !== idStr;
        }));
        // update todayTrip if it matches
        setTodayTrip(prev => {
          if (!prev) return prev;
          const prevId = prev.id || prev._id || (prev.booking && (prev.booking._id || prev.booking.id));
          const prevIdStr = (prevId && typeof prevId.toString === 'function') ? prevId.toString() : prevId;
          if (prevIdStr === idStr) return ({ ...prev, booking: { ...prev.booking, ...updated }, status: updated.status || 'COMPLETED', isOngoing: false });
          return prev;
        });
      } catch (err) { /* ignore */ }
    };
    window.addEventListener('bookingUpdated', onBookingUpdated);
    return () => {
      window.removeEventListener('bookingUpdated', onBookingUpdated);
    };
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
  const [todayTrip, setTodayTrip] = useState(null);
  const [checkedInBookings, setCheckedInBookings] = useState({});

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

  const handleCheckIn = async (trip) => {
    const bookingId = trip.id;
    const userId = (user && user.id) || localStorage.getItem('userId');
    try {
      // try a dedicated check-in endpoint first
      const res = await fetch(`/api/bookings/${bookingId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        setCheckedInBookings(prev => ({ ...prev, [bookingId]: true }));
        // persist fallback locally so a reload still shows checked-in if backend didn't save yet
        try { localStorage.setItem(`checkedIn_${bookingId}`, 'true'); } catch (e) { /* ignore */ }
        // fetch updated booking from server to reflect persisted state
        try {
          const refreshed = await fetch(`/api/bookings/${bookingId}`);
          if (refreshed.ok) {
            const rdata = await refreshed.json();
            const bk = rdata.booking || rdata;
                setUpcomingTrips(prev => prev.map(t => t.id === bookingId ? ({ ...t, booking: { ...t.booking, ...bk }, isOngoing: (bk.status === 'COMPLETED' ? false : t.isOngoing) }) : t));
                setTodayTrip(prev => (prev && prev.id === bookingId) ? ({ ...prev, booking: { ...prev.booking, ...bk }, isOngoing: (bk.status === 'COMPLETED' ? false : (prev.isOngoing)) }) : prev);
          } else {
            // fallback optimistic update
                setUpcomingTrips(prev => prev.map(t => t.id === bookingId ? ({ ...t, booking: { ...t.booking, checkedIn: true }, isOngoing: t.isOngoing }) : t));
                setTodayTrip(prev => (prev && prev.id === bookingId) ? ({ ...prev, booking: { ...prev.booking, checkedIn: true }, isOngoing: prev.isOngoing }) : prev);
          }
        } catch (err) {
          setUpcomingTrips(prev => prev.map(t => t.id === bookingId ? ({ ...t, booking: { ...t.booking, checkedIn: true }, isOngoing: t.isOngoing }) : t));
        }
        alert('You are checked in for today\'s tour.');
        return;
      }
      // fallback: try to patch booking (if backend supports)
      const res2 = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkedIn: true })
      });
      if (res2.ok) {
        setCheckedInBookings(prev => ({ ...prev, [bookingId]: true }));
        try { localStorage.setItem(`checkedIn_${bookingId}`, 'true'); } catch (e) { /* ignore */ }
        try {
          const refreshed = await fetch(`/api/bookings/${bookingId}`);
          if (refreshed.ok) {
            const rdata = await refreshed.json();
            const bk = rdata.booking || rdata;
            setUpcomingTrips(prev => prev.map(t => t.id === bookingId ? ({ ...t, booking: { ...t.booking, ...bk }, isOngoing: (bk.status === 'COMPLETED' ? false : t.isOngoing) }) : t));
            setTodayTrip(prev => (prev && prev.id === bookingId) ? ({ ...prev, booking: { ...prev.booking, ...bk }, isOngoing: (bk.status === 'COMPLETED' ? false : (prev.isOngoing)) }) : prev);
          } else {
            setUpcomingTrips(prev => prev.map(t => t.id === bookingId ? ({ ...t, booking: { ...t.booking, checkedIn: true }, isOngoing: t.isOngoing }) : t));
            setTodayTrip(prev => (prev && prev.id === bookingId) ? ({ ...prev, booking: { ...prev.booking, checkedIn: true } }) : prev);
          }
        } catch (err) {
          setUpcomingTrips(prev => prev.map(t => t.id === bookingId ? ({ ...t, booking: { ...t.booking, checkedIn: true }, isOngoing: t.isOngoing }) : t));
        }
        alert('You are checked in for today\'s tour.');
        return;
      }
      const txt = await res.text();
      alert('Check-in failed: ' + txt);
    } catch (err) {
      console.error('Check-in error', err);
      alert('Check-in failed, please try again later.');
    }
  };

  const handleEndTour = async (trip) => {
    const bookingId = trip.id;
    try {
      const res = await fetch(`/api/bookings/${bookingId}/complete`, { method: 'POST' });
      if (!res.ok) {
        const txt = await res.text();
        alert('Failed to end tour: ' + txt);
        return;
      }
      const data = await res.json();
      const updated = data.booking || data;
      // remove from upcomingTrips and update todayTrip
      setUpcomingTrips(prev => prev.filter(t => t.id !== bookingId));
      setTodayTrip(prev => (prev && prev.id === bookingId) ? ({ ...prev, booking: { ...prev.booking, ...updated }, status: updated.status || 'COMPLETED', isOngoing: false }) : prev);
      // notify other components (e.g., Bookings) to refresh/move the booking
      try { window.dispatchEvent(new CustomEvent('bookingUpdated', { detail: updated })); } catch (e) { /* ignore */ }
      alert('Tour marked as completed. You can now write a review.');
      // open review modal for the completed booking
      setReviewTargetBooking(updated);
      setReviewModalOpen(true);
    } catch (err) {
      console.error('End tour error', err);
      alert('Failed to end tour, please try again later.');
    }
  };

  const todayChecked = todayTrip ? ((todayTrip.booking && (todayTrip.booking.checkedIn || todayTrip.booking.checkedInByUser)) || checkedInBookings[todayTrip.id]) : false;

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

        {/* Announcements Banner */}
        <div className="mb-6">
          <AnnouncementBanner userRole="CUSTOMERS" />
        </div>

        {/* Floating support chat button/panel (only AdminChat, no extra Support wrapper) */}
        <div>
          <div aria-hidden className="fixed bottom-6 right-6 z-40">
            <button
              onClick={() => setShowSupportChat(s => !s)}
              className="w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
              title="Support"
            >
              <FaComments size={20} />
            </button>
          </div>

          {showSupportChat && (
            <div className="fixed bottom-24 right-6 w-96 max-w-full z-50">
              <div className="relative">
                  <div className="p-0">
                    <AdminChat currentUserId={(user && user.id) || localStorage.getItem('userId')} />
                  </div>
                </div>
            </div>
          )}
        </div>

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
          {todayTrip && (
            <div className="mb-4 p-4 rounded-lg bg-white dark:bg-gray-800 border-l-4 border-green-500 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-green-600">Today's Tour</div>
                <div className="font-bold text-lg text-gray-900 dark:text-white">{todayTrip.destination} — {todayTrip.dateLabel}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Operator: {todayTrip.booking?.assignedOperator?.name || 'TBD'}</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { if (!todayChecked) handleCheckIn(todayTrip); else alert('You are already checked in.'); }}
                  className={`px-5 py-2 rounded-lg font-semibold ${todayChecked ? 'bg-gray-300 text-gray-700 cursor-default' : 'bg-green-600 text-white hover:bg-green-700'}`}
                  disabled={todayChecked}
                >
                  {todayChecked ? 'Checked in' : 'Check in'}
                </button>
              </div>
            </div>
          )}
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
                    <div className="absolute top-4 right-4 text-right space-y-1">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        (trip.status && trip.status.toString().toUpperCase() === 'CONFIRMED') ? 'bg-green-500 text-white' : 'bg-yellow-400 text-gray-900'
                      }`}>
                        {trip.status}
                      </span>
                      {trip.isOngoing && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-700 text-white">
                          Ongoing
                        </span>
                      )}
                    </div>
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
                      {((trip.booking?.status === 'CONFIRMED' || trip.booking?.status === 'CHECKED_IN') && trip.isOngoing) && (
                        <button
                          onClick={() => handleEndTour(trip)}
                          className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        >
                          End Tour
                        </button>
                      )}
                      {trip.booking?.status === 'COMPLETED' && (() => {
                        const pkgId = trip.booking.packageId?._id || trip.booking.packageId || (trip.booking.package?._id || trip.booking.package);
                        const already = pkgId && reviewedPackages && reviewedPackages.has(pkgId.toString());
                        if (already) {
                          return (
                            <button
                              onClick={() => navigate('/customer/reviews')}
                              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition-colors"
                            >
                              View Review
                            </button>
                          );
                        }

                        return (
                          <button
                            onClick={() => { setReviewTargetBooking(trip.booking); setReviewModalOpen(true); }}
                            className="px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
                          >
                            Write Review
                          </button>
                        );
                      })()}
                      <button
                        onClick={() => {
                          // attempt to open a map view focused on package coordinates
                          const pkg = trip.booking?.packageId || trip.booking?.package || trip;
                          console.log('[Map Button] Package data:', pkg);
                          
                          // First, try to use mapLocation from package if available
                          let coords = null;
                          if (pkg.mapLocation && pkg.mapLocation.lat && pkg.mapLocation.lng) {
                            coords = {
                              lat: pkg.mapLocation.lat,
                              lng: pkg.mapLocation.lng,
                              zoom: pkg.mapLocation.zoom || 12
                            };
                            console.log('[Map Button] Using package mapLocation:', coords);
                          } else {
                            // Fallback: try to find coordinates from destinations array
                            console.log('[Map Button] No mapLocation, checking destinations:', pkg.destinations);
                            
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
                            
                            if (pkg.destinations && Array.isArray(pkg.destinations)) {
                              const mainDest = pkg.destinations.find((d, idx) => idx > 0 && d.name) || pkg.destinations[0];
                              if (mainDest && mainDest.name) {
                                const destName = mainDest.name.toLowerCase();
                                const cityName = mainDest.city?.toLowerCase();
                                
                                coords = destinationCoords[destName] || destinationCoords[cityName];
                                
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
                          }
                          
                          console.log('[Map Button] Final coords:', coords);
                          if (coords) {
                            setMapCoords(coords);
                            setMapTitle(pkg.title || trip.destination || 'Location');
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

        {reviewModalOpen && reviewTargetBooking && (
          <ReviewModal
            isOpen={reviewModalOpen}
            booking={reviewTargetBooking}
            onClose={() => { setReviewModalOpen(false); setReviewTargetBooking(null); }}
            onSubmitted={(booking) => {
              const pkgId = booking.packageId?._id || booking.packageId || (booking.package?._id || booking.package);
              if (pkgId) setReviewedPackages(prev => {
                const copy = new Set(Array.from(prev));
                copy.add(pkgId.toString());
                return copy;
              });
              // mark upcomingTrips and todayTrip locally as reviewed so UI updates
              try {
                setUpcomingTrips(prev => prev.map(t => {
                  const bid = t.booking?._id || t.booking?.id;
                  if (bid && (bid === (booking._id || booking.id))) {
                    return { ...t, booking: { ...t.booking, _reviewed: true } };
                  }
                  return t;
                }));
                setTodayTrip(prev => {
                  if (!prev) return prev;
                  const bid = prev.booking?._id || prev.booking?.id;
                  if (bid && (bid === (booking._id || booking.id))) return { ...prev, booking: { ...prev.booking, _reviewed: true } };
                  return prev;
                });
              } catch (err) { /* ignore */ }
            }}
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
