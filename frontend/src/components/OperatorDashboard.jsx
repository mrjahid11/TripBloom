import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBus, FaClipboardList, FaChartBar, FaCalendarCheck, FaSignOutAlt, FaBook, FaComments, FaUser, FaHome } from 'react-icons/fa';
import OperatorHome from '../operator/OperatorHome';
import MyDepartures from '../operator/MyDepartures';
import MyBookings from '../operator/MyBookings';
import ItinerariesManager from '../operator/ItinerariesManager';
import MessagesAnnouncements from '../operator/MessagesAnnouncements';
import OperatorProfile from '../operator/OperatorProfile';
import NotificationCenter from './NotificationCenter';

const OperatorDashboard = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'Operator';
  const firstName = userName.split(' ')[0];
  
  const [activeView, setActiveView] = useState(() => {
    try {
      return localStorage.getItem('operatorActiveView') || 'dashboard';
    } catch (e) {
      return 'dashboard';
    }
  });
  const [openBookingId, setOpenBookingId] = useState(null);

  const handleSetActiveView = (id) => {
    setActiveView(id);
    try { localStorage.setItem('operatorActiveView', id); } catch (e) { /* ignore */ }
  };

  const menuItems = [
    { id: 'dashboard', icon: FaHome, label: 'Dashboard' },
    { id: 'departures', icon: FaBus, label: 'My Departures' },
    { id: 'bookings', icon: FaBook, label: 'My Bookings' },
    { id: 'itineraries', icon: FaClipboardList, label: 'Checklists' },
    { id: 'messages', icon: FaComments, label: 'Messages' },
    { id: 'profile', icon: FaUser, label: 'Profile' }
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <OperatorHome />;
      case 'departures':
        return <MyDepartures />;
      case 'bookings':
        return <MyBookings />;
      case 'itineraries':
        return <ItinerariesManager />;
      case 'messages':
        return <MessagesAnnouncements openBookingId={openBookingId} />;
      case 'profile':
        return <OperatorProfile />;
      default:
        return <OperatorHome />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-orange-600 to-orange-700 text-white p-6 shadow-2xl overflow-y-auto">
        <div className="flex items-center space-x-3 mb-8">
          <FaBus className="text-3xl" />
          <h1 className="text-xl font-bold">Operator Hub</h1>
        </div>
        
        <nav className="space-y-2">
          <button
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all bg-green-600 hover:bg-green-700 mb-4"
            onClick={() => navigate('/')}
          >
            <FaChartBar />
            <span className="font-semibold">Main Site</span>
          </button>

          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSetActiveView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeView === item.id
                  ? 'bg-white/20 backdrop-blur-md shadow-lg'
                  : 'hover:bg-white/10'
              }`}
            >
              <item.icon />
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>

        <button 
          onClick={() => {
            localStorage.removeItem('userName');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
            try { localStorage.removeItem('operatorActiveView'); } catch (e) {}
            navigate('/');
          }}
          className="absolute bottom-6 left-6 right-6 flex items-center justify-center space-x-2 px-4 py-3 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30 transition-all"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Header: large welcome only on dashboard; compact title+controls on other views */}
        {activeView === 'dashboard' ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome back, {firstName}! 🚌
                </h2>
              </div>
              <div className="flex items-center space-x-4">
                <NotificationCenter
                  userId={localStorage.getItem('userId')}
                  userRole="TOUR_OPERATOR"
                  onOpenChat={(booking, customer) => {
                  setOpenBookingId(booking._id);
                  handleSetActiveView('messages');
                  }}
                />
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Rating</p>
                  <p className="text-3xl font-bold text-orange-600">4.9 ⭐</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {menuItems.find(m => m.id === activeView)?.label || 'Dashboard'}
            </h2>
            <div className="flex items-center space-x-4">
              <NotificationCenter
                userId={localStorage.getItem('userId')}
                userRole="TOUR_OPERATOR"
                onOpenChat={(booking, customer) => {
                  setOpenBookingId(booking._id);
                  handleSetActiveView('messages');
                }}
              />
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Rating</p>
                <p className="text-3xl font-bold text-orange-600">4.9 ⭐</p>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Content */}
        {renderContent()}
      </div>
    </div>
  );
};

export default OperatorDashboard;
