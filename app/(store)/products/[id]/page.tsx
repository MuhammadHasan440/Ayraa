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
  ChevronLeft, 
  ChevronRight,
  Heart,
  Share2
} from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';
import { Product } from '@/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { formatPKR } from '@/lib/utils/currency'; // Import PKR formatter

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

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!params.id) return;
        
        const productDoc = await getDoc(doc(db, 'products', params.id as string));
        if (productDoc.exists()) {
          setProduct({
            id: productDoc.id,
            ...productDoc.data()
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="bg-gray-200 h-[500px] rounded-lg"></div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-gray-200 h-20 w-20 rounded"></div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold">Product not found</h2>
        <p className="text-gray-600 mt-2">The product you're looking for doesn't exist.</p>
      </div>
    );
  }

  const features = [
    { icon: <Truck size={20} />, text: 'Free shipping on orders over Rs 5,000' }, // Updated to PKR
    { icon: <Shield size={20} />, text: '30-day return policy' },
    { icon: <RefreshCw size={20} />, text: 'Easy exchanges' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div>
          {/* Main Image */}
          <div className="relative h-[500px] mb-4 rounded-2xl overflow-hidden bg-gray-100">
            <Image
              src={product.images[selectedImage]}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
            >
              <Heart 
                size={24} 
                className={isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-600'} 
              />
            </button>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto py-2">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                  selectedImage === index ? 'border-rose-500' : 'border-transparent'
                }`}
              >
                <div className="relative w-full h-full">
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
            <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">
              {product.category === 'traditional' ? 'Traditional Wear' : 'Casual Wear'}
            </span>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < 4 ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                />
              ))}
              <span className="ml-2 text-sm text-gray-600">(48 reviews)</span>
            </div>
          </div>

          {/* Product Name */}
          <h1 className="text-3xl md:text-4xl font-bold">{product.name}</h1>

          {/* Price - UPDATED TO PKR */}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-rose-700">
              {formatPKR(product.price)}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-xl text-gray-400 line-through">
                  {formatPKR(product.originalPrice)}
                </span>
                <span className="px-2 py-1 bg-rose-100 text-rose-700 text-sm font-medium rounded">
                  Save {formatPKR(product.originalPrice - product.price)}
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed">{product.description}</p>

          {/* Size Selection */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="font-medium">Size</label>
              <button className="text-sm text-rose-600 hover:text-rose-700">
                Size Guide
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 border rounded-lg transition-colors ${
                    selectedSize === size
                      ? 'border-rose-500 bg-rose-50 text-rose-700'
                      : 'border-gray-300 hover:border-rose-300'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <label className="font-medium">Color</label>
            <div className="flex flex-wrap gap-3">
              {product.colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                    selectedColor === color
                      ? 'border-rose-500 bg-rose-50'
                      : 'border-gray-300 hover:border-rose-300'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: color }}
                  />
                  <span className="capitalize">{color}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity & Add to Cart */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <div className="flex items-center border rounded-lg">
              <button
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                className="px-4 py-3 hover:bg-gray-50"
              >
                -
              </button>
              <span className="px-4 py-3 min-w-[60px] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(prev => prev + 1)}
                className="px-4 py-3 hover:bg-gray-50"
              >
                +
              </button>
            </div>

            <button
              onClick={addToCart}
              disabled={!selectedSize || !selectedColor}
              className={`flex-1 py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 ${
                !selectedSize || !selectedColor
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-rose-600 text-white hover:bg-rose-700'
              }`}
            >
              Add to Cart
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
              }}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Share2 size={20} />
            </button>
          </div>

          {/* Stock Status */}
          <div className="pt-4">
            {product.stock > 0 ? (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>In stock ({product.stock} available)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Out of stock</span>
              </div>
            )}
          </div>

          {/* Features - Updated to PKR */}
          <div className="space-y-3 pt-6 border-t">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-gray-600">
                {feature.icon}
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related Products & Reviews */}
      <div className="mt-16">
        {/* Tabs for Description, Reviews, etc. */}
        <div className="border-b">
          <div className="flex space-x-8">
            <button className="py-4 font-medium border-b-2 border-rose-600 text-rose-600">
              Product Details
            </button>
            <button className="py-4 font-medium text-gray-600 hover:text-gray-900">
              Reviews (48)
            </button>
            <button className="py-4 font-medium text-gray-600 hover:text-gray-900">
              Shipping & Returns
            </button>
          </div>
        </div>

        {/* Additional Details - Updated with Pakistani context */}
        <div className="py-8">
          <h3 className="text-xl font-bold mb-4">About this product</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-2">Material & Care</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Premium Pakistani Cotton / Lawn / Silk</li>
                <li>Hand-wash recommended for traditional wear</li>
                <li>Iron on low heat with cloth protection</li>
                <li>Dry clean for embellished items</li>
                <li>Store in cool, dry place</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Product Information</h4>
              <ul className="space-y-2 text-gray-600">
                <li>• Made in Pakistan with local craftsmanship</li>
                <li>• Ethically produced by skilled artisans</li>
                <li>• Free shipping across Pakistan on orders over Rs 5,000</li>
                <li>• 7-day easy returns & exchanges</li>
                <li>• Cash on Delivery available</li>
                <li>• 6-month quality guarantee</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}