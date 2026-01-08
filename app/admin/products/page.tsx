'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Package,
  Tag,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Eye,
  Users,
  TrendingUp,
  ShoppingBag,
  EyeOff,
  BarChart3,
  DollarSign,
  Home,
  Settings,
  LogOut,
  Star,
  Watch,
  Shirt,
  GlassWater,
  Gem,
  Crown,
  Sparkles,
  Shield,
  Key,
  Globe,
  Menu,
  X,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

// PKR currency formatter
const formatPKR = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: 'traditional' | 'casual' | 'party-wear' | 'perfumes' | 'watches' | 'shoes';
  isNewArrival: boolean;
  isFeatured?: boolean;
  isPublished?: boolean;
  sizes: string[];
  colors: string[];
  stock: number;
  slug?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  rating?: number;
  reviews?: number;
}

// Helper function to ensure array type
const ensureArray = (data: any): string[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') return [data];
  return [];
};

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'traditional': <Shirt size={16} />,
  'casual': <Shirt size={16} />,
  'party-wear': <Crown size={16} />,
  'perfumes': <GlassWater size={16} />,
  'watches': <Watch size={16} />,
  'shoes': <Gem size={16} />,
};

// Category colors mapping
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'traditional': {
    bg: 'bg-gradient-to-r from-purple-900/20 to-purple-800/20',
    text: 'text-purple-300',
    border: 'border-purple-700/50'
  },
  'casual': {
    bg: 'bg-gradient-to-r from-emerald-900/20 to-emerald-800/20',
    text: 'text-emerald-300',
    border: 'border-emerald-700/50'
  },
  'party-wear': {
    bg: 'bg-gradient-to-r from-pink-900/20 to-pink-800/20',
    text: 'text-pink-300',
    border: 'border-pink-700/50'
  },
  'perfumes': {
    bg: 'bg-gradient-to-r from-amber-900/20 to-amber-800/20',
    text: 'text-amber-300',
    border: 'border-amber-700/50'
  },
  'watches': {
    bg: 'bg-gradient-to-r from-blue-900/20 to-blue-800/20',
    text: 'text-blue-300',
    border: 'border-blue-700/50'
  },
  'shoes': {
    bg: 'bg-gradient-to-r from-indigo-900/20 to-indigo-800/20',
    text: 'text-indigo-300',
    border: 'border-indigo-700/50'
  },
};

// Category display names
const CATEGORY_NAMES: Record<string, string> = {
  'traditional': 'Traditional Wear',
  'casual': 'Casual Wear',
  'party-wear': 'Party Wear',
  'perfumes': 'Perfumes',
  'watches': 'Watches',
  'shoes': 'Shoes',
};

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/admin-login');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user || !isAdmin) return;

      try {
        const productsQuery = query(
          collection(db, 'products'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(productsQuery);
        const productsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            description: data.description || '',
            price: data.price || 0,
            originalPrice: data.originalPrice || null,
            images: ensureArray(data.images),
            category: (data.category || 'traditional') as Product['category'],
            isNewArrival: data.isNewArrival || false,
            isFeatured: data.isFeatured || false,
            isPublished: data.isPublished !== false,
            sizes: ensureArray(data.sizes),
            colors: ensureArray(data.colors),
            stock: data.stock || 0,
            slug: data.slug || '',
            rating: data.rating || 0,
            reviews: data.reviews || 0,
            createdAt: data.createdAt || Timestamp.now(),
            updatedAt: data.updatedAt || Timestamp.now(),
          } as Product;
        });
        
        setProducts(productsData);
        setFilteredProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
        setErrorMessage('Failed to load products');
        setTimeout(() => setErrorMessage(''), 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user, isAdmin]);

  useEffect(() => {
    let result = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        CATEGORY_NAMES[product.category]?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(product => product.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'published') {
        result = result.filter(product => product.isPublished !== false);
      } else if (statusFilter === 'draft') {
        result = result.filter(product => product.isPublished === false);
      } else if (statusFilter === 'new') {
        result = result.filter(product => product.isNewArrival);
      } else if (statusFilter === 'featured') {
        result = result.filter(product => product.isFeatured);
      } else if (statusFilter === 'out-of-stock') {
        result = result.filter(product => product.stock === 0);
      } else if (statusFilter === 'low-stock') {
        result = result.filter(product => product.stock > 0 && product.stock <= 10);
      }
    }

    setFilteredProducts(result);
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, statusFilter, products]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/admin-login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      setProducts(products.filter(p => p.id !== productId));
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
      setSuccessMessage('Product deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting product:', error);
      setErrorMessage('Failed to delete product');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setShowDeleteModal(false);
      setProductToDelete(null);
    }
  };

  const togglePublishStatus = async (productId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        isPublished: !currentStatus,
        updatedAt: Timestamp.now()
      });
      
      setProducts(products.map(p => 
        p.id === productId ? { ...p, isPublished: !currentStatus } : p
      ));
      
      setSuccessMessage(`Product ${!currentStatus ? 'published' : 'unpublished'} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating product status:', error);
      setErrorMessage('Failed to update product status');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const toggleFeaturedStatus = async (productId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        isFeatured: !currentStatus,
        updatedAt: Timestamp.now()
      });
      
      setProducts(products.map(p => 
        p.id === productId ? { ...p, isFeatured: !currentStatus } : p
      ));
      
      setSuccessMessage(`Product ${!currentStatus ? 'featured' : 'unfeatured'} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating featured status:', error);
      setErrorMessage('Failed to update featured status');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedProducts.length) {
      setErrorMessage('Please select products to delete');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;

    try {
      const deletePromises = selectedProducts.map(productId =>
        deleteDoc(doc(db, 'products', productId))
      );
      await Promise.all(deletePromises);
      
      setProducts(products.filter(p => !selectedProducts.includes(p.id)));
      setSelectedProducts([]);
      setSuccessMessage('Products deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting products:', error);
      setErrorMessage('Failed to delete products');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProducts(currentPageProducts.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPageProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Categories for filter
  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'traditional', name: 'Traditional Wear' },
    { id: 'casual', name: 'Casual Wear' },
    { id: 'party-wear', name: 'Party Wear' },
    { id: 'perfumes', name: 'Perfumes' },
    { id: 'watches', name: 'Watches' },
    { id: 'shoes', name: 'Shoes' },
  ];

  // Status options
  const statusOptions = [
    { id: 'all', name: 'All Status' },
    { id: 'published', name: 'Published' },
    { id: 'draft', name: 'Draft' },
    { id: 'new', name: 'New Arrivals' },
    { id: 'featured', name: 'Featured' },
    { id: 'out-of-stock', name: 'Out of Stock' },
    { id: 'low-stock', name: 'Low Stock' },
  ];

  // Calculate revenue statistics
  const calculateRevenueStats = () => {
    const publishedProducts = products.filter(p => p.isPublished !== false);
    const totalRevenue = publishedProducts.reduce((sum, product) => sum + (product.price * product.stock), 0);
    const averagePrice = publishedProducts.length > 0 
      ? publishedProducts.reduce((sum, product) => sum + product.price, 0) / publishedProducts.length 
      : 0;
    const potentialRevenue = totalRevenue;
    
    // Category distribution
    const categoryDistribution = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topSellingCategory = Object.entries(categoryDistribution)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
    
    return {
      totalRevenue,
      averagePrice,
      potentialRevenue,
      topSellingCategory,
      categoryDistribution
    };
  };

  const revenueStats = calculateRevenueStats();
  const securityFeatures = [
    { text: "Secure Admin", icon: <Shield size={14} className="text-emerald-400" /> },
    { text: "Real-time Data", icon: <Globe size={14} className="text-blue-400" /> },
    { text: "SSL Protected", icon: <Key size={14} className="text-amber-400" /> },
  ];

  // Stats
  const totalProducts = products.length;
  const publishedProducts = products.filter(p => p.isPublished !== false).length;
  const draftProducts = products.filter(p => p.isPublished === false).length;
  const newArrivals = products.filter(p => p.isNewArrival).length;
  const featuredProducts = products.filter(p => p.isFeatured).length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length;

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading products...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-lg text-slate-300 hover:text-amber-400 transition-colors"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-20 pt-20 bottom-0 w-64 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 shadow-xl z-40 transition-transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        

        {/* Navigation */}
        <nav className="p-4 space-y-1 mt-3 pt-5">
          {[
            { name: 'Dashboard', href: '/admin/dashboard', icon: <TrendingUp size={20} /> },
            { name: 'Products', href: '/admin/products', icon: <Package size={20} />, active: true },
            { name: 'Orders', href: '/admin/orders', icon: <ShoppingBag size={20} /> },
            { name: 'Users', href: '/admin/users', icon: <Users size={20} /> },
            { name: 'Analytics', href: '/admin/analytics', icon: <BarChart3 size={20} /> },
            
          ].map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                item.active
                  ? 'bg-gradient-to-r from-amber-600/20 to-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </a>
          ))}
        </nav>

        
        
        {/* Admin Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-gradient-to-t from-slate-900 to-slate-950">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-600/20 to-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
              <span className="font-bold text-amber-400">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-white truncate">{user?.email}</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-400 hover:text-red-400"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64 p-4 md:p-6">
        {/* Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 rounded-xl border border-emerald-700/50 flex items-center gap-3">
            <CheckCircle className="text-emerald-400" size={20} />
            <span className="text-emerald-300 font-medium">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-900/20 to-red-800/20 rounded-xl border border-red-700/50 flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <span className="text-red-300 font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gradient-to-r from-amber-600/20 to-amber-500/20 p-2 rounded-lg border border-amber-500/30">
                <Package className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Product Management</h1>
                <p className="text-slate-400">Manage your product catalog (Prices in PKR)</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push('/admin/products/new')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl hover:from-amber-700 hover:to-amber-600 transition-all shadow-lg"
          >
            <Plus size={20} />
            Add New Product
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Products</p>
                <p className="text-xl md:text-2xl font-bold mt-2 text-white">{totalProducts}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Across {Object.keys(revenueStats.categoryDistribution).length} categories
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-600/20 to-blue-500/20 rounded-xl border border-blue-500/30">
                <Package className="text-blue-400" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Published / Drafts</p>
                <p className="text-xl md:text-2xl font-bold mt-2 text-white">{publishedProducts} / {draftProducts}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {((publishedProducts / totalProducts) * 100 || 0).toFixed(0)}% published
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 rounded-xl border border-emerald-500/30">
                <Eye className="text-emerald-400" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Average Price</p>
                <p className="text-xl md:text-2xl font-bold mt-2 text-white">{formatPKR(revenueStats.averagePrice)}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {newArrivals} new arrivals
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-amber-600/20 to-amber-500/20 rounded-xl border border-amber-500/30">
                <Tag className="text-amber-400" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Potential Revenue</p>
                <p className="text-xl md:text-2xl font-bold mt-2 text-white">{formatPKR(revenueStats.potentialRevenue)}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Based on current stock
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-purple-600/20 to-purple-500/20 rounded-xl border border-purple-500/30">
                <DollarSign className="text-purple-400" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 mb-8 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
                <input
                  type="text"
                  placeholder="Search products by name, description, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="w-full md:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white appearance-none"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id} className="bg-slate-800">
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white appearance-none"
                >
                  {statusOptions.map(status => (
                    <option key={status.id} value={status.id} className="bg-slate-800">
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">
                  {selectedProducts.length} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all shadow-lg"
                >
                  <Trash2 size={18} />
                  Delete Selected
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-800 to-slate-900">
                <tr>
                  <th className="py-3 px-4 md:px-6">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === currentPageProducts.length && currentPageProducts.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-600 bg-slate-800/50 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                    />
                  </th>
                  <th className="py-3 px-4 md:px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="py-3 px-4 md:px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="py-3 px-4 md:px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Price (PKR)
                  </th>
                  <th className="py-3 px-4 md:px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="py-3 px-4 md:px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-4 md:px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {currentPageProducts.map((product) => {
                  const sizesArray = ensureArray(product.sizes);
                  const colorsArray = ensureArray(product.colors);
                  const categoryConfig = CATEGORY_COLORS[product.category] || CATEGORY_COLORS.traditional;
                  
                  return (
                    <tr key={product.id} className="hover:bg-slate-800/50">
                      <td className="py-4 px-4 md:px-6">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="rounded border-slate-600 bg-slate-800/50 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                        />
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon size={20} className="text-slate-500" />
                              </div>
                            )}
                            {product.isNewArrival && (
                              <div className="absolute top-0 left-0 bg-gradient-to-r from-amber-600 to-amber-500 text-white text-xs px-2 py-1">
                                NEW
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white">{product.name}</p>
                            <p className="text-sm text-slate-400 truncate max-w-xs">
                              {product.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {sizesArray.slice(0, 3).map((size, index) => (
                                <span key={`${size}-${index}`} className="text-xs px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">
                                  {size}
                                </span>
                              ))}
                              {sizesArray.length > 3 && (
                                <span className="text-xs text-slate-500">
                                  +{sizesArray.length - 3} more
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {colorsArray.slice(0, 3).map((color, index) => (
                                <div key={`${color}-${index}`} className="flex items-center gap-1">
                                  <div 
                                    className="w-3 h-3 rounded-full border border-slate-600"
                                    style={{ backgroundColor: color.toLowerCase() }}
                                  />
                                  <span className="text-xs text-slate-400">{color}</span>
                                </div>
                              ))}
                              {colorsArray.length > 3 && (
                                <span className="text-xs text-slate-500">
                                  +{colorsArray.length - 3} colors
                                </span>
                              )}
                            </div>
                            {product.slug && (
                              <p className="text-xs text-slate-500 mt-1">
                                /{product.slug}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <div className="flex flex-col gap-2">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${categoryConfig.bg} ${categoryConfig.text} ${categoryConfig.border}`}>
                            {CATEGORY_ICONS[product.category]}
                            {CATEGORY_NAMES[product.category]}
                          </span>
                          {(product.rating ?? 0) > 0 && (
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Star size={12} className="text-amber-400 fill-amber-400" />
                              <span>{(product.rating ?? 0).toFixed(1)}</span>
                              <span className="text-slate-500">({product.reviews ?? 0})</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <div className="font-medium text-white">{formatPKR(product.price)}</div>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-slate-500 line-through">
                              {formatPKR(product.originalPrice)}
                            </div>
                            <div className="text-xs bg-gradient-to-r from-red-900/20 to-red-800/20 text-red-300 px-2 py-0.5 rounded border border-red-700/50">
                              Save {formatPKR(product.originalPrice - product.price)}
                            </div>
                          </div>
                        )}
                        {product.isNewArrival && (
                          <div className="text-xs bg-gradient-to-r from-amber-900/20 to-amber-800/20 text-amber-300 px-2 py-0.5 rounded border border-amber-700/50 mt-1 inline-block">
                            New Arrival
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              product.stock > 10 ? 'bg-emerald-500' :
                              product.stock > 0 ? 'bg-amber-500' : 'bg-red-500'
                            }`}></div>
                            <span className={product.stock === 0 ? 'text-red-400 font-medium' : 'text-slate-300'}>
                              {product.stock} units
                            </span>
                          </div>
                          {product.stock > 0 && (
                            <div className="text-xs text-slate-500">
                              Value: {formatPKR(product.price * product.stock)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <div className="space-y-1">
                          {/* Publish Status */}
                          <button
                            onClick={() => togglePublishStatus(product.id, product.isPublished !== false)}
                            className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border transition-all ${
                              product.isPublished !== false
                                ? 'bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 text-emerald-300 border-emerald-700/50 hover:from-emerald-800/30 hover:to-emerald-700/30'
                                : 'bg-gradient-to-r from-slate-800/20 to-slate-900/20 text-slate-300 border-slate-700 hover:from-slate-700/30 hover:to-slate-800/30'
                            }`}
                            title={product.isPublished !== false ? "Published - Click to unpublish" : "Draft - Click to publish"}
                          >
                            {product.isPublished !== false ? (
                              <>
                                <Eye size={12} />
                                Published
                              </>
                            ) : (
                              <>
                                <EyeOff size={12} />
                                Draft
                              </>
                            )}
                          </button>
                          
                          {/* Stock Status */}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                            product.stock > 0
                              ? 'bg-gradient-to-r from-blue-900/20 to-blue-800/20 text-blue-300 border-blue-700/50'
                              : 'bg-gradient-to-r from-red-900/20 to-red-800/20 text-red-300 border-red-700/50'
                          }`}>
                            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>

                          {/* Featured Status */}
                          <button
                            onClick={() => toggleFeaturedStatus(product.id, product.isFeatured || false)}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 border transition-all ${
                              product.isFeatured
                                ? 'bg-gradient-to-r from-purple-900/20 to-purple-800/20 text-purple-300 border-purple-700/50 hover:from-purple-800/30 hover:to-purple-700/30'
                                : 'bg-gradient-to-r from-slate-800/20 to-slate-900/20 text-slate-300 border-slate-700 hover:from-slate-700/30 hover:to-slate-800/30'
                            }`}
                            title={product.isFeatured ? "Featured - Click to unfeature" : "Not Featured - Click to feature"}
                          >
                            <Star size={12} />
                            {product.isFeatured ? 'Featured' : 'Feature'}
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <div className="flex items-center gap-2">
                          {/* View in Store Button - only if published */}
                          {product.isPublished !== false && (
                            <button
                              onClick={() => router.push(`/products/${product.slug || product.id}`)}
                              className="p-2 bg-gradient-to-r from-blue-600/20 to-blue-500/20 text-blue-300 hover:text-blue-200 rounded-lg transition-all border border-blue-500/30 hover:border-blue-400/50"
                              title="View in Store"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          
                          {/* Edit Button */}
                          <button
                            onClick={() => router.push(`/admin/products/edit/${product.id}`)}
                            className="p-2 bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 text-emerald-300 hover:text-emerald-200 rounded-lg transition-all border border-emerald-500/30 hover:border-emerald-400/50"
                            title="Edit Product"
                          >
                            <Edit size={16} />
                          </button>
                          
                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              setProductToDelete(product.id);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 bg-gradient-to-r from-red-600/20 to-red-500/20 text-red-300 hover:text-red-200 rounded-lg transition-all border border-red-500/30 hover:border-red-400/50"
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-full flex items-center justify-center border border-slate-700">
                <Package size={48} className="text-slate-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No products found</h3>
              <p className="text-slate-400 mb-6">
                {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No products in your catalog yet'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                    setStatusFilter('all');
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl hover:border-amber-500/30 transition-all text-slate-300 hover:text-white"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => router.push('/admin/products/new')}
                  className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl hover:from-amber-700 hover:to-amber-600 transition-all shadow-lg"
                >
                  Add Your First Product
                </button>
              </div>
            </div>
          )}

          {/* Pagination */}
          {filteredProducts.length > 0 && (
            <div className="px-4 md:px-6 py-4 border-t border-slate-800">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-slate-400">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} products
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl hover:border-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 hover:text-white"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`w-10 h-10 rounded-xl transition-all ${
                        currentPage === number
                          ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg'
                          : 'bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700 text-slate-300 hover:text-white hover:border-amber-500/30'
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl hover:border-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 hover:text-white"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-700">
            <h3 className="text-lg font-bold mb-4 text-white">Delete Product</h3>
            <p className="text-slate-400 mb-6">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl hover:border-amber-500/30 transition-all text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => productToDelete && handleDelete(productToDelete)}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all shadow-lg flex items-center gap-2"
              >
                <Trash2 size={18} />
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-800/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}