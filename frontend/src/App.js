import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import PractitionerDashboard from './pages/PractitionerDashboard';
import SupplierDashboard from './pages/SupplierDashboard';
import CreatePrescription from './pages/CreatePrescription';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import SupplierComparison from './pages/SupplierComparison';

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && user.user_type !== requiredRole) {
    return <Navigate to="/" />;
  }
  
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              {user?.user_type === 'practitioner' ? <PractitionerDashboard /> : <SupplierDashboard />}
            </ProtectedRoute>
          } />
          
          <Route path="/prescriptions/new" element={
            <ProtectedRoute requiredRole="practitioner">
              <CreatePrescription />
            </ProtectedRoute>
          } />
          
          <Route path="/orders" element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          } />
          
          <Route path="/inventory" element={
            <ProtectedRoute requiredRole="supplier">
              <Inventory />
            </ProtectedRoute>
          } />
          
          <Route path="/prescriptions/:prescriptionId/suppliers" element={
            <ProtectedRoute requiredRole="practitioner">
              <SupplierComparison />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;