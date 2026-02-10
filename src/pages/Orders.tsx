import React, { useState, useEffect } from 'react';
import { Search, Filter, Trash2, Clock, CheckCircle, Truck, Package, FileText } from 'lucide-react';
import { apiService } from '../services/api';
import Invoice from '../components/Invoice';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import CancellationNotification from '../components/CancellationNotification';

interface Order {
  id: string;
  customer: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  amount: number;
  status: string;
  date: string;
  items: any[];
  paymentMethod?: string;
  cancelReason?: string;
  cancelledAt?: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [cancelledOrderAlert, setCancelledOrderAlert] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; orderId: string }>({ show: false, orderId: '' });
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'info' });
  const [previousOrders, setPreviousOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Reduced to 30 seconds for Render
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      console.log('🔍 Orders Page: Fetching orders...');
      const newOrders = await apiService.getOrders();
      console.log('🔍 Orders Page: Received orders:', newOrders);
      console.log('🔍 Orders Page: Orders count:', newOrders.length);
      
      // Check for new orders
      if (previousOrderCount > 0 && newOrders.length > previousOrderCount) {
        setNewOrderAlert(true);
        setToast({
          show: true,
          message: `🎉 New order received! Total orders: ${newOrders.length}`,
          type: 'success'
        });
        
        // Auto-hide alert after 5 seconds
        setTimeout(() => {
          setNewOrderAlert(false);
          setToast({ show: false, message: '', type: 'info' });
        }, 5000);
      }
      
      setOrders(newOrders);
      setPreviousOrderCount(newOrders.length);
      
      // Check for cancelled orders
      if (previousOrders.length > 0) {
        const newlyCancelled = newOrders.filter((order: Order) => 
          order.status === 'cancelled' && 
          !previousOrders.find((prev: Order) => prev.id === order.id && prev.status === 'cancelled')
        );
        
        if (newlyCancelled.length > 0) {
          const cancelledOrder = newlyCancelled[0];
          setCancelledOrderAlert(cancelledOrder.id);
          setToast({
            show: true,
            message: `🚨 Order ${cancelledOrder.id} was cancelled by ${cancelledOrder.customer}`,
            type: 'error'
          });
          
          setTimeout(() => {
            setCancelledOrderAlert(null);
          }, 10000);
        }
      }
      
      setPreviousOrders(newOrders);
      console.log('🔍 Orders Page: State updated with', newOrders.length, 'orders');
    } catch (error) {
      console.error('❌ Orders Page: Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodDisplay = (paymentMethod: string) => {
    switch(paymentMethod) {
      case 'cod': return { text: 'Cash on Delivery', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: '💵' };
      case 'card': return { text: 'Credit/Debit Card', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: '💳' };
      case 'upi': return { text: 'UPI Payment', color: 'bg-green-100 text-green-800 border-green-300', icon: '📱' };
      case 'netbanking': return { text: 'Net Banking', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: '🏦' };
      default: return { text: 'Unknown', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: '❓' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending': return <Clock size={16} />;
      case 'processing': return <Package size={16} />;
      case 'shipped': return <Truck size={16} />;
      case 'delivered': return <CheckCircle size={16} />;
      case 'cancelled': return <span className="text-red-600">✕</span>;
      default: return <Package size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'delivered': return 'bg-green-100 text-green-800 border-green-300';
      case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (orderId: string) => {
    setDeleteConfirm({ show: true, orderId });
  };

  const confirmDelete = async () => {
    try {
      const result = await apiService.deleteOrder(deleteConfirm.orderId);
      
      if (result.success) {
        setOrders(orders.filter((o: any) => o.id !== deleteConfirm.orderId));
        setSelectedOrder(null);
        setDeleteConfirm({ show: false, orderId: '' });
        setToast({ show: true, message: 'Order deleted successfully!', type: 'success' });
      } else {
        setToast({ show: true, message: result.error || 'Failed to delete order', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      setToast({ show: true, message: 'Failed to delete order', type: 'error' });
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const result = await apiService.updateOrder(orderId, { status: newStatus });
      
      if (result.success) {
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        setToast({ show: true, message: 'Order status updated successfully!', type: 'success' });
      } else {
        setToast({ show: true, message: result.error || 'Failed to update order status', type: 'error' });
      }
    } catch (error) {
      console.error('Error updating order:', error);
      setToast({ show: true, message: 'Failed to update order status', type: 'error' });
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold text-gray-900 flex items-center gap-3">
            Orders Management
            {newOrderAlert && (
              <span className="bg-green-500 text-white px-3 py-1 text-sm font-body animate-pulse">
                🔔 New Order!
              </span>
            )}
          </h2>
          <p className="text-gray-600 text-sm font-body mt-1">Total: {filteredOrders.length} orders</p>
        </div>
        <button
          onClick={fetchOrders}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg transition font-body font-semibold"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by Order ID, Customer, or Email..."
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600" />
            <select
              value={filterStatus}
              onChange={(e: any) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h3>
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No orders found</p>
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
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order: any) => {
                  const paymentDisplay = getPaymentMethodDisplay(order.paymentMethod || 'unknown');
                  return (
                  <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{order.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.customer}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">₹{order.amount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 text-xs font-bold border flex items-center gap-2 w-fit ${paymentDisplay.color}`}>
                        <span>{paymentDisplay.icon}</span>
                        {paymentDisplay.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-4 py-2 text-xs font-bold border flex items-center gap-2 w-fit ${getStatusColor(order.status || 'pending')}`}>
                        {getStatusIcon(order.status || 'pending')}
                        {(order.status || 'pending').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(order.date).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 transition font-semibold text-xs"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowInvoice(true);
                        }}
                        className="px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 transition font-semibold text-xs"
                      >
                        <FileText size={14} className="inline mr-1" />
                        Invoice
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 transition font-semibold text-xs"
                      >
                        <Trash2 size={14} className="inline mr-1" />
                        Delete
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <Modal
        isOpen={!!selectedOrder && !showInvoice}
        onClose={() => setSelectedOrder(null)}
        title="Order Details"
        size="lg"
      >
        {selectedOrder && (
          <div className="p-6 space-y-6">
            {/* Order ID and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-semibold">Order ID</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{selectedOrder.id}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-semibold">Order Date</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{new Date(selectedOrder.date).toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            {/* Payment Method */}
            {selectedOrder.paymentMethod && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 font-semibold mb-2">Payment Method</p>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                    {selectedOrder.paymentMethod === 'cod' && 'Cash on Delivery'}
                    {selectedOrder.paymentMethod === 'card' && 'Credit/Debit Card'}
                    {selectedOrder.paymentMethod === 'upi' && 'UPI'}
                    {selectedOrder.paymentMethod === 'netbanking' && 'Net Banking'}
                  </span>
                </div>
              </div>
            )}

            {/* Cancellation Info - Show if order is cancelled */}
            {selectedOrder.status === 'cancelled' && (selectedOrder as any).cancelReason && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-gray-600 font-semibold mb-2">Cancellation Details</p>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-gray-600">Reason:</span>
                    <p className="font-semibold text-red-800">{(selectedOrder as any).cancelReason}</p>
                  </div>
                  {(selectedOrder as any).cancelledAt && (
                    <div>
                      <span className="text-xs text-gray-600">Cancelled On:</span>
                      <p className="font-semibold text-gray-900">
                        {new Date((selectedOrder as any).cancelledAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status Update */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600 font-semibold mb-2">Update Status</p>
              <select
                value={selectedOrder.status}
                onChange={(e: any) => handleStatusUpdate(selectedOrder.id, e.target.value)}
                className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Customer Information */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-bold text-gray-900 mb-3">Customer Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.customer}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">City</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.city}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-bold text-gray-900 mb-4">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition">
                      <div className="flex gap-4">
                        {/* Product Image */}
                        {item.image && (
                          <div className="w-20 h-20 bg-white rounded-lg border border-gray-300 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        
                        {/* Product Details */}
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600 mt-1">Variant: <span className="font-semibold text-gray-900">{item.variant || 'Default'}</span></p>
                          <p className="text-sm text-gray-600">Quantity: <span className="font-semibold text-gray-900">{item.quantity}</span></p>
                          <div className="flex gap-4 mt-2">
                            <p className="text-sm text-gray-600">Unit Price: <span className="font-bold text-blue-600">₹{item.price ? item.price.toLocaleString('en-IN') : '0'}</span></p>
                            <p className="text-sm text-gray-600">Total: <span className="font-bold text-blue-700">₹{item.price && item.quantity ? (item.price * item.quantity).toLocaleString('en-IN') : '0'}</span></p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery Address */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-bold text-gray-900 mb-3">Delivery Address</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-900 font-semibold">{selectedOrder.address}</p>
                <p className="text-gray-700 mt-1">{selectedOrder.city}, {selectedOrder.state} {selectedOrder.pincode}</p>
              </div>
            </div>

            {/* Shipping Charges - Admin can add manually */}
            <div className="border-t border-gray-200 pt-4">
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <label className="block text-sm text-gray-700 font-semibold mb-2">
                  Shipping Charges (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={(selectedOrder as any).shippingCharges || 0}
                  onChange={(e) => {
                    const charges = parseFloat(e.target.value) || 0;
                    setSelectedOrder({ ...selectedOrder, shippingCharges: charges } as any);
                  }}
                  onBlur={async () => {
                    // Save shipping charges to backend
                    try {
                      await apiService.updateOrder(selectedOrder.id, {
                        shippingCharges: (selectedOrder as any).shippingCharges || 0
                      });
                      fetchOrders();
                      setToast({ show: true, message: 'Shipping charges updated!', type: 'success' });
                    } catch (error) {
                      setToast({ show: true, message: 'Failed to update shipping charges', type: 'error' });
                    }
                  }}
                  className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-lg"
                  placeholder="Enter shipping charges"
                />
                <p className="text-xs text-gray-600 mt-2">
                  💡 Based on customer address, add appropriate shipping charges
                </p>
              </div>
            </div>

            {/* Order Amount */}
            <div className="border-t border-gray-200 pt-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm text-gray-600 font-semibold">Subtotal</span>
                  <span className="text-lg font-bold text-gray-900">₹{selectedOrder.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center bg-orange-50 p-3 rounded-lg">
                  <span className="text-sm text-gray-600 font-semibold">Shipping Charges</span>
                  <span className="text-lg font-bold text-orange-600">₹{((selectedOrder as any).shippingCharges || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-300">
                  <span className="text-base text-gray-700 font-bold">Grand Total</span>
                  <span className="text-3xl font-bold text-blue-600">
                    ₹{(selectedOrder.amount + ((selectedOrder as any).shippingCharges || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => handleDelete(selectedOrder.id)}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-semibold"
              >
                Delete Order
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Invoice Modal */}
      <Modal
        isOpen={showInvoice && !!selectedOrder}
        onClose={() => setShowInvoice(false)}
        title="Invoice"
        size="xl"
      >
        {selectedOrder && (
          <div className="p-6">
            <Invoice order={selectedOrder} showPrintButton={true} />
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action cannot be undone."
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ show: false, orderId: '' })}
      />

      {/* Cancellation Notification */}
      {cancelledOrderAlert && (
        <CancellationNotification
          orderId={cancelledOrderAlert}
          customerName={orders.find(o => o.id === cancelledOrderAlert)?.customer || 'Customer'}
          onClose={() => setCancelledOrderAlert(null)}
        />
      )}

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
