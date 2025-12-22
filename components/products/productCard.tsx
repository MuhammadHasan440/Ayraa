'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Eye, Star } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/lib/context/CartContext';
import {CurrencyFormatter} from '@/components/ui/CurrencyFormatter'; // ✅ Default import

interface ProductCardProps {
  product: Product;
  view?: 'grid' | 'list';
  className?: string;
}

export default function ProductCard({ product, view = 'grid', className = '' }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const { dispatch } = useCart();

  const addToCart = () => {
    const cartItem = {
      id: `${product.id}-default-default`,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      size: product.sizes[0] || 'M',
      color: product.colors[0] || 'Black',
      image: product.images[0],
    };

    dispatch({ type: 'ADD_ITEM', payload: cartItem });
    
    // Show quick feedback
    const button = document.activeElement as HTMLElement;
    if (button) {
      const originalText = button.textContent;
      button.textContent = 'Added!';
      button.classList.add('bg-green-600');
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('bg-green-600');
      }, 1000);
    }
  };

  const quickView = () => {
    window.location.href = `/products/${product.id}`;
  };

  if (view === 'list') {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        className={`flex flex-col md:flex-row gap-6 bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow ${className}`}
      >
        {/* Image */}
        <Link href={`/products/${product.id}`} className="block md:w-64 flex-shrink-0">
          <div className="relative h-64 md:h-full rounded-xl overflow-hidden bg-gray-100">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 256px) 100vw, 256px"
            />
            {product.isNewArrival && (
              <div className="absolute top-3 left-3 px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-full">
                NEW
              </div>
            )}
            {product.originalPrice && (
              <div className="absolute top-3 right-3 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                SALE
              </div>
            )}
          </div>
        </Link>

        {/* Details */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                product.category === 'traditional' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {product.category === 'traditional' ? 'Traditional' : 'Casual'}
              </span>
              {product.isNewArrival && (
                <span className="ml-2 px-3 py-1 bg-rose-100 text-rose-700 text-xs font-medium rounded-full">
                  New Arrival
                </span>
              )}
            </div>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Heart 
                size={20} 
                className={isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-400'} 
              />
            </button>
          </div>

          <Link href={`/products/${product.id}`}>
            <h3 className="text-xl font-bold mb-2 hover:text-rose-600 transition-colors">
              {product.name}
            </h3>
          </Link>

          <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < 4 ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">(48 reviews)</span>
            <span className="text-sm text-gray-600 ml-4">•</span>
            <span className="text-sm text-green-600 font-medium">
              {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          {/* Price - Using PKR */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl font-bold text-rose-700">
              <CurrencyFormatter value={product.price} /> {/* ✅ Fixed */}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-lg text-gray-400 line-through">
                  <CurrencyFormatter value={product.originalPrice} /> {/* ✅ Fixed */}
                </span>
                <span className="px-2 py-1 bg-red-100 text-red-700 text-sm font-medium rounded">
                  Save <CurrencyFormatter value={product.originalPrice - product.price} /> {/* ✅ Fixed */}
                </span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={addToCart}
              disabled={product.stock === 0}
              className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag size={18} />
              Add to Cart
            </button>
            <button
              onClick={quickView}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <Eye size={18} />
              Quick View
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid View (Default)
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`group bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-xl transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <Link href={`/products/${product.id}`} className="block relative">
        <div className="relative h-80 overflow-hidden bg-gray-100">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 400px) 100vw, 400px"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isNewArrival && (
              <span className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-full">
                NEW
              </span>
            )}
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
              </span>
            )}
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
              product.category === 'traditional' 
                ? 'bg-purple-600 text-white' 
                : 'bg-green-600 text-white'
            }`}>
              {product.category === 'traditional' ? 'Traditional' : 'Casual'}
            </span>
          </div>

          {/* Quick Actions */}
          <div className={`absolute top-3 right-3 flex flex-col gap-2 transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
          }`}>
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsFavorite(!isFavorite);
              }}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors"
              title="Add to favorites"
            >
              <Heart 
                size={18} 
                className={isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-600'} 
              />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                quickView();
              }}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors"
              title="Quick view"
            >
              <Eye size={18} className="text-gray-600" />
            </button>
          </div>

          {/* Add to Cart Overlay */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 transition-all duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <button
              onClick={(e) => {
                e.preventDefault();
                addToCart();
              }}
              disabled={product.stock === 0}
              className="w-full bg-white text-rose-700 py-3 rounded-lg font-medium hover:bg-rose-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ShoppingBag size={18} />
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-5">
        <div className="mb-2">
          <Link href={`/products/${product.id}`}>
            <h3 className="font-bold text-lg hover:text-rose-600 transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {product.description}
          </p>
        </div>

        {/* Rating & Stock */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < 4 ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
              />
            ))}
            <span className="text-sm text-gray-600 ml-1">(48)</span>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            product.stock > 10 
              ? 'bg-green-100 text-green-800'
              : product.stock > 0
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
          </span>
        </div>

        {/* Price - Using PKR */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-rose-700">
              <CurrencyFormatter value={product.price} /> {/* ✅ Fixed */}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                <CurrencyFormatter value={product.originalPrice} /> {/* ✅ Fixed */}
              </span>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            {product.sizes.length} sizes
          </div>
        </div>
      </div>
    </motion.div>
  );
}