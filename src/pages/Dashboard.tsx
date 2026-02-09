import { useState, useEffect } from 'react';
import { TrendingUp, Package, Clock, Users, ShoppingCart, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { apiService } from '../services/api';

interface Order {
  id: string;
  customer: string;
  email: string;
  amount: number;
  status: string;
  date: string;
  address: string;
  phone: string;
  items?: any[];
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    uniqueCustomers: 0,
    completedOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Reduced to 15 seconds to be gentler on Render
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      console.log('📊 Dashboard: Fetching orders...');
      const allOrders = await apiService.getOrders();
      console.log('📊 Dashboard: Received', allOrders.length, 'orders');
      
      // Backend is connected if we got data
      setBackendConnected(true);
      
      // Check for new orders
      if (previousOrderCount > 0 && allOrders.length > previousOrderCount) {
        setNewOrderAlert(true);
        
        // Auto-hide alert after 5 seconds
        setTimeout(() => {
          setNewOrderAlert(false);
        }, 5000);
      }
      
      setOrders(allOrders.slice(0, 10));
      setPreviousOrderCount(allOrders.length);
      setLastUpdate(new Date().toLocaleTimeString('en-IN'));

      // Calculate stats
      const totalRevenue = allOrders.reduce((sum: number, order: Order) => sum + (order.amount || 0), 0);
      const totalOrders = allOrders.length;
      const pendingOrders = allOrders.filter((o: Order) => o.status === 'pending').length;
      const completedOrders = allOrders.filter((o: Order) => o.status === 'delivered').length;
      const uniqueCustomers = new Set(allOrders.map((o: Order) => o.email)).size;

      console.log('📊 Dashboard Stats:', { totalRevenue, totalOrders, pendingOrders, completedOrders, uniqueCustomers });

      setStats({
        totalRevenue,
        totalOrders,
        pendingOrders,
        uniqueCustomers,
        completedOrders,
      });
    } catch (error) {
      console.error('❌ Dashboard: Error fetching data:', error);
      setBackendConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'delivered': return 'bg-green-100 text-green-800 border-green-300';
      case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'pending': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPaymentMethodDisplay = (paymentMethod: string) => {
    switch(paymentMethod) {
      case 'cod': return { text: 'COD', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: '💵' };
      case 'card': return { text: 'Card', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: '💳' };
      case 'upi': return { text: 'UPI', color: 'bg-green-100 text-green-800 border-green-300', icon: '📱' };
      case 'netbanking': return { text: 'Net Banking', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: '🏦' };
      default: return { text: 'Unknown', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: '❓' };
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Connection Status - Only show if disconnected */}
      {!backendConnected && (
        <div className="p-4 flex items-center gap-3 bg-yellow-50 border border-yellow-200">
          <WifiOff className="text-yellow-600" size={20} />
          <div>
            <p className="text-yellow-800 font-body font-semibold">Connecting to Backend...</p>
            <p className="text-yellow-700 text-sm font-body">Please wait, fetching data...</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg p-6 border-l-4 border-blue-600 hover:shadow-xl transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-body font-semibold">Total Revenue</p>
              <p className="text-3xl font-heading font-bold text-gray-900 mt-2">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
            </div>
            <TrendingUp className="text-blue-600" size={40} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 shadow-lg p-6 border-l-4 border-green-600 hover:shadow-xl transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-body font-semibold">Total Orders</p>
              <p className="text-3xl font-heading font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
            </div>
            <ShoppingCart className="text-green-600" size={40} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-lg p-6 border-l-4 border-yellow-600 hover:shadow-xl transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-body font-semibold">Pending Orders</p>
              <p className="text-3xl font-heading font-bold text-gray-900 mt-2">{stats.pendingOrders}</p>
            </div>
            <Clock className="text-yellow-600" size={40} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg p-6 border-l-4 border-purple-600 hover:shadow-xl transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Completed</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completedOrders}</p>
            </div>
            <Package className="text-purple-600" size={40} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-pink-100 shadow-lg p-6 border-l-4 border-pink-600 hover:shadow-xl transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Customers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.uniqueCustomers}</p>
            </div>
            <Users className="text-pink-600" size={40} />
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-heading font-bold text-gray-900 flex items-center gap-3">
            Recent Orders
            {newOrderAlert && (
              <span className="bg-green-500 text-white px-3 py-1 text-sm font-body animate-pulse">
                🔔 New Order!
              </span>
            )}
          </h3>
          <button onClick={fetchData} className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
            ↻ Refresh
          </button>
        </div>
        
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Order ID</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Payment</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const paymentDisplay = getPaymentMethodDisplay((order as any).paymentMethod || 'unknown');
                  return (
                  <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{order.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.customer}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">₹{order.amount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 text-xs font-bold border flex items-center gap-1 w-fit ${paymentDisplay.color}`}>
                        <span>{paymentDisplay.icon}</span>
                        {paymentDisplay.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-4 py-2 text-xs font-bold border ${getStatusColor(order.status || 'pending')}`}>
                        {(order.status || 'pending').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(order.date).toLocaleDateString('en-IN')}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
