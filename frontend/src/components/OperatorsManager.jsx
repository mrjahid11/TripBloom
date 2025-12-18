import React, { useState } from 'react';
import OperatorsList from './OperatorsList';
import OperatorDetailModal from './OperatorDetailModal';
import UserEditModal from './UserEditModal';

const OperatorsManager = () => {
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [operatorToEdit, setOperatorToEdit] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleViewDetails = (operator) => {
    setSelectedOperator(operator);
    setShowDetailModal(true);
  };

  const handleEdit = (operator) => {
    setOperatorToEdit(operator);
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleUserUpdated = () => {
    setShowEditModal(false);
    setOperatorToEdit(null);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <OperatorsList 
          onViewDetails={handleViewDetails}
          key={refreshTrigger}
        />
        
        <OperatorDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          operator={selectedOperator}
          onEdit={handleEdit}
        />

        <UserEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          user={operatorToEdit}
          onUserUpdated={handleUserUpdated}
        />
      </div>
    </div>
  );
};

export default OperatorsManager;
