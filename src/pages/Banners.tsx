import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { apiService } from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';

interface Banner {
  id: string;
  title: string;
  image: string;
  link?: string;
  active: boolean;
  order: number;
  createdAt: string;
}

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; bannerId: string }>({ show: false, bannerId: '' });
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'info' });
  
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    link: '',
    active: true,
    order: 0
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const data = await apiService.getBanners();
      setBanners(data);
    } catch (error) {
      console.error('Error fetching banners:', error);
      setToast({ show: true, message: 'Failed to fetch banners', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingBanner) {
        const result = await apiService.updateBanner({ ...formData, id: editingBanner.id });
        if (result.success) {
          setToast({ show: true, message: 'Banner updated successfully!', type: 'success' });
          fetchBanners();
          handleCloseModal();
        } else {
          setToast({ show: true, message: result.error || 'Failed to update banner', type: 'error' });
        }
      } else {
        const result = await apiService.saveBanner(formData);
        if (result.success) {
          setToast({ show: true, message: 'Banner added successfully!', type: 'success' });
          fetchBanners();
          handleCloseModal();
        } else {
          setToast({ show: true, message: result.error || 'Failed to add banner', type: 'error' });
        }
      }
    } catch (error) {
      console.error('Error saving banner:', error);
      setToast({ show: true, message: 'Failed to save banner', type: 'error' });
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      image: banner.image,
      link: banner.link || '',
      active: banner.active,
      order: banner.order
    });
    setShowModal(true);
  };

  const handleDelete = async (bannerId: string) => {
    setDeleteConfirm({ show: true, bannerId });
  };

  const confirmDelete = async () => {
    try {
      const result = await apiService.deleteBanner(deleteConfirm.bannerId);
      if (result.success) {
        setToast({ show: true, message: 'Banner deleted successfully!', type: 'success' });
        fetchBanners();
        setDeleteConfirm({ show: false, bannerId: '' });
      } else {
        setToast({ show: true, message: result.error || 'Failed to delete banner', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
      setToast({ show: true, message: 'Failed to delete banner', type: 'error' });
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      const result = await apiService.updateBanner({ 
        id: banner.id, 
        active: !banner.active 
      });
      if (result.success) {
        setToast({ show: true, message: `Banner ${!banner.active ? 'activated' : 'deactivated'}!`, type: 'success' });
        fetchBanners();
      } else {
        setToast({ show: true, message: result.error || 'Failed to update banner', type: 'error' });
      }
    } catch (error) {
      console.error('Error toggling banner:', error);
      setToast({ show: true, message: 'Failed to update banner', type: 'error' });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBanner(null);
    setFormData({
      title: '',
      image: '',
      link: '',
      active: true,
      order: 0
    });
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading banners...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold text-gray-900">Banner Management</h2>
          <p className="text-gray-600 text-sm font-body mt-1">Manage homepage banners and schemes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white hover:shadow-lg transition font-body font-semibold flex items-center gap-2"
        >
          <Plus size={20} />
          Add New Banner
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <p className="text-blue-800 font-semibold mb-2">📢 Banner Display Info:</p>
        <ul className="text-blue-700 text-sm space-y-1 ml-4">
          <li>• Only <strong>active</strong> banners will be shown on the ecommerce site</li>
          <li>• Banners are displayed in <strong>order</strong> (lower number = shown first)</li>
          <li>• Recommended image size: <strong>1920x600 pixels</strong></li>
          <li>• Supported formats: JPG, PNG, WebP</li>
        </ul>
      </div>

      {/* Banners Grid */}
      <div className="bg-white shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">All Banners ({banners.length})</h3>
        
        {banners.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No banners yet</p>
            <p className="text-gray-500 text-sm mt-2">Click "Add New Banner" to create your first banner</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <div key={banner.id} className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                {/* Banner Image */}
                <div className="relative h-48 bg-gray-100">
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-product.svg';
                    }}
                  />
                  
                  {/* Status Badge */}
                  <div className={`absolute top-2 right-2 px-3 py-1 text-xs font-bold rounded-full ${
                    banner.active 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-500 text-white'
                  }`}>
                    {banner.active ? '✓ Active' : '✕ Inactive'}
                  </div>

                  {/* Order Badge */}
                  <div className="absolute top-2 left-2 bg-blue-500 text-white px-3 py-1 text-xs font-bold rounded-full">
                    Order: {banner.order}
                  </div>
                </div>

                {/* Banner Info */}
                <div className="p-4">
                  <h4 className="font-bold text-gray-900 mb-2 line-clamp-1">{banner.title}</h4>
                  {banner.link && (
                    <p className="text-xs text-gray-600 mb-3 line-clamp-1">
                      🔗 {banner.link}
                    </p>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(banner)}
                      className={`flex-1 py-2 text-xs font-semibold rounded transition ${
                        banner.active
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {banner.active ? <EyeOff size={14} className="inline mr-1" /> : <Eye size={14} className="inline mr-1" />}
                      {banner.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleEdit(banner)}
                      className="flex-1 bg-blue-50 text-blue-600 py-2 text-xs font-semibold rounded hover:bg-blue-100 transition"
                    >
                      <Edit2 size={14} className="inline mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="flex-1 bg-red-50 text-red-600 py-2 text-xs font-semibold rounded hover:bg-red-100 transition"
                    >
                      <Trash2 size={14} className="inline mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Banner Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingBanner ? 'Edit Banner' : 'Add New Banner'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Banner Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., Summer Sale 2024"
              required
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Image URL *
            </label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., /Bner1.png or https://example.com/banner.jpg"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Upload image to public folder or use external URL
            </p>
          </div>

          {/* Link (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Link URL (Optional)
            </label>
            <input
              type="text"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., /products or https://example.com"
            />
          </div>

          {/* Order */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Display Order
            </label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="0"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lower number = shown first (0, 1, 2, ...)
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <label htmlFor="active" className="text-sm font-semibold text-gray-700">
              Active (Show on website)
            </label>
          </div>

          {/* Preview */}
          {formData.image && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Preview
              </label>
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                <img
                  src={formData.image}
                  alt="Banner preview"
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-product.svg';
                  }}
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3 rounded-lg hover:shadow-lg transition font-semibold"
            >
              {editingBanner ? 'Update Banner' : 'Add Banner'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="Delete Banner"
        message="Are you sure you want to delete this banner? This action cannot be undone."
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ show: false, bannerId: '' })}
      />

      {/* Toast */}
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
