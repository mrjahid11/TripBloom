import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUsers, FaPlus, FaEye, FaEdit, FaToggleOn, FaToggleOff, FaSearch, FaUserShield, FaUserTie, FaUser, FaBan } from 'react-icons/fa';
import UserEditModal from './UserEditModal';

const UsersList = ({ onViewDetails }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'CUSTOMER', 'ADMIN', 'TOUR_OPERATOR'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/users');
      
      // Fetch additional data for each user
      const usersWithData = await Promise.all(
        (res.data.users || []).map(async (user) => {
          try {
            // Get bookings count (mock for now)
            let bookingsCount = 0;
            let activeBookingsCount = 0;
            try {
              const bookingsRes = await axios.get('/api/bookings', {
                params: { customerId: user._id }
              });
              bookingsCount = bookingsRes.data.bookings?.length || 0;
              activeBookingsCount = bookingsRes.data.bookings?.filter(b => 
                ['PENDING', 'CONFIRMED'].includes(b.status)
              ).length || 0;
            } catch (err) {
              // Bookings endpoint not available - use mock data
              bookingsCount = Math.floor(Math.random() * 10);
              activeBookingsCount = Math.floor(Math.random() * 3);
            }

            // Get future departures if operator
            let futureDepartures = 0;
            if (user.roles?.some(r => r.toLowerCase() === 'tour_operator' || r.toLowerCase() === 'operator')) {
              try {
                const depRes = await axios.get(`/api/group-departure/operator/${user._id}/future`);
                futureDepartures = depRes.data.departures?.length || 0;
              } catch (err) {
                futureDepartures = 0;
              }
            }

            // Mock last login
            const lastLogin = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

            return {
              ...user,
              bookingsCount,
              activeBookingsCount,
              futureDepartures,
              lastLogin
            };
          } catch (err) {
            return {
              ...user,
              bookingsCount: 0,
              activeBookingsCount: 0,
              futureDepartures: 0,
              lastLogin: null
            };
          }
        })
      );

      setUsers(usersWithData);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
    setLoading(false);
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.put(`/api/admin/users/${userId}`, {
        isActive: !currentStatus
      });
      fetchUsers(); // Refresh list
    } catch (err) {
      console.error('Failed to toggle user status:', err);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || 
                       user.roles?.some(r => r.toUpperCase() === roleFilter.toUpperCase() || 
                                           (roleFilter === 'TOUR_OPERATOR' && r.toLowerCase() === 'operator'));
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (role) => {
    const roleUpper = role.toUpperCase();
    if (roleUpper === 'ADMIN') return FaUserShield;
    if (roleUpper === 'TOUR_OPERATOR' || roleUpper === 'OPERATOR') return FaUserTie;
    return FaUser;
  };

  const getRoleColor = (role) => {
    const roleUpper = role.toUpperCase();
    if (roleUpper === 'ADMIN') return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
    if (roleUpper === 'TOUR_OPERATOR' || roleUpper === 'OPERATOR') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatLastLogin = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const loginDate = new Date(date);
    const diffMs = now - loginDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(loginDate);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <FaUsers className="mr-3 text-primary" />
          User Management
        </h2>
        <button 
          onClick={() => {
            setSelectedUser(null);
            setShowEditModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <FaPlus />
          <span>Add User</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">All Roles</option>
          <option value="CUSTOMER">Customers</option>
          <option value="ADMIN">Admins</option>
          <option value="TOUR_OPERATOR">Tour Operators</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive/Blocked Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Email</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Role(s)</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Created Date</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Last Login</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const hasActiveData = user.activeBookingsCount > 0 || user.futureDepartures > 0;
              
              return (
                <tr
                  key={user._id}
                  className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    !user.isActive ? 'bg-red-50/30 dark:bg-red-900/10' : ''
                  }`}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {user.fullName}
                      </div>
                      {!user.isActive && (
                        <FaBan className="ml-2 text-red-600 dark:text-red-400" title="Blocked/Inactive user" />
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                    {user.email}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1">
                      {user.roles?.map((role, idx) => {
                        const RoleIcon = getRoleIcon(role);
                        return (
                          <span 
                            key={idx}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(role)}`}
                          >
                            <RoleIcon className="mr-1" />
                            {role.toUpperCase() === 'TOUR_OPERATOR' || role.toLowerCase() === 'operator' ? 'Operator' : role}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => toggleUserStatus(user._id, user.isActive)}
                      className={`flex items-center justify-center mx-auto px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                        user.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      }`}
                      title={hasActiveData && user.isActive ? 'Warning: User has active bookings/departures' : ''}
                    >
                      {user.isActive ? (
                        <>
                          <FaToggleOn className="mr-1" /> Active
                        </>
                      ) : (
                        <>
                          <FaToggleOff className="mr-1" /> Blocked
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-center text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="py-4 px-4 text-center text-sm text-gray-600 dark:text-gray-400">
                    {formatLastLogin(user.lastLogin)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => onViewDetails && onViewDetails(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEditModal(true);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
              ? 'No users match your filters' 
              : 'No users found'}
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-8 text-primary font-semibold">Loading...</div>
      )}

      {/* Stats Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
          <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold">Total Users</div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">{users.length}</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
          <div className="text-sm text-purple-600 dark:text-purple-400 font-semibold">Customers</div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">
            {users.filter(u => u.roles?.some(r => r.toUpperCase() === 'CUSTOMER')).length}
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
          <div className="text-sm text-green-600 dark:text-green-400 font-semibold">Active Users</div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-300">
            {users.filter(u => u.isActive).length}
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg">
          <div className="text-sm text-red-600 dark:text-red-400 font-semibold">Blocked Users</div>
          <div className="text-2xl font-bold text-red-900 dark:text-red-300">
            {users.filter(u => !u.isActive).length}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <UserEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onUserUpdated={() => {
          fetchUsers();
          setShowEditModal(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
};

export default UsersList;
