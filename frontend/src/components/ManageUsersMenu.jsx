import React, { useState } from 'react';
import { FaUsers, FaUserTie, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const ManageUsersMenu = ({ navigate }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-all font-semibold`}
      >
        <FaUsers className="text-xl text-blue-600 dark:text-blue-400" />
        <span>Manage Users</span>
        {open ? <FaChevronUp className="ml-auto" /> : <FaChevronDown className="ml-auto" />}
      </button>
      {open && (
        <div className="pl-8 pt-2 pb-2 space-y-2">
          <button
            onClick={() => navigate('/admin/users')}
            className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-800 rounded-lg transition-all"
          >
            <FaUsers className="text-lg text-blue-600 dark:text-blue-400" />
            <span>All Users</span>
          </button>
          <button
            onClick={() => navigate('/admin/operators')}
            className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-gray-800 rounded-lg transition-all"
          >
            <FaUserTie className="text-lg text-orange-600 dark:text-orange-400" />
            <span>Operators</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageUsersMenu;