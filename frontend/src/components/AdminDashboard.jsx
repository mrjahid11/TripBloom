import React, { useState, useEffect } from 'react';
import ManageUsersMenu from './ManageUsersMenu';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaUsers, FaRoute, FaChartLine, FaCog, FaSignOutAlt, FaBell, FaSearch, 
  FaCalendar, FaMapMarkerAlt, FaUserTie, FaDollarSign, FaShoppingCart,
  FaExclamationTriangle, FaCheckCircle, FaClock, FaTimesCircle, FaFilter,
  FaChartBar, FaArrowUp, FaArrowDown, FaChevronRight, FaStar
} from 'react-icons/fa';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookingsFilter, setBookingsFilter] = useState('all'); // 'all' or 'confirmed'
  const [revenueFilter, setRevenueFilter] = useState('confirmed'); // 'confirmed' or 'all'
  const [timeFilter, setTimeFilter] = useState('month'); // 'today', 'month', 'overall'
  const [chartFilter, setChartFilter] = useState('all'); // 'all', 'personal', 'group'
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState({
    bookings: { today: 0, month: 0, overall: 0, confirmed: 0 },
    revenue: { total: 0, confirmed: 0, pending: 0 },
    upcomingDepartures: [],
    cancellationRate: { withRefund: 0, withoutRefund: 0, total: 0 },
    bookingFunnel: { pending: 0, confirmed: 0, completed: 0, cancelled: 0, stuck: 0 },
    revenueOverTime: [],
    topPackages: [],
    alerts: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all necessary data in parallel
      const [packagesRes, departuresRes] = await Promise.all([
        axios.get('/api/admin/packages').catch(() => ({ data: { packages: [] } })),
        axios.get('/api/admin/group-departures').catch(() => ({ data: { departures: [] } }))
      ]);

      const packages = packagesRes.data.packages || [];
      const allDepartures = departuresRes.data.departures || [];

      // Calculate upcoming departures (next 7 days)
      const now = new Date();
      const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcomingDepartures = allDepartures
        .filter(dep => {
          const startDate = new Date(dep.startDate);
          return startDate >= now && startDate <= next7Days && dep.status !== 'CANCELLED';
        })
        .map(dep => ({
          ...dep,
          isLowOccupancy: (dep.bookedSeats / dep.totalSeats) < 0.3 // Less than 30%
        }));

      // Mock bookings data (replace with real API)
      const mockBookings = {
        today: 12,
        month: 145,
        overall: 2543,
        confirmed: 2180
      };

      // Mock revenue data
      const mockRevenue = {
        total: 125450,
        confirmed: 108230,
        pending: 17220
      };

      // Mock cancellation rate
      const totalCancelled = 156;
      const withRefund = 98;
      const mockCancellation = {
        total: ((totalCancelled / mockBookings.overall) * 100).toFixed(1),
        withRefund: ((withRefund / totalCancelled) * 100).toFixed(1),
        withoutRefund: (((totalCancelled - withRefund) / totalCancelled) * 100).toFixed(1)
      };

      // Mock booking funnel
      const mockFunnel = {
        pending: 45,
        confirmed: 203,
        completed: 1987,
        cancelled: 156,
        stuck: 8 // Pending > 24 hours
      };

      // Mock revenue over time (last 30 days)
      const mockRevenueOverTime = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000),
        personal: Math.floor(Math.random() * 3000 + 1000),
        group: Math.floor(Math.random() * 5000 + 2000),
        refunds: Math.floor(Math.random() * 500)
      }));

      // Calculate top performing packages
      const topPackages = packages
        .map(pkg => ({
          ...pkg,
          bookings: Math.floor(Math.random() * 100),
          revenue: Math.floor(Math.random() * 50000),
          rating: (Math.random() * 2 + 3).toFixed(1),
          isLowRatingHighVolume: false
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map(pkg => ({
          ...pkg,
          isLowRatingHighVolume: parseFloat(pkg.rating) < 3.5 && pkg.bookings > 50
        }));

      // Generate alerts
      const alerts = [];
      
      // Low occupancy departures
      upcomingDepartures.forEach(dep => {
        if (dep.isLowOccupancy) {
          alerts.push({
            id: `low-occ-${dep._id}`,
            type: 'warning',
            icon: FaExclamationTriangle,
            message: `Group Departure "${dep.packageId?.title || 'Package'}" on ${new Date(dep.startDate).toLocaleDateString()} has only ${dep.bookedSeats}/${dep.totalSeats} seats booked.`,
            action: () => navigate('/admin/departures'),
            timestamp: new Date()
          });
        }
      });

      // Departures without operators (within 24 hours)
      upcomingDepartures.forEach(dep => {
        const hoursUntil = (new Date(dep.startDate) - now) / (1000 * 60 * 60);
        if (hoursUntil < 24 && (!dep.operators || dep.operators.length === 0)) {
          alerts.push({
            id: `no-op-${dep._id}`,
            type: 'danger',
            icon: FaTimesCircle,
            message: `Departure "${dep.packageId?.title || 'Package'}" starts in ${Math.floor(hoursUntil)} hours but has no operators assigned!`,
            action: () => navigate('/admin/departures'),
            timestamp: new Date()
          });
        }
      });

      // Cancelled departures needing refund action
      const cancelledDepartures = allDepartures.filter(dep => 
        dep.status === 'CANCELLED' && new Date(dep.startDate) > now
      );
      if (cancelledDepartures.length > 0) {
        alerts.push({
          id: 'refunds-needed',
          type: 'warning',
          icon: FaDollarSign,
          message: `${cancelledDepartures.length} cancelled departure(s) may need refund processing.`,
          action: () => navigate('/admin/departures'),
          timestamp: new Date()
        });
      }

      // Stuck pending bookings
      if (mockFunnel.stuck > 0) {
        alerts.push({
          id: 'stuck-pending',
          type: 'info',
          icon: FaClock,
          message: `${mockFunnel.stuck} booking(s) have been pending for more than 24 hours.`,
          action: () => {},
          timestamp: new Date()
        });
      }

      setDashboardData({
        bookings: mockBookings,
        revenue: mockRevenue,
        upcomingDepartures,
        cancellationRate: mockCancellation,
        bookingFunnel: mockFunnel,
        revenueOverTime: mockRevenueOverTime,
        topPackages,
        alerts
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
    setLoading(false);
  };

  const getBookingsValue = () => {
    if (timeFilter === 'today') return dashboardData.bookings.today;
    if (timeFilter === 'month') return dashboardData.bookings.month;
    return dashboardData.bookings.overall;
  };

  const getBookingsLabel = () => {
    const base = bookingsFilter === 'confirmed' ? 'Confirmed Bookings' : 'Total Bookings';
    if (timeFilter === 'today') return `${base} (Today)`;
    if (timeFilter === 'month') return `${base} (This Month)`;
    return `${base} (Overall)`;
  };

  const getAlertColor = (type) => {
    const colors = {
      danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
      warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300',
      info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
      success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
    };
    return colors[type] || colors.info;
  };

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Bookings Card */}
          <div className="bg-gray-800 dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {getBookingsLabel()}
                  </p>
                  <FaShoppingCart className="text-blue-600 dark:text-blue-400 text-xl" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {bookingsFilter === 'confirmed' 
                    ? dashboardData.bookings.confirmed.toLocaleString()
                    : getBookingsValue().toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setTimeFilter('today')}
                className={`px-2 py-1 text-xs rounded ${timeFilter === 'today' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
              >
                Today
              </button>
              <button
                onClick={() => setTimeFilter('month')}
                className={`px-2 py-1 text-xs rounded ${timeFilter === 'month' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
              >
                Month
              </button>
              <button
                onClick={() => setTimeFilter('overall')}
                className={`px-2 py-1 text-xs rounded ${timeFilter === 'overall' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
              >
                Overall
              </button>
            </div>
            <div className="mt-2">
              <button
                onClick={() => setBookingsFilter(bookingsFilter === 'all' ? 'confirmed' : 'all')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center"
              >
                <FaFilter className="mr-1" />
                {bookingsFilter === 'all' ? 'Show Confirmed Only' : 'Show All Statuses'}
              </button>
            </div>
          </div>

          {/* Revenue Card */}
          <div className="bg-gray-800 dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700 dark:border-gray-700">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Revenue {revenueFilter === 'confirmed' ? '(Confirmed)' : '(All)'}
                  </p>
                  <FaDollarSign className="text-green-600 dark:text-green-400 text-xl" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${(revenueFilter === 'confirmed' 
                    ? dashboardData.revenue.confirmed 
                    : dashboardData.revenue.total).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Pending: ${dashboardData.revenue.pending.toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => setRevenueFilter(revenueFilter === 'all' ? 'confirmed' : 'all')}
              className="text-xs text-green-600 dark:text-green-400 hover:underline flex items-center mt-2"
            >
              <FaFilter className="mr-1" />
              {revenueFilter === 'all' ? 'Show Confirmed Only' : 'Include Pending'}
            </button>
          </div>

          {/* Upcoming Departures Card */}
          <div className="bg-gray-800 dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700 dark:border-gray-700">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Upcoming Departures
                  </p>
                  <FaCalendar className="text-purple-600 dark:text-purple-400 text-xl" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.upcomingDepartures.length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Next 7 days</p>
              </div>
            </div>
            {dashboardData.upcomingDepartures.filter(d => d.isLowOccupancy).length > 0 && (
              <div className="flex items-center text-xs text-orange-600 dark:text-orange-400 mt-2">
                <FaExclamationTriangle className="mr-1" />
                {dashboardData.upcomingDepartures.filter(d => d.isLowOccupancy).length} below min. occupancy
              </div>
            )}
          </div>

          {/* Cancellation Rate Card */}
          <div className="bg-gray-800 dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700 dark:border-gray-700">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Cancellation Rate
                  </p>
                  <FaTimesCircle className="text-red-600 dark:text-red-400 text-xl" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.cancellationRate.total}%
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>With refund:</span>
                    <span className="font-semibold">{dashboardData.cancellationRate.withRefund}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Without refund:</span>
                    <span className="font-semibold">{dashboardData.cancellationRate.withoutRefund}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Booking Status Funnel */}
          <div className="bg-gray-800 dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Booking Status Funnel</h2>
            <div className="space-y-3">
              {[
                { label: 'Pending', value: dashboardData.bookingFunnel.pending, color: 'yellow', width: 100 },
                { label: 'Confirmed', value: dashboardData.bookingFunnel.confirmed, color: 'green', width: 85 },
                { label: 'Completed', value: dashboardData.bookingFunnel.completed, color: 'blue', width: 70 },
                { label: 'Cancelled', value: dashboardData.bookingFunnel.cancelled, color: 'red', width: 55 }
              ].map((item, index) => (
                <div key={index} className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => {}}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{item.label}</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                  <div className="relative h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <div 
                      className={`absolute h-full bg-gradient-to-r from-${item.color}-400 to-${item.color}-600 flex items-center justify-end pr-3 text-white font-semibold text-xs transition-all duration-500`}
                      style={{ width: `${item.width}%` }}
                    >
                      <FaChevronRight />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {dashboardData.bookingFunnel.stuck > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center text-sm text-yellow-800 dark:text-yellow-300">
                  <FaClock className="mr-2" />
                  <span>{dashboardData.bookingFunnel.stuck} pending bookings stuck &gt; 24 hours</span>
                </div>
              </div>
            )}
          </div>

          {/* Revenue Over Time */}
          <div className="bg-gray-800 dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Revenue Over Time</h2>
              <select
                value={chartFilter}
                onChange={(e) => setChartFilter(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Tours</option>
                <option value="personal">Personal Only</option>
                <option value="group">Group Only</option>
              </select>
            </div>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 rounded-xl">
              <div className="text-center text-gray-600 dark:text-gray-400">
                <FaChartLine className="text-4xl mx-auto mb-2 text-primary" />
                <p className="text-sm">Line Chart: Last 30 Days</p>
                <p className="text-xs mt-1">Gross Revenue vs Net (after refunds)</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-xs text-green-600 dark:text-green-400">Gross</div>
                <div className="text-sm font-bold text-green-900 dark:text-green-300">$125K</div>
              </div>
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-xs text-red-600 dark:text-red-400">Refunds</div>
                <div className="text-sm font-bold text-red-900 dark:text-red-300">$8.5K</div>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-xs text-blue-600 dark:text-blue-400">Net</div>
                <div className="text-sm font-bold text-blue-900 dark:text-blue-300">$116.5K</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Top Packages & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Performing Packages */}
          <div className="lg:col-span-2 bg-gray-800 dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Top Performing Packages</h2>
            <div className="space-y-3">
              {dashboardData.topPackages.map((pkg, index) => (
                <div key={pkg._id} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-primary to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {pkg.title}
                      </h3>
                      {pkg.isLowRatingHighVolume && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 text-xs rounded-full flex items-center">
                          <FaExclamationTriangle className="mr-1" /> Quality Check
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
                      <span className="flex items-center">
                        <FaShoppingCart className="mr-1" /> {pkg.bookings} bookings
                      </span>
                      <span className="flex items-center">
                        <FaStar className="mr-1 text-yellow-500" /> {pkg.rating}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      ${(pkg.revenue / 1000).toFixed(1)}K
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">revenue</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts Panel */}
          <div className="bg-gray-800 dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Alerts</h2>
              <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-xs font-semibold rounded-full">
                {dashboardData.alerts.length}
              </span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {dashboardData.alerts.length > 0 ? (
                dashboardData.alerts.map((alert) => {
                  const AlertIcon = alert.icon;
                  return (
                    <div
                      key={alert.id}
                      onClick={alert.action}
                      className={`p-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${getAlertColor(alert.type)}`}
                    >
                      <div className="flex items-start">
                        <AlertIcon className="mt-0.5 mr-2 flex-shrink-0" />
                        <div className="flex-1 text-sm">
                          {alert.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FaCheckCircle className="text-4xl mx-auto mb-2 text-green-500" />
                  <p className="text-sm">No alerts at the moment</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions - Now in Sidebar */}
    </>
  );
};

export default AdminDashboard;
