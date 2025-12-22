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
      // Store current page to return after login
      sessionStorage.setItem('redirectAfterLogin', '/cart');
      
      // Redirect to login page
      router.push('/login');
      return;
    }

    // User is logged in, proceed to checkout
    setIsCheckingOut(true);
    setTimeout(() => {
      window.location.href = '/checkout';
    }, 500);
  };

  const calculateSubtotal = () => state.total;
  const calculateShipping = () => state.total > FREE_SHIPPING_THRESHOLD ? 0 : 500; // PKR 500 shipping
  const calculateTax = () => state.total * 0.13; // 13% tax for Pakistan
  const calculateTotal = () => calculateSubtotal() + calculateShipping() + calculateTax();

  const features = [
    {
      icon: <Truck className="w-6 h-6" />,
      title: 'Free Shipping',
      description: `On orders over ${formatPKR(FREE_SHIPPING_THRESHOLD)}`, // Updated
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure Checkout',
      description: 'SSL encrypted',
    },
    {
      icon: <RefreshCw className="w-6 h-6" />,
      title: 'Easy Returns',
      description: '30-day policy',
    },
    {
      icon: <Gift className="w-6 h-6" />,
      title: 'Gift Cards',
      description: 'Send digital gifts',
    },
  ];

  if (state.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8"
          >
            <div className="w-32 h-32 mx-auto bg-rose-100 rounded-full flex items-center justify-center">
              <ShoppingBag size={64} className="text-rose-600" />
            </div>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold mb-4"
          >
            Your cart is empty
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 mb-8 text-lg"
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
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
            >
              <ArrowLeft size={20} />
              Continue Shopping
            </Link>
            
            <Link
              href="/products?category=traditional"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 border-2 border-rose-600 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors font-medium"
            >
              <Tag size={20} />
              Shop Traditional Wear
            </Link>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 pt-8 border-t"
          >
            <h3 className="text-xl font-bold mb-6">Why Shop With Us?</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div key={feature.title} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-rose-100 text-rose-600 rounded-full mb-3">
                    {feature.icon}
                  </div>
                  <h4 className="font-medium">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
      <p className="text-gray-600 mb-8">Review your items and proceed to checkout</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Cart Header */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Your Items ({state.itemCount})</h2>
                <button
                  onClick={() => dispatch({ type: 'CLEAR_CART' })}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="divide-y">
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
                      <div className="relative w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 128px) 100vw, 128px"
                        />
                        {item.quantity > 1 && (
                          <div className="absolute top-2 right-2 w-8 h-8 bg-rose-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            ×{item.quantity}
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              <span>Size: {item.size}</span>
                              <span>Color: {item.color}</span>
                            </div>
                            <p className="font-bold text-lg">{formatPKR(item.price)}</p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center border rounded-lg">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="px-3 py-2 hover:bg-gray-50"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="px-4 py-2 min-w-[40px] text-center font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="px-3 py-2 hover:bg-gray-50"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove item"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>

                        {/* Item Total */}
                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                          <div className="text-sm text-gray-600">
                            Item total
                          </div>
                          <div className="text-lg font-bold">
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
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
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
                    className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button className="px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors">
                    Apply
                  </button>
                  <button
                    onClick={() => setShowPromoInput(false)}
                    className="px-4 py-3 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowPromoInput(true)}
                  className="w-full sm:w-auto inline-flex items-center gap-2 px-6 py-3 border-2 border-rose-600 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors font-medium"
                >
                  <Tag size={20} />
                  Add Promo Code
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>

            {/* Summary Details */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPKR(calculateSubtotal())}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className={calculateShipping() === 0 ? 'text-green-600 font-medium' : ''}>
                  {calculateShipping() === 0 ? 'FREE' : formatPKR(calculateShipping())}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (13%)</span>
                <span>{formatPKR(calculateTax())}</span>
              </div>

              {/* Shipping Progress */}
              {calculateShipping() > 0 && (
                <div className="mt-4 p-4 bg-rose-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Add {formatPKR(FREE_SHIPPING_THRESHOLD - state.total)} for free shipping!
                    </span>
                    <span className="text-sm font-bold text-rose-700">
                      {formatPKR(state.total)} / {formatPKR(FREE_SHIPPING_THRESHOLD)}
                    </span>
                  </div>
                  <div className="h-2 bg-rose-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-600 rounded-full"
                      style={{ width: `${Math.min((state.total / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>{formatPKR(calculateTotal())}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Including {formatPKR(calculateTax())} in taxes
              </p>
            </div>

            {/* Checkout Button - Updated with Authentication Check */}
            {user ? (
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full bg-rose-600 text-white py-4 rounded-lg hover:bg-rose-700 transition-colors font-medium flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {isCheckingOut ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Proceed to Checkout
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-rose-600 text-white py-4 rounded-lg hover:bg-rose-700 transition-colors font-medium flex items-center justify-center gap-3 mb-2"
                >
                  <ArrowRight size={20} />
                  Proceed to Checkout
                </button>
                <p className="text-sm text-center text-gray-600">
                  You'll be asked to log in or create an account to continue
                </p>
              </div>
            )}

            {/* User Status Indicator */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Account Status:</span>
                <span className={`font-medium ${user ? 'text-green-600' : 'text-amber-600'}`}>
                  {user ? `Logged in as ${user.email?.split('@')[0]}` : 'Guest User'}
                </span>
              </div>
              {!user && (
                <p className="text-xs text-gray-500 mt-1">
                  <Link href="/login" className="text-rose-600 hover:underline">
                    Sign in
                  </Link> for faster checkout and order tracking
                </p>
              )}
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-6">
              <Shield size={16} />
              <span>Secure checkout • SSL encrypted</span>
            </div>

            {/* Payment Methods */}
            <div className="border-t pt-6">
              <p className="text-sm font-medium mb-3">We accept</p>
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm">Visa</div>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm">Mastercard</div>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm">PayPal</div>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm">JazzCash</div>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm">Easypaisa</div>
              </div>
            </div>

            {/* Guarantee */}
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start gap-3">
                <Shield className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800 mb-1">Shopping Guarantee</h4>
                  <p className="text-green-700 text-sm">
                    30-day returns • Free shipping over {formatPKR(FREE_SHIPPING_THRESHOLD)} • Price match guarantee
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Sidebar */}
          <div className="mt-6 space-y-4">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border">
                <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="text-rose-600">
                    {feature.icon}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recently Viewed (Placeholder) */}
      <div className="mt-16">
        <h3 className="text-xl font-bold mb-6">You may also like</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}