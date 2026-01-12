'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowLeft, 
  ArrowRight,
  Truck,
  Shield,
  RefreshCw,
  Gift,
  Tag,
  Crown,
  Gem,
  Shirt,
  Watch,
  SprayCan,
  Footprints,
  Lock,
  Package,
  CheckCircle,
  CreditCard,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';
import { useAuth } from '@/lib/context/AuthContext';

// PKR currency formatter
const formatPKR = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Free shipping threshold for PKR
const FREE_SHIPPING_THRESHOLD = 10000; // PKR 10,000

export default function CartPage() {
  const router = useRouter();
  const { state, dispatch } = useCart();
  const { user } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      dispatch({ type: 'REMOVE_ITEM', payload: id });
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity: newQuantity } });
    }
  };

  const removeItem = (id: string) => {
    if (confirm('Are you sure you want to remove this item from your cart?')) {
      dispatch({ type: 'REMOVE_ITEM', payload: id });
    }
  };

  const handleCheckout = () => {
    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', '/cart');
      router.push('/login');
      return;
    }

    setIsCheckingOut(true);
    setTimeout(() => {
      window.location.href = '/checkout';
    }, 500);
  };

  const calculateSubtotal = () => state.total;
  const calculateShipping = () => state.total > FREE_SHIPPING_THRESHOLD ? 0 : 500; // PKR 500 shipping
  const calculateTax = () => state.total * 0.16; // 16% tax for Pakistan
  const calculateTotal = () => calculateSubtotal() + calculateShipping() + calculateTax();

  const features = [
    {
      icon: <Truck className="w-5 h-5" />,
      title: 'Free Shipping',
      description: `Over ${formatPKR(FREE_SHIPPING_THRESHOLD)}`,
      color: 'text-teal-400',
      bg: 'bg-teal-900/20'
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Secure Payment',
      description: 'SSL encrypted',
      color: 'text-emerald-400',
      bg: 'bg-emerald-900/20'
    },
    {
      icon: <RefreshCw className="w-5 h-5" />,
      title: 'Easy Returns',
      description: '30-day policy',
      color: 'text-amber-400',
      bg: 'bg-amber-900/20'
    },
    {
      icon: <Gift className="w-5 h-5" />,
      title: 'Gift Cards',
      description: 'Send digital gifts',
      color: 'text-purple-400',
      bg: 'bg-purple-900/20'
    },
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'traditional': return <Crown size={16} className="text-amber-400" />;
      case 'party': return <Gem size={16} className="text-purple-400" />;
      case 'casual': return <Shirt size={16} className="text-emerald-400" />;
      case 'watches': return <Watch size={16} className="text-slate-400" />;
      case 'perfumes': return <SprayCan size={16} className="text-rose-400" />;
      case 'footwear': return <Footprints size={16} className="text-blue-400" />;
      default: return <Package size={16} className="text-slate-400" />;
    }
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-8"
            >
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center border border-slate-700">
                <ShoppingBag size={64} className="text-amber-400" />
              </div>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-bold mb-4 text-white"
            >
              Your Cart is Empty
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-400 mb-8 text-lg"
            >
              Looks like you haven't added any items to your cart yet.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl hover:from-amber-700 hover:to-amber-600 transition-all font-medium shadow-lg"
              >
                <ArrowLeft size={20} />
                Continue Shopping
              </Link>
              
              <Link
                href="/products?category=traditional"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 border-2 border-amber-500 text-amber-300 rounded-xl hover:bg-amber-900/20 transition-all font-medium"
              >
                <Crown size={20} />
                Shop Traditional Wear
              </Link>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-16 pt-8 border-t border-slate-800"
            >
              <h3 className="text-xl font-bold mb-6 text-amber-200">Why Shop With AYRAA?</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {features.map((feature, index) => (
                  <div key={feature.title} className="text-center p-4 rounded-xl bg-slate-800/30 border border-slate-700">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-3 ${feature.bg} ${feature.color}`}>
                      {feature.icon}
                    </div>
                    <h4 className="font-medium text-white">{feature.title}</h4>
                    <p className="text-sm text-slate-400">{feature.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick Categories */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12"
            >
              <h4 className="text-lg font-semibold mb-4 text-slate-300">Browse Collections</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { name: 'Traditional Wear', href: '/products?category=traditional', icon: Crown },
                  { name: 'Party Wear', href: '/products?category=party', icon: Gem },
                  { name: 'Casual Wear', href: '/products?category=casual', icon: Shirt },
                  { name: 'Luxury Watches', href: '/products?category=watches', icon: Watch },
                  { name: 'Designer Perfumes', href: '/products?category=perfumes', icon: SprayCan },
                  { name: 'Premium Footwear', href: '/products?category=footwear', icon: Footprints },
                ].map((category) => {
                  const Icon = category.icon;
                  return (
                    <Link
                      key={category.name}
                      href={category.href}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700 hover:border-amber-500/50 hover:bg-slate-800/50 transition-all"
                    >
                      <div className="p-2 rounded-lg bg-slate-800/50">
                        <Icon size={18} className="text-amber-400" />
                      </div>
                      <span className="text-sm text-slate-300">{category.name}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="text-amber-400" />
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-300 to-amber-200 bg-clip-text text-transparent">
              Shopping Cart
            </h1>
          </div>
          <p className="text-slate-400">Review your items and proceed to checkout</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 overflow-hidden">
              {/* Cart Header */}
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-amber-200">Your Items ({state.itemCount})</h2>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to clear your cart?')) {
                        dispatch({ type: 'CLEAR_CART' });
                      }
                    }}
                    className="text-sm text-red-400 hover:text-red-300 font-medium flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Clear Cart
                  </button>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="divide-y divide-slate-700">
                <AnimatePresence>
                  {state.items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-6"
                    >
                      <div className="flex flex-col sm:flex-row gap-6">
                        {/* Product Image */}
                        <div className="relative w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 128px) 100vw, 128px"
                          />
                          {item.quantity > 1 && (
                            <div className="absolute top-2 right-2 w-8 h-8 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold border border-amber-400">
                              ×{item.quantity}
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getCategoryIcon(item.category || '')}
                                <h3 className="font-bold text-lg text-white">{item.name}</h3>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                                <span>Size: <span className="text-amber-300">{item.size}</span></span>
                                <span>Color: <span className="text-amber-300">{item.color}</span></span>
                              </div>
                              <p className="font-bold text-lg text-amber-300">{formatPKR(item.price)}</p>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center border border-slate-700 rounded-lg bg-slate-800/50">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="px-3 py-2 hover:bg-slate-700/50 transition-colors text-slate-300"
                                >
                                  <Minus size={16} />
                                </button>
                                <span className="px-4 py-2 min-w-[40px] text-center font-medium text-white">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="px-3 py-2 hover:bg-slate-700/50 transition-colors text-slate-300"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                              
                              <button
                                onClick={() => removeItem(item.id)}
                                className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors border border-red-800/30"
                                title="Remove item"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>

                          {/* Item Total */}
                          <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
                            <div className="text-sm text-slate-400">
                              Item total
                            </div>
                            <div className="text-lg font-bold text-amber-300">
                              {formatPKR(item.price * item.quantity)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Continue Shopping & Promo */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800/50 hover:border-slate-600 transition-all font-medium"
              >
                <ArrowLeft size={20} />
                Continue Shopping
              </Link>

              <div className="flex-1">
                {showPromoInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Enter promo code"
                      className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500"
                    />
                    <button className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl hover:from-amber-700 hover:to-amber-600 transition-all">
                      Apply
                    </button>
                    <button
                      onClick={() => setShowPromoInput(false)}
                      className="px-4 py-3 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPromoInput(true)}
                    className="w-full sm:w-auto inline-flex items-center gap-2 px-6 py-3 border-2 border-amber-500 text-amber-300 rounded-xl hover:bg-amber-900/20 transition-all font-medium"
                  >
                    <Tag size={20} />
                    Add Promo Code
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary - Fixed Layout */}
          <div className="lg:col-span-1">
            {/* Main Order Summary Card */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 overflow-hidden mb-6">
              {/* Header */}
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-amber-200">Order Summary</h2>
              </div>

              {/* Price Breakdown */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Subtotal ({state.itemCount} items)</span>
                  <span className="font-medium text-white">{formatPKR(calculateSubtotal())}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Shipping</span>
                  <span className={calculateShipping() === 0 ? 'text-emerald-400 font-medium' : 'text-white'}>
                    {calculateShipping() === 0 ? 'FREE' : formatPKR(calculateShipping())}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Tax (16%)</span>
                  <span className="text-white">{formatPKR(calculateTax())}</span>
                </div>

                {/* Shipping Progress Bar */}
                {calculateShipping() > 0 && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-amber-900/20 to-amber-800/20 rounded-xl border border-amber-800/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-amber-300">
                        Add {formatPKR(FREE_SHIPPING_THRESHOLD - state.total)} for free shipping!
                      </span>
                      <span className="text-sm font-bold text-amber-300">
                        {Math.round((state.total / FREE_SHIPPING_THRESHOLD) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-amber-900/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((state.total / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-amber-400/70 mt-1">
                      <span>{formatPKR(0)}</span>
                      <span>{formatPKR(FREE_SHIPPING_THRESHOLD)}</span>
                    </div>
                  </div>
                )}

                {/* Total Amount */}
                <div className="border-t border-slate-700 pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-lg font-bold text-white">Total Amount</div>
                      <p className="text-sm text-slate-400 mt-1">
                        {calculateShipping() === 0 ? 'Free shipping included' : `Shipping: ${formatPKR(calculateShipping())}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-amber-200 bg-clip-text text-transparent">
                        {formatPKR(calculateTotal())}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">PKR</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkout Button Section */}
              <div className="p-6 border-t border-slate-700 bg-slate-900/20">
                {user ? (
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    {isCheckingOut ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard size={20} />
                        Proceed to Checkout
                        <ArrowRight size={20} />
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={handleCheckout}
                      className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <ArrowRight size={20} />
                      Proceed to Checkout
                    </button>
                    <p className="text-sm text-center text-slate-400 px-2">
                      You'll be asked to log in or create an account to continue
                    </p>
                  </div>
                )}

                {/* User Status - Compact */}
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {user ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Lock className="w-4 h-4 text-amber-400" />
                      )}
                      <span className="text-sm text-slate-300">
                        {user ? 'Logged in' : 'Guest checkout'}
                      </span>
                    </div>
                    {!user && (
                      <Link 
                        href="/login" 
                        className="text-sm text-amber-400 hover:text-amber-300 hover:underline"
                      >
                        Sign in
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Collapsible Payment Methods */}
              <div className="border-t border-slate-700">
                <button
                  onClick={() => setShowPaymentMethods(!showPaymentMethods)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-medium text-slate-300">Payment & Security</span>
                  </div>
                  {showPaymentMethods ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                
                <AnimatePresence>
                  {showPaymentMethods && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-4">
                        {/* Security Info */}
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-300 p-3 bg-slate-800/30 rounded-xl">
                          <Lock className="w-4 h-4 text-emerald-400" />
                          <span>Secure SSL Encryption • 100% Safe</span>
                        </div>

                        {/* Payment Methods */}
                        <div>
                          <p className="text-sm font-medium mb-2 text-slate-300">Accepted Payment Methods</p>
                          <div className="grid grid-cols-3 gap-2">
                            {['Visa', 'Mastercard', 'JazzCash', 'Easypaisa', 'Bank', 'COD'].map((method) => (
                              <div 
                                key={method} 
                                className="px-2 py-1.5 bg-slate-800/50 rounded-lg text-xs text-slate-300 border border-slate-700 text-center hover:bg-slate-800/70 transition-colors"
                              >
                                {method}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Shopping Guarantee Card */}
            <div className="mb-6 p-5 bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 rounded-2xl border border-emerald-800/30">
              <div className="flex items-center gap-3 mb-3">
                <Star className="text-emerald-400 w-5 h-5" />
                <h4 className="font-medium text-emerald-300">AYRAA Shopping Guarantee</h4>
              </div>
              <ul className="text-sm text-emerald-400/90 space-y-2 pl-8">
                <li className="relative before:content-['✓'] before:absolute before:-left-4">
                  30-day easy returns
                </li>
                <li className="relative before:content-['✓'] before:absolute before:-left-4">
                  Free shipping over {formatPKR(FREE_SHIPPING_THRESHOLD)}
                </li>
                <li className="relative before:content-['✓'] before:absolute before:-left-4">
                  6-month warranty on all products
                </li>
                <li className="relative before:content-['✓'] before:absolute before:-left-4">
                  Price match guarantee
                </li>
              </ul>
            </div>

            {/* Features Sidebar */}
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div 
                  key={feature.title} 
                  className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700 hover:border-slate-600 transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${feature.bg} ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white mb-0.5">{feature.title}</h4>
                    <p className="text-sm text-slate-400">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recently Viewed */}
        <div className="mt-12 lg:mt-16 pt-8 border-t border-slate-800">
          <h3 className="text-xl font-bold mb-6 text-amber-200">Frequently Bought Together</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl h-64 animate-pulse border border-slate-700"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}