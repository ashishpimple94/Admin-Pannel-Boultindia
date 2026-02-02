import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, AlertCircle, Shield, Eye, EyeOff } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, isLoading } = useAdminAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4 py-12 relative overflow-hidden admin-login-container">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
      </div>
      
      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Login Card */}
        <div className="glass-effect rounded-3xl shadow-2xl border border-white/20 overflow-hidden admin-login-card">
          {/* Header Section */}
          <div className="px-8 py-10 text-center">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="relative admin-login-logo">
                <img 
                  src="/logo1.png" 
                  alt="Boult Logo"
                  className="h-16 w-auto object-contain bg-white rounded-xl px-4 py-2 shadow-lg"
                  onError={(e: any) => {
                    e.target.src = "/logo2.png";
                  }}
                />
                <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1">
                  <Shield size={16} className="text-white" />
                </div>
              </div>
            </div>
            
            {/* Welcome Text */}
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-blue-200 text-sm">Please login to Admin Dashboard</p>
            
            {/* Decorative Line */}
            <div className="flex items-center justify-center mt-6 mb-8">
              <div className="h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent w-32"></div>
            </div>
          </div>

          {/* Form Section */}
          <div className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 backdrop-blur-sm animate-slide-up">
                  <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {/* Username Field */}
              <div className="space-y-2">
                <label className="block text-white font-medium text-sm">Username or Email</label>
                <div className="relative">
                  <User size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="admin or admin@boultindia.com"
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all backdrop-blur-sm admin-login-input"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-white font-medium text-sm">Password</label>
                <div className="relative">
                  <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all backdrop-blur-sm admin-login-input"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-75 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] admin-login-button"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    Admin Login
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-white/10 bg-white/5">
            <p className="text-center text-blue-200 text-xs">
              Secure admin access for Boult India management
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 backdrop-blur-sm animate-slide-up">
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-yellow-400" />
            <div>
              <p className="text-yellow-200 text-sm font-semibold">Security Notice</p>
              <p className="text-yellow-300 text-xs mt-1">
                This is a secure admin area. All activities are logged and monitored.
              </p>
            </div>
          </div>
        </div>

        {/* Powered By */}
        <div className="mt-4 text-center animate-fade-in">
          <p className="text-blue-300 text-xs">
            Powered by <span className="font-semibold">V Tech Multi Solutions</span>
          </p>
        </div>
      </div>
    </div>
  );
}