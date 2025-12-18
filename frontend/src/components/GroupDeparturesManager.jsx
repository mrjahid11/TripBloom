import React, { useState } from 'react';
import GroupDeparturesCalendar from './GroupDeparturesCalendar';
import GroupDeparturesList from './GroupDeparturesList';
import GroupDepartureDetailModal from './GroupDepartureDetailModal';
import CreateDepartureModal from './CreateDepartureModal';
import EditDepartureModal from './EditDepartureModal';
import { FaCalendarAlt, FaList } from 'react-icons/fa';

const GroupDeparturesManager = () => {
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [selectedDeparture, setSelectedDeparture] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleViewDetails = (departure) => {
    setSelectedDeparture(departure);
    setShowDetailModal(true);
  };

  const handleDepartureUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCreateDeparture = () => {
    setShowCreateModal(true);
  };

  const handleDepartureCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditDeparture = (departure) => {
    setSelectedDeparture(departure);
    setShowEditModal(true);
  };

  const handleDeleteDeparture = async (departure) => {
    if (!confirm(`Are you sure you want to delete the departure for "${departure.packageId?.title || 'this package'}"?\n\nStart Date: ${new Date(departure.startDate).toLocaleDateString()}\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const axios = (await import('axios')).default;
      await axios.delete(`/api/admin/group-departures/${departure._id}`);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Failed to delete departure:', err);
      alert(err.response?.data?.message || 'Failed to delete departure');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-900 p-6 space-y-6">
      {/* View Toggle */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setViewMode('calendar')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            viewMode === 'calendar'
              ? 'bg-primary text-white shadow-lg'
              : 'bg-gray-800 dark:bg-gray-800 text-gray-300 dark:text-gray-300 hover:shadow-md'
          }`}
        >
          <FaCalendarAlt />
          <span>Calendar View</span>
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            viewMode === 'list'
              ? 'bg-primary text-white shadow-lg'
              : 'bg-gray-800 dark:bg-gray-800 text-gray-300 dark:text-gray-300 hover:shadow-md'
          }`}
        >
          <FaList />
          <span>List View</span>
        </button>
      </div>

      {/* Content */}
      {viewMode === 'calendar' ? (
        <GroupDeparturesCalendar key={refreshTrigger} onCreateDeparture={handleCreateDeparture} />
      ) : (
        <GroupDeparturesList 
          key={refreshTrigger} 
          onViewDetails={handleViewDetails} 
          onCreateDeparture={handleCreateDeparture}
          onEditDeparture={handleEditDeparture}
          onDeleteDeparture={handleDeleteDeparture}
        />
      )}

      {/* Detail Modal */}
      <GroupDepartureDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        departure={selectedDeparture}
        onDepartureUpdated={handleDepartureUpdated}
      />

      {/* Create Modal */}
      <CreateDepartureModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onDepartureCreated={handleDepartureCreated}
      />

      {/* Edit Modal */}
      <EditDepartureModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        departure={selectedDeparture}
        onDepartureUpdated={handleDepartureUpdated}
      />
    </div>
  );
};

export default GroupDeparturesManager;
