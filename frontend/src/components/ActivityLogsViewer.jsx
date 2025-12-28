import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaFilter, FaCalendar, FaUser, FaSearch, FaDownload, FaEye,
  FaUserShield, FaBox, FaStar, FaDollarSign, FaCog, FaBullhorn
} from 'react-icons/fa';

const ActivityLogsViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    action: '',
    startDate: '',
    endDate: '',
    adminId: '',
    limit: 100
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.action) params.append('action', filter.action);
      if (filter.startDate) params.append('startDate', filter.startDate);
      if (filter.endDate) params.append('endDate', filter.endDate);
      if (filter.adminId) params.append('adminId', filter.adminId);
      params.append('limit', filter.limit);

      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/admin/activity-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLogs(response.data.activities || []);
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    }
    setLoading(false);
  };

  const getActionIcon = (action) => {
    const iconMap = {
      USER_CREATED: FaUser,
      USER_UPDATED: FaUser,
      USER_SUSPENDED: FaUserShield,
      USER_ACTIVATED: FaUserShield,
      ROLE_CHANGED: FaUserShield,
      PACKAGE_APPROVED: FaBox,
      PACKAGE_REJECTED: FaBox,
      PACKAGE_DELETED: FaBox,
      REVIEW_DELETED: FaStar,
      OPERATOR_CREATED: FaUser,
      OPERATOR_DELETED: FaUser,
      BOOKING_CANCELLED: FaDollarSign,
      REFUND_PROCESSED: FaDollarSign,
      SETTINGS_UPDATED: FaCog,
      ANNOUNCEMENT_CREATED: FaBullhorn,
      CONTACT_RESOLVED: FaUser
    };
    return iconMap[action] || FaEye;
  };

  const getActionColor = (action) => {
    if (action.includes('DELETED') || action.includes('SUSPENDED') || action.includes('REJECTED')) {
      return 'text-red-600 bg-red-100';
    }
    if (action.includes('CREATED') || action.includes('APPROVED') || action.includes('ACTIVATED')) {
      return 'text-green-600 bg-green-100';
    }
    if (action.includes('UPDATED') || action.includes('CHANGED')) {
      return 'text-blue-600 bg-blue-100';
    }
    return 'text-gray-600 bg-gray-100';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionTypeOptions = () => [
    'USER_CREATED', 'USER_UPDATED', 'USER_SUSPENDED', 'USER_ACTIVATED', 'ROLE_CHANGED',
    'PACKAGE_APPROVED', 'PACKAGE_REJECTED', 'PACKAGE_DELETED',
    'REVIEW_DELETED', 'OPERATOR_CREATED', 'OPERATOR_DELETED',
    'BOOKING_CANCELLED', 'REFUND_PROCESSED', 'SETTINGS_UPDATED',
    'ANNOUNCEMENT_CREATED', 'CONTACT_RESOLVED'
  ];

  const exportToCSV = () => {
    const headers = ['Date', 'Admin', 'Action', 'Description', 'IP Address'];
    const rows = filteredLogs.map(log => [
      formatDate(log.createdAt),
      log.adminId?.fullName || 'System',
      log.action,
      log.description,
      log.ipAddress || 'N/A'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredLogs = logs.filter(log =>
    searchTerm === '' ||
    log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.adminId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                <FaEye className="text-blue-600" />
                Activity Logs
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Track all administrative actions and system changes
              </p>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaDownload />
              Export CSV
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Action Type Filter */}
            <select
              value={filter.action}
              onChange={(e) => setFilter({ ...filter, action: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Actions</option>
              {getActionTypeOptions().map(action => (
                <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
              ))}
            </select>

            {/* Date Range */}
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="End Date"
            />
          </div>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredLogs.length} of {logs.length} logs
          </div>
        </div>

        {/* Logs List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FaEye className="mx-auto text-6xl mb-4 opacity-20" />
              <p className="text-xl">No activity logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredLogs.map((log) => {
                    const Icon = getActionIcon(log.action);
                    return (
                      <tr
                        key={log._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FaUserShield className="text-blue-600" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {log.adminId?.fullName || 'System'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}>
                            <Icon />
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {log.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {log.ipAddress || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <FaEye className="inline" /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Activity Log Details
                </h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Timestamp
                  </label>
                  <p className="text-gray-900 dark:text-white">{formatDate(selectedLog.createdAt)}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Admin
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedLog.adminId?.fullName || 'System'} ({selectedLog.adminId?.email || 'N/A'})
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Action Type
                  </label>
                  <p className="text-gray-900 dark:text-white">{selectedLog.action}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Target Type
                  </label>
                  <p className="text-gray-900 dark:text-white">{selectedLog.targetType}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Description
                  </label>
                  <p className="text-gray-900 dark:text-white">{selectedLog.description}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    IP Address
                  </label>
                  <p className="text-gray-900 dark:text-white">{selectedLog.ipAddress || 'N/A'}</p>
                </div>

                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Metadata
                    </label>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogsViewer;
