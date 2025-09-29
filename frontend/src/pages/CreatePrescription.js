import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import HerbAutocomplete from '../components/HerbAutocomplete';

const CreatePrescription = () => {
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_phone: '',
    patient_address: '',
    patient_dob: '',
    symptoms: '',
    diagnosis: '',
    treatment_days: 7,
    notes: ''
  });
  
  const [items, setItems] = useState([
    { herb_id: null, herb_name: '', chinese_name: '', quantity_per_day: '', notes: '', display_name: '' }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleHerbSelect = (index, herbData) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      herb_id: herbData.herb_id,
      herb_name: herbData.herb_name,
      chinese_name: herbData.chinese_name,
      display_name: `${herbData.herb_name} (${herbData.chinese_name || 'N/A'})`
    };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { herb_id: null, herb_name: '', chinese_name: '', quantity_per_day: '', notes: '', display_name: '' }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate items
    const validItems = items.filter(item => (item.herb_name || item.display_name) && item.quantity_per_day);
    if (validItems.length === 0) {
      setError('Please add at least one herb with quantity');
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/prescriptions`, {
        ...formData,
        items: validItems.map(item => ({
          ...item,
          quantity_per_day: parseFloat(item.quantity_per_day)
        }))
      });

      navigate('/');
    } catch (error) {
      setError(error.response?.data?.error || 'Error creating prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create New Prescription</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Patient Name *
            </label>
            <input
              type="text"
              name="patient_name"
              value={formData.patient_name}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              name="patient_dob"
              value={formData.patient_dob}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Patient Phone
            </label>
            <input
              type="tel"
              name="patient_phone"
              value={formData.patient_phone}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Treatment Days *
            </label>
            <input
              type="number"
              name="treatment_days"
              value={formData.treatment_days}
              onChange={handleFormChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
              required
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Patient Address
          </label>
          <textarea
            name="patient_address"
            value={formData.patient_address}
            onChange={handleFormChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
            rows="2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Symptoms & Clinical Presentation *
            </label>
            <textarea
              name="symptoms"
              value={formData.symptoms}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
              rows="4"
              placeholder="e.g., Fatigue, insomnia, cold hands and feet, pale tongue..."
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              TCM Diagnosis
            </label>
            <textarea
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
              rows="4"
              placeholder="e.g., Kidney Yang Deficiency, Spleen Qi Deficiency..."
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Herbs</h3>
            <button
              type="button"
              onClick={addItem}
              className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
            >
              Add Herb
            </button>
          </div>
          
          {items.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Herb Name (English or Chinese) *
                  </label>
                  <HerbAutocomplete
                    value={item.display_name || item.herb_name}
                    onChange={(value) => handleItemChange(index, 'display_name', value)}
                    onSelect={(herbData) => handleHerbSelect(index, herbData)}
                    placeholder="Type herb name in English or Chinese (e.g., Ginseng or 人参)"
                    required
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Start typing to see suggestions. Supports both English and Chinese names.
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Quantity per Day (grams) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={item.quantity_per_day}
                    onChange={(e) => handleItemChange(index, 'quantity_per_day', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
                    placeholder="e.g., 10"
                  />
                </div>
                
                <div className="flex items-end">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Notes for this herb
                </label>
                <input
                  type="text"
                  value={item.notes}
                  onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
                  placeholder="Special instructions..."
                />
              </div>
              
              {item.quantity_per_day && (
                <div className="mt-2 text-sm text-gray-600">
                  Total quantity needed: {(parseFloat(item.quantity_per_day) * formData.treatment_days).toFixed(1)}g
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            General Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleFormChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
            rows="3"
            placeholder="Any special instructions or notes..."
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-500 text-white px-6 py-2 rounded hover:bg-primary-600 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Prescription'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePrescription;