import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const PractitionerDashboard = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'active', // active, all, completed
    sortBy: 'priority', // priority, date, patient
    dateRange: '30', // 7, 30, 90, all
    showCompleted: false
  });

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [prescriptions, filters]);

  const applyFiltersAndSort = () => {
    let filtered = [...prescriptions];

    // Filter by status
    if (filters.status === 'active') {
      filtered = filtered.filter(p => 
        ['pending', 'awaiting_supplier_confirmation', 'cancellation_pending'].includes(p.status)
      );
    } else if (filters.status === 'completed') {
      filtered = filtered.filter(p => 
        ['completed', 'cancelled'].includes(p.status)
      );
    }
    // 'all' shows everything

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const daysAgo = parseInt(filters.dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      
      filtered = filtered.filter(p => 
        new Date(p.created_at) >= cutoffDate
      );
    }

    // Sort prescriptions
    filtered.sort((a, b) => {
      if (filters.sortBy === 'priority') {
        // Priority order: pending > awaiting_confirmation > cancellation_pending > assigned > others
        const priorityOrder = {
          'pending': 1,
          'awaiting_supplier_confirmation': 2,
          'cancellation_pending': 3,
          'assigned': 4,
          'in_progress': 5,
          'completed': 6,
          'cancelled': 7
        };
        const aPriority = priorityOrder[a.status] || 8;
        const bPriority = priorityOrder[b.status] || 8;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        // If same priority, sort by date (newest first)
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (filters.sortBy === 'date') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (filters.sortBy === 'patient') {
        return a.patient_name.localeCompare(b.patient_name);
      }
      return 0;
    });

    setFilteredPrescriptions(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const getActionItemsCount = () => {
    return prescriptions.filter(p => 
      ['pending', 'awaiting_supplier_confirmation', 'cancellation_pending'].includes(p.status)
    ).length;
  };

  const cancelPrescription = async (prescriptionId, patientName) => {
    // Show common cancellation reasons
    const commonReasons = [
      'Diagnosis revision needed',
      'Patient changed mind',
      'Prescription error - need to revise',
      'Insurance coverage issue',
      'Drug interaction concern',
      'Patient condition changed',
      'Other (specify below)'
    ];
    
    let selectedReason = '';
    let customReason = '';
    
    // Create a more professional dialog
    const reasonDialog = window.confirm(
      `Cancel prescription for ${patientName}?\n\n` +
      `Common reasons:\n` +
      `• Diagnosis revision needed\n` +
      `• Patient changed mind\n` +
      `• Prescription error\n` +
      `• Insurance issue\n` +
      `• Drug interaction\n\n` +
      `Click OK to continue, Cancel to abort.`
    );
    
    if (!reasonDialog) {
      return;
    }
    
    const reason = prompt(
      `Please specify the reason for cancelling ${patientName}'s prescription:\n\n` +
      `(This helps maintain proper clinical records)`
    );
    
    if (reason === null) {
      return; // User clicked cancel
    }

    if (!window.confirm(
      `⚠️ CONFIRM CANCELLATION ⚠️\n\n` +
      `Patient: ${patientName}\n` +
      `Reason: ${reason || 'No reason provided'}\n\n` +
      `This will permanently delete the prescription.\n` +
      `Continue?`
    )) {
      return;
    }

    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/prescriptions/${prescriptionId}`, {
        data: { reason: reason || 'Cancelled by practitioner' }
      });
      
      fetchPrescriptions(); // Refresh the list
      alert(`✅ Prescription for ${patientName} cancelled successfully.\n\nYou can create a new prescription if needed.`);
    } catch (error) {
      console.error('Error cancelling prescription:', error);
      const errorMessage = error.response?.data?.error || 'Error cancelling prescription. Please try again.';
      alert(`❌ ${errorMessage}`);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/prescriptions`);
      setPrescriptions(response.data);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      awaiting_supplier_confirmation: 'bg-orange-100 text-orange-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      cancellation_pending: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      pending: 'PENDING',
      awaiting_supplier_confirmation: 'AWAITING SUPPLIER CONFIRMATION',
      assigned: 'ASSIGNED',
      in_progress: 'IN PROGRESS',
      completed: 'COMPLETED',
      cancelled: 'CANCELLED',
      cancellation_pending: 'CANCELLATION REQUESTED'
    };
    return statusTexts[status] || status.replace('_', ' ').toUpperCase();
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Practitioner Dashboard</h1>
          {getActionItemsCount() > 0 && (
            <p className="text-sm text-orange-600 mt-1">
              {getActionItemsCount()} prescription{getActionItemsCount() !== 1 ? 's' : ''} require{getActionItemsCount() === 1 ? 's' : ''} your attention
            </p>
          )}
        </div>
        <Link 
          to="/prescriptions/new"
          className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
        >
          Create New Prescription
        </Link>
      </div>

      {/* Dashboard Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Show:</span>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="active">Action Required ({getActionItemsCount()})</option>
              <option value="all">All Prescriptions</option>
              <option value="completed">Completed Only</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="priority">Priority (Action Items First)</option>
              <option value="date">Date (Newest First)</option>
              <option value="patient">Patient Name (A-Z)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Period:</span>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            Showing {filteredPrescriptions.length} of {prescriptions.length} prescriptions
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Prescriptions</h2>
          
          {filteredPrescriptions.length === 0 ? (
            <div className="text-center py-8">
              {prescriptions.length === 0 ? (
                <div>
                  <p className="text-gray-500 mb-4">No prescriptions yet. Create your first prescription!</p>
                  <Link 
                    to="/prescriptions/new"
                    className="bg-primary-500 text-white px-6 py-2 rounded hover:bg-primary-600"
                  >
                    Create First Prescription
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-4">No prescriptions match your current filters.</p>
                  <button
                    onClick={() => setFilters({ status: 'all', sortBy: 'date', dateRange: 'all' })}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Show All Prescriptions
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPrescriptions.map((prescription) => (
                <div key={prescription.id} className={`border rounded-lg p-4 ${
                  ['pending', 'awaiting_supplier_confirmation', 'cancellation_pending'].includes(prescription.status) 
                    ? 'border-l-4 border-l-orange-400 bg-orange-50' 
                    : ''
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">Patient: {prescription.patient_name}</h3>
                        {['pending', 'awaiting_supplier_confirmation', 'cancellation_pending'].includes(prescription.status) && (
                          <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                            ACTION REQUIRED
                          </span>
                        )}
                      </div>
                      {prescription.patient_dob && (
                        <p className="text-sm text-gray-600">
                          DOB: {new Date(prescription.patient_dob).toLocaleDateString()} 
                          (Age: {Math.floor((new Date() - new Date(prescription.patient_dob)) / (365.25 * 24 * 60 * 60 * 1000))})
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        Treatment: {prescription.treatment_days} days
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
                        {getStatusText(prescription.status)}
                      </span>
                      {prescription.status === 'pending' && (
                        <div className="flex flex-wrap gap-2">
                          <Link 
                            to={`/prescriptions/${prescription.id}/suppliers`}
                            className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600"
                          >
                            Compare Suppliers
                          </Link>
                          <button
                            onClick={() => cancelPrescription(prescription.id, prescription.patient_name)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                          >
                            Cancel Prescription
                          </button>
                        </div>
                      )}
                      {prescription.status === 'awaiting_supplier_confirmation' && (
                        <div className="flex space-x-2">
                          <span className="bg-orange-500 text-white px-3 py-1 rounded text-xs">
                            Waiting for Supplier
                          </span>
                          <button
                            onClick={() => cancelPrescription(prescription.id, prescription.patient_name)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                          >
                            Cancel Prescription
                          </button>
                        </div>
                      )}
                      {prescription.status === 'cancellation_pending' && (
                        <Link 
                          to="/orders"
                          className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                        >
                          Review Cancellation
                        </Link>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <h4 className="text-sm font-medium mb-2">Herbs:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {prescription.items && prescription.items.map((item, index) => (
                        <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                          <span className="font-medium">{item.herb_name}</span>
                          {item.chinese_name && (
                            <span className="text-gray-600"> ({item.chinese_name})</span>
                          )}
                          <br />
                          <span className="text-gray-600">
                            {item.quantity_per_day}g/day × {prescription.treatment_days} days = {item.total_quantity}g total
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Clinical Information */}
                  {(prescription.symptoms || prescription.diagnosis) && (
                    <div className="mt-3 p-3 bg-blue-50 rounded">
                      {prescription.symptoms && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-blue-800">Symptoms:</span>
                          <p className="text-xs text-blue-700">{prescription.symptoms}</p>
                        </div>
                      )}
                      {prescription.diagnosis && (
                        <div>
                          <span className="text-xs font-medium text-blue-800">Diagnosis:</span>
                          <p className="text-xs text-blue-700">{prescription.diagnosis}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-3 text-xs text-gray-500">
                    Created: {new Date(prescription.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PractitionerDashboard;