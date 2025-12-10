import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import ManageUsersMenu from './ManageUsersMenu';
import { 
  FaUsers, FaRoute, FaChartLine, FaCog, FaSignOutAlt, FaBell, FaSearch, 
  FaCalendar, FaDollarSign
} from 'react-icons/fa';

const AdminLayout = () => {
  const navigate = useNavigate();

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
            onClick={() => navigate('/admin/refunds')}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-all"
          >
            <FaDollarSign className="text-xl text-red-600 dark:text-red-400" />
            <span className="font-semibold">Refund Queue</span>
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
              <button className="relative p-2 text-gray-300 dark:text-gray-300 hover:text-primary transition-colors">
                <FaBell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
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
