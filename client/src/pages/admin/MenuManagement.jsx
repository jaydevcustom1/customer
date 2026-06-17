import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Search, Upload, Check, AlertCircle } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { useCart } from '../../context/CartContext';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Table, { TableRow, TableCell } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

const MenuManagement = () => {
  const toast = useToast();
  const { settings } = useCart();

  const [activeTab, setActiveTab] = useState('products'); // products, categories
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Edit states
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  // Forms states
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', stock: '0', categoryId: '', status: true, image: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  const [categoryForm, setCategoryForm] = useState({
    name: '', description: '', status: true
  });

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('qr_admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [prodRes, catRes] = await Promise.all([
        axios.get(`${backendUrl}/api/products`, config),
        axios.get(`${backendUrl}/api/categories`, config)
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Fetch menu data error:', err);
      toast.error('Failed to load menu items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Product CRUD
  const handleOpenProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock: product.stock.toString(),
        categoryId: product.categoryId,
        status: product.status,
        image: null
      });
      setImagePreview(product.image ? (product.image.startsWith('/uploads/') ? `${backendUrl}${product.image}` : product.image) : null);
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '', description: '', price: '', stock: '10', categoryId: categories[0]?.id || '', status: true, image: null
      });
      setImagePreview(null);
    }
    setIsProductModalOpen(true);
  };

  const handleProductImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductForm(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.categoryId) {
      toast.warning('Please fill in required fields');
      return;
    }

    const formData = new FormData();
    formData.append('name', productForm.name);
    formData.append('description', productForm.description);
    formData.append('price', productForm.price);
    formData.append('stock', productForm.stock);
    formData.append('categoryId', productForm.categoryId);
    formData.append('status', productForm.status);
    if (productForm.image) {
      formData.append('image', productForm.image);
    }

    try {
      const token = localStorage.getItem('qr_admin_token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      if (editingProduct) {
        await axios.put(`${backendUrl}/api/products/${editingProduct.id}`, formData, config);
        toast.success('Product updated successfully');
      } else {
        await axios.post(`${backendUrl}/api/products`, formData, config);
        toast.success('Product created successfully');
      }

      setIsProductModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Save product error:', err);
      toast.error('Failed to save product.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const token = localStorage.getItem('qr_admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.delete(`${backendUrl}/api/products/${id}`, config);
      toast.success('Product deleted successfully');
      fetchData();
    } catch (err) {
      console.error('Delete product error:', err);
      toast.error('Failed to delete product.');
    }
  };

  // Category CRUD
  const handleOpenCategoryModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        status: category.status
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', status: true });
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name) {
      toast.warning('Category name is required');
      return;
    }

    try {
      const token = localStorage.getItem('qr_admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editingCategory) {
        await axios.put(`${backendUrl}/api/categories/${editingCategory.id}`, categoryForm, config);
        toast.success('Category updated successfully');
      } else {
        await axios.post(`${backendUrl}/api/categories`, categoryForm, config);
        toast.success('Category created successfully');
      }

      setIsCategoryModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Save category error:', err);
      toast.error(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete category? All associated products will be deleted as well!')) return;
    try {
      const token = localStorage.getItem('qr_admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.delete(`${backendUrl}/api/categories/${id}`, config);
      toast.success('Category deleted successfully');
      fetchData();
    } catch (err) {
      console.error('Delete category error:', err);
      toast.error('Failed to delete category.');
    }
  };

  // Filtering
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 font-sans overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Menu Management</h1>
          <p className="text-xs text-slate-400 mt-1">Configure restaurant categories, customize items, set pricing and availability.</p>
        </div>
        
        <div className="flex gap-2">
          {activeTab === 'products' ? (
            <Button
              variant="primary"
              onClick={() => handleOpenProductModal()}
              className="flex items-center gap-1.5 text-xs font-bold rounded-xl"
            >
              <Plus size={16} /> Add Product
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => handleOpenCategoryModal()}
              className="flex items-center gap-1.5 text-xs font-bold rounded-xl"
            >
              <Plus size={16} /> Add Category
            </Button>
          )}
        </div>
      </div>

      {/* Tabs list & search */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex border-b border-slate-100 pb-px gap-4">
          <button
            onClick={() => { setActiveTab('products'); setSearchQuery(''); }}
            className={`pb-3 text-xs font-extrabold transition-all relative ${
              activeTab === 'products' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => { setActiveTab('categories'); setSearchQuery(''); }}
            className={`pb-3 text-xs font-extrabold transition-all relative ${
              activeTab === 'categories' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Categories ({categories.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder={activeTab === 'products' ? "Search products..." : "Search categories..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 text-xs pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all font-semibold"
          />
        </div>
      </div>

      {/* Lists */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading files...</div>
      ) : activeTab === 'products' ? (
        // Products Table
        filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl text-slate-400">No products found.</div>
        ) : (
          <Table headers={['Image', 'Name', 'Category', 'Price', 'Stock', 'Status', 'Actions']}>
            {filteredProducts.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="h-10 w-10 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200/50">
                    {p.image ? (
                      <img 
                        src={p.image.startsWith('/uploads/') ? `${backendUrl}${p.image}` : p.image} 
                        alt={p.name} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[8px] text-slate-400 font-bold block text-center mt-3">NO IMG</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-extrabold text-slate-800">{p.name}</TableCell>
                <TableCell className="font-semibold text-slate-500">{p.category?.name || 'Unassigned'}</TableCell>
                <TableCell className="font-extrabold text-slate-900">
                  {settings.currency === 'USD' ? '$' : settings.currency}
                  {Number(p.price).toFixed(2)}
                </TableCell>
                <TableCell className="font-bold text-slate-600">{p.stock} units</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    p.status ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {p.status ? 'Available' : 'Unavailable'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenProductModal(p)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )
      ) : (
        // Categories Table
        filteredCategories.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl text-slate-400">No categories found.</div>
        ) : (
          <Table headers={['Name', 'Description', 'Status', 'Actions']}>
            {filteredCategories.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-extrabold text-slate-800">{c.name}</TableCell>
                <TableCell className="max-w-xs truncate text-slate-400 font-medium">{c.description || '-'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    c.status ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {c.status ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenCategoryModal(c)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(c.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )
      )}

      {/* Product Edit / Add Modal */}
      {isProductModalOpen && (
        <Modal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          title={editingProduct ? 'Edit Product' : 'Add New Product'}
          size="md"
        >
          <form onSubmit={handleSaveProduct} className="space-y-4">
            {/* Title / Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Product Name *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Category *</label>
                <select
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm(p => ({ ...p, categoryId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none"
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Description</label>
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm(p => ({ ...p, description: e.target.value }))}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm(p => ({ ...p, price: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Inventory Stock *</label>
                <input
                  type="number"
                  value={productForm.stock}
                  onChange={(e) => setProductForm(p => ({ ...p, stock: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Image Upload section */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-2.5">Product Display Image</label>
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
                <div className="h-16 w-16 rounded-lg overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center text-slate-400 font-bold border border-slate-200">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <Upload size={18} />
                  )}
                </div>
                <div className="space-y-1">
                  <input
                    type="file"
                    id="product-image-upload"
                    accept="image/*"
                    onChange={handleProductImageChange}
                    className="hidden"
                  />
                  <label 
                    htmlFor="product-image-upload"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer shadow-sm active:scale-95 transition-all"
                  >
                    Select File
                  </label>
                  <p className="text-[9px] text-slate-400">Max size: 5MB (JPG, PNG, WebP)</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="product-status"
                checked={productForm.status}
                onChange={(e) => setProductForm(p => ({ ...p, status: e.target.checked }))}
                className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-slate-300 rounded"
              />
              <label htmlFor="product-status" className="text-xs font-bold text-slate-600 cursor-pointer">
                Product Available for Customers
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
              <Button variant="outline" size="sm" onClick={() => setIsProductModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Category Edit / Add Modal */}
      {isCategoryModalOpen && (
        <Modal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          title={editingCategory ? 'Edit Category' : 'Add New Category'}
          size="sm"
        >
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Category Name *</label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(c => ({ ...c, name: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Description</label>
              <textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(c => ({ ...c, description: e.target.value }))}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="category-status"
                checked={categoryForm.status}
                onChange={(e) => setCategoryForm(c => ({ ...c, status: e.target.checked }))}
                className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-slate-300 rounded"
              />
              <label htmlFor="category-status" className="text-xs font-bold text-slate-600 cursor-pointer">
                Category Active
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
              <Button variant="outline" size="sm" onClick={() => setIsCategoryModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default MenuManagement;
