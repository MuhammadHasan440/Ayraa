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
  IndianRupee
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
  category: 'traditional' | 'casual';
  isNewArrival: boolean;
  isPublished?: boolean;
  sizes: string[];
  colors: string[];
  stock: number;
  slug?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ✅ Helper function to ensure array type
const ensureArray = (data: any): string[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') return [data];
  return [];
};

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

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
            category: data.category || 'traditional',
            isNewArrival: data.isNewArrival || false,
            isPublished: data.isPublished !== false, // Default to true if not set
            sizes: ensureArray(data.sizes),
            colors: ensureArray(data.colors),
            stock: data.stock || 0,
            slug: data.slug || '',
            createdAt: data.createdAt || Timestamp.now(),
            updatedAt: data.updatedAt || Timestamp.now(),
          } as Product;
        });
        
        setProducts(productsData);
        setFilteredProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
        alert('Failed to load products');
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
        product.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(product => product.category === categoryFilter);
    }

    setFilteredProducts(result);
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, products]);

  const handleDelete = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      setProducts(products.filter(p => p.id !== productId));
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
      alert('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
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
      
      alert(`Product ${!currentStatus ? 'published' : 'unpublished'} successfully!`);
    } catch (error) {
      console.error('Error updating product status:', error);
      alert('Failed to update product status');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedProducts.length) {
      alert('Please select products to delete');
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
      alert('Products deleted successfully');
    } catch (error) {
      console.error('Error deleting products:', error);
      alert('Failed to delete products');
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
  ];

  // Calculate revenue statistics in PKR
  const calculateRevenueStats = () => {
    const publishedProducts = products.filter(p => p.isPublished !== false);
    const totalRevenue = publishedProducts.reduce((sum, product) => sum + (product.price * product.stock), 0);
    const averagePrice = publishedProducts.length > 0 
      ? publishedProducts.reduce((sum, product) => sum + product.price, 0) / publishedProducts.length 
      : 0;
    const potentialRevenue = totalRevenue;
    const topSellingCategory = products.length > 0
      ? products.reduce((acc, product) => {
          acc[product.category] = (acc[product.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      : { traditional: 0, casual: 0 };
    
    return {
      totalRevenue,
      averagePrice,
      potentialRevenue,
      topSellingCategory: Object.entries(topSellingCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'
    };
  };

  const revenueStats = calculateRevenueStats();

  // Stats
  const totalProducts = products.length;
  const publishedProducts = products.filter(p => p.isPublished !== false).length;
  const draftProducts = products.filter(p => p.isPublished === false).length;
  const traditionalProducts = products.filter(p => p.category === 'traditional').length;
  const casualProducts = products.filter(p => p.category === 'casual').length;
  const newArrivals = products.filter(p => p.isNewArrival).length;
  const outOfStock = products.filter(p => p.stock === 0).length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 ml-64 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-5 bottom-0 w-64 bg-white border-r">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-rose-700 flex items-center gap-2">
            <IndianRupee className="w-6 h-6" />
            AYRAA Admin
          </h1>
        </div>
        <nav className="p-4 space-y-1">
          {[
            { name: 'Dashboard', href: '/admin/dashboard', icon: <TrendingUp size={20} /> },
            { name: 'Products', href: '/admin/products', icon: <Package size={20} /> },
            { name: 'Orders', href: '/admin/orders', icon: <ShoppingBag size={20} /> },
            { name: 'Users', href: '/admin/users', icon: <Users size={20} /> },
            { name: 'Analytics', href: '/admin/analytics', icon: <BarChart3 size={20} /> },
          ].map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-rose-50 hover:text-rose-700 transition-colors"
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Product Management</h1>
            <p className="text-gray-600">Manage your product catalog (Prices in PKR)</p>
          </div>
          <button
            onClick={() => router.push('/admin/products/new')}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
          >
            <Plus size={20} />
            Add New Product
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold mt-2">{totalProducts}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {traditionalProducts} Traditional • {casualProducts} Casual
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Package className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Published / Drafts</p>
                <p className="text-2xl font-bold mt-2">{publishedProducts} / {draftProducts}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {((publishedProducts / totalProducts) * 100 || 0).toFixed(0)}% published
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <Eye className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Price</p>
                <p className="text-2xl font-bold mt-2">{formatPKR(revenueStats.averagePrice)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {outOfStock > 0 && `${outOfStock} out of stock`}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-full">
                <Tag className="text-amber-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Potential Revenue</p>
                <p className="text-2xl font-bold mt-2">{formatPKR(revenueStats.potentialRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Based on current stock
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-full">
                <IndianRupee className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search products by name, description, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="w-full md:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 appearance-none bg-white"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedProducts.length} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={18} />
                  Delete Selected
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-6">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === currentPageProducts.length && currentPageProducts.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                    />
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price (PKR)
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentPageProducts.map((product) => {
                  const sizesArray = ensureArray(product.sizes);
                  const colorsArray = ensureArray(product.colors);
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon size={20} className="text-gray-400" />
                              </div>
                            )}
                            {product.isNewArrival && (
                              <div className="absolute top-0 left-0 bg-rose-600 text-white text-xs px-2 py-1">
                                NEW
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-600 truncate max-w-xs">
                              {product.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {sizesArray.slice(0, 3).map((size, index) => (
                                <span key={`${size}-${index}`} className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                                  {size}
                                </span>
                              ))}
                              {sizesArray.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{sizesArray.length - 3} more
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {colorsArray.slice(0, 3).map((color, index) => (
                                <div key={`${color}-${index}`} className="flex items-center gap-1">
                                  <div 
                                    className="w-3 h-3 rounded-full border"
                                    style={{ 
                                      backgroundColor: color.toLowerCase(),
                                      borderColor: '#d1d5db'
                                    }}
                                  />
                                  <span className="text-xs text-gray-500">{color}</span>
                                </div>
                              ))}
                              {colorsArray.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{colorsArray.length - 3} colors
                                </span>
                              )}
                            </div>
                            {product.slug && (
                              <p className="text-xs text-gray-500 mt-1">
                                /{product.slug}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          product.category === 'traditional'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {product.category === 'traditional' ? 'Traditional' : 'Casual'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium">{formatPKR(product.price)}</div>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-gray-500 line-through">
                              {formatPKR(product.originalPrice)}
                            </div>
                            <div className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                              Save {formatPKR(product.originalPrice - product.price)}
                            </div>
                          </div>
                        )}
                        {product.isNewArrival && (
                          <div className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded mt-1 inline-block">
                            New Arrival
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              product.stock > 10 ? 'bg-green-500' :
                              product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                            <span className={product.stock === 0 ? 'text-red-600 font-medium' : ''}>
                              {product.stock} units
                            </span>
                          </div>
                          {product.stock > 0 && (
                            <div className="text-xs text-gray-500">
                              Value: {formatPKR(product.price * product.stock)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          {/* Publish Status */}
                          <button
                            onClick={() => togglePublishStatus(product.id, product.isPublished !== false)}
                            className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                              product.isPublished !== false
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
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
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            product.stock > 0
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {/* View in Store Button - only if published */}
                          {product.isPublished !== false && (
                            <button
                              onClick={() => router.push(`/products/${product.slug || product.id}`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View in Store"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          
                          {/* Edit Button */}
                          <button
                            onClick={() => router.push(`/admin/products/edit/${product.id}`)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
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
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Package size={48} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || categoryFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'No products in your catalog yet'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => router.push('/admin/products/new')}
                  className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                >
                  Add Your First Product
                </button>
              </div>
            </div>
          )}

          {/* Pagination */}
          {filteredProducts.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} products
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`w-10 h-10 rounded-lg ${
                        currentPage === number
                          ? 'bg-rose-600 text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Delete Product</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => productToDelete && handleDelete(productToDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 size={18} />
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}