import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Menu, X, LogOut, User } from 'lucide-react';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Banners from './pages/Banners';
import './App.css';

function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-blue-600 to-blue-800 text-white transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="p-4 border-b border-blue-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo1.png" 
              alt="Boult Logo"
              className="h-8 w-auto object-contain bg-white rounded px-1"
              onError={(e: any) => {
                e.target.src = "/logo2.png";
              }}
            />
            {sidebarOpen && <h1 className="text-xl font-heading font-bold">Admin</h1>}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-blue-700 transition"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-3 p-3 hover:bg-blue-700 transition font-body font-medium rounded-lg"
          >
            <span className="text-xl">📊</span>
            {sidebarOpen && <span>Dashboard</span>}
          </Link>
          <Link
            to="/orders"
            className="flex items-center gap-3 p-3 hover:bg-blue-700 transition font-body font-medium rounded-lg"
          >
            <span className="text-xl">📦</span>
            {sidebarOpen && <span>Orders</span>}
          </Link>
          <Link
            to="/products"
            className="flex items-center gap-3 p-3 hover:bg-blue-700 transition font-body font-medium rounded-lg"
          >
            <span className="text-xl">🛍️</span>
            {sidebarOpen && <span>Products</span>}
          </Link>
          <Link
            to="/banners"
            className="flex items-center gap-3 p-3 hover:bg-blue-700 transition font-body font-medium rounded-lg"
          >
            <span className="text-xl">🎨</span>
            {sidebarOpen && <span>Banners</span>}
          </Link>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-blue-700">
          {sidebarOpen && user && (
            <div className="mb-3 p-2 bg-blue-700 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <User size={16} />
                <span className="text-sm font-semibold">{user.name}</span>
              </div>
              <p className="text-xs text-blue-200">{user.role.replace('_', ' ').toUpperCase()}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 hover:bg-red-600 transition font-body font-medium rounded-lg w-full text-left"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-md p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/logo1.png" 
                alt="Boult Logo"
                className="h-10 w-auto object-contain"
                onError={(e: any) => {
                  e.target.src = "/logo2.png";
                }}
              />
              <div>
                <h2 className="text-2xl font-heading font-bold text-gray-800">Boult India</h2>
                <p className="text-sm text-gray-600 font-body">Admin Dashboard</p>
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-lg">
                <User size={20} className="text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/products" element={<Products />} />
            <Route path="/banners" element={<Banners />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AdminAuthProvider>
  );
}

export default App;
