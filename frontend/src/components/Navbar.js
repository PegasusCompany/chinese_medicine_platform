import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl font-bold text-primary-600">
            中医平台 Chinese Medicine Platform
          </Link>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-600">
                  Welcome, {user.name} ({user.user_type})
                </span>
                
                <Link 
                  to="/" 
                  className="text-primary-600 hover:text-primary-700"
                >
                  Dashboard
                </Link>
                
                {user.user_type === 'practitioner' && (
                  <Link 
                    to="/prescriptions/new" 
                    className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
                  >
                    New Prescription
                  </Link>
                )}
                
                <Link 
                  to="/orders" 
                  className="text-primary-600 hover:text-primary-700"
                >
                  Orders
                </Link>
                
                {user.user_type === 'supplier' && (
                  <Link 
                    to="/inventory" 
                    className="text-primary-600 hover:text-primary-700"
                  >
                    Inventory
                  </Link>
                )}
                
                <button 
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="space-x-2">
                <Link 
                  to="/login" 
                  className="text-primary-600 hover:text-primary-700"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;