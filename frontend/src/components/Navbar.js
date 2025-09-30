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
    <nav className="bg-gradient-to-r from-primary-900 to-primary-800 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl font-bold text-white hover:text-primary-100 transition-colors">
            中医平台 Chinese Medicine Platform
          </Link>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-primary-100">
                  Welcome, {user.name} ({user.user_type})
                </span>
                
                <Link 
                  to="/" 
                  className="text-white hover:text-primary-200 transition-colors"
                >
                  Dashboard
                </Link>
                
                {user.user_type === 'practitioner' && (
                  <Link 
                    to="/prescriptions/new" 
                    className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-400 transition-colors shadow-md"
                  >
                    New Prescription
                  </Link>
                )}
                
                <Link 
                  to="/orders" 
                  className="text-white hover:text-primary-200 transition-colors"
                >
                  Orders
                </Link>
                
                {user.user_type === 'supplier' && (
                  <Link 
                    to="/inventory" 
                    className="text-white hover:text-primary-200 transition-colors"
                  >
                    Inventory
                  </Link>
                )}
                
                <button 
                  onClick={handleLogout}
                  className="text-primary-200 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="space-x-2">
                <Link 
                  to="/login" 
                  className="text-white hover:text-primary-200 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-400 transition-colors shadow-md"
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