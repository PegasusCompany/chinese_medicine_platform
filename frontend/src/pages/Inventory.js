import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [herbs, setHerbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
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
          className="mt-4 bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
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
                {inventory.map((item) => (
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
                            className="bg-green-500 text-white px-2 py-1 rounded text-sm mr-2 hover:bg-green-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="bg-gray-500 text-white px-2 py-1 rounded text-sm hover:bg-gray-600"
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
                              className="bg-primary-500 text-white px-2 py-1 rounded text-sm hover:bg-primary-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.herb_id, item.herb_name)}
                              className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;