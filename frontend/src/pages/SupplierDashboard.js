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
    try {
      const estimatedCompletion = new Date();
      estimatedCompletion.setDate(estimatedCompletion.getDate() + 3); // 3 days from now
      
      await axios.post(`${process.env.REACT_APP_API_URL}/api/orders/accept/${prescriptionId}`, {
        estimated_completion: estimatedCompletion.toISOString(),
        total_amount: 0, // You can calculate this based on your pricing
        notes: 'Order accepted and will be processed soon'
      });
      
      // Refresh the list
      fetchAvailablePrescriptions();
      alert('Prescription accepted successfully!');
    } catch (error) {
      console.error('Error accepting prescription:', error);
      alert('Error accepting prescription. Please try again.');
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      const estimatedCompletion = new Date();
      estimatedCompletion.setDate(estimatedCompletion.getDate() + 3);
      
      await axios.put(`${process.env.REACT_APP_API_URL}/api/orders/${orderId}/accept`, {
        estimated_completion: estimatedCompletion.toISOString(),
        notes: 'Order confirmed by supplier'
      });
      
      fetchPendingOrders();
      alert('Order accepted successfully!');
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Error accepting order. Please try again.');
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
                        <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          URGENT - CONFIRM NOW
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Patient: {order.patient_name}</p>
                      <p className="text-sm text-gray-600">Treatment: {order.treatment_days} days</p>
                      <p className="text-sm text-gray-600">Practitioner: {order.practitioner_name}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => acceptOrder(order.id)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                      >
                        ✓ Accept Order
                      </button>
                      <button
                        onClick={() => rejectOrder(order.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                      >
                        ✗ Reject Order
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <h4 className="text-sm font-medium mb-2">Required Herbs:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {order.items && order.items.map((item, index) => (
                        <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                          <span className="font-medium">{item.herb_name}</span>
                          {item.chinese_name && (
                            <span className="text-gray-600"> ({item.chinese_name})</span>
                          )}
                          <br />
                          <span className="text-gray-600">Total needed: {item.total_quantity}g</span>
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

        {/* Filters for Available Prescriptions */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="date">Date (Newest First)</option>
                <option value="practitioner">Practitioner Name</option>
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

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Practitioner:</span>
              <select
                value={filters.practitioner}
                onChange={(e) => handleFilterChange('practitioner', e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="">All Practitioners</option>
                {uniquePractitioners.map(practitioner => (
                  <option key={practitioner} value={practitioner}>{practitioner}</option>
                ))}
              </select>
            </div>

            <button
              onClick={clearFilters}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              Clear Filters
            </button>

            <div className="ml-auto text-sm text-gray-600">
              Showing {filteredPrescriptions.length} of {prescriptions.length} prescriptions
            </div>
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
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
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
                        Treatment: {prescription.treatment_days} days
                      </p>
                    </div>
                    <button
                      onClick={() => acceptPrescription(prescription.id)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Accept Order
                    </button>
                  </div>
                  
                  <div className="mt-3">
                    <h4 className="text-sm font-medium mb-2">Required Herbs:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {prescription.items && prescription.items.map((item, index) => (
                        <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                          <span className="font-medium">{item.herb_name}</span>
                          {item.chinese_name && (
                            <span className="text-gray-600"> ({item.chinese_name})</span>
                          )}
                          <br />
                          <span className="text-gray-600">
                            Total needed: {item.total_quantity}g
                          </span>
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