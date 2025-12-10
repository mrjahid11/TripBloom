import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUsers, FaPlus, FaEye, FaEdit, FaToggleOn, FaToggleOff, FaExclamationTriangle, FaSearch } from 'react-icons/fa';

const OperatorsList = ({ onViewDetails }) => {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    setLoading(true);
    try {
      // First try to get all users, then filter by role on frontend
      // This ensures we catch all operator role variations
      const res = await axios.get('/api/admin/users');
      
      console.log('API Response:', res.data);
      
      // Filter operators (handle all role variations)
      const allUsers = res.data.users || res.data || [];
      const operatorUsers = allUsers.filter(user => 
        user.roles?.some(r => {
          const roleUpper = r.toUpperCase();
          return roleUpper === 'TOUR_OPERATOR' || roleUpper === 'OPERATOR';
        })
      );
      
      // Fetch additional data for each operator
      const operatorsWithData = await Promise.all(
        operatorUsers.map(async (operator) => {
          try {
            // Get all departures to count both upcoming and assigned packages
            const allDeparturesRes = await axios.get('/api/admin/group-departures');
            const allDepartures = allDeparturesRes.data.departures || [];
            
            console.log(`\n=== Processing operator: ${operator.fullName} (ID: ${operator._id}) ===`);
            console.log(`Total departures in system: ${allDepartures.length}`);
            
            // Log first departure structure for debugging
            if (allDepartures.length > 0) {
              console.log('Sample departure structure:', {
                id: allDepartures[0]._id,
                packageTitle: allDepartures[0].packageId?.title,
                operators: allDepartures[0].operators,
                packageId: allDepartures[0].packageId?._id,
                startDate: allDepartures[0].startDate,
                endDate: allDepartures[0].endDate,
                status: allDepartures[0].status
              });
              console.log('All departures with dates:');
              allDepartures.forEach((dep, idx) => {
                console.log(`  ${idx + 1}. ${dep.packageId?.title || 'Unknown'}: Start=${dep.startDate}, End=${dep.endDate}, Status=${dep.status}`);
              });
            }
            
            const now = new Date();
            console.log(`Current date: ${now.toISOString()}`);
            
            // Filter departures where this operator is assigned
            const operatorDepartures = allDepartures.filter(dep => {
              // Check if operator is assigned to this departure
              // Handle both string and ObjectId comparisons
              if (!dep.operators || dep.operators.length === 0) {
                return false;
              }
              
              const isAssigned = dep.operators.some(op => {
                const opId = op.operatorId?._id || op.operatorId;
                const match = String(opId) === String(operator._id);
                if (match) {
                  console.log(`  ✓ Matched in departure: ${dep.packageId?.title || dep._id}`);
                }
                return match;
              });
              return isAssigned;
            });
            
            console.log(`Total departures assigned to ${operator.fullName}: ${operatorDepartures.length}`);
            
            // Count upcoming departures (future dates only)
            const upcomingDepartures = operatorDepartures.filter(dep => {
              const startDate = new Date(dep.startDate);
              const isFuture = startDate >= now;
              console.log(`  Departure "${dep.packageId?.title || dep._id}": ${startDate.toISOString()} - ${isFuture ? 'FUTURE' : 'PAST'}`);
              return isFuture;
            }).length;
            
            console.log(`✓ Upcoming departures count: ${upcomingDepartures}`);
            
            // Count unique packages from all operator departures
            const uniquePackageIds = new Set(
              operatorDepartures
                .map(dep => {
                  const pkgId = dep.packageId?._id || dep.packageId;
                  return String(pkgId);
                })
                .filter(id => id && id !== 'undefined')
            );
            
            const assignedPackages = uniquePackageIds.size;
            
            console.log(`✓ Unique packages count: ${assignedPackages}\n`);

            return {
              ...operator,
              upcomingDepartures,
              assignedPackages
            };
          } catch (err) {
            console.error(`Error fetching data for operator ${operator._id}:`, err);
            return {
              ...operator,
              upcomingDepartures: 0,
              assignedPackages: 0
            };
          }
        })
      );

      setOperators(operatorsWithData);
      
      // Debug logging
      console.log('Total users fetched:', allUsers.length);
      console.log('Filtered operators:', operatorUsers.length);
      console.log('Operators with data:', operatorsWithData);
    } catch (err) {
      console.error('Failed to fetch operators:', err);
    }
    setLoading(false);
  };

  const toggleOperatorStatus = async (operatorId, currentStatus) => {
    try {
      await axios.put(`/api/admin/users/${operatorId}`, {
        isActive: !currentStatus
      });
      fetchOperators(); // Refresh list
    } catch (err) {
      console.error('Failed to toggle operator status:', err);
    }
  };

  const filteredOperators = operators.filter(op => {
    const matchesSearch = op.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         op.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && op.isActive) ||
                         (statusFilter === 'inactive' && !op.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <FaUsers className="mr-3 text-primary" />
          Tour Operators
        </h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-colors">
          <FaPlus />
          <span>Add Operator</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Email</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Phone</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Assigned Packages</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Upcoming Departures</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOperators.map((operator) => {
              const hasWarning = !operator.isActive && operator.upcomingDepartures > 0;
              
              return (
                <tr
                  key={operator._id}
                  className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    hasWarning ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                  }`}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {operator.fullName}
                      </div>
                      {hasWarning && (
                        <FaExclamationTriangle 
                          className="ml-2 text-yellow-600 dark:text-yellow-400" 
                          title="Inactive operator with future departures"
                        />
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                    {operator.email}
                  </td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                    {operator.phone || 'N/A'}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => toggleOperatorStatus(operator._id, operator.isActive)}
                      className={`flex items-center justify-center mx-auto px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                        operator.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}
                    >
                      {operator.isActive ? (
                        <>
                          <FaToggleOn className="mr-1" /> Active
                        </>
                      ) : (
                        <>
                          <FaToggleOff className="mr-1" /> Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full font-semibold">
                      {operator.assignedPackages}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-semibold ${
                      operator.upcomingDepartures > 0
                        ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                        : 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
                    }`}>
                      {operator.upcomingDepartures}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => onViewDetails && onViewDetails(operator)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      <button
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

        {filteredOperators.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'No operators match your filters' 
                : operators.length === 0 
                  ? 'No tour operators found in the system'
                  : 'No operators found'}
            </div>
            {operators.length === 0 && !searchTerm && statusFilter === 'all' && (
              <div className="text-sm text-gray-400 dark:text-gray-500">
                <p className="mb-2">No users with "tour_operator" or "operator" role exist yet.</p>
                <p>Add users with operator role from User Management or create a new operator.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-8 text-primary font-semibold">Loading...</div>
      )}

      {/* Stats Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
          <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold">Total Operators</div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">{operators.length}</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
          <div className="text-sm text-green-600 dark:text-green-400 font-semibold">Active Operators</div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-300">
            {operators.filter(op => op.isActive).length}
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
          <div className="text-sm text-orange-600 dark:text-orange-400 font-semibold">With Future Departures</div>
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-300">
            {operators.filter(op => op.upcomingDepartures > 0).length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorsList;
