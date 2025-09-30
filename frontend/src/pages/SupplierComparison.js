import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SupplierComparison = () => {
  const { prescriptionId } = useParams();
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  
  // Filter and sort states
  const [filters, setFilters] = useState({
    maxPrice: '',
    minQualityGrade: '',
    sortBy: 'price' // price, quality, name
  });

  useEffect(() => {
    fetchSuppliers();
    fetchPrescription();
  }, [prescriptionId]);

  // Apply filters and sorting whenever suppliers or filters change
  useEffect(() => {
    applyFiltersAndSort();
  }, [suppliers, filters]);

  const applyFiltersAndSort = () => {
    let filtered = [...suppliers];

    // Filter by maximum price
    if (filters.maxPrice) {
      filtered = filtered.filter(supplier => 
        supplier.estimated_total <= parseFloat(filters.maxPrice)
      );
    }

    // Filter by minimum quality grade
    if (filters.minQualityGrade) {
      filtered = filtered.filter(supplier => {
        const supplierGrades = supplier.herb_details.map(herb => herb.quality_grade);
        const hasRequiredGrade = supplierGrades.some(grade => {
          if (filters.minQualityGrade === 'A') return grade === 'A';
          if (filters.minQualityGrade === 'B') return grade === 'A' || grade === 'B';
          if (filters.minQualityGrade === 'C') return true;
          return true;
        });
        return hasRequiredGrade;
      });
    }

    // Sort suppliers
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price':
          return a.estimated_total - b.estimated_total;
        case 'price_desc':
          return b.estimated_total - a.estimated_total;
        case 'quality':
          const aQuality = getAverageQualityScore(a.herb_details);
          const bQuality = getAverageQualityScore(b.herb_details);
          return bQuality - aQuality; // Higher quality first
        case 'name':
          return a.supplier_name.localeCompare(b.supplier_name);
        default:
          return a.estimated_total - b.estimated_total;
      }
    });

    setFilteredSuppliers(filtered);
  };

  const getAverageQualityScore = (herbDetails) => {
    const scores = herbDetails.map(herb => {
      switch (herb.quality_grade) {
        case 'A': return 3;
        case 'B': return 2;
        case 'C': return 1;
        default: return 1;
      }
    });
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      maxPrice: '',
      minQualityGrade: '',
      sortBy: 'price'
    });
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/prescriptions/${prescriptionId}/suppliers`);
      setSuppliers(response.data);
      setFilteredSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrescription = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/prescriptions`);
      const prescriptions = response.data;
      const currentPrescription = prescriptions.find(p => p.id === parseInt(prescriptionId));
      setPrescription(currentPrescription);
    } catch (error) {
      console.error('Error fetching prescription:', error);
    }
  };

  const selectSupplier = async (supplierId) => {
    try {
      const supplier = suppliers.find(s => s.supplier_id === supplierId);
      
      if (!supplier) {
        alert('Supplier not found. Please try again.');
        return;
      }
      
      await axios.post(`${process.env.REACT_APP_API_URL}/api/prescriptions/${prescriptionId}/select-supplier`, {
        supplier_id: supplierId,
        total_amount: supplier.estimated_total,
        notes: `Order placed through supplier comparison. Selected: ${supplier.supplier_name}`
      });
      
      alert(`Order placed with ${supplier.supplier_name} successfully!`);
      navigate('/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      const errorMessage = error.response?.data?.error || 'Error placing order. Please try again.';
      alert(errorMessage);
    }
  };

  const getQualityColor = (grade) => {
    const colors = {
      'A': 'bg-green-100 text-green-800',
      'B': 'bg-yellow-100 text-yellow-800',
      'C': 'bg-orange-100 text-orange-800'
    };
    return colors[grade] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="text-center">Loading supplier comparison...</div>;
  }

  if (suppliers.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Supplier Comparison</h1>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p className="font-bold">No suppliers available</p>
          <p>No suppliers currently have all the required herbs in sufficient quantities for this prescription.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 bg-primary-900 text-white px-4 py-2 rounded-lg hover:bg-primary-800 transition-colors shadow-md"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Supplier Comparison</h1>
        <button 
          onClick={() => navigate('/')}
          className="text-primary-600 hover:text-primary-700"
        >
          ← Back to Dashboard
        </button>
      </div>

      {prescription && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Prescription Details</h2>
          <p><strong>Patient:</strong> {prescription.patient_name}</p>
          <p><strong>Treatment Days:</strong> {prescription.treatment_days}</p>
          <div className="mt-3">
            <h3 className="font-medium mb-2">Required Herbs:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {prescription.items && prescription.items.map((item, index) => (
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
        </div>
      )}

      {/* Smart Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">🔍 Smart Filters & Sorting</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Max Price Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Budget (HK$)
            </label>
            <input
              type="number"
              placeholder="e.g., 100"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Quality Grade Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Quality
            </label>
            <select
              value={filters.minQualityGrade}
              onChange={(e) => handleFilterChange('minQualityGrade', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
            >
              <option value="">Any Quality</option>
              <option value="C">Grade C or better</option>
              <option value="B">Grade B or better</option>
              <option value="A">Grade A only</option>
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
              <option value="price">Price (Low to High)</option>
              <option value="price_desc">Price (High to Low)</option>
              <option value="quality">Quality (Best First)</option>
              <option value="name">Supplier Name (A-Z)</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full bg-secondary-500 text-white px-4 py-2 rounded-lg hover:bg-secondary-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Filter Results Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredSuppliers.length} of {suppliers.length} suppliers
          {filters.maxPrice && ` • Budget: ≤HK$${filters.maxPrice}`}
          {filters.minQualityGrade && ` • Quality: Grade ${filters.minQualityGrade}+`}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">
          Available Suppliers ({filteredSuppliers.length})
          {filteredSuppliers.length !== suppliers.length && (
            <span className="text-sm text-gray-500 ml-2">
              (filtered from {suppliers.length} total)
            </span>
          )}
        </h2>
        
        {filteredSuppliers.length === 0 ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <p className="font-bold">No suppliers match your filters</p>
            <p>Try adjusting your budget or quality requirements.</p>
            <button 
              onClick={clearFilters}
              className="mt-2 bg-primary-900 text-white px-4 py-2 rounded-lg hover:bg-primary-800 transition-colors shadow-md"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          filteredSuppliers.map((supplier, index) => (
          <div key={supplier.supplier_id} className="bg-white rounded-lg shadow-lg p-6 relative">
            {/* Ranking Badge */}
            {index === 0 && filters.sortBy === 'price' && (
              <div className="absolute top-4 right-4 bg-success-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                💰 BEST PRICE
              </div>
            )}
            {index === 0 && filters.sortBy === 'quality' && (
              <div className="absolute top-4 right-4 bg-primary-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                ⭐ BEST QUALITY
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-primary-600">{supplier.supplier_name}</h3>
                <p className="text-gray-600">{supplier.address}</p>
                <p className="text-gray-600">{supplier.phone}</p>
                
                {/* Quality Summary */}
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Quality:</span>
                  {[...new Set(supplier.herb_details.map(h => h.quality_grade))].map(grade => (
                    <span key={grade} className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityColor(grade)}`}>
                      Grade {grade}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  HK${supplier.estimated_total}
                </div>
                <p className="text-sm text-gray-600">Total Cost</p>
                
                {/* Price Comparison */}
                {suppliers.length > 1 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {supplier.estimated_total === Math.min(...suppliers.map(s => s.estimated_total)) && (
                      <span className="text-green-600 font-medium">Lowest Price</span>
                    )}
                    {supplier.estimated_total === Math.max(...suppliers.map(s => s.estimated_total)) && (
                      <span className="text-red-600 font-medium">Highest Price</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">Herb Details & Pricing:</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Herb</th>
                      <th className="px-3 py-2 text-left">Required</th>
                      <th className="px-3 py-2 text-left">Available</th>
                      <th className="px-3 py-2 text-left">Price/g</th>
                      <th className="px-3 py-2 text-left">Quality</th>
                      <th className="px-3 py-2 text-left">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplier.herb_details.map((herb, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-3 py-2">
                          <div>
                            <span className="font-medium">{herb.herb_name}</span>
                            {herb.chinese_name && (
                              <div className="text-gray-500 text-xs">{herb.chinese_name}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">{herb.required_quantity}g</td>
                        <td className="px-3 py-2">
                          <span className={herb.available_quantity >= herb.required_quantity ? 'text-green-600' : 'text-red-600'}>
                            {herb.available_quantity}g
                          </span>
                        </td>
                        <td className="px-3 py-2">HK${herb.price_per_gram}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityColor(herb.quality_grade)}`}>
                            Grade {herb.quality_grade}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-medium">HK${herb.line_total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-600">
                <p>All herbs available in sufficient quantities</p>
                <p>Quality grades: {[...new Set(supplier.herb_details.map(h => h.quality_grade))].join(', ')}</p>
              </div>
              <button
                onClick={() => selectSupplier(supplier.supplier_id)}
                className="bg-primary-900 text-white px-6 py-2 rounded-lg hover:bg-primary-800 font-medium transition-colors shadow-md"
              >
                Select This Supplier
              </button>
            </div>
          </div>
          ))
        )}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">💡 Smart Selection Guide:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <h4 className="font-medium mb-2">Quality Grades:</h4>
            <ul className="space-y-1">
              <li>• <strong>Grade A:</strong> Premium quality, highest standards</li>
              <li>• <strong>Grade B:</strong> Good quality, reliable for most treatments</li>
              <li>• <strong>Grade C:</strong> Basic quality, budget-friendly option</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Selection Tips:</h4>
            <ul className="space-y-1">
              <li>• Use filters to find suppliers within your budget</li>
              <li>• Sort by quality for critical treatments</li>
              <li>• Consider price vs quality balance</li>
              <li>• All suppliers have sufficient inventory</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierComparison;