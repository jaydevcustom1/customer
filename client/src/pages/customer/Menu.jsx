import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, ShoppingBag, Plus, Minus, Check, ArrowUpDown } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../components/ui/Toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

const Menu = () => {
  const { addToCart, settings } = useCart();
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc'); // name-asc, price-asc, price-desc
  const [loading, setLoading] = useState(true);

  // Product Detail Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailQty, setDetailQty] = useState(1);

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          axios.get(`${backendUrl}/api/products`),
          axios.get(`${backendUrl}/api/categories`)
        ]);
        setProducts(prodRes.data.filter(p => p.status)); // Only active products
        setCategories(catRes.data.filter(c => c.status)); // Only active categories
      } catch (err) {
        console.error('Error loading menu:', err);
        toast.error('Failed to load menu. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleQuickAdd = (product, e) => {
    e.stopPropagation(); // Prevent opening modal
    if (product.stock <= 0) {
      toast.warning('Product is currently out of stock');
      return;
    }
    addToCart(product, 1);
    toast.success(`Added ${product.name} to cart`);
  };

  const handleOpenDetailModal = (product) => {
    setSelectedProduct(product);
    setDetailQty(1);
  };

  const handleDetailAdd = () => {
    if (selectedProduct.stock < detailQty) {
      toast.warning(`Only ${selectedProduct.stock} items available in stock`);
      return;
    }
    addToCart(selectedProduct, detailQty);
    toast.success(`Added ${detailQty}x ${selectedProduct.name} to cart`);
    setSelectedProduct(null);
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'name-asc') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'price-asc') {
      return a.price - b.price;
    }
    if (sortBy === 'price-desc') {
      return b.price - a.price;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-24 fade-in max-w-7xl mx-auto px-4 py-4 md:py-8">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 z-30 px-5 py-4 rounded-2xl shadow-sm mb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Browse Menu</h1>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-semibold bg-slate-100 text-slate-600 rounded-lg py-1.5 px-2 border-none focus:outline-none"
            >
              <option value="name-asc">Sort A-Z</option>
              <option value="price-asc">Price: Low-High</option>
              <option value="price-desc">Price: High-Low</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search delicious meals, drinks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 text-sm pl-10 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Categories Horizontal Carousel */}
      <div className="px-5 mt-4 overflow-x-auto whitespace-nowrap py-1 scrollbar-none flex gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            selectedCategory === 'all'
              ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
              : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'
          }`}
        >
          All Items
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              selectedCategory === cat.id
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products list */}
      <div className="px-5 mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Skeletons
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 flex gap-4 animate-pulse">
              <div className="h-20 w-20 rounded-xl bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-4 bg-slate-100 rounded w-1/4 mt-2" />
              </div>
            </div>
          ))
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm font-semibold">No items match your criteria.</p>
            <p className="text-xs mt-1">Try another search or select a different category.</p>
          </div>
        ) : (
          sortedProducts.map((product) => {
            const hasStock = product.stock > 0;
            return (
              <Card 
                key={product.id} 
                className="overflow-hidden flex p-3 gap-4 border border-slate-100"
                onClick={() => handleOpenDetailModal(product)}
              >
                {/* Product Image */}
                <div className="h-24 w-24 rounded-xl overflow-hidden shrink-0 bg-slate-100 relative">
                  {product.image ? (
                    <img 
                      src={product.image.startsWith('/uploads/') ? `${backendUrl}${product.image}` : product.image} 
                      alt={product.name} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary-50 text-primary-400 font-bold text-xs">
                      No Image
                    </div>
                  )}
                  {!hasStock && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
                      <span className="text-[10px] uppercase font-bold text-white px-2 py-0.5 rounded bg-red-500">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Product details */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 leading-tight truncate">{product.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {product.description || 'No description available'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-extrabold text-slate-900">
                      {settings.currency === 'USD' ? '$' : settings.currency}
                      {product.price.toFixed(2)}
                    </span>
                    <button
                      disabled={!hasStock}
                      onClick={(e) => handleQuickAdd(product, e)}
                      className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                        hasStock 
                          ? 'bg-primary-50 text-white hover:bg-primary-600 shadow-sm active:scale-95' 
                          : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Modal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title="Product Details"
          size="sm"
        >
          <div className="space-y-4">
            <div className="h-48 w-full rounded-xl overflow-hidden bg-slate-100 relative">
              {selectedProduct.image ? (
                <img 
                  src={selectedProduct.image.startsWith('/uploads/') ? `${backendUrl}${selectedProduct.image}` : selectedProduct.image} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary-50 text-primary-400 font-bold">
                  No Image Available
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-800">{selectedProduct.name}</h2>
              <span className="inline-block text-base font-extrabold text-primary-500 mt-1">
                {settings.currency === 'USD' ? '$' : settings.currency}
                {selectedProduct.price.toFixed(2)}
              </span>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {selectedProduct.description || 'No description available'}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-semibold bg-slate-50 p-2.5 rounded-xl">
                <span>Stock Availability</span>
                <span className={selectedProduct.stock > 0 ? 'text-emerald-600' : 'text-red-500'}>
                  {selectedProduct.stock > 0 ? `${selectedProduct.stock} items left` : 'Out of Stock'}
                </span>
              </div>
            </div>

            {selectedProduct.stock > 0 && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                {/* Quantity Controls */}
                <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-xl">
                  <button
                    disabled={detailQty <= 1}
                    onClick={() => setDetailQty(prev => prev - 1)}
                    className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-600 disabled:opacity-50"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-bold w-6 text-center text-slate-800">{detailQty}</span>
                  <button
                    disabled={detailQty >= selectedProduct.stock}
                    onClick={() => setDetailQty(prev => prev + 1)}
                    className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-600 disabled:opacity-50"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <Button 
                  variant="primary" 
                  onClick={handleDetailAdd} 
                  className="font-semibold shadow-sm py-2 px-5 text-xs rounded-xl"
                >
                  Add To Cart - {(selectedProduct.price * detailQty).toFixed(2)}
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Menu;
