import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SupplierDashboard = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [filters, setFilters] = useState({
    sortBy: 'date', // date, practitioner, value
    dateRange: '30', // 7, 30, 90, all
    minValue: '', // minimum order value filter
    practitioner: '' // filter by practitioner
  });

  useEffect(() => {
    fetchAvailablePrescriptions();
    fetchPendingOrders();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [prescriptions, filters]);

  const fetchAvailablePrescriptions = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/prescriptions`);
      setPrescriptions(response.data);
      setFilteredPrescriptions(response.data);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...prescriptions];

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const daysAgo = parseInt(filters.dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      
      filtered = filtered.filter(p => 
        new Date(p.created_at) >= cutoffDate
      );
    }

    // Filter by practitioner
    if (filters.practitioner) {
      filtered = filtered.filter(p => 
        p.practitioner_name && p.practitioner_name.toLowerCase().includes(filters.practitioner.toLowerCase())
      );
    }

    // Sort prescriptions
    filtered.sort((a, b) => {
      if (filters.sortBy === 'date') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (filters.sortBy === 'practitioner') {
        return (a.practitioner_name || '').localeCompare(b.practitioner_name || '');
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

  const clearFilters = () => {
    setFilters({
      sortBy: 'date',
      dateRange: '30',
      minValue: '',
      practitioner: ''
    });
  };

  // Get unique practitioner names for filter
  const uniquePractitioners = [...new Set(prescriptions.map(p => p.practitioner_name).filter(Boolean))].sort();

  const fetchPendingOrders = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/orders`);
      const pending = response.data.filter(order => order.status === 'pending_confirmation');
      setPendingOrders(pending);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    }
  };

  const acceptPrescription = async (prescriptionId) => {
    // Calculate default completion date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().split('T')[0]; // Format as YYYY-MM-DD

    // Prompt for estimated completion date
    const completionDate = prompt(
      `🗓️ ESTIMATED COMPLETION DATE\n\n` +
      `When can you complete this prescription?\n\n` +
      `Please enter date in YYYY-MM-DD format:\n` +
      `Example: ${defaultDate}\n\n` +
      `Press OK to use default (tomorrow) or enter your preferred date:`,
      defaultDate
    );

    if (completionDate === null) {
      return; // User cancelled
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(completionDate)) {
      alert('Please enter a valid date in YYYY-MM-DD format (e.g., 2024-12-25)');
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(completionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      alert('Completion date cannot be in the past. Please select today or a future date.');
      return;
    }

    if (!window.confirm(
      `Confirm prescription acceptance:\n\n` +
      `Estimated completion: ${completionDate}\n\n` +
      `This will create an order and notify the practitioner.`
    )) {
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/orders/accept/${prescriptionId}`, {
        estimated_completion: completionDate,
        total_amount: 0, // You can calculate this based on your pricing
        notes: 'Order accepted and will be processed soon'
      });
      
      // Refresh the list
      fetchAvailablePrescriptions();
      alert(`✅ Prescription accepted successfully!\n\nEstimated completion: ${completionDate}`);
    } catch (error) {
      console.error('Error accepting prescription:', error);
      const errorMessage = error.response?.data?.error || 'Error accepting prescription. Please try again.';
      alert(`❌ ${errorMessage}`);
    }
  };

  const acceptOrder = async (orderId) => {
    // Calculate default completion date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().split('T')[0]; // Format as YYYY-MM-DD

    // Prompt for estimated completion date
    const completionDate = prompt(
      `🗓️ ESTIMATED COMPLETION DATE\n\n` +
      `When can you complete this order?\n\n` +
      `Please enter date in YYYY-MM-DD format:\n` +
      `Example: ${defaultDate}\n\n` +
      `Press OK to use default (tomorrow) or enter your preferred date:`,
      defaultDate
    );

    if (completionDate === null) {
      return; // User cancelled
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(completionDate)) {
      alert('Please enter a valid date in YYYY-MM-DD format (e.g., 2024-12-25)');
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(completionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      alert('Completion date cannot be in the past. Please select today or a future date.');
      return;
    }

    if (!window.confirm(
      `Confirm order acceptance:\n\n` +
      `Estimated completion: ${completionDate}\n\n` +
      `This will notify the practitioner that you've accepted the order.`
    )) {
      return;
    }

    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/orders/${orderId}/accept`, {
        estimated_completion: completionDate,
        notes: 'Order accepted by supplier'
      });
      fetchPendingOrders();
      alert(`✅ Order accepted successfully!\n\nEstimated completion: ${completionDate}`);
    } catch (error) {
      console.error('Error accepting order:', error);
      const errorMessage = error.response?.data?.error || 'Error accepting order. Please try again.';
      alert(`❌ ${errorMessage}`);
    }
  };

  const rejectOrder = async (orderId) => {
    const reason = prompt('Please provide a reason for rejecting this order (optional):');
    
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/orders/${orderId}/reject`, {
        reason: reason || 'No reason provided'
      });
      
      fetchPendingOrders();
      alert('Order rejected. The prescription has been returned to the practitioner for supplier reselection.');
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Error rejecting order. Please try again.');
    }
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Supplier Dashboard</h1>
          {pendingOrders.length > 0 && (
            <p className="text-sm text-orange-600 mt-1">
              {pendingOrders.length} order{pendingOrders.length !== 1 ? 's' : ''} awaiting your confirmation
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        {/* Pending Order Confirmations */}
        {pendingOrders.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-yellow-800">
              🔔 Orders Awaiting Your Confirmation ({pendingOrders.length})
            </h2>
            <p className="text-sm text-yellow-700 mb-4">
              These orders have been assigned to you by practitioners. Please confirm or reject them.
            </p>
            
            <div className="space-y-4">
              {pendingOrders.map((order) => (
                <div key={order.id} className="border border-orange-400 rounded-lg p-4 bg-orange-50 border-l-4 border-l-orange-500">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">Order #{order.id}</h3>
                        <span className="bg-warning-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          URGENT - CONFIRM NOW
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Patient: {order.patient_name}</p>
                      <p className="text-sm text-gray-600">Treatment: {order.treatment_days} days × {order.doses_per_day || 2} doses/day</p>
                      <p className="text-sm text-gray-600">Practitioner: {order.practitioner_name}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => acceptOrder(order.id)}
                        className="bg-success-500 text-white px-4 py-2 rounded-lg hover:bg-success-600 transition-colors shadow-md"
                      >
                        ✓ Accept Order
                      </button>
                      <button
                        onClick={() => rejectOrder(order.id)}
                        className="bg-error-500 text-white px-4 py-2 rounded-lg hover:bg-error-600 transition-colors shadow-md"
                      >
                        ✗ Reject Order
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <h4 className="text-sm font-medium mb-2">Required Herbs:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {order.items && order.items.map((item, index) => (
                        <div key={index} className="text-sm bg-gray-50 p-3 rounded border">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium">{item.herb_name}</span>
                            <span className="font-bold text-green-600">HK${item.line_total || '0.00'}</span>
                          </div>
                          {item.chinese_name && (
                            <div className="text-gray-600 text-xs mb-1">({item.chinese_name})</div>
                          )}
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Total: {item.total_quantity}g</span>
                            <span>@HK${item.price_per_gram || '0.00'}/g</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {order.total_amount && (
                    <div className="mt-3 text-sm">
                      <strong>Estimated Total: HK${order.total_amount}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Filters for Available Prescriptions */}
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg shadow-lg border-l-4 border-primary-500 p-6 mb-6">
          <div className="flex items-center mb-4">
            <h3 className="text-lg font-semibold text-primary-800 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find & Sort Available Prescriptions
            </h3>
            <div className="ml-auto bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
              {filteredPrescriptions.length} of {prescriptions.length} prescriptions
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Sort Filter */}
            <div className="bg-white rounded-lg p-4 border border-primary-200 shadow-sm">
              <label className="block text-sm font-semibold text-primary-700 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                Sort Order
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-4 py-3 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 bg-white shadow-sm font-medium transition-colors text-sm"
              >
                <option value="date">📅 Date (Newest First)</option>
                <option value="practitioner">👨‍⚕️ Practitioner Name</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="bg-white rounded-lg p-4 border border-secondary-200 shadow-sm">
              <label className="block text-sm font-semibold text-secondary-700 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Time Period
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-4 py-3 border-2 border-secondary-300 rounded-lg focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 bg-white shadow-sm font-medium transition-colors text-sm"
              >
                <option value="7">📊 Last 7 days</option>
                <option value="30">📈 Last 30 days</option>
                <option value="90">📉 Last 90 days</option>
                <option value="all">🗓️ All time</option>
              </select>
            </div>

            {/* Practitioner Filter */}
            <div className="bg-white rounded-lg p-4 border border-primary-200 shadow-sm">
              <label className="block text-sm font-semibold text-primary-700 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Practitioner
              </label>
              <select
                value={filters.practitioner}
                onChange={(e) => handleFilterChange('practitioner', e.target.value)}
                className="w-full px-4 py-3 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 bg-white shadow-sm font-medium transition-colors text-sm"
              >
                <option value="">👥 All Practitioners</option>
                {uniquePractitioners.map(practitioner => (
                  <option key={practitioner} value={practitioner}>👨‍⚕️ {practitioner}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="bg-white rounded-lg p-4 border border-secondary-200 shadow-sm flex items-end">
              <button
                onClick={clearFilters}
                className="w-full bg-gradient-to-r from-secondary-500 to-primary-500 text-white px-4 py-3 rounded-lg hover:from-secondary-600 hover:to-primary-600 transition-all duration-200 font-medium shadow-md flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Clear Filters
              </button>
            </div>
          </div>

          {/* Active Filter Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-xs font-medium">
              Sorted by: {filters.sortBy === 'date' ? 'Date (Newest First)' : 'Practitioner Name'}
            </span>
            <span className="bg-secondary-100 text-secondary-800 px-3 py-1 rounded-full text-xs font-medium">
              Period: {filters.dateRange === 'all' ? 'All time' : `Last ${filters.dateRange} days`}
            </span>
            {filters.practitioner && (
              <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-xs font-medium">
                Practitioner: {filters.practitioner}
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Available Prescriptions</h2>
          
          {filteredPrescriptions.length === 0 ? (
            <div className="text-center py-8">
              {prescriptions.length === 0 ? (
                <p className="text-gray-500">No pending prescriptions available.</p>
              ) : (
                <div>
                  <p className="text-gray-500 mb-4">No prescriptions match your current filters.</p>
                  <button
                    onClick={clearFilters}
                    className="bg-secondary-500 text-white px-4 py-2 rounded-lg hover:bg-secondary-600 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPrescriptions.map((prescription) => (
                <div key={prescription.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">Patient: {prescription.patient_name}</h3>
                      <p className="text-sm text-gray-600">
                        Practitioner: {prescription.practitioner_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Treatment: {prescription.treatment_days} days × {prescription.doses_per_day || 2} doses/day
                      </p>
                    </div>
                    <button
                      onClick={() => acceptPrescription(prescription.id)}
                      className="bg-primary-900 text-white px-4 py-2 rounded-lg hover:bg-primary-800 transition-colors shadow-md"
                    >
                      Accept Order
                    </button>
                  </div>
                  
                  <div className="mt-3">
                    <h4 className="text-sm font-medium mb-2">Required Herbs:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {prescription.items && prescription.items.map((item, index) => (
                        <div key={index} className="text-sm bg-gray-50 p-3 rounded border">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium">{item.herb_name}</span>
                            <span className="font-bold text-green-600">HK${item.line_total || '0.00'}</span>
                          </div>
                          {item.chinese_name && (
                            <div className="text-gray-600 text-xs mb-1">({item.chinese_name})</div>
                          )}
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Total: {item.total_quantity}g</span>
                            <span>@HK${item.price_per_gram || '0.00'}/g</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {prescription.patient_address && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium">Delivery Address:</h4>
                      <p className="text-sm text-gray-600">{prescription.patient_address}</p>
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

export default SupplierDashboard;