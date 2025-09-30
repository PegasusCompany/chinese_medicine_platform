import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [herbs, setHerbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    qualityGrade: '',
    minQuantity: '',
    maxQuantity: '',
    minPrice: '',
    maxPrice: '',
    expiryStatus: '', // all, expiring_soon, expired
    sortBy: 'name', // name, quantity, price, quality, expiry
    sortOrder: 'asc' // asc, desc
  });
  const [aiQuery, setAiQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [newItem, setNewItem] = useState({
    herb_id: '',
    quantity_available: '',
    price_per_gram: '',
    quality_grade: 'A',
    expiry_date: ''
  });

  useEffect(() => {
    fetchInventory();
    fetchHerbs();
  }, []);

  // Apply filters and sorting whenever inventory or filters change
  useEffect(() => {
    applyFiltersAndSort();
  }, [inventory, filters]);

  const applyFiltersAndSort = () => {
    let filtered = [...inventory];

    // Search filter (herb name or Chinese name)
    if (filters.search) {
      filtered = filtered.filter(item =>
        item.herb_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        (item.chinese_name && item.chinese_name.includes(filters.search))
      );
    }

    // Quality grade filter
    if (filters.qualityGrade) {
      filtered = filtered.filter(item => item.quality_grade === filters.qualityGrade);
    }

    // Quantity filters
    if (filters.minQuantity) {
      filtered = filtered.filter(item => parseFloat(item.quantity_available) >= parseFloat(filters.minQuantity));
    }
    if (filters.maxQuantity) {
      filtered = filtered.filter(item => parseFloat(item.quantity_available) <= parseFloat(filters.maxQuantity));
    }

    // Price filters
    if (filters.minPrice) {
      filtered = filtered.filter(item => parseFloat(item.price_per_gram || 0) >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(item => parseFloat(item.price_per_gram || 0) <= parseFloat(filters.maxPrice));
    }

    // Expiry status filter
    if (filters.expiryStatus) {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      filtered = filtered.filter(item => {
        if (!item.expiry_date) return filters.expiryStatus === 'all';
        
        const expiryDate = new Date(item.expiry_date);
        
        if (filters.expiryStatus === 'expired') {
          return expiryDate < today;
        } else if (filters.expiryStatus === 'expiring_soon') {
          return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
        }
        return true;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.herb_name.toLowerCase();
          bValue = b.herb_name.toLowerCase();
          break;
        case 'quantity':
          aValue = parseFloat(a.quantity_available);
          bValue = parseFloat(b.quantity_available);
          break;
        case 'price':
          aValue = parseFloat(a.price_per_gram || 0);
          bValue = parseFloat(b.price_per_gram || 0);
          break;
        case 'quality':
          // A=3, B=2, C=1 for sorting
          const qualityValues = { 'A': 3, 'B': 2, 'C': 1 };
          aValue = qualityValues[a.quality_grade] || 0;
          bValue = qualityValues[b.quality_grade] || 0;
          break;
        case 'expiry':
          aValue = a.expiry_date ? new Date(a.expiry_date) : new Date('9999-12-31');
          bValue = b.expiry_date ? new Date(b.expiry_date) : new Date('9999-12-31');
          break;
        default:
          aValue = a.herb_name.toLowerCase();
          bValue = b.herb_name.toLowerCase();
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredInventory(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      qualityGrade: '',
      minQuantity: '',
      maxQuantity: '',
      minPrice: '',
      maxPrice: '',
      expiryStatus: '',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  const getExpiryStatusCount = (status) => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return inventory.filter(item => {
      if (!item.expiry_date) return false;
      const expiryDate = new Date(item.expiry_date);
      
      if (status === 'expired') {
        return expiryDate < today;
      } else if (status === 'expiring_soon') {
        return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
      }
      return false;
    }).length;
  };

  // AI Query Processing
  const processAiQuery = (query) => {
    const lowerQuery = query.toLowerCase();
    const newFilters = {
      search: '',
      qualityGrade: '',
      minQuantity: '',
      maxQuantity: '',
      minPrice: '',
      maxPrice: '',
      expiryStatus: '',
      sortBy: 'name',
      sortOrder: 'asc'
    };

    // Extract herb names
    const herbNames = ['ginseng', 'astragalus', 'goji', 'reishi', 'cordyceps', 'schisandra'];
    const foundHerb = herbNames.find(herb => lowerQuery.includes(herb));
    if (foundHerb) {
      newFilters.search = foundHerb;
    }

    // Extract quality grades
    if (lowerQuery.includes('grade a') || lowerQuery.includes('premium')) {
      newFilters.qualityGrade = 'A';
    } else if (lowerQuery.includes('grade b') || lowerQuery.includes('standard')) {
      newFilters.qualityGrade = 'B';
    } else if (lowerQuery.includes('grade c') || lowerQuery.includes('basic')) {
      newFilters.qualityGrade = 'C';
    }

    // Extract quantity filters
    const quantityMatch = lowerQuery.match(/(?:under|less than|below)\s*(\d+)/);
    if (quantityMatch) {
      newFilters.maxQuantity = quantityMatch[1];
    }
    const minQuantityMatch = lowerQuery.match(/(?:over|more than|above)\s*(\d+)/);
    if (minQuantityMatch) {
      newFilters.minQuantity = minQuantityMatch[1];
    }
    if (lowerQuery.includes('low stock')) {
      newFilters.maxQuantity = '100';
    }

    // Extract price filters
    const priceMatch = lowerQuery.match(/(?:cost|price).*?(?:over|more than|above)\s*(?:hk\$?)?(\d+(?:\.\d+)?)/);
    if (priceMatch) {
      newFilters.minPrice = priceMatch[1];
    }
    const maxPriceMatch = lowerQuery.match(/(?:cost|price).*?(?:under|less than|below)\s*(?:hk\$?)?(\d+(?:\.\d+)?)/);
    if (maxPriceMatch) {
      newFilters.maxPrice = maxPriceMatch[1];
    }
    if (lowerQuery.includes('expensive') || lowerQuery.includes('costly')) {
      newFilters.sortBy = 'price';
      newFilters.sortOrder = 'desc';
    }
    if (lowerQuery.includes('cheap') || lowerQuery.includes('affordable')) {
      newFilters.sortBy = 'price';
      newFilters.sortOrder = 'asc';
    }

    // Extract expiry filters
    if (lowerQuery.includes('expir') && (lowerQuery.includes('soon') || lowerQuery.includes('this month') || lowerQuery.includes('30 days'))) {
      newFilters.expiryStatus = 'expiring_soon';
    }
    if (lowerQuery.includes('expired')) {
      newFilters.expiryStatus = 'expired';
    }

    // Extract sorting
    if (lowerQuery.includes('sort by name') || lowerQuery.includes('alphabetical')) {
      newFilters.sortBy = 'name';
    }
    if (lowerQuery.includes('sort by quantity') || lowerQuery.includes('by stock')) {
      newFilters.sortBy = 'quantity';
    }
    if (lowerQuery.includes('sort by price')) {
      newFilters.sortBy = 'price';
    }
    if (lowerQuery.includes('highest first') || lowerQuery.includes('descending')) {
      newFilters.sortOrder = 'desc';
    }

    return newFilters;
  };

  const handleAiQuery = (query) => {
    if (!query.trim()) return;
    
    setAiProcessing(true);
    
    // Simulate AI processing delay
    setTimeout(() => {
      const newFilters = processAiQuery(query);
      setFilters(newFilters);
      setAiProcessing(false);
      setShowAiSuggestions(false);
      
      // Show feedback
      const appliedFilters = Object.entries(newFilters).filter(([key, value]) => value !== '' && key !== 'sortBy' && key !== 'sortOrder').length;
      if (appliedFilters > 0) {
        // Could show a toast or feedback message here
      }
    }, 500);
  };

  const getAiSuggestions = (query) => {
    const suggestions = [
      "Show Grade A herbs under 100g",
      "Find ginseng with low stock",
      "What herbs expire this month?",
      "Sort by price, most expensive first",
      "Show all premium quality herbs",
      "Find herbs costing over HK$5 per gram",
      "Low stock items that expire soon",
      "All Grade B herbs sorted by quantity",
      "Expensive herbs in descending order",
      "Show expired inventory items"
    ];

    if (!query) return suggestions.slice(0, 5);
    
    return suggestions.filter(s => 
      s.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 3);
  };

  const handleAiInputChange = (value) => {
    setAiQuery(value);
    if (value.length > 0) {
      setAiSuggestions(getAiSuggestions(value));
      setShowAiSuggestions(true);
    } else {
      setShowAiSuggestions(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/suppliers/inventory`);
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchHerbs = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/suppliers/herbs`);
      setHerbs(response.data);
    } catch (error) {
      console.error('Error fetching herbs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInventory = async (herbId, data) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/suppliers/inventory/${herbId}`, data);
      fetchInventory();
      setEditingItem(null);
      setNewItem({
        herb_id: '',
        quantity_available: '',
        price_per_gram: '',
        quality_grade: 'A',
        expiry_date: ''
      });
    } catch (error) {
      console.error('Error updating inventory:', error);
      alert('Error updating inventory');
    }
  };

  const handleAddNew = async () => {
    if (!newItem.herb_id || !newItem.quantity_available) {
      alert('Please select a herb and enter quantity');
      return;
    }
    
    await handleUpdateInventory(newItem.herb_id, {
      quantity_available: parseFloat(newItem.quantity_available),
      price_per_gram: newItem.price_per_gram ? parseFloat(newItem.price_per_gram) : null,
      quality_grade: newItem.quality_grade,
      expiry_date: newItem.expiry_date || null
    });
  };

  const startEditing = (item) => {
    setEditingItem({
      ...item,
      quantity_available: item.quantity_available.toString(),
      price_per_gram: item.price_per_gram ? item.price_per_gram.toString() : '',
      expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : ''
    });
  };

  const handleEditSave = async () => {
    await handleUpdateInventory(editingItem.herb_id, {
      quantity_available: parseFloat(editingItem.quantity_available),
      price_per_gram: editingItem.price_per_gram ? parseFloat(editingItem.price_per_gram) : null,
      quality_grade: editingItem.quality_grade,
      expiry_date: editingItem.expiry_date || null
    });
  };

  const handleDeleteItem = async (herbId, herbName) => {
    if (!window.confirm(`Are you sure you want to delete "${herbName}" from your inventory? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/suppliers/inventory/${herbId}`);
      fetchInventory(); // Refresh the list
      alert('Inventory item deleted successfully');
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      alert('Error deleting inventory item');
    }
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Inventory Management</h1>

      {/* Filters and Sorting */}
      {inventory.length > 0 && (
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg shadow p-6 mb-6 border-l-4 border-primary-500">
          <h2 className="text-lg font-semibold text-primary-800 mb-4">📊 Filter & Sort Inventory</h2>
          
          {/* Search and Quick Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Search Herbs</label>
              <input
                type="text"
                placeholder="Search by name or Chinese name..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Quality Grade</label>
              <select
                value={filters.qualityGrade}
                onChange={(e) => handleFilterChange('qualityGrade', e.target.value)}
                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
              >
                <option value="">All Grades</option>
                <option value="A">Grade A (Premium)</option>
                <option value="B">Grade B (Standard)</option>
                <option value="C">Grade C (Basic)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Expiry Status</label>
              <select
                value={filters.expiryStatus}
                onChange={(e) => handleFilterChange('expiryStatus', e.target.value)}
                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
              >
                <option value="">All Items</option>
                <option value="expiring_soon">⚠️ Expiring Soon ({getExpiryStatusCount('expiring_soon')})</option>
                <option value="expired">🚨 Expired ({getExpiryStatusCount('expired')})</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Sort By</label>
              <div className="flex space-x-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="flex-1 px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
                >
                  <option value="name">📝 Name</option>
                  <option value="quantity">📦 Quantity</option>
                  <option value="price">💰 Price</option>
                  <option value="quality">⭐ Quality</option>
                  <option value="expiry">📅 Expiry</option>
                </select>
                <button
                  onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  title={`Sort ${filters.sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Min Quantity (g)</label>
              <input
                type="number"
                placeholder="0"
                value={filters.minQuantity}
                onChange={(e) => handleFilterChange('minQuantity', e.target.value)}
                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Max Quantity (g)</label>
              <input
                type="number"
                placeholder="∞"
                value={filters.maxQuantity}
                onChange={(e) => handleFilterChange('maxQuantity', e.target.value)}
                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Min Price (HK$/g)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Max Price (HK$/g)</label>
              <input
                type="number"
                step="0.01"
                placeholder="∞"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
              />
            </div>
          </div>
          
          {/* Filter Summary and Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-primary-200">
            <div className="text-sm text-primary-700">
              <span className="font-medium">Showing {filteredInventory.length} of {inventory.length} items</span>
              {(filters.search || filters.qualityGrade || filters.expiryStatus || filters.minQuantity || filters.maxQuantity || filters.minPrice || filters.maxPrice) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.search && <span className="bg-primary-200 text-primary-800 px-2 py-1 rounded text-xs">Search: {filters.search}</span>}
                  {filters.qualityGrade && <span className="bg-primary-200 text-primary-800 px-2 py-1 rounded text-xs">Grade: {filters.qualityGrade}</span>}
                  {filters.expiryStatus && <span className="bg-primary-200 text-primary-800 px-2 py-1 rounded text-xs">Status: {filters.expiryStatus.replace('_', ' ')}</span>}
                  {(filters.minQuantity || filters.maxQuantity) && <span className="bg-primary-200 text-primary-800 px-2 py-1 rounded text-xs">Quantity: {filters.minQuantity || '0'}-{filters.maxQuantity || '∞'}g</span>}
                  {(filters.minPrice || filters.maxPrice) && <span className="bg-primary-200 text-primary-800 px-2 py-1 rounded text-xs">Price: HK${filters.minPrice || '0'}-{filters.maxPrice || '∞'}</span>}
                </div>
              )}
            </div>
            <button
              onClick={clearFilters}
              className="bg-secondary-500 text-white px-4 py-2 rounded-lg hover:bg-secondary-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* AI Smart Query Section */}
      {inventory.length > 0 && (
        <div className="bg-gradient-to-r from-secondary-50 to-primary-50 rounded-lg shadow p-6 mb-6 border-l-4 border-secondary-400">
          <div className="flex items-center mb-4">
            <h2 className="text-lg font-semibold text-secondary-800">🤖 AI Smart Query</h2>
            <span className="ml-2 bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium">Advanced</span>
          </div>
          
          <div className="relative">
            <div className="flex items-center space-x-3 mb-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Ask me about your inventory... e.g., 'Show Grade A herbs under 100g'"
                  value={aiQuery}
                  onChange={(e) => handleAiInputChange(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAiQuery(aiQuery)}
                  className="w-full px-4 py-3 border-2 border-secondary-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors text-sm"
                  disabled={aiProcessing}
                />
                {aiProcessing && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleAiQuery(aiQuery)}
                disabled={!aiQuery.trim() || aiProcessing}
                className="bg-primary-900 text-white px-6 py-3 rounded-lg hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
              >
                {aiProcessing ? 'Processing...' : 'Search'}
              </button>
            </div>

            {/* AI Suggestions Dropdown */}
            {showAiSuggestions && aiSuggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-secondary-300 rounded-lg shadow-lg mt-1">
                {aiSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-secondary-100 last:border-b-0 text-sm"
                    onClick={() => {
                      setAiQuery(suggestion);
                      handleAiQuery(suggestion);
                    }}
                  >
                    <span className="text-secondary-600">💡</span> {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-sm text-secondary-600 mr-2">Quick actions:</span>
            {[
              "Low stock items",
              "Expiring soon",
              "Grade A herbs",
              "Most expensive",
              "Recently added"
            ].map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  setAiQuery(action);
                  handleAiQuery(action);
                }}
                className="bg-white border border-secondary-300 text-secondary-700 px-3 py-1 rounded-full text-xs hover:bg-secondary-50 hover:border-primary-300 transition-colors"
              >
                {action}
              </button>
            ))}
          </div>

          {/* AI Query Help */}
          <div className="mt-4 p-3 bg-white rounded-lg border border-secondary-200">
            <div className="text-xs text-secondary-600">
              <strong className="text-secondary-800">💡 Try asking:</strong>
              <div className="mt-1 space-y-1">
                <div>"Show Grade A herbs under 100g" • "What expires this month?" • "Sort by price, highest first"</div>
                <div>"Find ginseng with low stock" • "Expensive herbs over HK$10" • "All premium quality items"</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Item */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Herb to Inventory</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Herb</label>
            <select
              value={newItem.herb_id}
              onChange={(e) => setNewItem({...newItem, herb_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
            >
              <option value="">Select Herb</option>
              {herbs.map(herb => (
                <option key={herb.id} value={herb.id}>
                  {herb.name} {herb.chinese_name && `(${herb.chinese_name})`}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Quantity (g)</label>
            <input
              type="number"
              step="0.1"
              value={newItem.quantity_available}
              onChange={(e) => setNewItem({...newItem, quantity_available: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Price per gram</label>
            <input
              type="number"
              step="0.01"
              value={newItem.price_per_gram}
              onChange={(e) => setNewItem({...newItem, price_per_gram: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Quality Grade</label>
            <select
              value={newItem.quality_grade}
              onChange={(e) => setNewItem({...newItem, quality_grade: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
            >
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Expiry Date</label>
            <input
              type="date"
              value={newItem.expiry_date}
              onChange={(e) => setNewItem({...newItem, expiry_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>
        
        <button
          onClick={handleAddNew}
          className="mt-4 bg-primary-900 text-white px-4 py-2 rounded-lg hover:bg-primary-800 transition-colors shadow-md"
        >
          Add to Inventory
        </button>
      </div>

      {/* Current Inventory */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Current Inventory</h2>
        
        {inventory.length === 0 ? (
          <p className="text-gray-500">No inventory items yet. Add some herbs above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Herb Name</th>
                  <th className="px-4 py-2 text-left">Chinese Name</th>
                  <th className="px-4 py-2 text-left">Quantity (g)</th>
                  <th className="px-4 py-2 text-left">Price/g</th>
                  <th className="px-4 py-2 text-left">Quality</th>
                  <th className="px-4 py-2 text-left">Expiry Date</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-secondary-500">
                      {inventory.length === 0 ? (
                        <div>
                          <p className="text-lg mb-2">📦 No inventory items yet</p>
                          <p>Add your first herb to get started!</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-lg mb-2">🔍 No items match your filters</p>
                          <p>Try adjusting your search criteria or clearing filters.</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr key={item.id} className="border-t">
                    {editingItem && editingItem.id === item.id ? (
                      <>
                        <td className="px-4 py-2">{item.herb_name}</td>
                        <td className="px-4 py-2">{item.chinese_name}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="0.1"
                            value={editingItem.quantity_available}
                            onChange={(e) => setEditingItem({...editingItem, quantity_available: e.target.value})}
                            className="w-20 px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="0.01"
                            value={editingItem.price_per_gram}
                            onChange={(e) => setEditingItem({...editingItem, price_per_gram: e.target.value})}
                            className="w-20 px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={editingItem.quality_grade}
                            onChange={(e) => setEditingItem({...editingItem, quality_grade: e.target.value})}
                            className="px-2 py-1 border rounded"
                          >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="date"
                            value={editingItem.expiry_date}
                            onChange={(e) => setEditingItem({...editingItem, expiry_date: e.target.value})}
                            className="px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={handleEditSave}
                            className="bg-success-500 text-white px-2 py-1 rounded-lg text-sm mr-2 hover:bg-success-600 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="bg-secondary-500 text-white px-2 py-1 rounded-lg text-sm hover:bg-secondary-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2 font-medium">{item.herb_name}</td>
                        <td className="px-4 py-2">{item.chinese_name}</td>
                        <td className="px-4 py-2">{item.quantity_available}g</td>
                        <td className="px-4 py-2">
                          {item.price_per_gram ? `$${item.price_per_gram}` : '-'}
                        </td>
                        <td className="px-4 py-2">Grade {item.quality_grade}</td>
                        <td className="px-4 py-2">
                          {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEditing(item)}
                              className="bg-primary-500 text-white px-2 py-1 rounded-lg text-sm hover:bg-primary-600 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.herb_id, item.herb_name)}
                              className="bg-error-500 text-white px-2 py-1 rounded-lg text-sm hover:bg-error-600 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;