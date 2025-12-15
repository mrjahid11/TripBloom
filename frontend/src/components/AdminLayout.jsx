import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ManageUsersMenu from './ManageUsersMenu';
import { 
  FaUsers, FaRoute, FaChartLine, FaCog, FaSignOutAlt, FaBell, FaSearch, 
  FaCalendar, FaDollarSign, FaStar, FaEnvelope
} from 'react-icons/fa';

const AdminLayout = () => {
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadList, setUnreadList] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const fetchUnread = async () => {
    try {
      const role = localStorage.getItem('userRole') || '';
      const res = await axios.get('/api/admin/contacts', { headers: { 'x-user-role': role } });
      if (res.data && Array.isArray(res.data.contacts)) {
        const unread = res.data.contacts.filter(c => !c.handled).slice(0,5);
        setUnreadList(unread);
        setUnreadCount(unread.length);
      }
    } catch (err) {
      // ignore polling errors
      console.debug('Unread fetch failed', err?.message || err);
    }
  };

  useEffect(() => {
    fetchUnread();
    const t = setInterval(fetchUnread, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-900 flex">
      {/* Left Sidebar Navigation */}
      <aside className="w-64 bg-gray-800 dark:bg-gray-800 shadow-2xl border-r border-gray-700 dark:border-gray-700 fixed h-full overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <img src="/tripbloom_logo.svg" alt="TripBloom" className="w-10 h-10" />
            <h1 className="text-xl font-bold text-primary">Admin Portal</h1>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-2">
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <FaChartLine className="text-xl" />
            <span className="font-semibold">Home</span>
          </button>
          <button 
            onClick={() => navigate('/admin')}
            className="w-full flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <FaChartLine className="text-xl" />
            <span className="font-semibold">Dashboard</span>
          </button>

          {/* Manage Users Dropdown */}
          <ManageUsersMenu navigate={navigate} />

          
          
          <button 
            onClick={() => navigate('/admin/packages')}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-gray-700 rounded-lg transition-all"
          >
            <FaRoute className="text-xl text-green-600 dark:text-green-400" />
            <span className="font-semibold">Tour Packages</span>
          </button>
          
          <button 
            onClick={() => navigate('/admin/departures')}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-700 rounded-lg transition-all"
          >
            <FaCalendar className="text-xl text-purple-600 dark:text-purple-400" />
            <span className="font-semibold">Departures</span>
          </button>
          
          <button 
            onClick={() => navigate('/admin/contacts')}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg transition-all"
          >
            <FaEnvelope className="text-xl text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold">Contact Messages</span>
          </button>
          
          <button 
            onClick={() => navigate('/admin/refunds')}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-all"
          >
            <FaDollarSign className="text-xl text-red-600 dark:text-red-400" />
            <span className="font-semibold">Refund Queue</span>
          </button>
          
          <button 
            onClick={() => navigate('/admin/reviews')}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-gray-700 rounded-lg transition-all"
          >
            <FaStar className="text-xl text-yellow-600 dark:text-yellow-400" />
            <span className="font-semibold">Reviews</span>
          </button>
          


          <button 
            onClick={() => navigate('/admin/settings')}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all"
          >
            <FaCog className="text-xl text-gray-600 dark:text-gray-400" />
            <span className="font-semibold">Settings</span>
          </button>
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 dark:border-gray-700 bg-gray-800 dark:bg-gray-800">
          <button 
            onClick={() => {
              localStorage.removeItem('userName');
              localStorage.removeItem('userRole');
              navigate('/');
            }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-semibold"
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-64">
        {/* Top Bar */}
        <div className="bg-gray-800 dark:bg-gray-800 shadow-lg border-b border-gray-700 dark:border-gray-700 px-8 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white dark:text-white">Admin Dashboard</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-600 dark:border-gray-600 rounded-lg bg-gray-700 dark:bg-gray-700 text-white dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
              <div className="relative" ref={notifRef}>
                <button onClick={() => setShowNotifications(v => !v)} className="relative p-2 text-gray-300 dark:text-gray-300 hover:text-primary transition-colors">
                  <FaBell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full animate-pulse">{unreadCount}</span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700 font-semibold">Notifications</div>
                    <div className="max-h-60 overflow-auto">
                      {unreadList.length === 0 && <div className="p-4 text-sm text-gray-500">No new messages</div>}
                      {unreadList.map(n => (
                        <button key={n._id} onClick={() => { setShowNotifications(false); navigate(`/admin/contacts?focus=${n._id}`); }} className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true"></span>
                              <div className="font-medium text-sm">{n.name}</div>
                            </div>
                            <div className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleTimeString()}</div>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300 truncate">{n.message}</div>
                        </button>
                      ))}
                    </div>
                    <div className="p-2 text-center border-t border-gray-100 dark:border-gray-700">
                      <button onClick={() => { setShowNotifications(false); navigate('/admin/contacts'); }} className="text-sm text-primary">View all</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="px-8 py-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
