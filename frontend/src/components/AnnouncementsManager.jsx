import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaBullhorn, FaPlus, FaEdit, FaTrash, FaEye, FaToggleOn, FaToggleOff,
  FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaTimes, FaBell
} from 'react-icons/fa';

const AnnouncementsManager = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'INFO',
    targetAudience: ['ALL'],
    priority: 'MEDIUM',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: true
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/announcements', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(response.data.announcements || []);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      console.log('Submitting announcement:', formData);
      
      if (editingAnnouncement) {
        const response = await axios.put(
          `/api/admin/announcements/${editingAnnouncement._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Update response:', response.data);
      } else {
        const response = await axios.post('/api/admin/announcements', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Create response:', response.data);
      }

      fetchAnnouncements();
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save announcement:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      alert(`Failed to save announcement: ${errorMsg}`);
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      targetAudience: announcement.targetAudience,
      priority: announcement.priority,
      startDate: announcement.startDate ? new Date(announcement.startDate).toISOString().split('T')[0] : '',
      endDate: announcement.endDate ? new Date(announcement.endDate).toISOString().split('T')[0] : '',
      isActive: announcement.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      alert('Failed to delete announcement. Please try again.');
    }
  };

  const toggleActive = async (announcement) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/admin/announcements/${announcement._id}`,
        { isActive: !announcement.isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to toggle announcement:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'INFO',
      targetAudience: ['ALL'],
      priority: 'MEDIUM',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      isActive: true
    });
    setEditingAnnouncement(null);
  };

  const getTypeIcon = (type) => {
    const icons = {
      INFO: FaInfoCircle,
      WARNING: FaExclamationTriangle,
      SUCCESS: FaCheckCircle,
      ERROR: FaTimes,
      MAINTENANCE: FaBell
    };
    return icons[type] || FaInfoCircle;
  };

  const getTypeColor = (type) => {
    const colors = {
      INFO: 'bg-blue-100 text-blue-800 border-blue-300',
      WARNING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      SUCCESS: 'bg-green-100 text-green-800 border-green-300',
      ERROR: 'bg-red-100 text-red-800 border-red-300',
      MAINTENANCE: 'bg-purple-100 text-purple-800 border-purple-300'
    };
    return colors[type] || colors.INFO;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: 'text-gray-600',
      MEDIUM: 'text-blue-600',
      HIGH: 'text-orange-600',
      URGENT: 'text-red-600'
    };
    return colors[priority] || colors.MEDIUM;
  };

  const handleAudienceChange = (audience) => {
    if (audience === 'ALL') {
      setFormData({ ...formData, targetAudience: ['ALL'] });
    } else {
      const newAudience = formData.targetAudience.filter(a => a !== 'ALL');
      if (newAudience.includes(audience)) {
        setFormData({ ...formData, targetAudience: newAudience.filter(a => a !== audience) });
      } else {
        setFormData({ ...formData, targetAudience: [...newAudience, audience] });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                <FaBullhorn className="text-blue-600" />
                Announcements Manager
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Create and manage platform-wide announcements
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              <FaPlus />
              New Announcement
            </button>
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
              <FaBullhorn className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-xl text-gray-600 dark:text-gray-400">No announcements yet</p>
              <p className="text-gray-500 dark:text-gray-500 mt-2">Create your first announcement to get started</p>
            </div>
          ) : (
            announcements.map((announcement) => {
              const TypeIcon = getTypeIcon(announcement.type);
              return (
                <div
                  key={announcement._id}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 ${getTypeColor(announcement.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <TypeIcon className="text-2xl" />
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                          {announcement.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(announcement.priority)}`}>
                          {announcement.priority}
                        </span>
                        {announcement.isActive ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            Active
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                            Inactive
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {announcement.message}
                      </p>

                      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <FaEye />
                          <span>Target: {announcement.targetAudience.join(', ')}</span>
                        </div>
                        <div>
                          Start: {new Date(announcement.startDate).toLocaleDateString()}
                        </div>
                        {announcement.endDate && (
                          <div>
                            End: {new Date(announcement.endDate).toLocaleDateString()}
                          </div>
                        )}
                        <div>
                          By: {announcement.createdBy?.fullName || 'Admin'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => toggleActive(announcement)}
                        className={`p-2 rounded-lg transition-colors ${
                          announcement.isActive
                            ? 'text-green-600 hover:bg-green-100'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={announcement.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {announcement.isActive ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                      </button>
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement._id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter announcement title"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter announcement message"
                  />
                </div>

                {/* Type and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="INFO">Info</option>
                      <option value="WARNING">Warning</option>
                      <option value="SUCCESS">Success</option>
                      <option value="ERROR">Error</option>
                      <option value="MAINTENANCE">Maintenance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Priority *
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Target Audience *
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {['ALL', 'CUSTOMERS', 'OPERATORS', 'ADMINS'].map((audience) => (
                      <label key={audience} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.targetAudience.includes(audience)}
                          onChange={() => handleAudienceChange(audience)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">{audience}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-gray-700 dark:text-gray-300">
                    Active (announcement will be visible immediately)
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  {editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsManager;
