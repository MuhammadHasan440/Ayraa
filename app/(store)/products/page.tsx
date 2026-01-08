'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '@/components/products/productCard';
import { Product } from '@/types';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { 
  Filter, 
  Grid3x3, 
  List, 
  Sparkles, 
  ChevronDown,
  X,
  Loader2,
  Watch,
  SprayCan,
  Shirt,
  ShoppingBag,
  Footprints,
  Crown,
  Gem,
  Zap,
  Search,
  DollarSign,
  SortAsc,
  TrendingUp
} from 'lucide-react';

// Add this currency formatter function
const formatPKR = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const ensureArray = (data: any): string[] => {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
};

// Create a separate component that uses useSearchParams
function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Update price range for PKR
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || 'all',
    sortBy: searchParams.get('sort') || 'newest',
    priceRange: [0, 50000] as [number, number],
    showNewArrivals: searchParams.get('new') === 'true',
    searchQuery: searchParams.get('search') || '',
  });

  // Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        const data: Product[] = snapshot.docs
          .map(doc => {
            const d = doc.data();
            if (d.isPublished === false) return null;

            return {
              id: doc.id,
              name: d.name || '',
              description: d.description || '',
              price: Number(d.price) || 0,
              originalPrice: d.originalPrice || null,
              images: ensureArray(d.images),
              category: d.category || 'traditional',
              isNewArrival: d.isNewArrival ?? false,
              isPublished: d.isPublished !== false,
              sizes: ensureArray(d.sizes),
              colors: ensureArray(d.colors),
              stock: d.stock || 0,
              slug: d.slug || doc.id,
              createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(),
              updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate() : new Date(),
            };
          })
          .filter(Boolean) as Product[];

        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on query params and filters
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (filters.category && filters.category !== 'all') {
      result = result.filter(p => 
        p.category.toLowerCase() === filters.category.toLowerCase()
      );
    }

    // New arrivals filter
    if (filters.showNewArrivals) {
      result = result.filter(p => p.isNewArrival);
    }

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    // Price range filter
    result = result.filter(
      p => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    // Sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'popular':
          return b.stock - a.stock; // Using stock as popularity proxy
        default: // newest
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    return result;
  }, [products, filters]);

  // Update active filters display
  useEffect(() => {
    const active: string[] = [];
    if (filters.category !== 'all') {
      const categoryName = categories.find(cat => cat.id === filters.category)?.label;
      if (categoryName) active.push(categoryName);
    }
    if (filters.showNewArrivals) active.push('New Arrivals');
    if (filters.searchQuery) active.push(`Search: ${filters.searchQuery}`);
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 50000) {
      active.push(`${formatPKR(filters.priceRange[0])} - ${formatPKR(filters.priceRange[1])}`);
    }
    setActiveFilters(active);
  }, [filters]);

  // Handle filter changes
  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    
    // Update URL params
    const params = new URLSearchParams(searchParams.toString());
    if (key === 'category' && value !== 'all') {
      params.set('category', value);
    } else if (key === 'category' && value === 'all') {
      params.delete('category');
    }
    
    if (key === 'showNewArrivals' && value) {
      params.set('new', 'true');
    } else if (key === 'showNewArrivals' && !value) {
      params.delete('new');
    }
    
    router.push(`/products${params.toString() ? `?${params.toString()}` : ''}`);
  }, [router, searchParams]);

  const clearFilters = useCallback(() => {
    setFilters({
      category: 'all',
      sortBy: 'newest',
      priceRange: [0, 50000],
      showNewArrivals: false,
      searchQuery: '',
    });
    router.push('/products');
  }, [router]);

  // Handle price range change
  const handlePriceRangeChange = useCallback((index: number, value: number) => {
    setFilters(prev => {
      const newRange = [...prev.priceRange] as [number, number];
      newRange[index] = value;
      return { ...prev, priceRange: newRange };
    });
  }, []);

  // UPDATED: Only your specific categories
  const categories = [
    { 
      id: 'all', 
      label: 'All Products', 
      icon: ShoppingBag, 
      gradient: 'from-slate-800 to-slate-900',
      bg: 'bg-slate-800/50',
      textColor: 'text-slate-300',
      iconColor: 'text-amber-400'
    },
    { 
      id: 'traditional', 
      label: 'Traditional Wear', 
      icon: Crown, 
      gradient: 'from-amber-900 to-amber-800',
      bg: 'bg-amber-900/30',
      textColor: 'text-amber-300',
      iconColor: 'text-amber-400'
    },
    { 
      id: 'party', 
      label: 'Party Wear', 
      icon: Gem, 
      gradient: 'from-purple-900 to-purple-800',
      bg: 'bg-purple-900/30',
      textColor: 'text-purple-300',
      iconColor: 'text-purple-400'
    },
    { 
      id: 'casual', 
      label: 'Casual Wear', 
      icon: Shirt, 
      gradient: 'from-emerald-900 to-emerald-800',
      bg: 'bg-emerald-900/30',
      textColor: 'text-emerald-300',
      iconColor: 'text-emerald-400'
    },
    { 
      id: 'watches', 
      label: 'Luxury Watches', 
      icon: Watch, 
      gradient: 'from-slate-800 to-slate-900',
      bg: 'bg-slate-800/50',
      textColor: 'text-slate-300',
      iconColor: 'text-slate-400'
    },
    { 
      id: 'perfumes', 
      label: 'Designer Perfumes', 
      icon: SprayCan, 
      gradient: 'from-rose-900 to-rose-800',
      bg: 'bg-rose-900/30',
      textColor: 'text-rose-300',
      iconColor: 'text-rose-400'
    },
    { 
      id: 'footwear', 
      label: 'Footwear', 
      icon: Footprints, 
      gradient: 'from-blue-900 to-blue-800',
      bg: 'bg-blue-900/30',
      textColor: 'text-blue-300',
      iconColor: 'text-blue-400'
    },
    { 
      id: 'new', 
      label: 'New Arrivals', 
      icon: Zap, 
      gradient: 'from-red-900 to-red-800',
      bg: 'bg-red-900/30',
      textColor: 'text-red-300',
      iconColor: 'text-red-400'
    },
  ];

  const sortOptions = [
    { id: 'newest', label: 'Newest First', icon: Sparkles },
    { id: 'price-low', label: 'Price: Low to High', icon: DollarSign },
    { id: 'price-high', label: 'Price: High to Low', icon: DollarSign },
    { id: 'popular', label: 'Most Popular', icon: TrendingUp },
  ];

  // Loading skeleton with dark theme
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 py-12">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-12 w-64 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg mb-8 mx-auto"></div>
            
            {/* Categories skeleton */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="h-10 w-32 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg"></div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
                  <div className="h-64 bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl mb-4"></div>
                  <div className="h-4 bg-slate-800 rounded mb-2"></div>
                  <div className="h-4 bg-slate-800 rounded w-2/3"></div>
                  <div className="h-8 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg mt-3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-2 rounded-lg">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-amber-300">Premium Collection</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 bg-clip-text text-transparent mb-4">
              Shop Luxury Fashion
            </h1>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-6">
              Discover curated collections of traditional elegance, party glamour, casual chic, 
              luxury watches, designer perfumes, and premium footwear.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for traditional wear, perfumes, watches..."
                  value={filters.searchQuery}
                  onChange={(e) => updateFilter('searchQuery', e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" size={24} />
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-3xl mx-auto">
                {['Traditional Wear', 'Party Wear', 'Casual Wear', 'Designer Perfumes', 'Luxury Watches', 'Premium Footwear'].map((tag, i) => (
                  <button
                    key={tag}
                    onClick={() => updateFilter('category', tag.toLowerCase().replace(' ', '-').split(' ')[0])}
                    className="px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full text-sm font-medium text-slate-300 hover:text-amber-300 hover:bg-slate-800 transition-all border border-slate-700"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Categories Quick Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 md:mb-12"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-amber-200">Browse Collections</h2>
            <button 
              onClick={() => document.getElementById('categories-scroll')?.scrollBy({ left: 200, behavior: 'smooth' })}
              className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              Scroll More
              <ChevronDown size={16} className="rotate-270" />
            </button>
          </div>
          <div 
            id="categories-scroll"
            className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = cat.id === 'new' 
                ? filters.showNewArrivals 
                : filters.category === cat.id;
              
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (cat.id === 'new') {
                      updateFilter('showNewArrivals', !filters.showNewArrivals);
                    } else {
                      updateFilter('category', cat.id);
                    }
                  }}
                  className={`flex-shrink-0 flex flex-col items-center justify-center gap-2 px-6 py-4 rounded-2xl transition-all duration-300 hover:scale-105 border ${isActive 
                    ? `bg-gradient-to-r ${cat.gradient} border-amber-500 shadow-lg ${cat.textColor} font-semibold` 
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white hover:shadow-lg'}`}
                >
                  <Icon size={24} className={cat.iconColor} />
                  <span className="text-sm whitespace-nowrap">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Main Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          {/* Results Count & Active Filters */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-sm text-slate-400">
                Showing <span className="font-semibold text-amber-300">{filteredProducts.length}</span> of {products.length} products
              </div>
            </div>
            
            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {activeFilters.map(filter => (
                  <span
                    key={filter}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800/70 text-amber-300 rounded-full text-sm border border-slate-700"
                  >
                    {filter}
                    <button
                      onClick={() => {
                        if (filter.includes('Search')) {
                          updateFilter('searchQuery', '');
                        } else if (filter === 'New Arrivals') {
                          updateFilter('showNewArrivals', false);
                        } else if (filter.includes('PKR')) {
                          updateFilter('priceRange', [0, 50000]);
                        } else {
                          updateFilter('category', 'all');
                        }
                      }}
                      className="hover:bg-slate-700 rounded-full p-0.5 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                <button
                  onClick={clearFilters}
                  className="text-sm text-slate-400 hover:text-amber-300 font-medium flex items-center gap-1"
                >
                  Clear all
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Sort Dropdown */}
            <div className="relative group">
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="appearance-none bg-slate-800/50 border border-slate-700 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer hover:border-slate-600 transition-all text-white"
              >
                {sortOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <SortAsc className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>

            {/* View Toggle */}
            <div className="flex bg-slate-800/50 border border-slate-700 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' 
                  ? 'bg-gradient-to-r from-amber-900/30 to-amber-800/30 text-amber-300 border border-amber-700/50' 
                  : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'}`}
              >
                <Grid3x3 size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' 
                  ? 'bg-gradient-to-r from-amber-900/30 to-amber-800/30 text-amber-300 border border-amber-700/50' 
                  : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'}`}
              >
                <List size={20} />
              </button>
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-sm hover:border-amber-500 hover:text-amber-300 transition-all"
            >
              <Filter size={16} />
              Filters
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 sticky top-24"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg text-amber-200">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-amber-400 hover:text-amber-300 font-medium"
                >
                  Reset All
                </button>
              </div>

              {/* Categories Filter */}
              <div className="mb-8">
                <h4 className="font-medium text-slate-300 mb-3">Categories</h4>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                  {categories.filter(cat => cat.id !== 'new').map((cat) => {
                    const Icon = cat.icon;
                    const isActive = filters.category === cat.id;
                    
                    return (
                      <button
                        key={cat.id}
                        onClick={() => updateFilter('category', cat.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive 
                          ? `bg-gradient-to-r ${cat.gradient} ${cat.textColor} border border-slate-600 shadow-sm` 
                          : 'hover:bg-slate-800/50 text-slate-400 hover:text-white'}`}
                      >
                        <Icon size={18} className={cat.iconColor} />
                        <span className="text-sm">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Filters */}
              <div className="mb-8">
                <h4 className="font-medium text-slate-300 mb-3">Special Collections</h4>
                <div className="space-y-2">
                  {categories.filter(cat => cat.id === 'new').map((cat) => {
                    const Icon = cat.icon;
                    const isActive = filters.showNewArrivals;
                    
                    return (
                      <button
                        key={cat.id}
                        onClick={() => updateFilter('showNewArrivals', !filters.showNewArrivals)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive 
                          ? `bg-gradient-to-r ${cat.gradient} ${cat.textColor} border border-slate-600 shadow-sm` 
                          : 'hover:bg-slate-800/50 text-slate-400 hover:text-white'}`}
                      >
                        <Icon size={18} className={cat.iconColor} />
                        <span className="text-sm">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-slate-300">Price Range (PKR)</h4>
                  <span className="text-sm text-amber-400 font-medium">
                    {formatPKR(filters.priceRange[0])} - {formatPKR(filters.priceRange[1])}
                  </span>
                </div>
                <div className="px-2">
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    step="500"
                    value={filters.priceRange[0]}
                    onChange={(e) => handlePriceRangeChange(0, parseInt(e.target.value))}
                    className="w-full h-2 bg-gradient-to-r from-slate-700 to-slate-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-amber-500 [&::-webkit-slider-thumb]:to-amber-600 [&::-webkit-slider-thumb]:shadow-md"
                  />
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    step="500"
                    value={filters.priceRange[1]}
                    onChange={(e) => handlePriceRangeChange(1, parseInt(e.target.value))}
                    className="w-full h-2 bg-gradient-to-r from-slate-700 to-slate-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-amber-500 [&::-webkit-slider-thumb]:to-amber-600 [&::-webkit-slider-thumb]:shadow-md mt-2"
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>{formatPKR(0)}</span>
                  <span>{formatPKR(25000)}</span>
                  <span>{formatPKR(50000)}+</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {filteredProducts.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={viewMode + filters.sortBy}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`grid gap-6 ${viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1'
                  }`}
                >
                  {filteredProducts.map((product, i) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      className="hover:shadow-2xl transition-all duration-300"
                    >
                      <ProductCard product={product} view={viewMode} />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-slate-700">
                  <Sparkles className="text-amber-400" size={48} />
                </div>
                <h3 className="text-2xl font-semibold text-amber-200 mb-2">
                  No products found
                </h3>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                  Try adjusting your filters or browse our entire collection
                </p>
                <button
                  onClick={clearFilters}
                  className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg hover:shadow-xl font-medium"
                >
                  View All Products
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween' }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 z-50 lg:hidden shadow-2xl border-l border-slate-800"
            >
              <div className="p-6 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-amber-200">Filters</h3>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
                  >
                    <X size={24} />
                  </button>
                </div>
                {/* Mobile filter content */}
                <div className="space-y-6">
                  {/* Categories for mobile */}
                  <div>
                    <h4 className="font-medium text-slate-300 mb-3">Categories</h4>
                    <div className="space-y-2">
                      {categories.filter(cat => cat.id !== 'new').map((cat) => {
                        const Icon = cat.icon;
                        const isActive = filters.category === cat.id;
                        
                        return (
                          <button
                            key={cat.id}
                            onClick={() => updateFilter('category', cat.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive 
                              ? `bg-gradient-to-r ${cat.gradient} ${cat.textColor} border border-slate-600 shadow-sm` 
                              : 'hover:bg-slate-800/50 text-slate-400 hover:text-white'}`}
                          >
                            <Icon size={18} className={cat.iconColor} />
                            <span className="text-sm">{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* New Arrivals for mobile */}
                  <div>
                    {categories.filter(cat => cat.id === 'new').map((cat) => {
                      const Icon = cat.icon;
                      const isActive = filters.showNewArrivals;
                      
                      return (
                        <button
                          key={cat.id}
                          onClick={() => updateFilter('showNewArrivals', !filters.showNewArrivals)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive 
                            ? `bg-gradient-to-r ${cat.gradient} ${cat.textColor} border border-slate-600 shadow-sm` 
                            : 'hover:bg-slate-800/50 text-slate-400 hover:text-white'}`}
                        >
                          <Icon size={18} className={cat.iconColor} />
                          <span className="text-sm">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Price Range for mobile */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-slate-300">Price Range (PKR)</h4>
                      <span className="text-sm text-amber-400 font-medium">
                        {formatPKR(filters.priceRange[0])} - {formatPKR(filters.priceRange[1])}
                      </span>
                    </div>
                    <div className="px-2">
                      <input
                        type="range"
                        min="0"
                        max="50000"
                        step="500"
                        value={filters.priceRange[0]}
                        onChange={(e) => handlePriceRangeChange(0, parseInt(e.target.value))}
                        className="w-full h-2 bg-gradient-to-r from-slate-700 to-slate-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-amber-500 [&::-webkit-slider-thumb]:to-amber-600 [&::-webkit-slider-thumb]:shadow-md"
                      />
                      <input
                        type="range"
                        min="0"
                        max="50000"
                        step="500"
                        value={filters.priceRange[1]}
                        onChange={(e) => handlePriceRangeChange(1, parseInt(e.target.value))}
                        className="w-full h-2 bg-gradient-to-r from-slate-700 to-slate-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-amber-500 [&::-webkit-slider-thumb]:to-amber-600 [&::-webkit-slider-thumb]:shadow-md mt-2"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={clearFilters}
                    className="w-full py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-amber-300 rounded-xl font-medium hover:from-slate-900 hover:to-slate-800 transition-all border border-slate-700"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main component with Suspense boundary
export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-slate-700">
            <Loader2 className="w-12 h-12 animate-spin text-amber-400" />
          </div>
          <h3 className="text-2xl font-semibold text-amber-200 mb-2">
            Loading Products
          </h3>
          <p className="text-slate-400">
            Loading our premium collection...
          </p>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}