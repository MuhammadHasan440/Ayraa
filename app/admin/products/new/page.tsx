'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Plus,
  Hash,
  Eye,
  EyeOff,
  Sparkles,
  Watch,
  Shirt,
  GlassWater,
  Gem,
  Crown,
  Package,
  Tag,
  TrendingUp,
  Clock,
  Shield,
  Key,
  Globe,
  Menu,
  Check,
  AlertCircle,
  DollarSign,
  Users,
  Settings,
  LogOut,
  BarChart3,
  Home,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  isNewArrival: boolean;
  isOnSale: boolean;
  isFeatured: boolean;
  isPublished: boolean;
  sizes: string[];
  colors: string[];
  stock: number;
  images: string[];
  slug: string;
  brand?: string;
  weight?: number;
  materials?: string[];
  rating?: number;
  reviews?: number;
}

// Categories configuration matching AdminProductsPage
const CATEGORIES = [
  { 
    id: 'traditional', 
    label: 'Traditional Wear', 
    icon: Shirt,
    color: 'from-purple-900/20 to-purple-800/20',
    textColor: 'text-purple-300',
    borderColor: 'border-purple-700/50',
    iconColor: 'text-purple-400'
  },
  { 
    id: 'casual', 
    label: 'Casual Wear', 
    icon: Shirt,
    color: 'from-emerald-900/20 to-emerald-800/20',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-700/50',
    iconColor: 'text-emerald-400'
  },
  { 
    id: 'party-wear', 
    label: 'Party Wear', 
    icon: Crown,
    color: 'from-pink-900/20 to-pink-800/20',
    textColor: 'text-pink-300',
    borderColor: 'border-pink-700/50',
    iconColor: 'text-pink-400'
  },
  { 
    id: 'perfumes', 
    label: 'Perfumes', 
    icon: GlassWater,
    color: 'from-amber-900/20 to-amber-800/20',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-700/50',
    iconColor: 'text-amber-400'
  },
  { 
    id: 'watches', 
    label: 'Watches', 
    icon: Watch,
    color: 'from-blue-900/20 to-blue-800/20',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-700/50',
    iconColor: 'text-blue-400'
  },
  { 
    id: 'shoes', 
    label: 'Shoes', 
    icon: Gem,
    color: 'from-indigo-900/20 to-indigo-800/20',
    textColor: 'text-indigo-300',
    borderColor: 'border-indigo-700/50',
    iconColor: 'text-indigo-400'
  },
];

// PKR currency formatter
const formatPKR = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function NewProductPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    category: 'traditional',
    isNewArrival: false,
    isOnSale: false,
    isFeatured: false,
    isPublished: true,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'White', 'Red', 'Blue'],
    stock: 10,
    images: [],
    slug: '',
    brand: '',
    weight: 0,
    materials: [],
    rating: 0,
    reviews: 0,
  });
  
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newMaterial, setNewMaterial] = useState('');
  const [manualSlug, setManualSlug] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/admin-login');
    }
  }, [user, isAdmin, authLoading, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/admin-login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Auto-generate slug from product name
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  };

  // Auto-update slug when name changes
  useEffect(() => {
    if (!manualSlug && formData.name) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(prev.name)
      }));
    }
  }, [formData.name, manualSlug]);

  // Update selected category object when category changes
  useEffect(() => {
    const category = CATEGORIES.find(cat => cat.id === formData.category);
    if (category) {
      setSelectedCategory(category);
    }
  }, [formData.category]);

  const securityFeatures = [
    { text: "Secure Admin", icon: <Shield size={14} className="text-emerald-400" /> },
    { text: "Real-time Data", icon: <Globe size={14} className="text-blue-400" /> },
    { text: "SSL Protected", icon: <Key size={14} className="text-amber-400" /> },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else if (name === 'price' || name === 'originalPrice' || name === 'stock' || name === 'weight' || name === 'rating' || name === 'reviews') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else if (name === 'slug') {
      setManualSlug(true);
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Convert image file to base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Resize image to reduce size
  const resizeImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate the new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files).slice(0, 5);
    setLoading(true);

    try {
      const base64Images: string[] = [];

      for (const file of selectedFiles) {
        if (file.size > 2 * 1024 * 1024) {
          setErrorMessage(`Image ${file.name} is too large. Maximum size is 2MB.`);
          setTimeout(() => setErrorMessage(''), 3000);
          continue;
        }

        const base64 = await fileToBase64(file);
        const resizedBase64 = await resizeImage(base64);
        base64Images.push(resizedBase64);
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...base64Images].slice(0, 5)
      }));

      if (selectedFiles.length > 5) {
        setErrorMessage('Only the first 5 images were added. Maximum 5 images per product.');
        setTimeout(() => setErrorMessage(''), 3000);
      }

    } catch (error) {
      console.error('Error processing images:', error);
      setErrorMessage('Failed to process images. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addSize = () => {
    if (newSize.trim() && !formData.sizes.includes(newSize.trim())) {
      setFormData(prev => ({
        ...prev,
        sizes: [...prev.sizes, newSize.trim()]
      }));
      setNewSize('');
    }
  };

  const removeSize = (size: string) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter(s => s !== size)
    }));
  };

  const addColor = () => {
    if (newColor.trim() && !formData.colors.includes(newColor.trim())) {
      setFormData(prev => ({
        ...prev,
        colors: [...prev.colors, newColor.trim()]
      }));
      setNewColor('');
    }
  };

  const removeColor = (color: string) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter(c => c !== color)
    }));
  };

  const addMaterial = () => {
    if (newMaterial.trim() && !formData.materials?.includes(newMaterial.trim())) {
      setFormData(prev => ({
        ...prev,
        materials: [...(prev.materials || []), newMaterial.trim()]
      }));
      setNewMaterial('');
    }
  };

  const removeMaterial = (material: string) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials?.filter(m => m !== material)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.description || formData.price <= 0) {
      setErrorMessage('Please fill in all required fields');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (formData.images.length === 0) {
      setErrorMessage('Please upload at least one product image');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (!formData.slug) {
      setErrorMessage('Please provide a URL slug for the product');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(formData.slug)) {
      setErrorMessage('Slug can only contain lowercase letters, numbers, and hyphens. No spaces or special characters.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setLoading(true);

    try {
      // Prepare product data
      const productData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        originalPrice: formData.originalPrice || null,
        category: formData.category,
        isNewArrival: formData.isNewArrival,
        isOnSale: formData.isOnSale,
        isFeatured: formData.isFeatured,
        isPublished: formData.isPublished,
        sizes: formData.sizes,
        colors: formData.colors,
        stock: formData.stock,
        images: formData.images,
        slug: formData.slug,
        brand: formData.brand || null,
        weight: formData.weight || null,
        materials: formData.materials || [],
        rating: formData.rating || 0,
        reviews: formData.reviews || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log('Creating product in Firestore...');
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'products'), productData);
      
      console.log('✅ Product created with ID:', docRef.id);
      
      // Show success message
      const statusMessage = formData.isPublished 
        ? 'Product is now live in the store!' 
        : 'Product saved as draft (not visible in store).';
      
      setSuccessMessage(`✅ Product created successfully!\n${statusMessage}`);
      setTimeout(() => setSuccessMessage(''), 5000);
      
      // Redirect to products page
      setTimeout(() => {
        router.push('/admin/products');
      }, 1500);
      
    } catch (error: any) {
      console.error('❌ Error creating product:', error);
      
      if (error.code === 'resource-exhausted') {
        setErrorMessage('Firestore quota exceeded. Please try again later or reduce image sizes.');
      } else if (error.code === 'permission-denied') {
        setErrorMessage('Permission denied. Please check Firestore rules.');
      } else if (error.message?.includes('payload')) {
        setErrorMessage('Product data is too large. Please reduce image sizes or number of images.');
      } else {
        setErrorMessage(`Failed to create product: ${error.message || 'Unknown error'}`);
      }
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const CategoryIcon = selectedCategory.icon;

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
      <aside className={`fixed left-0 top-20 bottom-0 w-64 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 shadow-xl z-40 transition-transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
       

        {/* Navigation */}
        <nav className="p-4 space-y-1 mt-3 pt-10">
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

        {/* Security Features */}
        <div className="mt-8 p-4 border-t border-slate-800">
          <div className="flex items-center justify-center gap-4 mb-4">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-1 text-xs text-slate-400">
                {feature.icon}
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
        
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
          <div className="mb-6 p-4 bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 rounded-2xl border border-emerald-700/50 flex items-center gap-3">
            <Check className="text-emerald-400" size={20} />
            <span className="text-emerald-300 font-medium">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-900/20 to-red-800/20 rounded-2xl border border-red-700/50 flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <span className="text-red-300 font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gradient-to-r from-amber-600/20 to-amber-500/20 p-2 rounded-lg border border-amber-500/30">
                <Plus className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Create New Product</h1>
                <p className="text-slate-400">Add a new product to your store with all the details</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push('/admin/products')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl hover:border-amber-500/30 transition-all text-slate-300 hover:text-white"
          >
            <ArrowLeft size={20} />
            Back to Products
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-5 md:p-6 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Product Details</h2>
                  <div className={`px-3 py-1.5 rounded-full text-sm font-medium border bg-gradient-to-r ${selectedCategory.color} ${selectedCategory.textColor} ${selectedCategory.borderColor}`}>
                    {selectedCategory.label}
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
                      required
                      placeholder="Enter product name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={5}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
                      required
                      placeholder="Describe your product in detail..."
                    />
                  </div>
                  
                  {/* Categories Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-3 text-slate-300">
                      Category *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {CATEGORIES.map((category) => {
                        const Icon = category.icon;
                        const isActive = formData.category === category.id;
                        
                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                            className={`p-4 rounded-xl border-2 transition-all duration-300 ${isActive 
                              ? `bg-gradient-to-r ${category.color} ${category.textColor} ${category.borderColor} scale-105 shadow-lg` 
                              : 'bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700 hover:border-amber-500/30 hover:shadow-sm text-slate-400 hover:text-white'}`}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <Icon size={24} className={isActive ? category.iconColor : 'text-slate-500'} />
                              <span className="text-sm font-medium">{category.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* URL Slug */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      URL Slug *
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        (SEO-friendly URL identifier)
                      </span>
                    </label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500">
                          /products/
                        </div>
                        <input
                          type="text"
                          name="slug"
                          value={formData.slug}
                          onChange={handleInputChange}
                          className="w-full pl-28 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white font-mono transition-all"
                          required
                          placeholder="product-url-name"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setManualSlug(false);
                          setFormData(prev => ({
                            ...prev,
                            slug: generateSlug(prev.name)
                          }));
                        }}
                        className="px-4 py-3 bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl hover:border-amber-500/30 text-slate-300 hover:text-white whitespace-nowrap transition-all"
                        title="Generate from product name"
                      >
                        Auto Generate
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Product URL: <span className="font-mono text-amber-400">https://ayraa.com/products/{formData.slug || 'product-name'}</span>
                    </p>
                  </div>
                  
                  {/* Brand and Additional Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-300">
                        Brand (Optional)
                      </label>
                      <input
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
                        placeholder="e.g., Nike, Rolex, Chanel"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-300">
                        Weight (grams, Optional)
                      </label>
                      <input
                        type="number"
                        name="weight"
                        value={formData.weight || ''}
                        onChange={handleInputChange}
                        min="0"
                        step="1"
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
                        placeholder="e.g., 500"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Images Upload Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-5 md:p-6 backdrop-blur-sm"
              >
                <h2 className="text-xl font-bold text-white mb-6">
                  Product Images *
                  {formData.images.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-slate-400">
                      ({formData.images.length}/5 images)
                    </span>
                  )}
                </h2>
                
                <div className="space-y-6">
                  {/* Upload Area */}
                  <div className={`border-3 border-dashed ${formData.images.length === 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-700'} rounded-2xl p-8 text-center transition-all`}>
                    <input
                      type="file"
                      id="imageUpload"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={loading}
                    />
                    <label htmlFor="imageUpload" className="cursor-pointer block">
                      <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${loading ? 'animate-pulse' : ''}`}>
                        {loading ? (
                          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-r from-amber-600/20 to-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
                            <Upload className="text-amber-400" size={32} />
                          </div>
                        )}
                      </div>
                      <p className="text-lg font-medium mb-1 text-white">
                        {loading ? 'Uploading images...' : 'Drag & drop or click to upload'}
                      </p>
                      <p className="text-sm text-slate-400 mb-4">
                        Upload up to 5 images • Max 2MB each • JPG, PNG, WebP
                      </p>
                      <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl hover:from-amber-700 hover:to-amber-600 transition-all shadow-lg font-medium">
                        <Upload size={18} />
                        Browse Files
                      </div>
                    </label>
                  </div>
                  
                  {/* Preview Grid */}
                  {formData.images.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-300 mb-3">Image Preview</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 shadow-sm">
                              <img
                                src={image}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 w-8 h-8 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110"
                              title="Remove image"
                            >
                              <X size={16} />
                            </button>
                            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-3">
                        First image will be used as the main product image
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Pricing & Inventory */}
            <div className="space-y-6">
              {/* Pricing Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-5 md:p-6 backdrop-blur-sm"
              >
                <h2 className="text-xl font-bold text-white mb-6">Pricing & Status</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      Selling Price (PKR) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">₨</span>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        min="0"
                        step="1"
                        className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white transition-all"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      Original Price (PKR)
                      <span className="ml-2 text-xs font-normal text-slate-500">(Optional - for sale display)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">₨</span>
                      <input
                        type="number"
                        name="originalPrice"
                        value={formData.originalPrice || ''}
                        onChange={handleInputChange}
                        min="0"
                        step="1"
                        className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
                        placeholder="Leave empty if not on sale"
                      />
                    </div>
                  </div>
                  
                  {/* Rating & Reviews */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-300">
                        Rating (0-5)
                      </label>
                      <input
                        type="number"
                        name="rating"
                        value={formData.rating || ''}
                        onChange={handleInputChange}
                        min="0"
                        max="5"
                        step="0.1"
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white transition-all"
                        placeholder="0-5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-300">
                        Reviews Count
                      </label>
                      <input
                        type="number"
                        name="reviews"
                        value={formData.reviews || ''}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white transition-all"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  {/* Status Toggles */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-700">
                      <div className="flex items-center gap-3">
                        <Clock className="text-amber-400" size={20} />
                        <div>
                          <div className="font-medium text-white">New Arrival</div>
                          <div className="text-xs text-slate-400">Show in new arrivals section</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="isNewArrival"
                          checked={formData.isNewArrival}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-slate-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-700">
                      <div className="flex items-center gap-3">
                        <Tag className="text-emerald-400" size={20} />
                        <div>
                          <div className="font-medium text-white">On Sale</div>
                          <div className="text-xs text-slate-400">Show sale badge and discount</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="isOnSale"
                          checked={formData.isOnSale}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-slate-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-700">
                      <div className="flex items-center gap-3">
                        <Sparkles className="text-purple-400" size={20} />
                        <div>
                          <div className="font-medium text-white">Featured</div>
                          <div className="text-xs text-slate-400">Show in featured section</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="isFeatured"
                          checked={formData.isFeatured}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-slate-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-700">
                      <div className="flex items-center gap-3">
                        {formData.isPublished ? (
                          <Eye className="text-emerald-400" size={20} />
                        ) : (
                          <EyeOff className="text-slate-400" size={20} />
                        )}
                        <div>
                          <div className="font-medium text-white">{formData.isPublished ? 'Published' : 'Draft'}</div>
                          <div className="text-xs text-slate-400">
                            {formData.isPublished ? 'Visible in store' : 'Hidden from customers'}
                          </div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="isPublished"
                          checked={formData.isPublished}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-slate-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Inventory Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-5 md:p-6 backdrop-blur-sm"
              >
                <h2 className="text-xl font-bold text-white mb-6">Inventory & Variants</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white transition-all"
                      required
                    />
                  </div>
                  
                  {/* Sizes */}
                  <div>
                    <label className="block text-sm font-medium mb-3 text-slate-300">
                      Available Sizes
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newSize}
                        onChange={(e) => setNewSize(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                        placeholder="Add size (e.g., XL, 10, One Size)"
                        className="flex-1 px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500"
                      />
                      <button
                        type="button"
                        onClick={addSize}
                        className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-lg hover:from-amber-700 hover:to-amber-600 transition-all shadow-lg flex items-center"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.sizes.map((size) => (
                        <div
                          key={size}
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-800/30 to-slate-900/30 hover:from-slate-700/40 hover:to-slate-800/40 rounded-lg border border-slate-700 transition-all"
                        >
                          <span className="font-medium text-slate-300">{size}</span>
                          <button
                            type="button"
                            onClick={() => removeSize(size)}
                            className="text-slate-400 hover:text-red-400 transition-colors"
                            title="Remove size"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Colors */}
                  <div>
                    <label className="block text-sm font-medium mb-3 text-slate-300">
                      Available Colors
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                        placeholder="Add color (e.g., Navy Blue)"
                        className="flex-1 px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500"
                      />
                      <button
                        type="button"
                        onClick={addColor}
                        className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-lg hover:from-amber-700 hover:to-amber-600 transition-all shadow-lg flex items-center"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.colors.map((color) => (
                        <div
                          key={color}
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-800/30 to-slate-900/30 hover:from-slate-700/40 hover:to-slate-800/40 rounded-lg border border-slate-700 transition-all"
                        >
                          <div 
                            className="w-4 h-4 rounded-full border border-slate-600"
                            style={{ backgroundColor: color.toLowerCase() }}
                          />
                          <span className="font-medium text-slate-300">{color}</span>
                          <button
                            type="button"
                            onClick={() => removeColor(color)}
                            className="text-slate-400 hover:text-red-400 transition-colors"
                            title="Remove color"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Materials */}
                  <div>
                    <label className="block text-sm font-medium mb-3 text-slate-300">
                      Materials (Optional)
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newMaterial}
                        onChange={(e) => setNewMaterial(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
                        placeholder="Add material (e.g., Cotton, Leather)"
                        className="flex-1 px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500"
                      />
                      <button
                        type="button"
                        onClick={addMaterial}
                        className="px-4 py-2.5 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-lg hover:from-slate-600 hover:to-slate-700 transition-all shadow-lg flex items-center"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.materials?.map((material) => (
                        <div
                          key={material}
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-800/30 to-slate-900/30 hover:from-slate-700/40 hover:to-slate-800/40 rounded-lg border border-slate-700 transition-all"
                        >
                          <span className="font-medium text-slate-300">{material}</span>
                          <button
                            type="button"
                            onClick={() => removeMaterial(material)}
                            className="text-slate-400 hover:text-red-400 transition-colors"
                            title="Remove material"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Submit Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-gradient-to-r from-amber-900/20 to-amber-800/20 rounded-2xl border border-amber-700/50 p-6 md:p-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
              <div className="flex-1">
                <h3 className="font-bold text-xl text-white mb-2">
                  {formData.isPublished ? 'Publish Product' : 'Save as Draft'}
                </h3>
                <p className="text-slate-300">
                  {formData.isPublished 
                    ? 'This product will be immediately visible to customers in your store.'
                    : 'This product will be saved but hidden from customers until published.'
                  }
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-amber-400">
                  {formatPKR(formData.price)}
                </div>
                {formData.originalPrice && formData.originalPrice > formData.price && (
                  <div className="text-sm text-slate-400 line-through">
                    {formatPKR(formData.originalPrice)}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push('/admin/products')}
                className="px-8 py-3 bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl hover:border-amber-500/30 text-slate-300 hover:text-white transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl hover:from-amber-700 hover:to-amber-600 transition-all font-medium flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Product...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {formData.isPublished ? 'Publish Product Now' : 'Save as Draft'}
                  </>
                )}
              </button>
            </div>
            
            {/* Preview Link */}
            {formData.slug && (
              <div className="mt-6 pt-6 border-t border-amber-700/30">
                <p className="text-sm text-slate-400">
                  Product Preview URL:{' '}
                  <span className="font-mono text-amber-400 bg-gradient-to-r from-slate-800/50 to-slate-900/50 px-2 py-1 rounded border border-slate-700">
                    /products/{formData.slug}
                  </span>
                </p>
              </div>
            )}
          </motion.div>
        </form>
      </div>

      {/* Background Decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-800/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}