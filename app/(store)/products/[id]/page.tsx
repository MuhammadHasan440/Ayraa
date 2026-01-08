'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  Star, 
  Truck, 
  Shield, 
  RefreshCw, 
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Package,
  Zap,
  Crown,
  Gem,
  Shirt,
  Watch,
  SprayCan,
  Footprints,
  Minus,
  Plus,
  Check,
  ShoppingBag,
  Tag
} from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';
import { Product } from '@/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { formatPKR } from '@/lib/utils/currency';

export default function ProductDetailPage() {
  const params = useParams();
  const { dispatch } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!params.id) return;
        
        const productDoc = await getDoc(doc(db, 'products', params.id as string));
        if (productDoc.exists()) {
          const data = productDoc.data();
          setProduct({
            id: productDoc.id,
            name: data.name || '',
            description: data.description || '',
            price: Number(data.price) || 0,
            originalPrice: data.originalPrice || null,
            images: Array.isArray(data.images) ? data.images : [data.images].filter(Boolean),
            category: data.category || 'traditional',
            isNewArrival: data.isNewArrival ?? false,
            sizes: Array.isArray(data.sizes) ? data.sizes : [data.sizes].filter(Boolean),
            colors: Array.isArray(data.colors) ? data.colors : [data.colors].filter(Boolean),
            stock: data.stock || 0,
            slug: data.slug || productDoc.id,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
          } as Product);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  const addToCart = () => {
    if (!product || !selectedSize || !selectedColor) {
      alert('Please select size and color');
      return;
    }

    const cartItem = {
      id: `${product.id}-${selectedSize}-${selectedColor}`,
      productId: product.id,
      category: product.category,
      name: product.name,
      price: product.price,
      quantity,
      size: selectedSize,
      color: selectedColor,
      image: product.images[0],
    };

    dispatch({ type: 'ADD_ITEM', payload: cartItem });
    
    // Show success notification
    alert('Added to cart successfully!');
  };

  // Category icons mapping
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'traditional': return <Crown size={20} className="text-amber-400" />;
      case 'party': return <Gem size={20} className="text-purple-400" />;
      case 'casual': return <Shirt size={20} className="text-emerald-400" />;
      case 'watches': return <Watch size={20} className="text-slate-400" />;
      case 'perfumes': return <SprayCan size={20} className="text-rose-400" />;
      case 'footwear': return <Footprints size={20} className="text-blue-400" />;
      default: return <ShoppingBag size={20} className="text-slate-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'traditional': return 'from-amber-900/30 to-amber-800/30 text-amber-300';
      case 'party': return 'from-purple-900/30 to-purple-800/30 text-purple-300';
      case 'casual': return 'from-emerald-900/30 to-emerald-800/30 text-emerald-300';
      case 'watches': return 'from-slate-800/50 to-slate-900/50 text-slate-300';
      case 'perfumes': return 'from-rose-900/30 to-rose-800/30 text-rose-300';
      case 'footwear': return 'from-blue-900/30 to-blue-800/30 text-blue-300';
      default: return 'from-slate-800/50 to-slate-900/50 text-slate-300';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'traditional': return 'Traditional Wear';
      case 'party': return 'Party Wear';
      case 'casual': return 'Casual Wear';
      case 'watches': return 'Luxury Watches';
      case 'perfumes': return 'Designer Perfumes';
      case 'footwear': return 'Premium Footwear';
      default: return 'Fashion';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 h-[500px] rounded-2xl"></div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-gradient-to-br from-slate-800 to-slate-700 h-20 w-20 rounded-xl"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-8 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg w-3/4"></div>
                <div className="h-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg w-1/2"></div>
                <div className="h-6 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg w-1/4"></div>
                <div className="h-32 bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-slate-700">
            <Package className="w-12 h-12 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-amber-200">Product not found</h2>
          <p className="text-slate-400 mt-2">The product you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const features = [
    { 
      icon: <Truck size={20} className="text-teal-400" />, 
      text: 'Free shipping on orders over Rs 10,000' 
    },
    { 
      icon: <Shield size={20} className="text-emerald-400" />, 
      text: '30-day easy return policy' 
    },
    { 
      icon: <RefreshCw size={20} className="text-amber-400" />, 
      text: 'Quick & easy exchanges' 
    },
    { 
      icon: <Zap size={20} className="text-red-400" />, 
      text: 'Express delivery available' 
    },
  ];

  const reviews = [
    { name: 'Sarah K.', rating: 5, comment: 'Perfect fit and amazing quality!', date: '2 days ago' },
    { name: 'Ali R.', rating: 5, comment: 'Love the design and material', date: '1 week ago' },
    { name: 'Fatima W.', rating: 4, comment: 'Great product, delivery was fast', date: '2 weeks ago' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900"
            >
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              
              {/* Image Navigation */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(prev => prev === 0 ? product.images.length - 1 : prev - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-slate-800/80 backdrop-blur-sm rounded-full hover:bg-slate-700/80 transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={() => setSelectedImage(prev => prev === product.images.length - 1 ? 0 : prev + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-slate-800/80 backdrop-blur-sm rounded-full hover:bg-slate-700/80 transition-colors"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
              
              {/* Favorite & Badges */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                {product.isNewArrival && (
                  <span className="px-3 py-1 bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-bold rounded-full">
                    NEW
                  </span>
                )}
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="p-2.5 bg-slate-800/80 backdrop-blur-sm rounded-full hover:bg-slate-700/80 transition-colors"
                >
                  <Heart 
                    size={22} 
                    className={isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-300'} 
                  />
                </button>
              </div>
            </motion.div>

            {/* Thumbnails */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === index 
                      ? 'border-amber-500 shadow-lg shadow-amber-500/20' 
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="relative w-full h-full bg-gradient-to-br from-slate-800 to-slate-900">
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category & Rating */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getCategoryIcon(product.category)}
                <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getCategoryColor(product.category)}`}>
                  {getCategoryName(product.category)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < 4 ? 'fill-amber-400 text-amber-400' : 'fill-slate-700 text-slate-700'}
                    />
                  ))}
                </div>
                <span className="text-sm text-slate-400">(48 reviews)</span>
              </div>
            </div>

            {/* Product Name */}
            <h1 className="text-3xl md:text-4xl font-bold text-white">{product.name}</h1>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-300 to-amber-200 bg-clip-text text-transparent">
                {formatPKR(product.price)}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-xl text-slate-400 line-through">
                    {formatPKR(product.originalPrice)}
                  </span>
                  <span className="px-3 py-1 bg-gradient-to-r from-red-900/30 to-red-800/30 text-red-300 text-sm font-medium rounded-full border border-red-800/50">
                    Save {formatPKR(product.originalPrice - product.price)}
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-slate-300 leading-relaxed text-lg">{product.description}</p>

            {/* Size Selection */}
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <label className="font-medium text-slate-300">Select Size</label>
                <button className="text-sm text-amber-400 hover:text-amber-300">
                  Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-3 rounded-xl transition-all ${
                      selectedSize === size
                        ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white border border-amber-500 shadow-lg'
                        : 'bg-slate-800/50 border border-slate-700 hover:border-amber-500/50 hover:text-amber-300 text-slate-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div className="space-y-4">
              <label className="font-medium text-slate-300">Select Color</label>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
                      selectedColor === color
                        ? 'bg-slate-800 border-amber-500'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="relative">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-slate-700"
                        style={{ backgroundColor: color }}
                      />
                      {selectedColor === color && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                    <span className="capitalize text-slate-300">{color}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity & Actions */}
            <div className="space-y-4 pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Quantity Selector */}
                <div className="flex items-center border border-slate-700 rounded-xl bg-slate-800/50">
                  <button
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="px-4 py-3 hover:bg-slate-700/50 transition-colors text-slate-300"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="px-6 py-3 min-w-[60px] text-center text-xl font-medium text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(prev => prev + 1)}
                    className="px-4 py-3 hover:bg-slate-700/50 transition-colors text-slate-300"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {/* Add to Cart */}
                <button
                  onClick={addToCart}
                  disabled={!selectedSize || !selectedColor || product.stock === 0}
                  className={`flex-1 py-3 rounded-xl transition-all font-medium flex items-center justify-center gap-3 ${
                    !selectedSize || !selectedColor || product.stock === 0
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  <ShoppingBag size={22} />
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>

                {/* Share Button */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }}
                  className="p-3 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <Share2 size={22} className="text-slate-300" />
                </button>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                {product.stock > 0 ? (
                  <>
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-emerald-400">
                      In stock ({product.stock} available)
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-red-400">Out of stock</span>
                  </>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="pt-6 border-t border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 text-slate-300">
                    <div className="p-2 rounded-lg bg-slate-800/50">
                      {feature.icon}
                    </div>
                    <span className="text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-12 lg:mt-16">
          {/* Tab Navigation */}
          <div className="border-b border-slate-800">
            <div className="flex space-x-8 overflow-x-auto">
              {['details', 'reviews', 'shipping', 'care'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? 'text-amber-300 border-b-2 border-amber-500'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {tab === 'details' && 'Product Details'}
                  {tab === 'reviews' && 'Reviews (48)'}
                  {tab === 'shipping' && 'Shipping & Returns'}
                  {tab === 'care' && 'Care Instructions'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="py-8">
            {activeTab === 'details' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-amber-200">Material & Craftsmanship</h3>
                  <ul className="space-y-3 text-slate-300">
                    <li className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                        <Check size={14} className="text-amber-400" />
                      </div>
                      <span>Premium Pakistani fabrics (Lawn, Silk, Cotton)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                        <Check size={14} className="text-amber-400" />
                      </div>
                      <span>Hand-stitched detailing and embroidery</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                        <Check size={14} className="text-amber-400" />
                      </div>
                      <span>Traditional craftsmanship with modern finishing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                        <Check size={14} className="text-amber-400" />
                      </div>
                      <span>Ethically sourced materials</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-amber-200">Features & Benefits</h3>
                  <ul className="space-y-3 text-slate-300">
                    <li className="flex items-start gap-2">
                      <Tag size={18} className="text-purple-400 mt-1 flex-shrink-0" />
                      <span>Premium quality with durability guarantee</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap size={18} className="text-amber-400 mt-1 flex-shrink-0" />
                      <span>Express shipping across Pakistan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield size={18} className="text-emerald-400 mt-1 flex-shrink-0" />
                      <span>6-month quality warranty</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Truck size={18} className="text-blue-400 mt=1 flex-shrink-0" />
                      <span>Free shipping on orders over Rs 10,000</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-center p-6 rounded-2xl bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700">
                    <div className="text-4xl font-bold text-amber-300">4.8</div>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < 4 ? 'fill-amber-400 text-amber-400' : 'fill-slate-700 text-slate-700'}
                        />
                      ))}
                    </div>
                    <div className="text-sm text-slate-400 mt-2">48 reviews</div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-amber-200 mb-2">Customer Feedback</h4>
                    <p className="text-slate-300">
                      Our customers love the quality and design of our products. 
                      Join thousands of satisfied customers who trust AYRAA for premium fashion.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reviews.map((review, index) => (
                    <div key={index} className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-700 text-slate-700'}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-slate-500">{review.date}</span>
                      </div>
                      <p className="text-slate-300 mb-3">{review.comment}</p>
                      <div className="text-sm font-medium text-slate-400">- {review.name}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'shipping' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-amber-200">Shipping Information</h3>
                  <div className="space-y-3 text-slate-300">
                    <div className="flex items-start gap-3">
                      <Truck className="text-teal-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Free Shipping</div>
                        <div className="text-sm">On orders over Rs 10,000 across Pakistan</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Zap className="text-amber-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Express Delivery</div>
                        <div className="text-sm">2-3 business days in major cities</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Package className="text-blue-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Cash on Delivery</div>
                        <div className="text-sm">Available for all Pakistani orders</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-amber-200">Return Policy</h3>
                  <div className="space-y-3 text-slate-300">
                    <div className="flex items-start gap-3">
                      <RefreshCw className="text-emerald-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-medium">30-Day Returns</div>
                        <div className="text-sm">Easy returns for unused items with tags</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Shield className="text-purple-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Quality Guarantee</div>
                        <div className="text-sm">6-month warranty on manufacturing defects</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Tag className="text-rose-400 mt=1 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Exchange Option</div>
                        <div className="text-sm">Quick size/color exchanges available</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'care' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-amber-200">Care Instructions</h3>
                  <ul className="space-y-2 text-slate-300">
                    <li>• Hand wash recommended for traditional wear</li>
                    <li>• Dry clean embellished items only</li>
                    <li>• Iron on low heat with cloth protection</li>
                    <li>• Avoid direct sunlight for color preservation</li>
                    <li>• Store in breathable garment bags</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-amber-200">Material Care</h3>
                  <ul className="space-y-2 text-slate-300">
                    <li>• Cotton/Lawn: Machine wash cold, tumble dry low</li>
                    <li>• Silk: Dry clean only</li>
                    <li>• Embroidered: Hand wash separately</li>
                    <li>• Stitched Items: Press seams carefully</li>
                    <li>• Jewelry/Trims: Avoid harsh chemicals</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}