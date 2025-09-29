import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    // Practitioner filters
    patient: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    dobFrom: '',
    dobTo: '',
    phone: '',
    address: '',
    symptoms: '',
    diagnosis: '',
    // Supplier filters
    priority: 'urgent', // urgent, active, all, completed
    sortBy: 'priority', // priority, date, patient, value
    dateRange: '30' // 7, 30, 90, all
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  // Set smart default priority when orders are first loaded (for suppliers)
  useEffect(() => {
    if (user.user_type === 'supplier' && orders.length > 0 && filters.priority === 'urgent') {
      const smartPriority = getSmartDefaultPriority();
      if (smartPriority !== 'urgent') {
        setFilters(prev => ({
          ...prev,
          priority: smartPriority
        }));
      }
    }
  }, [orders.length > 0]); // Only run when orders are first loaded

  // Apply filters whenever orders or filters change
  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  // Smart priority adjustment when orders change (for suppliers)
  useEffect(() => {
    if (user.user_type === 'supplier' && orders.length > 0) {
      const currentPriority = filters.priority;
      const smartPriority = getSmartDefaultPriority();
      
      // Auto-adjust if current filter shows no results but smart priority would show results
      if (currentPriority === 'urgent' && getUrgentOrdersCount() === 0 && smartPriority !== 'urgent') {
        setFilters(prev => ({
          ...prev,
          priority: smartPriority
        }));
      }
    }
  }, [orders, user.user_type]);

  const applyFilters = () => {
    let filtered = [...orders];

    if (user.user_type === 'practitioner') {
      // Practitioner filters (existing logic)
      if (filters.patient) {
        filtered = filtered.filter(order => 
          order.patient_name.toLowerCase().includes(filters.patient.toLowerCase())
        );
      }

      if (filters.status) {
        filtered = filtered.filter(order => order.status === filters.status);
      }

      if (filters.dateFrom) {
        filtered = filtered.filter(order => 
          new Date(order.created_at) >= new Date(filters.dateFrom)
        );
      }

      if (filters.dateTo) {
        filtered = filtered.filter(order => 
          new Date(order.created_at) <= new Date(filters.dateTo + 'T23:59:59')
        );
      }

      if (filters.dobFrom) {
        filtered = filtered.filter(order => 
          order.patient_dob && new Date(order.patient_dob) >= new Date(filters.dobFrom)
        );
      }

      if (filters.dobTo) {
        filtered = filtered.filter(order => 
          order.patient_dob && new Date(order.patient_dob) <= new Date(filters.dobTo)
        );
      }

      if (filters.phone) {
        filtered = filtered.filter(order => 
          order.patient_phone && order.patient_phone.toLowerCase().includes(filters.phone.toLowerCase())
        );
      }

      if (filters.address) {
        filtered = filtered.filter(order => 
          order.patient_address && order.patient_address.toLowerCase().includes(filters.address.toLowerCase())
        );
      }

      if (filters.symptoms) {
        filtered = filtered.filter(order => 
          order.symptoms && order.symptoms.toLowerCase().includes(filters.symptoms.toLowerCase())
        );
      }

      if (filters.diagnosis) {
        filtered = filtered.filter(order => 
          order.diagnosis && order.diagnosis.toLowerCase().includes(filters.diagnosis.toLowerCase())
        );
      }
    } else if (user.user_type === 'supplier') {
      // Supplier priority-based filtering
      if (filters.priority === 'urgent') {
        filtered = filtered.filter(order => 
          ['pending_confirmation', 'cancellation_requested', 'accepted'].includes(order.status)
        );
      } else if (filters.priority === 'active') {
        filtered = filtered.filter(order => 
          ['accepted', 'preparing', 'packed', 'shipped'].includes(order.status)
        );
      } else if (filters.priority === 'completed') {
        filtered = filtered.filter(order => 
          ['delivered', 'completed'].includes(order.status)
        );
      }
      // 'all' shows everything

      // Date range filter for suppliers
      if (filters.dateRange !== 'all') {
        const daysAgo = parseInt(filters.dateRange);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        
        filtered = filtered.filter(order => 
          new Date(order.created_at) >= cutoffDate
        );
      }

      // Sort supplier orders
      filtered.sort((a, b) => {
        if (filters.sortBy === 'priority') {
          // Priority order for suppliers
          const priorityOrder = {
            'pending_confirmation': 1,
            'cancellation_requested': 2,
            'accepted': 3,
            'preparing': 4,
            'packed': 5,
            'shipped': 6,
            'delivered': 7,
            'completed': 8
          };
          const aPriority = priorityOrder[a.status] || 8;
          const bPriority = priorityOrder[b.status] || 8;
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          return new Date(b.created_at) - new Date(a.created_at);
        } else if (filters.sortBy === 'date') {
          return new Date(b.created_at) - new Date(a.created_at);
        } else if (filters.sortBy === 'patient') {
          return a.patient_name.localeCompare(b.patient_name);
        } else if (filters.sortBy === 'value') {
          return (b.total_amount || 0) - (a.total_amount || 0);
        }
        return 0;
      });
    }

    setFilteredOrders(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    if (user.user_type === 'practitioner') {
      setFilters({
        patient: '',
        status: '',
        dateFrom: '',
        dateTo: '',
        dobFrom: '',
        dobTo: '',
        phone: '',
        address: '',
        symptoms: '',
        diagnosis: '',
        priority: 'urgent',
        sortBy: 'priority',
        dateRange: '30'
      });
    } else {
      setFilters({
        patient: '',
        status: '',
        dateFrom: '',
        dateTo: '',
        dobFrom: '',
        dobTo: '',
        phone: '',
        address: '',
        symptoms: '',
        diagnosis: '',
        priority: 'urgent',
        sortBy: 'priority',
        dateRange: '30'
      });
    }
  };

  const getUrgentOrdersCount = () => {
    return orders.filter(order => 
      ['pending_confirmation', 'cancellation_requested', 'accepted'].includes(order.status)
    ).length;
  };

  const getActiveOrdersCount = () => {
    return orders.filter(order => 
      ['accepted', 'preparing', 'packed', 'shipped'].includes(order.status)
    ).length;
  };

  // Smart priority selection: urgent -> active -> all
  const getSmartDefaultPriority = () => {
    if (getUrgentOrdersCount() > 0) return 'urgent';
    if (getActiveOrdersCount() > 0) return 'active';
    return 'all';
  };

  // Get unique patient names for filter dropdown
  const uniquePatients = [...new Set(orders.map(order => order.patient_name))].sort();

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/orders`);
      setOrders(response.data);
      setFilteredOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/orders/${orderId}/status`, {
        status: newStatus
      });
      fetchOrders(); // Refresh the list
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      accepted: 'bg-blue-100 text-blue-800',
      preparing: 'bg-yellow-100 text-yellow-800',
      packed: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-green-200 text-green-900',
      cancellation_requested: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      accepted: 'preparing',
      preparing: 'packed',
      packed: 'shipped',
      shipped: 'delivered',
      delivered: 'completed'
    };
    return statusFlow[currentStatus];
  };

  const getPreviousStatus = (currentStatus) => {
    const reverseStatusFlow = {
      preparing: 'accepted',
      packed: 'preparing',
      shipped: 'packed',
      delivered: 'shipped'
      // Note: No reverse from 'completed' - it's final
    };
    return reverseStatusFlow[currentStatus];
  };

  const isOrderCompleted = (status) => {
    return status === 'completed';
  };

  const isOrderFinal = (status) => {
    return ['completed', 'rejected'].includes(status);
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to reject this order? This will return the prescription to the practitioner for supplier reselection.')) {
      return;
    }

    try {
      const reason = prompt('Please provide a reason for rejecting this order:');
      await axios.put(`${process.env.REACT_APP_API_URL}/api/orders/${orderId}/reject`, {
        reason: reason || 'Rejected by supplier'
      });
      fetchOrders(); // Refresh the list
      alert('Order rejected successfully. The prescription has been returned to the practitioner.');
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Error rejecting order');
    }
  };

  const requestCancellation = async (orderId) => {
    const reason = prompt('This order has been confirmed. Please provide a detailed reason for requesting cancellation (this will notify the practitioner):');
    
    if (!reason || reason.trim() === '') {
      alert('A reason is required for cancellation requests.');
      return;
    }

    if (!window.confirm('This will send a cancellation request to the practitioner. The order will remain active until the practitioner approves the cancellation. Continue?')) {
      return;
    }

    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/orders/${orderId}/request-cancellation`, {
        reason: reason
      });
      fetchOrders();
      alert('Cancellation request sent to practitioner. The order remains active until approved.');
    } catch (error) {
      console.error('Error requesting cancellation:', error);
      alert('Error sending cancellation request');
    }
  };

  const approveCancellation = async (orderId) => {
    const reason = prompt('Please provide a reason for approving this cancellation (optional):');
    
    if (!window.confirm('Approving this cancellation will return the prescription to pending status so you can select another supplier. Continue?')) {
      return;
    }

    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/orders/${orderId}/approve-cancellation`, {
        reason: reason || 'Approved by practitioner'
      });
      fetchOrders();
      alert('Cancellation approved. You can now select another supplier for this prescription.');
    } catch (error) {
      console.error('Error approving cancellation:', error);
      alert('Error approving cancellation');
    }
  };

  const denyCancellation = async (orderId) => {
    const reason = prompt('Please provide a reason for denying this cancellation:');
    
    if (!reason || reason.trim() === '') {
      alert('A reason is required for denying cancellation requests.');
      return;
    }

    if (!window.confirm('Denying this cancellation means the supplier must fulfill the order. Continue?')) {
      return;
    }

    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/orders/${orderId}/deny-cancellation`, {
        reason: reason
      });
      fetchOrders();
      alert('Cancellation request denied. The supplier must fulfill the order.');
    } catch (error) {
      console.error('Error denying cancellation:', error);
      alert('Error denying cancellation');
    }
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {user.user_type === 'supplier' ? 'Order Management' : 'Order History & Status'}
          </h1>
          {user.user_type === 'supplier' && getUrgentOrdersCount() > 0 && (
            <p className="text-sm text-orange-600 mt-1">
              {getUrgentOrdersCount()} order{getUrgentOrdersCount() !== 1 ? 's' : ''} require{getUrgentOrdersCount() === 1 ? 's' : ''} immediate attention
            </p>
          )}
        </div>
      </div>

      {/* Smart Filters for Suppliers */}
      {user.user_type === 'supplier' && orders.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🎯 Order Management Filters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority View
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
              >
                <option value="urgent">🔥 Urgent Actions ({getUrgentOrdersCount()})</option>
                <option value="active">⚡ Active Orders ({getActiveOrdersCount()})</option>
                <option value="completed">✅ Completed Orders</option>
                <option value="all">📋 All Orders ({orders.length})</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
              >
                <option value="priority">Priority (Urgent First)</option>
                <option value="date">Date (Newest First)</option>
                <option value="patient">Patient Name</option>
                <option value="value">Order Value</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Period
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Reset Filters
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600">
              <div>Showing {filteredOrders.length} of {orders.length} orders</div>
              <div className="flex flex-wrap gap-2 mt-1">
                {filters.priority !== 'all' && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {filters.priority === 'urgent' ? '🔥 Urgent Actions' : 
                     filters.priority === 'active' ? '⚡ Active Orders' : 
                     '✅ Completed Orders'}
                  </span>
                )}
                {filters.dateRange !== 'all' && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    Last {filters.dateRange} days
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters for Practitioners */}
      {user.user_type === 'practitioner' && orders.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔍 Advanced Patient & Order Search</h2>
          
          {/* Basic Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Patient Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient Name
              </label>
              <select
                value={filters.patient}
                onChange={(e) => handleFilterChange('patient', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
              >
                <option value="">All Patients</option>
                {uniquePatients.map(patient => (
                  <option key={patient} value={patient}>{patient}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
              >
                <option value="">All Statuses</option>
                <option value="accepted">Accepted</option>
                <option value="preparing">Preparing</option>
                <option value="packed">Packed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Patient Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient Phone
              </label>
              <input
                type="text"
                placeholder="Search by phone..."
                value={filters.phone}
                onChange={(e) => handleFilterChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Patient Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient Address
              </label>
              <input
                type="text"
                placeholder="Search by address..."
                value={filters.address}
                onChange={(e) => handleFilterChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {/* Date Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Order Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Date From
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Order Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Date To
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Patient DOB From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient DOB From
              </label>
              <input
                type="date"
                value={filters.dobFrom}
                onChange={(e) => handleFilterChange('dobFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Patient DOB To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient DOB To
              </label>
              <input
                type="date"
                value={filters.dobTo}
                onChange={(e) => handleFilterChange('dobTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {/* Clinical Search Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Symptoms Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Symptoms Search
              </label>
              <input
                type="text"
                placeholder="Search symptoms (e.g., fatigue, insomnia)..."
                value={filters.symptoms}
                onChange={(e) => handleFilterChange('symptoms', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Diagnosis Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diagnosis Search
              </label>
              <input
                type="text"
                placeholder="Search diagnosis (e.g., Kidney Yang Deficiency)..."
                value={filters.diagnosis}
                onChange={(e) => handleFilterChange('diagnosis', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600">
              <div>Showing {filteredOrders.length} of {orders.length} orders</div>
              <div className="flex flex-wrap gap-2 mt-1">
                {filters.patient && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Patient: {filters.patient}</span>}
                {filters.status && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Status: {filters.status}</span>}
                {filters.phone && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Phone: {filters.phone}</span>}
                {filters.symptoms && <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Symptoms: {filters.symptoms}</span>}
                {filters.diagnosis && <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Diagnosis: {filters.diagnosis}</span>}
              </div>
            </div>
            <button
              onClick={clearFilters}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.length === 0 ? (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <p className="font-bold">No orders match your filters</p>
              <p>Try adjusting your search criteria.</p>
              <button 
                onClick={clearFilters}
                className="mt-2 bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            filteredOrders.map((order, index) => {
              const isUrgent = ['pending_confirmation', 'cancellation_requested', 'accepted'].includes(order.status);
              const isHighPriority = ['pending_confirmation', 'cancellation_requested'].includes(order.status);
              const isReadyForCompletion = order.status === 'delivered';
              
              return (
            <div key={order.id} className={`bg-white rounded-lg shadow p-6 ${
              user.user_type === 'supplier' && isUrgent 
                ? 'border-l-4 border-l-orange-400 bg-orange-50' 
                : user.user_type === 'supplier' && isReadyForCompletion
                ? 'border-l-4 border-l-green-400 bg-green-50'
                : ''
            }`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold">Order #{order.id}</h3>
                    {user.user_type === 'supplier' && isHighPriority && (
                      <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                        🚨 URGENT
                      </span>
                    )}
                    {user.user_type === 'supplier' && isUrgent && !isHighPriority && (
                      <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        ⚡ ACTION NEEDED
                      </span>
                    )}
                    {user.user_type === 'supplier' && isReadyForCompletion && (
                      <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        🎯 READY TO COMPLETE
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">Patient: {order.patient_name}</p>
                  {order.patient_dob && (
                    <p className="text-gray-600 text-sm">
                      DOB: {new Date(order.patient_dob).toLocaleDateString()} 
                      (Age: {Math.floor((new Date() - new Date(order.patient_dob)) / (365.25 * 24 * 60 * 60 * 1000))})
                    </p>
                  )}
                  {order.patient_phone && (
                    <p className="text-gray-600 text-sm">Phone: {order.patient_phone}</p>
                  )}
                  {user.user_type === 'practitioner' ? (
                    <p className="text-gray-600">Supplier: {order.supplier_name}</p>
                  ) : (
                    <p className="text-gray-600">Practitioner: {order.practitioner_name}</p>
                  )}
                  <p className="text-gray-600">Treatment: {order.treatment_days} days</p>
                </div>
                
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </span>
                  
                  {user.user_type === 'supplier' && (
                    <div className="mt-2 space-y-2">
                      {/* Forward Status Button - Regular workflow */}
                      {getNextStatus(order.status) && order.status !== 'delivered' && (
                        <div>
                          <button
                            onClick={() => updateOrderStatus(order.id, getNextStatus(order.status))}
                            className="bg-primary-500 text-white px-3 py-1 rounded text-sm hover:bg-primary-600 mr-2"
                          >
                            Mark as {getNextStatus(order.status).replace('_', ' ')}
                          </button>
                        </div>
                      )}

                      {/* Completed Button - Only for delivered orders */}
                      {order.status === 'delivered' && (
                        <div>
                          <button
                            onClick={() => {
                              if (window.confirm('Confirm that the customer has received the herbs and the order is complete? This action cannot be undone.')) {
                                updateOrderStatus(order.id, 'completed');
                              }
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 mr-2 font-semibold"
                          >
                            ✅ Mark as Completed
                          </button>
                          <p className="text-xs text-gray-600 mt-1">
                            Click when customer has received the herbs
                          </p>
                        </div>
                      )}
                      
                      {/* Reverse Status Button */}
                      {getPreviousStatus(order.status) && (
                        <div>
                          <button
                            onClick={() => updateOrderStatus(order.id, getPreviousStatus(order.status))}
                            className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 mr-2"
                          >
                            Revert to {getPreviousStatus(order.status).replace('_', ' ')}
                          </button>
                        </div>
                      )}
                      
                      {/* Cancel Order Button - Only for pending_confirmation status */}
                      {user.user_type === 'supplier' && order.status === 'pending_confirmation' && (
                        <div>
                          <button
                            onClick={() => cancelOrder(order.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                          >
                            Reject Order
                          </button>
                        </div>
                      )}
                      
                      {/* Emergency cancellation for confirmed orders (requires special handling) */}
                      {user.user_type === 'supplier' && ['accepted', 'preparing'].includes(order.status) && (
                        <div>
                          <button
                            onClick={() => requestCancellation(order.id)}
                            className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
                          >
                            Request Cancellation
                          </button>
                        </div>
                      )}
                      
                      {/* Practitioner cancellation approval buttons */}
                      {user.user_type === 'practitioner' && order.status === 'cancellation_requested' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => approveCancellation(order.id)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                          >
                            ✓ Approve Cancellation
                          </button>
                          <button
                            onClick={() => denyCancellation(order.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                          >
                            ✗ Deny Cancellation
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2">Herbs Required:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {order.items && order.items.map((item, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <span className="font-medium">{item.herb_name}</span>
                      {item.chinese_name && (
                        <span className="text-gray-600"> ({item.chinese_name})</span>
                      )}
                      <br />
                      <span className="text-sm text-gray-600">
                        Total: {item.total_quantity}g
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Order Date:</span><br />
                  {new Date(order.created_at).toLocaleDateString()}
                </div>
                
                {order.estimated_completion && (
                  <div>
                    <span className="font-medium">Estimated Completion:</span><br />
                    {new Date(order.estimated_completion).toLocaleDateString()}
                  </div>
                )}
                
                {order.actual_completion && (
                  <div>
                    <span className="font-medium">Completed:</span><br />
                    {new Date(order.actual_completion).toLocaleDateString()}
                  </div>
                )}
              </div>

              {order.total_amount && (
                <div className="mt-4 pt-4 border-t">
                  <span className="font-medium">Total Amount: ${order.total_amount}</span>
                </div>
              )}

              {/* Clinical Information */}
              {user.user_type === 'practitioner' && (order.symptoms || order.diagnosis) && (
                <div className="mt-4 pt-4 border-t bg-blue-50 p-3 rounded">
                  <h4 className="font-medium text-blue-800 mb-2">Clinical Information</h4>
                  {order.symptoms && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-blue-700">Symptoms:</span>
                      <p className="text-sm text-blue-600">{order.symptoms}</p>
                    </div>
                  )}
                  {order.diagnosis && (
                    <div>
                      <span className="text-sm font-medium text-blue-700">Diagnosis:</span>
                      <p className="text-sm text-blue-600">{order.diagnosis}</p>
                    </div>
                  )}
                </div>
              )}

              {order.notes && (
                <div className="mt-4 pt-4 border-t">
                  <span className="font-medium">Notes:</span>
                  <p className="text-gray-600 mt-1">{order.notes}</p>
                </div>
              )}
            </div>
            );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Orders;