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
  SprayCan,
  Shirt,
  Footprints,
  Gem,
  Headphones,
  Tag,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string; // Updated to support multiple categories
  isNewArrival: boolean;
  isOnSale: boolean; // Added sale status
  isPublished: boolean;
  sizes: string[];
  colors: string[];
  stock: number;
  images: string[];
  slug: string;
  brand?: string; // Added brand field
  weight?: number; // Added weight in grams
  materials?: string[]; // Added materials array
}

// Categories configuration with icons and colors
const CATEGORIES = [
  { 
    id: 'traditional', 
    label: 'Traditional Wear', 
    icon: Sparkles,
    color: 'bg-gradient-to-r from-rose-50 to-pink-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200'
  },
  { 
    id: 'casual', 
    label: 'Casual Wear', 
    icon: Shirt,
    color: 'bg-gradient-to-r from-blue-50 to-cyan-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200'
  },
  { 
    id: 'perfumes', 
    label: 'Perfumes', 
    icon: SprayCan,
    color: 'bg-gradient-to-r from-violet-50 to-purple-50',
    textColor: 'text-violet-700',
    borderColor: 'border-violet-200'
  },
  { 
    id: 'watches', 
    label: 'Watches', 
    icon: Watch,
    color: 'bg-gradient-to-r from-amber-50 to-orange-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200'
  },
  { 
    id: 'footwear', 
    label: 'Footwear', 
    icon: Footprints,
    color: 'bg-gradient-to-r from-emerald-50 to-teal-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200'
  },
  { 
    id: 'accessories', 
    label: 'Accessories', 
    icon: Gem,
    color: 'bg-gradient-to-r from-fuchsia-50 to-pink-50',
    textColor: 'text-fuchsia-700',
    borderColor: 'border-fuchsia-200'
  },
  { 
    id: 'electronics', 
    label: 'Electronics', 
    icon: Headphones,
    color: 'bg-gradient-to-r from-gray-50 to-slate-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200'
  },
];

export default function NewProductPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    category: 'traditional',
    isNewArrival: false,
    isOnSale: false,
    isPublished: true,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'White', 'Red', 'Blue'],
    stock: 10,
    images: [],
    slug: '',
    brand: '',
    weight: 0,
    materials: [],
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else if (name === 'price' || name === 'originalPrice' || name === 'stock' || name === 'weight') {
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
          alert(`Image ${file.name} is too large. Maximum size is 2MB.`);
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
        alert('Only the first 5 images were added. Maximum 5 images per product.');
      }

    } catch (error) {
      console.error('Error processing images:', error);
      alert('Failed to process images. Please try again.');
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
      alert('Please fill in all required fields');
      return;
    }

    if (formData.images.length === 0) {
      alert('Please upload at least one product image');
      return;
    }

    if (!formData.slug) {
      alert('Please provide a URL slug for the product');
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(formData.slug)) {
      alert('Slug can only contain lowercase letters, numbers, and hyphens. No spaces or special characters.');
      return;
    }

    // Warn about large image data
    const totalImageSize = formData.images.reduce((total, img) => total + (img.length * 3) / 4, 0);
    if (totalImageSize > 5000000) {
      alert('Total image size is too large. Please reduce the number of images or their quality.');
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
        isPublished: formData.isPublished,
        sizes: formData.sizes,
        colors: formData.colors,
        stock: formData.stock,
        images: formData.images,
        slug: formData.slug,
        brand: formData.brand || null,
        weight: formData.weight || null,
        materials: formData.materials || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log('Creating product in Firestore...');
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'products'), productData);
      
      console.log('✅ Product created with ID:', docRef.id);
      
      // Show success message based on publication status
      const statusMessage = formData.isPublished 
        ? 'Product is now live in the store!' 
        : 'Product saved as draft (not visible in store).';
      
      alert(`✅ Product created successfully!\n\n${statusMessage}\n\nProduct URL: /products/${formData.slug}`);
      
      // Redirect to products page
      router.push('/admin/products');
      
    } catch (error: any) {
      console.error('❌ Error creating product:', error);
      
      if (error.code === 'resource-exhausted') {
        alert('Firestore quota exceeded. Please try again later or reduce image sizes.');
      } else if (error.code === 'permission-denied') {
        alert('Permission denied. Please check Firestore rules.');
      } else if (error.message?.includes('payload')) {
        alert('Product data is too large. Please reduce image sizes or number of images.');
      } else {
        alert(`Failed to create product: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const CategoryIcon = selectedCategory.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Admin Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => router.push('/admin/products')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Back to Products</span>
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium">{user?.email}</div>
                <div className="text-xs text-gray-500">Admin</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-700 to-pink-600 bg-clip-text text-transparent">
            Create New Product
          </h1>
          <p className="text-gray-600 mt-2">
            Add a new product to your store with all the details
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg border p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Product Details</h2>
                  <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${selectedCategory.color} ${selectedCategory.textColor}`}>
                    {selectedCategory.label}
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                      required
                      placeholder="Enter product name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                      required
                      placeholder="Describe your product in detail..."
                    />
                  </div>
                  
                  {/* Categories Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-3 text-gray-700">
                      Category *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {CATEGORIES.map((category) => {
                        const Icon = category.icon;
                        const isActive = formData.category === category.id;
                        
                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                            className={`p-4 rounded-xl border-2 transition-all duration-300 ${isActive 
                              ? `${category.color} ${category.textColor} ${category.borderColor} scale-105 shadow-md` 
                              : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <Icon size={24} />
                              <span className="text-sm font-medium">{category.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* URL Slug */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      URL Slug *
                      <span className="ml-2 text-xs font-normal text-gray-500">
                        (SEO-friendly URL identifier)
                      </span>
                    </label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                          /products/
                        </div>
                        <input
                          type="text"
                          name="slug"
                          value={formData.slug}
                          onChange={handleInputChange}
                          className="w-full pl-28 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all font-mono"
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
                        className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 text-sm font-medium whitespace-nowrap transition-colors"
                        title="Generate from product name"
                      >
                        Auto Generate
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Product URL: <span className="font-mono text-rose-600">https://yourapp.com/products/{formData.slug || 'product-name'}</span>
                    </p>
                  </div>
                  
                  {/* Brand and Additional Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Brand (Optional)
                      </label>
                      <input
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                        placeholder="e.g., Nike, Rolex, Chanel"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Weight (grams, Optional)
                      </label>
                      <input
                        type="number"
                        name="weight"
                        value={formData.weight || ''}
                        onChange={handleInputChange}
                        min="0"
                        step="1"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
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
                className="bg-white rounded-2xl shadow-lg border p-6"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  Product Images *
                  {formData.images.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({formData.images.length}/5 images)
                    </span>
                  )}
                </h2>
                
                <div className="space-y-6">
                  {/* Upload Area */}
                  <div className={`border-3 border-dashed ${formData.images.length === 0 ? 'border-rose-200 bg-rose-50' : 'border-gray-200'} rounded-2xl p-8 text-center transition-all`}>
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
                          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-r from-rose-100 to-pink-100 rounded-full flex items-center justify-center">
                            <Upload className="text-rose-500" size={32} />
                          </div>
                        )}
                      </div>
                      <p className="text-lg font-medium mb-1">
                        {loading ? 'Uploading images...' : 'Drag & drop or click to upload'}
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        Upload up to 5 images • Max 2MB each • JPG, PNG, WebP
                      </p>
                      <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium">
                        <Upload size={18} />
                        Browse Files
                      </div>
                    </label>
                  </div>
                  
                  {/* Preview Grid */}
                  {formData.images.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Image Preview</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-sm">
                              <img
                                src={image}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110"
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
                      <p className="text-xs text-gray-500 mt-3">
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
                className="bg-white rounded-2xl shadow-lg border p-6"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-6">Pricing & Status</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Selling Price (PKR) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">₨</span>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        min="0"
                        step="1"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Original Price (PKR)
                      <span className="ml-2 text-xs font-normal text-gray-500">(Optional - for sale display)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">₨</span>
                      <input
                        type="number"
                        name="originalPrice"
                        value={formData.originalPrice || ''}
                        onChange={handleInputChange}
                        min="0"
                        step="1"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                        placeholder="Leave empty if not on sale"
                      />
                    </div>
                  </div>
                  
                  {/* Status Toggles */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Clock className="text-rose-500" size={20} />
                        <div>
                          <div className="font-medium">New Arrival</div>
                          <div className="text-xs text-gray-500">Show in new arrivals section</div>
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
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Tag className="text-green-500" size={20} />
                        <div>
                          <div className="font-medium">On Sale</div>
                          <div className="text-xs text-gray-500">Show sale badge and discount</div>
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
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        {formData.isPublished ? (
                          <Eye className="text-green-500" size={20} />
                        ) : (
                          <EyeOff className="text-gray-500" size={20} />
                        )}
                        <div>
                          <div className="font-medium">{formData.isPublished ? 'Published' : 'Draft'}</div>
                          <div className="text-xs text-gray-500">
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
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
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
                className="bg-white rounded-2xl shadow-lg border p-6"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-6">Inventory & Variants</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  
                  {/* Sizes */}
                  <div>
                    <label className="block text-sm font-medium mb-3 text-gray-700">
                      Available Sizes
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newSize}
                        onChange={(e) => setNewSize(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                        placeholder="Add size (e.g., XL, 10, One Size)"
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={addSize}
                        className="px-4 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors flex items-center"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.sizes.map((size) => (
                        <div
                          key={size}
                          className="group flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <span className="font-medium">{size}</span>
                          <button
                            type="button"
                            onClick={() => removeSize(size)}
                            className="text-gray-500 hover:text-red-600 transition-colors"
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
                    <label className="block text-sm font-medium mb-3 text-gray-700">
                      Available Colors
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                        placeholder="Add color (e.g., Navy Blue)"
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={addColor}
                        className="px-4 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors flex items-center"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.colors.map((color) => (
                        <div
                          key={color}
                          className="group flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: color.toLowerCase() }}
                          />
                          <span className="font-medium">{color}</span>
                          <button
                            type="button"
                            onClick={() => removeColor(color)}
                            className="text-gray-500 hover:text-red-600 transition-colors"
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
                    <label className="block text-sm font-medium mb-3 text-gray-700">
                      Materials (Optional)
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newMaterial}
                        onChange={(e) => setNewMaterial(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
                        placeholder="Add material (e.g., Cotton, Leather)"
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={addMaterial}
                        className="px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.materials?.map((material) => (
                        <div
                          key={material}
                          className="group flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <span className="font-medium">{material}</span>
                          <button
                            type="button"
                            onClick={() => removeMaterial(material)}
                            className="text-gray-500 hover:text-red-600 transition-colors"
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
            className="mt-8 bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl shadow-lg border border-rose-100 p-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
              <div className="flex-1">
                <h3 className="font-bold text-xl text-gray-800 mb-2">
                  {formData.isPublished ? 'Publish Product' : 'Save as Draft'}
                </h3>
                <p className="text-gray-600">
                  {formData.isPublished 
                    ? 'This product will be immediately visible to customers in your store.'
                    : 'This product will be saved but hidden from customers until published.'
                  }
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-rose-700">
                  ₨{formData.price.toLocaleString()}
                </div>
                {formData.originalPrice && formData.originalPrice > formData.price && (
                  <div className="text-sm text-gray-500 line-through">
                    ₨{formData.originalPrice.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push('/admin/products')}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl hover:from-rose-700 hover:to-pink-700 transition-all font-medium flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
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
              <div className="mt-6 pt-6 border-t border-rose-200">
                <p className="text-sm text-gray-600">
                  Product Preview URL:{' '}
                  <span className="font-mono text-rose-600 bg-rose-50 px-2 py-1 rounded">
                    /products/{formData.slug}
                  </span>
                </p>
              </div>
            )}
          </motion.div>
        </form>
      </div>
    </div>
  );
}