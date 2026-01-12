'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Eye, Star, Sparkles, Shield, Zap, Check } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/lib/context/CartContext';
import { CurrencyFormatter } from '@/components/ui/CurrencyFormatter';

interface ProductCardProps {
  product: Product;
  view?: 'grid' | 'list';
  className?: string;
}

export default function ProductCard({ product, view = 'grid', className = '' }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [cartButtonState, setCartButtonState] = useState<'idle' | 'adding' | 'added'>('idle');
  const { dispatch } = useCart();

  // Reset button state after animation completes
  useEffect(() => {
    if (cartButtonState === 'added') {
      const timer = setTimeout(() => {
        setCartButtonState('idle');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cartButtonState]);

  const addToCart = () => {
    const cartItem = {
      id: `${product.id}-default-default`,
      productId: product.id,
      category: product.category,
      name: product.name,
      price: product.price,
      quantity: 1,
      size: product.sizes[0] || 'M',
      color: product.colors[0] || 'Black',
      image: product.images[0],
    };

    dispatch({ type: 'ADD_ITEM', payload: cartItem });
    
    // Update button state instead of manipulating DOM
    setCartButtonState('adding');
    
    // Small delay to show "adding" state before "added" confirmation
    setTimeout(() => {
      setCartButtonState('added');
    }, 100);
  };

  const quickView = () => {
    window.location.href = `/products/${product.id}`;
  };

  if (view === 'list') {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        className={`flex flex-col md:flex-row gap-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 hover:shadow-xl transition-all backdrop-blur-sm hover:border-amber-500/30 ${className}`}
      >
        {/* Image */}
        <Link href={`/products/${product.id}`} className="block md:w-64 flex-shrink-0">
          <div className="relative h-64 md:h-full rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 group">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 256px) 100vw, 256px"
            />
            {product.isNewArrival && (
              <div className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-amber-600 to-amber-500 text-white text-xs font-bold rounded-full shadow-lg">
                <div className="flex items-center gap-1">
                  <Sparkles size={10} />
                  NEW
                </div>
              </div>
            )}
           
          </div>
        </Link>

        {/* Details */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-3">
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-slate-800 to-slate-900 border ${
                product.category === 'traditional' 
                  ? 'border-purple-500/30 text-purple-300' 
                  : 'border-emerald-500/30 text-emerald-300'
              }`}>
                {product.category === 'traditional' ? 'Traditional' : 'Casual'}
              </span>
              {product.isNewArrival && (
                <span className="px-3 py-1 bg-gradient-to-r from-amber-600/20 to-amber-500/20 text-amber-300 text-xs font-medium rounded-full border border-amber-500/30">
                  <div className="flex items-center gap-1">
                    <Sparkles size={10} />
                    New Arrival
                  </div>
                </span>
              )}
              {product.isBestSeller && (
                <span className="px-3 py-1 bg-gradient-to-r from-rose-600/20 to-rose-500/20 text-rose-300 text-xs font-medium rounded-full border border-rose-500/30">
                  Best Seller
                </span>
              )}
            </div>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 hover:bg-slate-800/50 rounded-full transition-colors border border-slate-700"
            >
              <Heart 
                size={20} 
                className={isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400 hover:text-amber-400'} 
              />
            </button>
          </div>

          <Link href={`/products/${product.id}`}>
            <h3 className="text-xl font-bold mb-2 text-white hover:text-amber-300 transition-colors">
              {product.name}
            </h3>
          </Link>

          <p className="text-slate-400 mb-4 line-clamp-2">{product.description}</p>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < 4 ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}
                />
              ))}
            </div>
            <span className="text-sm text-slate-500">(48 reviews)</span>
            <span className="text-sm text-slate-500 ml-4">•</span>
            <span className={`text-sm font-medium flex items-center gap-1 ${
              product.stock > 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {product.stock > 0 ? (
                <>
                  <Shield size={12} className="text-emerald-400" />
                  In Stock
                </>
              ) : (
                'Out of Stock'
              )}
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-amber-200 bg-clip-text text-transparent">
              <CurrencyFormatter value={product.price} />
            </span>
            {product.originalPrice && (
              <>
                <span className="text-lg text-slate-500 line-through">
                  <CurrencyFormatter value={product.originalPrice} />
                </span>
                <span className="px-2 py-1 bg-gradient-to-r from-red-600/20 to-red-500/20 text-red-300 text-sm font-medium rounded border border-red-500/30">
                  Save <CurrencyFormatter value={product.originalPrice - product.price} />
                </span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={addToCart}
              disabled={product.stock === 0 || cartButtonState === 'adding' || cartButtonState === 'added'}
              className={`flex items-center justify-center gap-2 px-6 py-3 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg min-w-[140px] ${
                cartButtonState === 'added'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500'
                  : cartButtonState === 'adding'
                  ? 'bg-gradient-to-r from-amber-700 to-amber-600'
                  : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600'
              }`}
            >
              {cartButtonState === 'added' ? (
                <>
                  <Check size={18} />
                  Added!
                </>
              ) : cartButtonState === 'adding' ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <ShoppingBag size={18} />
                  Add to Cart
                </>
              )}
            </button>
            <button
              onClick={quickView}
              className="flex items-center gap-2 px-6 py-3 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800/50 transition-colors font-medium hover:border-amber-500/30 hover:text-amber-300"
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
      className={`group bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 overflow-hidden hover:shadow-2xl transition-all duration-300 backdrop-blur-sm hover:border-amber-500/30 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <Link href={`/products/${product.id}`} className="block relative">
        <div className="relative h-80 overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
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
              <span className="px-3 py-1 bg-gradient-to-r from-amber-600 to-amber-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                <Sparkles size={10} />
                NEW
              </span>
            )}
           
            <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-lg bg-gradient-to-r ${
              product.category === 'traditional' 
                ? 'from-purple-600 to-purple-500 text-white' 
                : 'from-emerald-600 to-emerald-500 text-white'
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
              className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center shadow-lg hover:from-slate-700 hover:to-slate-800 transition-all border border-slate-700"
              title="Add to favorites"
            >
              <Heart 
                size={18} 
                className={isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400 hover:text-amber-400'} 
              />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                quickView();
              }}
              className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center shadow-lg hover:from-slate-700 hover:to-slate-800 transition-all border border-slate-700"
              title="Quick view"
            >
              <Eye size={18} className="text-slate-400 hover:text-amber-400" />
            </button>
          </div>

          {/* Add to Cart Overlay */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <button
              onClick={(e) => {
                e.preventDefault();
                addToCart();
              }}
              disabled={product.stock === 0 || cartButtonState === 'adding' || cartButtonState === 'added'}
              className={`w-full text-white py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg ${
                cartButtonState === 'added'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500'
                  : cartButtonState === 'adding'
                  ? 'bg-gradient-to-r from-amber-700 to-amber-600'
                  : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600'
              }`}
            >
              {cartButtonState === 'added' ? (
                <>
                  <Check size={18} />
                  Added to Cart!
                </>
              ) : cartButtonState === 'adding' ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : product.stock === 0 ? (
                'Out of Stock'
              ) : (
                <>
                  <ShoppingBag size={18} />
                  Add to Cart
                </>
              )}
            </button>
          </div>
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-5">
        <div className="mb-2">
          <Link href={`/products/${product.id}`}>
            <h3 className="font-bold text-lg text-white hover:text-amber-300 transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>
          <p className="text-slate-400 text-sm line-clamp-2 mb-3">
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
                className={i < 4 ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}
              />
            ))}
            
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full border ${
            product.stock > 10 
              ? 'bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : product.stock > 0
              ? 'bg-gradient-to-r from-amber-600/20 to-amber-500/20 text-amber-300 border-amber-500/30'
              : 'bg-gradient-to-r from-red-600/20 to-red-500/20 text-red-300 border-red-500/30'
          }`}>
            {product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-amber-300 to-amber-200 bg-clip-text text-transparent">
              <CurrencyFormatter value={product.price} />
            </span>
            {product.originalPrice && (
              <span className="text-sm text-slate-500 line-through">
                <CurrencyFormatter value={product.originalPrice} />
              </span>
            )}
          </div>
          
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Zap size={12} className="text-amber-400" />
            {product.sizes.length} sizes
          </div>
        </div>
      </div>
    </motion.div>
  );
}