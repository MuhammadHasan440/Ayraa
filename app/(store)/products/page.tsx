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
  TrendingUp, 
  Clock,
  ChevronDown,
  X,
  Loader2,
  Watch,
  SprayCan,
  Shirt,
  ShoppingBag,
  Footprints,
  Headphones,
  Heart,
  Gem,
  Tag
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

  // Update price range for PKR (assuming your products are in PKR)
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || 'all',
    sortBy: searchParams.get('sort') || 'newest',
    priceRange: [0, 50000] as [number, number], // Changed to PKR range
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
        p.description.toLowerCase().includes(query)
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
          // Add popularity logic here if available
          return 0;
        default: // newest
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    return result;
  }, [products, filters]);

  // Update active filters display with PKR formatting
  useEffect(() => {
    const active: string[] = [];
    if (filters.category !== 'all') active.push(filters.category);
    if (filters.showNewArrivals) active.push('New Arrivals');
    if (filters.searchQuery) active.push(`Search: ${filters.searchQuery}`);
    // Add price range to active filters
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

  // Handle price range change with debounce
  const handlePriceRangeChange = useCallback((index: number, value: number) => {
    setFilters(prev => {
      const newRange = [...prev.priceRange] as [number, number];
      newRange[index] = value;
      return { ...prev, priceRange: newRange };
    });
  }, []);

  // Updated categories with perfumes, watches, and more
  const categories = [
    { id: 'all', label: 'All Products', icon: ShoppingBag, color: 'from-blue-50 to-blue-100', textColor: 'text-blue-700' },
    { id: 'traditional', label: 'Traditional', icon: Sparkles, color: 'from-rose-50 to-pink-50', textColor: 'text-rose-700' },
    { id: 'casual', label: 'Casual', icon: Shirt, color: 'from-emerald-50 to-teal-50', textColor: 'text-emerald-700' },
    { id: 'perfumes', label: 'Perfumes', icon: SprayCan, color: 'from-violet-50 to-purple-50', textColor: 'text-violet-700' },
    { id: 'watches', label: 'Watches', icon: Watch, color: 'from-amber-50 to-orange-50', textColor: 'text-amber-700' },
    { id: 'footwear', label: 'Footwear', icon: Footprints, color: 'from-cyan-50 to-blue-50', textColor: 'text-cyan-700' },
    { id: 'accessories', label: 'Accessories', icon: Gem, color: 'from-fuchsia-50 to-pink-50', textColor: 'text-fuchsia-700' },
    { id: 'electronics', label: 'Electronics', icon: Headphones, color: 'from-gray-50 to-slate-50', textColor: 'text-gray-700' },
    { id: 'new', label: 'New Arrivals', icon: Clock, color: 'from-red-50 to-rose-50', textColor: 'text-red-700' },
    { id: 'sale', label: 'On Sale', icon: Tag, color: 'from-green-50 to-emerald-50', textColor: 'text-green-700' },
    { id: 'trending', label: 'Trending', icon: TrendingUp, color: 'from-indigo-50 to-blue-50', textColor: 'text-indigo-700' },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, color: 'from-rose-50 to-red-50', textColor: 'text-rose-700' },
  ];

  const sortOptions = [
    { id: 'newest', label: 'Newest First' },
    { id: 'price-low', label: 'Price: Low to High' },
    { id: 'price-high', label: 'Price: High to Low' },
    { id: 'popular', label: 'Most Popular' },
    { id: 'rating', label: 'Highest Rated' },
  ];

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-12 w-64 bg-gradient-to-r from-rose-100 to-pink-100 rounded-lg mb-8 mx-auto"></div>
            
            {/* Categories skeleton */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                <div key={i} className="h-10 w-32 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg"></div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-100 rounded mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                  <div className="h-8 bg-gradient-to-r from-rose-100 to-pink-100 rounded-lg mt-3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-purple-50 border-b">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-rose-700 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Premium Collection
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-6">
              Discover luxury perfumes, elegant watches, fashion apparel, and more
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
              {['Traditional Wear', 'Designer Perfumes', 'Luxury Watches', 'Casual Fashion', 'Accessories'].map((tag, i) => (
                <span key={tag} className="px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 border border-white">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Categories Quick Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Shop by Category</h2>
            <button 
              onClick={() => document.getElementById('categories-scroll')?.scrollBy({ left: 200, behavior: 'smooth' })}
              className="text-sm text-rose-600 hover:text-rose-800 flex items-center gap-1"
            >
              View All
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
                : cat.id === 'sale'
                ? false // You can add sale filter logic here
                : cat.id === 'trending'
                ? false // You can add trending filter logic here
                : cat.id === 'wishlist'
                ? false // You can add wishlist filter logic here
                : filters.category === cat.id;
              
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (cat.id === 'new') {
                      updateFilter('showNewArrivals', !filters.showNewArrivals);
                    } else if (cat.id === 'sale') {
                      // Add sale filter logic
                      updateFilter('category', 'sale');
                    } else if (cat.id === 'trending') {
                      // Add trending filter logic
                      updateFilter('category', 'trending');
                    } else if (cat.id === 'wishlist') {
                      // Add wishlist logic
                      alert('Wishlist feature coming soon!');
                    } else {
                      updateFilter('category', cat.id);
                    }
                  }}
                  className={`flex-shrink-0 flex flex-col items-center justify-center gap-2 px-6 py-4 rounded-2xl transition-all duration-300 hover:scale-105 ${isActive 
                    ? `bg-gradient-to-r ${cat.color} border-2 border-white shadow-lg ${cat.textColor} font-semibold` 
                    : 'bg-white border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 hover:shadow-md'}`}
                >
                  <Icon size={24} />
                  <span className="text-sm whitespace-nowrap">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Main Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          {/* Results Count */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Showing <span className="font-semibold text-rose-700">{filteredProducts.length}</span> of {products.length} products
            </div>
            
            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {activeFilters.map(filter => (
                  <span
                    key={filter}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 rounded-full text-sm border border-rose-200"
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
                      className="hover:bg-rose-200 rounded-full p-0.5 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-rose-700 font-medium flex items-center gap-1"
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
                className="appearance-none bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent cursor-pointer hover:border-rose-300 transition-all shadow-sm"
              >
                {sortOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>

            {/* View Toggle */}
            <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700' : 'text-gray-500 hover:text-rose-600'}`}
              >
                <Grid3x3 size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700' : 'text-gray-500 hover:text-rose-600'}`}
              >
                <List size={20} />
              </button>
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm hover:border-rose-300 hover:text-rose-700 transition-all shadow-sm"
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
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg sticky top-24"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg text-gray-800">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-rose-600 hover:text-rose-800 font-medium"
                >
                  Reset All
                </button>
              </div>

              {/* Categories Filter */}
              <div className="mb-8">
                <h4 className="font-medium text-gray-700 mb-3">Categories</h4>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                  {categories.filter(cat => !['new', 'sale', 'trending', 'wishlist'].includes(cat.id)).map((cat) => {
                    const Icon = cat.icon;
                    const isActive = filters.category === cat.id;
                    
                    return (
                      <button
                        key={cat.id}
                        onClick={() => updateFilter('category', cat.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive 
                          ? `bg-gradient-to-r ${cat.color} ${cat.textColor} border border-white shadow-sm` 
                          : 'hover:bg-gray-50 text-gray-600'}`}
                      >
                        <Icon size={18} />
                        <span className="text-sm">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Filters */}
              <div className="mb-8">
                <h4 className="font-medium text-gray-700 mb-3">Special Collections</h4>
                <div className="space-y-2">
                  {categories.filter(cat => ['new', 'sale'].includes(cat.id)).map((cat) => {
                    const Icon = cat.icon;
                    const isActive = cat.id === 'new' ? filters.showNewArrivals : false;
                    
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          if (cat.id === 'new') {
                            updateFilter('showNewArrivals', !filters.showNewArrivals);
                          } else {
                            // Add sale filter logic
                            alert('Sale filter coming soon!');
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive 
                          ? `bg-gradient-to-r ${cat.color} ${cat.textColor} border border-white shadow-sm` 
                          : 'hover:bg-gray-50 text-gray-600'}`}
                      >
                        <Icon size={18} />
                        <span className="text-sm">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-700">Price Range (PKR)</h4>
                  <span className="text-sm text-rose-600 font-medium">
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
                    className="w-full h-2 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-rose-500 [&::-webkit-slider-thumb]:to-pink-500 [&::-webkit-slider-thumb]:shadow-md"
                  />
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    step="500"
                    value={filters.priceRange[1]}
                    onChange={(e) => handlePriceRangeChange(1, parseInt(e.target.value))}
                    className="w-full h-2 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-rose-500 [&::-webkit-slider-thumb]:to-pink-500 [&::-webkit-slider-thumb]:shadow-md mt-2"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
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
                      className="hover:shadow-xl transition-shadow duration-300"
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
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center shadow-lg">
                  <Sparkles className="text-rose-500" size={48} />
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                  No products found
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Try adjusting your filters or browse our entire collection
                </p>
                <button
                  onClick={clearFilters}
                  className="px-8 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl hover:from-rose-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl font-medium"
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
              className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween' }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-gradient-to-b from-white to-gray-50 z-50 lg:hidden shadow-2xl"
            >
              <div className="p-6 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-gray-800">Filters</h3>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                {/* Mobile filter content */}
                <div className="space-y-6">
                  {/* Categories for mobile */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Categories</h4>
                    <div className="space-y-2">
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
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive 
                              ? `bg-gradient-to-r ${cat.color} ${cat.textColor} border border-white shadow-sm` 
                              : 'hover:bg-gray-50 text-gray-600'}`}
                          >
                            <Icon size={18} />
                            <span className="text-sm">{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Price Range for mobile */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-700">Price Range (PKR)</h4>
                      <span className="text-sm text-rose-600 font-medium">
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
                        className="w-full h-2 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-rose-500 [&::-webkit-slider-thumb]:to-pink-500 [&::-webkit-slider-thumb]:shadow-md"
                      />
                      <input
                        type="range"
                        min="0"
                        max="50000"
                        step="500"
                        value={filters.priceRange[1]}
                        onChange={(e) => handlePriceRangeChange(1, parseInt(e.target.value))}
                        className="w-full h-2 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-rose-500 [&::-webkit-slider-thumb]:to-pink-500 [&::-webkit-slider-thumb]:shadow-md mt-2"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={clearFilters}
                    className="w-full py-3 bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 rounded-xl font-medium hover:from-rose-100 hover:to-pink-100 transition-colors border border-rose-200"
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
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center shadow-lg">
            <Loader2 className="w-12 h-12 animate-spin text-rose-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">
            Loading Products
          </h3>
          <p className="text-gray-500">
            Please wait while we load our premium collection...
          </p>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}