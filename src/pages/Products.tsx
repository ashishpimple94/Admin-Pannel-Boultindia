import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Upload } from 'lucide-react';
import { apiService } from '../services/api';
import { uploadToImgBB, EXISTING_PRODUCT_IMAGES } from '../services/imageUpload';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  featured: boolean;
  onSale: boolean;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'polish',
    image: '',
    featured: false,
    onSale: false,
  });
  const [specifications, setSpecifications] = useState<string[]>(['']);
  const [directions, setDirections] = useState<string[]>(['']);
  const [benefits, setBenefits] = useState<string[]>(['']);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [packs, setPacks] = useState<Array<{ name: string; price: string }>>([{ name: '', price: '' }]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; productId: string }>({ show: false, productId: '' });
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'info' });

  const categories = ['polish', 'spray', 'cleaner', 'mask', 'soap', 'lubricant', 'treatment', 'kit', 'cloth', 'restorer', 'coolant', 'repellent', 'paint', 'wash', 'dresser', 'coating'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const products = await apiService.getProducts();
      setProducts(products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      setToast({ show: true, message: 'Uploading image...', type: 'info' });

      const result = await uploadToImgBB(file);

      if (result.success && result.url) {
        setFormData(prev => ({ ...prev, image: result.url! }));
        setImagePreview(result.url);
        setToast({ show: true, message: 'Image uploaded successfully!', type: 'success' });
      } else {
        setToast({ show: true, message: result.error || 'Upload failed', type: 'error' });
      }
    } catch (error) {
      console.error('Image upload error:', error);
      setToast({ show: true, message: 'Failed to upload image', type: 'error' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      setToast({ show: true, message: 'Name and price are required', type: 'error' });
      return;
    }

    const validPacks = packs.filter(p => p.name && p.price);
    const validSpecs = specifications.filter(s => s.trim());
    const validDirections = directions.filter(d => d.trim());
    const validBenefits = benefits.filter(b => b.trim());

    try {
      let result;
      const productData = {
        ...formData,
        image: formData.image || '/placeholder-product.svg', // Use selected image or placeholder
        variants: validPacks,
        specifications: validSpecs,
        directions: validDirections,
        benefits: validBenefits
      };

      if (editingProduct) {
        result = await apiService.updateProduct({ id: editingProduct.id, ...productData });
      } else {
        result = await apiService.saveProduct(productData);
      }

      if (result.success) {
        fetchProducts();
        resetForm();
        setToast({ show: true, message: editingProduct ? 'Product updated!' : 'Product added!', type: 'success' });
      } else {
        setToast({ show: true, message: result.error || 'Failed to save product', type: 'error' });
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setToast({ show: true, message: 'Failed to save product', type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirm({ show: true, productId: id });
  };

  const confirmDelete = async () => {
    try {
      const result = await apiService.deleteProduct(deleteConfirm.productId);
      
      if (result.success) {
        fetchProducts();
        setDeleteConfirm({ show: false, productId: '' });
        setToast({ show: true, message: 'Product deleted!', type: 'success' });
      } else {
        setToast({ show: true, message: result.error || 'Failed to delete product', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setToast({ show: true, message: 'Failed to delete product', type: 'error' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'polish',
      image: '',
      featured: false,
      onSale: false,
    });
    setPacks([{ name: '', price: '' }]);
    setSpecifications(['']);
    setDirections(['']);
    setBenefits(['']);
    setImageFile(null);
    setImagePreview('');
    setEditingProduct(null);
    setShowAddForm(false);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          filteredProducts.map((product: any) => (
            <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              {/* Image */}
              <div className="h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                <img
                  src={product.image || '/placeholder-product.svg'}
                  alt={product.name}
                  className="w-full h-full object-contain p-4"
                />
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                  <div className="flex gap-1">
                    {product.featured && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                        Featured
                      </span>
                    )}
                    {product.onSale && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                        Sale
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

                <div className="flex justify-between items-center mb-3">
                  <span className="text-xl font-bold text-blue-600">₹{product.price}</span>
                  <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                    {product.category}
                  </span>
                </div>

                {/* Variants */}
                {product.variants && product.variants.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Variants:</p>
                    <div className="flex flex-wrap gap-1">
                      {product.variants.map((variant: any, idx: number) => (
                        <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {variant.name} - ₹{variant.price}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingProduct(product);
                      setFormData({
                        name: product.name,
                        description: product.description,
                        price: product.price.toString(),
                        category: product.category,
                        image: product.image,
                        featured: product.featured,
                        onSale: product.onSale,
                      });
                      if (product.variants) {
                        setPacks(product.variants);
                      }
                      setShowAddForm(true);
                    }}
                    className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded text-sm hover:bg-blue-100 flex items-center justify-center gap-1"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 bg-red-50 text-red-600 py-2 px-3 rounded text-sm hover:bg-red-100 flex items-center justify-center gap-1"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Form Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => resetForm()}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
            <div className="space-y-3">
              {/* Option 1: Upload New Image */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition">
                <label className="cursor-pointer block">
                  <div className="flex flex-col items-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Click to upload new image</span>
                    <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 32MB</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              </div>

              {/* Option 2: Select Existing Image */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Or select existing image:</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  onChange={(e) => {
                    if (e.target.value) {
                      setFormData(prev => ({ ...prev, image: e.target.value }));
                      setImagePreview('');
                    }
                  }}
                  value={formData.image && formData.image.startsWith('/') ? formData.image : ''}
                  disabled={uploadingImage}
                >
                  <option value="">Select from existing images...</option>
                  {EXISTING_PRODUCT_IMAGES.map((img) => (
                    <option key={img.value} value={img.value}>
                      {img.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Option 3: Manual URL Input */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Or enter image URL:</label>
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.png"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={uploadingImage}
                />
              </div>

              {/* Image Preview */}
              {(imagePreview || formData.image) && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2">Preview:</p>
                  <img
                    src={imagePreview || formData.image}
                    alt="Preview"
                    className="h-32 w-32 object-contain border rounded mx-auto"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-product.svg';
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-2 break-all">{formData.image}</p>
                </div>
              )}

              {uploadingImage && (
                <div className="text-center py-2">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <p className="text-sm text-gray-600 mt-2">Uploading...</p>
                </div>
              )}
            </div>
          </div>

          {/* Specifications */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Specifications</label>
              <button
                type="button"
                onClick={() => setSpecifications([...specifications, ''])}
                className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded hover:bg-green-200"
              >
                + Add Spec
              </button>
            </div>
            <div className="space-y-2">
              {specifications.map((spec, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., Penetrates deep through rust"
                    value={spec}
                    onChange={(e) => {
                      const newSpecs = [...specifications];
                      newSpecs[idx] = e.target.value;
                      setSpecifications(newSpecs);
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  {specifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSpecifications(specifications.filter((_, i) => i !== idx))}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Directions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Directions for Use</label>
              <button
                type="button"
                onClick={() => setDirections([...directions, ''])}
                className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded hover:bg-purple-200"
              >
                + Add Direction
              </button>
            </div>
            <div className="space-y-2">
              {directions.map((direction, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., Shake the can thoroughly before use"
                    value={direction}
                    onChange={(e) => {
                      const newDirections = [...directions];
                      newDirections[idx] = e.target.value;
                      setDirections(newDirections);
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  {directions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setDirections(directions.filter((_, i) => i !== idx))}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Benefits</label>
              <button
                type="button"
                onClick={() => setBenefits([...benefits, ''])}
                className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded hover:bg-yellow-200"
              >
                + Add Benefit
              </button>
            </div>
            <div className="space-y-2">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., Protects against rust formation"
                    value={benefit}
                    onChange={(e) => {
                      const newBenefits = [...benefits];
                      newBenefits[idx] = e.target.value;
                      setBenefits(newBenefits);
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  {benefits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setBenefits(benefits.filter((_, i) => i !== idx))}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Variants Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Product Variants</label>
              <button
                type="button"
                onClick={() => setPacks([...packs, { name: '', price: '' }])}
                className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200"
              >
                + Add Variant
              </button>
            </div>
            <div className="space-y-2">
              {packs.map((pack, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., 100ml, 500ml"
                    value={pack.name}
                    onChange={(e) => {
                      const newPacks = [...packs];
                      newPacks[idx].name = e.target.value;
                      setPacks(newPacks);
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={pack.price}
                    onChange={(e) => {
                      const newPacks = [...packs];
                      newPacks[idx].price = e.target.value;
                      setPacks(newPacks);
                    }}
                    className="w-20 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  {packs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setPacks(packs.filter((_, i) => i !== idx))}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleInputChange}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Featured Product</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="onSale"
                checked={formData.onSale}
                onChange={handleInputChange}
                className="rounded"
              />
              <span className="text-sm text-gray-700">On Sale</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              {editingProduct ? 'Update Product' : 'Add Product'}
            </button>
            <button
              type="button"
              onClick={() => resetForm()}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ show: false, productId: '' })}
      />

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