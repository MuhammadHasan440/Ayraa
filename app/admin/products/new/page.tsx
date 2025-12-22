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
  Image as ImageIcon,
  Globe,
  Eye,
  EyeOff,
  Hash,
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
  category: 'traditional' | 'casual';
  isNewArrival: boolean;
  isPublished: boolean; // ✅ ADDED: Control visibility in store
  sizes: string[];
  colors: string[];
  stock: number;
  images: string[];
  slug: string; // ✅ ADDED: For URL-friendly product links
}

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
    isPublished: true, // ✅ ADDED: Default to published
    sizes: ['S', 'M', 'L'],
    colors: ['Black', 'White', 'Red'],
    stock: 10,
    images: [],
    slug: '', // ✅ ADDED: Will be auto-generated
  });
  
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  const [manualSlug, setManualSlug] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/admin-login');
    }
  }, [user, isAdmin, authLoading, router]);

  // ✅ ADDED: Auto-generate slug from product name
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  };

  // ✅ ADDED: Auto-update slug when name changes
  useEffect(() => {
    if (!manualSlug && formData.name) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(prev.name)
      }));
    }
  }, [formData.name, manualSlug]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else if (name === 'price' || name === 'originalPrice' || name === 'stock') {
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
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // 70% quality
      };
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Limit to 5 images max to prevent Firestore size limits
    const selectedFiles = Array.from(files).slice(0, 5);
    
    // Show loading for images
    setLoading(true);

    try {
      const base64Images: string[] = [];

      for (const file of selectedFiles) {
        // Check file size (max 2MB per image)
        if (file.size > 2 * 1024 * 1024) {
          alert(`Image ${file.name} is too large. Maximum size is 2MB.`);
          continue;
        }

        // Convert to base64
        const base64 = await fileToBase64(file);
        
        // Resize to reduce size
        const resizedBase64 = await resizeImage(base64);
        base64Images.push(resizedBase64);
      }

      // Add to form data
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...base64Images].slice(0, 5) // Max 5 images
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
    if (totalImageSize > 5000000) { // 5MB limit
      alert('Total image size is too large. Please reduce the number of images or their quality.');
      return;
    }

    setLoading(true);

    try {
      // Prepare product data with ALL required fields
      const productData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        originalPrice: formData.originalPrice || null,
        category: formData.category,
        isNewArrival: formData.isNewArrival,
        isPublished: formData.isPublished, // ✅ ADDED: Store visibility status
        sizes: formData.sizes,
        colors: formData.colors,
        stock: formData.stock,
        images: formData.images,
        slug: formData.slug, // ✅ ADDED: URL-friendly identifier
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log('Creating product in Firestore...');
      console.log('Product data:', { ...productData, images: `${productData.images.length} images` });
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'products'), productData);
      
      console.log('✅ Product created with ID:', docRef.id);
      
      alert(`✅ Product created successfully!\n\nProduct will ${formData.isPublished ? 'immediately appear' : 'NOT appear'} in the store.\n\nProduct URL: /products/${formData.slug}`);
      
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-rose-700">AYRAA Admin</h1>
        </div>
        <nav className="p-4 space-y-1">
          {[
            { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
            { name: 'Products', href: '/admin/products', icon: '👚' },
            { name: 'Orders', href: '/admin/orders', icon: '📦' },
            { name: 'Users', href: '/admin/users', icon: '👥' },
            { name: 'Analytics', href: '/admin/analytics', icon: '📈' },
          ].map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-rose-50 hover:text-rose-700 transition-colors"
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Add New Product</h1>
            <p className="text-gray-600">Create a new product for your store</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-bold mb-4">Basic Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      required
                      placeholder="Enter product name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      required
                      placeholder="Describe the product..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="traditional">Traditional Wear</option>
                      <option value="casual">Casual Wear</option>
                    </select>
                  </div>
                  
                  {/* ✅ ADDED: URL Slug Field */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      URL Slug *
                      <span className="ml-2 text-xs text-gray-500">
                        (Used in product URL)
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text"
                          name="slug"
                          value={formData.slug}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm whitespace-nowrap"
                        title="Generate from product name"
                      >
                        Auto Generate
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Product will be accessible at: <span className="font-mono">/products/{formData.slug || 'product-name'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-bold mb-4">Pricing</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Original Price ($) <span className="text-gray-500">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      name="originalPrice"
                      value={formData.originalPrice || ''}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="Leave empty if not on sale"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isNewArrival"
                        name="isNewArrival"
                        checked={formData.isNewArrival}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                      />
                      <label htmlFor="isNewArrival" className="text-sm flex items-center gap-2">
                        Mark as New Arrival
                        {formData.isNewArrival && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs rounded-full">
                            Featured
                          </span>
                        )}
                      </label>
                    </div>
                    
                    {/* ✅ ADDED: Publish Status Toggle */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPublished"
                        name="isPublished"
                        checked={formData.isPublished}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <label htmlFor="isPublished" className="text-sm flex items-center gap-2">
                        {formData.isPublished ? (
                          <>
                            <Eye size={16} className="text-green-600" />
                            <span className="text-green-700 font-medium">Published in Store</span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                              Visible to Customers
                            </span>
                          </>
                        ) : (
                          <>
                            <EyeOff size={16} className="text-gray-500" />
                            <span className="text-gray-700">Draft (Hidden from Store)</span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                              Admin Only
                            </span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Images */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-bold mb-4">
                  Product Images *
                  {formData.images.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({formData.images.length}/5 images)
                    </span>
                  )}
                </h2>
                
                <div className="space-y-4">
                  {/* Image Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
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
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        {loading ? (
                          <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Upload className="text-gray-400" size={24} />
                        )}
                      </div>
                      <p className="text-sm font-medium mb-1">
                        {loading ? 'Processing images...' : 'Click to upload images'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Max 5 images, 2MB each (stored in database)
                      </p>
                    </label>
                  </div>
                  
                  {/* Preview Images */}
                  {formData.images.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Selected Images:</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                              <img
                                src={image}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove image"
                            >
                              <X size={16} />
                            </button>
                            <div className="mt-1 text-xs text-center truncate">
                              Image {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Images are compressed and stored directly in the database
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Inventory */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-bold mb-4">Inventory</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      required
                    />
                  </div>
                  
                  {/* Sizes */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Available Sizes
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newSize}
                        onChange={(e) => setNewSize(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                        placeholder="Add size (e.g., XL)"
                        className="flex-1 px-3 py-2 border rounded"
                      />
                      <button
                        type="button"
                        onClick={addSize}
                        className="px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 flex items-center"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.sizes.map((size) => (
                        <div
                          key={size}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg"
                        >
                          <span className="font-medium">{size}</span>
                          <button
                            type="button"
                            onClick={() => removeSize(size)}
                            className="text-red-500 hover:text-red-700"
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
                    <label className="block text-sm font-medium mb-2">
                      Available Colors
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                        placeholder="Add color (e.g., Blue)"
                        className="flex-1 px-3 py-2 border rounded"
                      />
                      <button
                        type="button"
                        onClick={addColor}
                        className="px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 flex items-center"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.colors.map((color) => (
                        <div
                          key={color}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg"
                        >
                          <div 
                            className="w-4 h-4 rounded-full border"
                            style={{ 
                              backgroundColor: color.toLowerCase(),
                              borderColor: '#d1d5db'
                            }}
                          />
                          <span className="font-medium">{color}</span>
                          <button
                            type="button"
                            onClick={() => removeColor(color)}
                            className="text-red-500 hover:text-red-700"
                            title="Remove color"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons with Status Preview */}
          <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-lg">Ready to Create Product</h3>
                <p className="text-gray-600 text-sm">
                  {formData.isPublished ? (
                    <span className="flex items-center gap-2 text-green-600">
                      <Globe size={16} />
                      This product will appear in your store immediately
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-gray-500">
                      <EyeOff size={16} />
                      This product will be saved as a draft (not visible in store)
                    </span>
                  )}
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Product Preview</div>
                <div className="text-lg font-bold">
                  {formData.name || 'Unnamed Product'}
                </div>
                <div className="text-sm text-gray-500">
                  /products/{formData.slug || 'product-slug'}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push('/admin/products')}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Product...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {formData.isPublished ? 'Publish Product' : 'Save as Draft'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}