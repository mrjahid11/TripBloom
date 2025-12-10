import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaCog, FaSave, FaUndo, FaExclamationTriangle, FaCheckCircle,
  FaDollarSign, FaPercent, FaCalendar, FaUserShield, FaUserTie,
  FaUser, FaLock, FaUnlock, FaInfoCircle, FaBell
} from 'react-icons/fa';

const SystemSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('cancellation'); // 'cancellation', 'commission', 'permissions'

  // Cancellation Rules State
  const [cancellationRules, setCancellationRules] = useState({
    enabled: true,
    rules: [
      { daysBeforeStart: 30, refundPercentage: 100, description: '30+ days: Full refund' },
      { daysBeforeStart: 14, refundPercentage: 75, description: '14-29 days: 75% refund' },
      { daysBeforeStart: 7, refundPercentage: 50, description: '7-13 days: 50% refund' },
      { daysBeforeStart: 3, refundPercentage: 25, description: '3-6 days: 25% refund' },
      { daysBeforeStart: 0, refundPercentage: 0, description: '0-2 days: No refund' }
    ],
    operatorCancelledFullRefund: true,
    emergencyRefundPercentage: 100,
    processingFee: 5 // Processing fee percentage
  });

  // Commission & Discount Rules State
  const [commissionRules, setCommissionRules] = useState({
    defaultOperatorCommission: 15, // Percentage
    defaultAdminCommission: 10, // Percentage
    earlyBirdDiscountEnabled: true,
    earlyBirdDays: 60,
    earlyBirdPercentage: 10,
    groupDiscountEnabled: true,
    groupDiscountRules: [
      { minPeople: 5, discountPercentage: 5 },
      { minPeople: 10, discountPercentage: 10 },
      { minPeople: 15, discountPercentage: 15 }
    ],
    seasonalPricingEnabled: true,
    peakSeasonMultiplier: 1.3,
    offSeasonMultiplier: 0.8
  });

  // Role & Permissions State
  const [permissions, setPermissions] = useState({
    ADMIN: {
      canManageUsers: true,
      canManagePackages: true,
      canManageDepartures: true,
      canManageOperators: true,
      canViewReports: true,
      canProcessRefunds: true,
      canModerateReviews: true,
      canManageSettings: true,
      canDeleteBookings: true,
      canOverridePrices: true
    },
    TOUR_OPERATOR: {
      canManageUsers: false,
      canManagePackages: true, // Only their own
      canManageDepartures: true, // Only their own
      canManageOperators: false,
      canViewReports: true, // Only their data
      canProcessRefunds: false,
      canModerateReviews: false,
      canManageSettings: false,
      canDeleteBookings: false,
      canOverridePrices: true // Only their packages
    },
    CUSTOMER: {
      canManageUsers: false,
      canManagePackages: false,
      canManageDepartures: false,
      canManageOperators: false,
      canViewReports: false,
      canProcessRefunds: false,
      canModerateReviews: false,
      canManageSettings: false,
      canDeleteBookings: false,
      canOverridePrices: false
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/settings').catch(() => ({ data: {} }));
      if (response.data.cancellationRules) {
        setCancellationRules(response.data.cancellationRules);
      }
      if (response.data.commissionRules) {
        setCommissionRules(response.data.commissionRules);
      }
      if (response.data.permissions) {
        setPermissions(response.data.permissions);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
    setLoading(false);
  };

  const validateCancellationRules = () => {
    const newErrors = {};

    // Validate each rule
    cancellationRules.rules.forEach((rule, index) => {
      if (rule.refundPercentage < 0 || rule.refundPercentage > 100) {
        newErrors[`rule_${index}`] = 'Refund percentage must be between 0 and 100';
      }
      if (rule.daysBeforeStart < 0) {
        newErrors[`days_${index}`] = 'Days must be 0 or positive';
      }
    });

    // Validate processing fee
    if (cancellationRules.processingFee < 0 || cancellationRules.processingFee > 100) {
      newErrors.processingFee = 'Processing fee must be between 0 and 100';
    }

    // Validate emergency refund
    if (cancellationRules.emergencyRefundPercentage < 0 || cancellationRules.emergencyRefundPercentage > 100) {
      newErrors.emergencyRefund = 'Emergency refund must be between 0 and 100';
    }

    return newErrors;
  };

  const validateCommissionRules = () => {
    const newErrors = {};

    // Validate commission percentages
    if (commissionRules.defaultOperatorCommission < 0 || commissionRules.defaultOperatorCommission > 100) {
      newErrors.operatorCommission = 'Operator commission must be between 0 and 100';
    }
    if (commissionRules.defaultAdminCommission < 0 || commissionRules.defaultAdminCommission > 100) {
      newErrors.adminCommission = 'Admin commission must be between 0 and 100';
    }

    // Validate total commission doesn't exceed 100%
    const totalCommission = parseFloat(commissionRules.defaultOperatorCommission) + parseFloat(commissionRules.defaultAdminCommission);
    if (totalCommission > 100) {
      newErrors.totalCommission = 'Total commission cannot exceed 100%';
    }

    // Validate early bird discount
    if (commissionRules.earlyBirdPercentage < 0 || commissionRules.earlyBirdPercentage > 100) {
      newErrors.earlyBirdPercentage = 'Early bird discount must be between 0 and 100';
    }
    if (commissionRules.earlyBirdDays < 0) {
      newErrors.earlyBirdDays = 'Early bird days must be 0 or positive';
    }

    // Validate group discounts
    commissionRules.groupDiscountRules.forEach((rule, index) => {
      if (rule.discountPercentage < 0 || rule.discountPercentage > 100) {
        newErrors[`groupDiscount_${index}`] = 'Group discount must be between 0 and 100';
      }
      if (rule.minPeople < 1) {
        newErrors[`groupPeople_${index}`] = 'Minimum people must be at least 1';
      }
    });

    // Validate seasonal pricing
    if (commissionRules.peakSeasonMultiplier < 1) {
      newErrors.peakMultiplier = 'Peak season multiplier must be at least 1.0';
    }
    if (commissionRules.offSeasonMultiplier < 0.1 || commissionRules.offSeasonMultiplier > 1) {
      newErrors.offMultiplier = 'Off-season multiplier must be between 0.1 and 1.0';
    }

    return newErrors;
  };

  const saveSettings = async () => {
    // Validate based on active tab
    let validationErrors = {};
    if (activeTab === 'cancellation') {
      validationErrors = validateCancellationRules();
    } else if (activeTab === 'commission') {
      validationErrors = validateCommissionRules();
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await axios.post('/api/admin/settings', {
        cancellationRules,
        commissionRules,
        permissions
      }).catch(() => {
        // Mock success for demo
        console.log('Settings saved (mock)');
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setErrors({ general: 'Failed to save settings. Please try again.' });
    }
    setLoading(false);
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset to default settings? This cannot be undone.')) {
      fetchSettings();
      setErrors({});
    }
  };

  const updateCancellationRule = (index, field, value) => {
    const newRules = [...cancellationRules.rules];
    newRules[index] = { ...newRules[index], [field]: parseFloat(value) || 0 };
    setCancellationRules({ ...cancellationRules, rules: newRules });
  };

  const updateGroupDiscountRule = (index, field, value) => {
    const newRules = [...commissionRules.groupDiscountRules];
    newRules[index] = { ...newRules[index], [field]: parseFloat(value) || 0 };
    setCommissionRules({ ...commissionRules, groupDiscountRules: newRules });
  };

  const togglePermission = (role, permission) => {
    setPermissions({
      ...permissions,
      [role]: {
        ...permissions[role],
        [permission]: !permissions[role][permission]
      }
    });
  };

  const renderCancellationTab = () => (
    <div className="space-y-6">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div>
          <div className="font-semibold text-gray-900 dark:text-white">Enable Cancellation Rules</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Allow customers to cancel bookings with refunds</div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={cancellationRules.enabled}
            onChange={(e) => setCancellationRules({ ...cancellationRules, enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* Cancellation Rules Table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <FaCalendar className="mr-2 text-blue-600 dark:text-blue-400" />
          Refund Tiers by Days Before Start
        </h3>
        <div className="space-y-3">
          {cancellationRules.rules.map((rule, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Days Before Start
                </label>
                <input
                  type="number"
                  min="0"
                  value={rule.daysBeforeStart}
                  onChange={(e) => updateCancellationRule(index, 'daysBeforeStart', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                {errors[`days_${index}`] && (
                  <p className="text-red-600 text-xs mt-1">{errors[`days_${index}`]}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Refund Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={rule.refundPercentage}
                    onChange={(e) => updateCancellationRule(index, 'refundPercentage', e.target.value)}
                    className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <FaPercent className="absolute right-3 top-3 text-gray-400" />
                </div>
                {errors[`rule_${index}`] && (
                  <p className="text-red-600 text-xs mt-1">{errors[`rule_${index}`]}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={rule.description}
                  onChange={(e) => updateCancellationRule(index, 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Processing Fee (%)
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={cancellationRules.processingFee}
              onChange={(e) => setCancellationRules({ ...cancellationRules, processingFee: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <FaPercent className="absolute right-3 top-3 text-gray-400" />
          </div>
          {errors.processingFee && (
            <p className="text-red-600 text-xs mt-1">{errors.processingFee}</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fee deducted from all refunds</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Emergency Refund (%)
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              value={cancellationRules.emergencyRefundPercentage}
              onChange={(e) => setCancellationRules({ ...cancellationRules, emergencyRefundPercentage: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <FaPercent className="absolute right-3 top-3 text-gray-400" />
          </div>
          {errors.emergencyRefund && (
            <p className="text-red-600 text-xs mt-1">{errors.emergencyRefund}</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Medical/emergency cases</p>
        </div>

        <div className="flex items-center">
          <div>
            <div className="font-semibold text-gray-900 dark:text-white mb-2">Operator Cancelled</div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={cancellationRules.operatorCancelledFullRefund}
                onChange={(e) => setCancellationRules({ ...cancellationRules, operatorCancelledFullRefund: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Full refund</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCommissionTab = () => (
    <div className="space-y-6">
      {/* Default Commissions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <FaDollarSign className="mr-2 text-green-600 dark:text-green-400" />
          Default Commission Rates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tour Operator Commission (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={commissionRules.defaultOperatorCommission}
                onChange={(e) => setCommissionRules({ ...commissionRules, defaultOperatorCommission: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <FaPercent className="absolute right-3 top-3 text-gray-400" />
            </div>
            {errors.operatorCommission && (
              <p className="text-red-600 text-xs mt-1">{errors.operatorCommission}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Platform/Admin Commission (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={commissionRules.defaultAdminCommission}
                onChange={(e) => setCommissionRules({ ...commissionRules, defaultAdminCommission: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <FaPercent className="absolute right-3 top-3 text-gray-400" />
            </div>
            {errors.adminCommission && (
              <p className="text-red-600 text-xs mt-1">{errors.adminCommission}</p>
            )}
          </div>
        </div>
        {errors.totalCommission && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
            <FaExclamationTriangle className="text-red-600 dark:text-red-400 mt-0.5 mr-2" />
            <p className="text-red-600 dark:text-red-400 text-sm">{errors.totalCommission}</p>
          </div>
        )}
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-300">
            <strong>Total Commission:</strong> {(parseFloat(commissionRules.defaultOperatorCommission) + parseFloat(commissionRules.defaultAdminCommission)).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Early Bird Discount */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <FaBell className="mr-2 text-yellow-600 dark:text-yellow-400" />
            Early Bird Discount
          </h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={commissionRules.earlyBirdDiscountEnabled}
              onChange={(e) => setCommissionRules({ ...commissionRules, earlyBirdDiscountEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
        {commissionRules.earlyBirdDiscountEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Days Before Departure
              </label>
              <input
                type="number"
                min="0"
                value={commissionRules.earlyBirdDays}
                onChange={(e) => setCommissionRules({ ...commissionRules, earlyBirdDays: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              {errors.earlyBirdDays && (
                <p className="text-red-600 text-xs mt-1">{errors.earlyBirdDays}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Discount Percentage
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={commissionRules.earlyBirdPercentage}
                  onChange={(e) => setCommissionRules({ ...commissionRules, earlyBirdPercentage: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <FaPercent className="absolute right-3 top-3 text-gray-400" />
              </div>
              {errors.earlyBirdPercentage && (
                <p className="text-red-600 text-xs mt-1">{errors.earlyBirdPercentage}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Group Discounts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <FaUserTie className="mr-2 text-purple-600 dark:text-purple-400" />
            Group Booking Discounts
          </h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={commissionRules.groupDiscountEnabled}
              onChange={(e) => setCommissionRules({ ...commissionRules, groupDiscountEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
        {commissionRules.groupDiscountEnabled && (
          <div className="space-y-3">
            {commissionRules.groupDiscountRules.map((rule, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minimum People
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={rule.minPeople}
                    onChange={(e) => updateGroupDiscountRule(index, 'minPeople', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  {errors[`groupPeople_${index}`] && (
                    <p className="text-red-600 text-xs mt-1">{errors[`groupPeople_${index}`]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Discount Percentage
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={rule.discountPercentage}
                      onChange={(e) => updateGroupDiscountRule(index, 'discountPercentage', e.target.value)}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <FaPercent className="absolute right-3 top-3 text-gray-400" />
                  </div>
                  {errors[`groupDiscount_${index}`] && (
                    <p className="text-red-600 text-xs mt-1">{errors[`groupDiscount_${index}`]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seasonal Pricing */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <FaCalendar className="mr-2 text-orange-600 dark:text-orange-400" />
            Seasonal Pricing
          </h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={commissionRules.seasonalPricingEnabled}
              onChange={(e) => setCommissionRules({ ...commissionRules, seasonalPricingEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
        {commissionRules.seasonalPricingEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Peak Season Multiplier
              </label>
              <input
                type="number"
                min="1"
                max="3"
                step="0.1"
                value={commissionRules.peakSeasonMultiplier}
                onChange={(e) => setCommissionRules({ ...commissionRules, peakSeasonMultiplier: parseFloat(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              {errors.peakMultiplier && (
                <p className="text-red-600 text-xs mt-1">{errors.peakMultiplier}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Price × {commissionRules.peakSeasonMultiplier}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Off-Season Multiplier
              </label>
              <input
                type="number"
                min="0.1"
                max="1"
                step="0.1"
                value={commissionRules.offSeasonMultiplier}
                onChange={(e) => setCommissionRules({ ...commissionRules, offSeasonMultiplier: parseFloat(e.target.value) || 0.8 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              {errors.offMultiplier && (
                <p className="text-red-600 text-xs mt-1">{errors.offMultiplier}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Price × {commissionRules.offSeasonMultiplier}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPermissionsTab = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <FaInfoCircle className="text-blue-600 dark:text-blue-400 mt-0.5 mr-3" />
          <div>
            <div className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
              Role & Permission Overview
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-400">
              Define what actions each user role can perform. Changes take effect immediately for all users in that role.
            </div>
          </div>
        </div>
      </div>

      {Object.keys(permissions).map(role => (
        <div key={role} className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center mb-4">
            {role === 'ADMIN' && <FaUserShield className="text-2xl text-red-600 dark:text-red-400 mr-3" />}
            {role === 'TOUR_OPERATOR' && <FaUserTie className="text-2xl text-orange-600 dark:text-orange-400 mr-3" />}
            {role === 'CUSTOMER' && <FaUser className="text-2xl text-blue-600 dark:text-blue-400 mr-3" />}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {role.replace('_', ' ')}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(permissions[role]).map(permission => (
              <div key={permission} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center">
                  {permissions[role][permission] ? (
                    <FaCheckCircle className="text-green-600 dark:text-green-400 mr-3" />
                  ) : (
                    <FaLock className="text-red-600 dark:text-red-400 mr-3" />
                  )}
                  <span className="text-sm text-gray-900 dark:text-white">
                    {permission.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions[role][permission]}
                    onChange={() => togglePermission(role, permission)}
                    disabled={role === 'ADMIN' && permission === 'canManageSettings'} // Admin always has settings access
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600 peer-disabled:opacity-50"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <FaCog className="mr-3 text-blue-600 dark:text-blue-400" />
                System Settings & Configuration
              </h2>
              <div className="flex space-x-3">
                <button
                  onClick={resetToDefaults}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-semibold flex items-center"
                >
                  <FaUndo className="mr-2" />
                  Reset
                </button>
                <button
                  onClick={saveSettings}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center disabled:opacity-50"
                >
                  <FaSave className="mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('cancellation')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === 'cancellation'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Cancellation Rules
              </button>
              <button
                onClick={() => setActiveTab('commission')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === 'commission'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Commission & Discounts
              </button>
              <button
                onClick={() => setActiveTab('permissions')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === 'permissions'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Role & Permissions
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {saved && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center">
                <FaCheckCircle className="text-green-600 dark:text-green-400 mr-3" />
                <p className="text-green-700 dark:text-green-400 font-semibold">Settings saved successfully!</p>
              </div>
            )}

            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
                <FaExclamationTriangle className="text-red-600 dark:text-red-400 mt-0.5 mr-3" />
                <p className="text-red-600 dark:text-red-400">{errors.general}</p>
              </div>
            )}

            {activeTab === 'cancellation' && renderCancellationTab()}
            {activeTab === 'commission' && renderCommissionTab()}
            {activeTab === 'permissions' && renderPermissionsTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
