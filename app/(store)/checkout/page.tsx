'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Lock, 
  Shield, 
  Truck, 
  CreditCard,
  Smartphone,
  ArrowLeft,
  CheckCircle,
  Phone
} from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';
import { useAuth } from '@/lib/context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import toast, { Toaster } from 'react-hot-toast';

// PKR currency formatter
const formatPKR = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Pakistani cities
const PAKISTANI_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
  'Hyderabad', 'Sukkur', 'Bahawalpur', 'Abbottabad', 'Mardan'
];

// Pakistani provinces
const PAKISTANI_PROVINCES = [
  'Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan',
  'Gilgit-Baltistan', 'Azad Jammu & Kashmir'
];

export default function CheckoutPage() {
  const router = useRouter();
  const { state, dispatch } = useCart();
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Pakistan',
    phone: '+92', // Default Pakistan country code
    saveInfo: false,
  });
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [easypaisaNumber, setEasypaisaNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/checkout');
    }
  }, [user, router]);

  useEffect(() => {
    if (user && userData) {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        firstName: userData.name?.split(' ')[0] || '',
        lastName: userData.name?.split(' ')[1] || '',
        phone: userData.phone || '+92',
      }));
    }
  }, [userData, user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.province.trim()) newErrors.province = 'Province is required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    
    // Pakistani phone validation
    const phoneRegex = /^(\+92|0)[1-9][0-9]{9}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Valid Pakistani phone number required (e.g., +92 3XX XXXXXXX)';
    }
    
    // Easypaisa validation
    if (paymentMethod === 'easypaisa' && !easypaisaNumber.trim()) {
      newErrors.easypaisaNumber = 'Easypaisa number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) {
      return;
    }
    
    setLoading(true);

    try {
      // Calculate totals
      const taxRate = 0.13; // 13% tax for Pakistan
      const shippingCost = state.total > 10000 ? 0 : 500; // Free shipping over PKR 10,000
      const subtotal = state.total;
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + shippingCost + taxAmount;

      // Create order in Firestore
      const orderData = {
        userId: user.uid,
        userEmail: user.email,
        userName: `${formData.firstName} ${formData.lastName}`,
        items: state.items,
        subtotal: subtotal,
        shippingCost: shippingCost,
        taxAmount: taxAmount,
        totalAmount: totalAmount,
        shippingAddress: {
          street: formData.address,
          city: formData.city,
          province: formData.province,
          country: formData.country,
          postalCode: formData.postalCode,
          phone: formData.phone,
        },
        status: 'pending',
        paymentMethod: paymentMethod,
        paymentDetails: paymentMethod === 'easypaisa' ? {
          easypaisaNumber: easypaisaNumber,
        } : {},
        paymentStatus: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // Show success toast
      toast.success(
        (t) => (
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-500" size={24} />
            <div>
              <p className="font-semibold">Order Placed Successfully!</p>
              <p className="text-sm text-gray-600 mt-1">
                Order ID: {orderRef.id}
              </p>
              <button
                onClick={() => {
                  dispatch({ type: 'CLEAR_CART' });
                  toast.dismiss(t.id);
                  router.push('/products');
                }}
                className="mt-2 px-4 py-1.5 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ),
        {
          duration: 8000,
          position: 'top-center',
          style: {
            background: '#fff',
            color: '#333',
            border: '1px solid #e5e7eb',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          },
        }
      );

      // Clear cart after toast appears
      dispatch({ type: 'CLEAR_CART' });

      // Auto-redirect after 8 seconds
      setTimeout(() => {
        router.push('/products');
      }, 8000);

    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('There was an error processing your order. Please try again.', {
        position: 'top-center',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete Your Order</h1>
          <p className="text-gray-600">Secure checkout with Pakistani payment options</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contact Information */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                    <span className="text-rose-600 font-bold">1</span>
                  </div>
                  <h2 className="text-xl font-bold">Contact Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.firstName ? 'border-red-500 focus:ring-red-500' : 'focus:ring-rose-500'
                      }`}
                      placeholder="Ali"
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.lastName ? 'border-red-500 focus:ring-red-500' : 'focus:ring-rose-500'
                      }`}
                      placeholder="Khan"
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      required
                      placeholder="customer@example.com"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Phone Number *
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                            errors.phone ? 'border-red-500 focus:ring-red-500' : 'focus:ring-rose-500'
                          }`}
                          placeholder="+92 3XX XXXXXXX"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={16} />
                        <span>Pakistan</span>
                      </div>
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Format: +92 followed by 10 digits (e.g., +92 300 1234567)
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                    <span className="text-rose-600 font-bold">2</span>
                  </div>
                  <h2 className="text-xl font-bold">Shipping Address</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.address ? 'border-red-500 focus:ring-red-500' : 'focus:ring-rose-500'
                      }`}
                      placeholder="House #123, Street #456, Area Name"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      City *
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.city ? 'border-red-500 focus:ring-red-500' : 'focus:ring-rose-500'
                      }`}
                    >
                      <option value="">Select a city</option>
                      {PAKISTANI_CITIES.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Province *
                    </label>
                    <select
                      name="province"
                      value={formData.province}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.province ? 'border-red-500 focus:ring-red-500' : 'focus:ring-rose-500'
                      }`}
                    >
                      <option value="">Select a province</option>
                      {PAKISTANI_PROVINCES.map(province => (
                        <option key={province} value={province}>{province}</option>
                      ))}
                    </select>
                    {errors.province && (
                      <p className="text-red-500 text-sm mt-1">{errors.province}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.postalCode ? 'border-red-500 focus:ring-red-500' : 'focus:ring-rose-500'
                      }`}
                      placeholder="54000"
                    />
                    {errors.postalCode && (
                      <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Country *
                    </label>
                    <div className="px-4 py-2 border rounded-lg bg-gray-50">
                      Pakistan
                    </div>
                    <input type="hidden" name="country" value="Pakistan" />
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="saveInfo"
                      checked={formData.saveInfo}
                      onChange={handleInputChange}
                      className="rounded"
                    />
                    <span className="text-sm">Save this information for next time</span>
                  </label>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                    <span className="text-rose-600 font-bold">3</span>
                  </div>
                  <h2 className="text-xl font-bold">Payment Method</h2>
                </div>
                
                <div className="space-y-4">
                  <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer ${
                    paymentMethod === 'credit-card' ? 'border-rose-500 bg-rose-50' : 'hover:border-rose-300'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="credit-card"
                      checked={paymentMethod === 'credit-card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-rose-600"
                    />
                    <CreditCard className="text-gray-600" />
                    <div className="flex-1">
                      <span className="font-medium">Credit/Debit Card</span>
                      <p className="text-sm text-gray-600">Pay with Visa, MasterCard, or UnionPay</p>
                    </div>
                  </label>
                  
                  <label className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer ${
                    paymentMethod === 'easypaisa' ? 'border-rose-500 bg-rose-50' : 'hover:border-rose-300'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="easypaisa"
                      checked={paymentMethod === 'easypaisa'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-rose-600"
                    />
                    <Smartphone className="text-green-600" />
                    <div className="flex-1">
                      <span className="font-medium">Easypaisa</span>
                      <p className="text-sm text-gray-600">Pay with your Easypaisa wallet</p>
                    </div>
                  </label>
                </div>

                {/* Easypaisa Number Input */}
                {paymentMethod === 'easypaisa' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200"
                  >
                    <label className="block text-sm font-medium mb-2 text-green-800">
                      Easypaisa Mobile Account Number *
                    </label>
                    <input
                      type="tel"
                      value={easypaisaNumber}
                      onChange={(e) => {
                        setEasypaisaNumber(e.target.value);
                        if (errors.easypaisaNumber) {
                          setErrors(prev => ({ ...prev, easypaisaNumber: '' }));
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.easypaisaNumber ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500'
                      }`}
                      placeholder="03XX XXXXXXX"
                    />
                    {errors.easypaisaNumber && (
                      <p className="text-red-500 text-sm mt-1">{errors.easypaisaNumber}</p>
                    )}
                    <p className="text-xs text-green-700 mt-2">
                      After placing order, you'll receive payment instructions via SMS
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-between gap-4">
                <button
                  type="button"
                  onClick={() => router.push('/cart')}
                  className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft size={20} />
                  Back to Cart
                </button>
                
                <button
                  type="submit"
                  disabled={loading || state.items.length === 0}
                  className="px-8 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock size={20} />
                      Place Order
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-8">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>
              
              {/* Items */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {state.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-xs text-gray-600">
                        Size: {item.size} | Color: {item.color}
                      </p>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm">
                          {formatPKR(item.price)} × {item.quantity}
                        </span>
                        <span className="font-medium">
                          {formatPKR(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Totals */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPKR(state.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className={state.total > 10000 ? 'text-green-600' : ''}>
                    {state.total > 10000 ? 'FREE' : formatPKR(500)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (13%)</span>
                  <span>{formatPKR(state.total * 0.13)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>
                      {formatPKR(state.total + (state.total > 10000 ? 0 : 500) + (state.total * 0.13))}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Shipping Progress */}
              {state.total <= 10000 && (
                <div className="mt-4 p-3 bg-rose-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-rose-700">
                      Add {formatPKR(10000 - state.total)} for free shipping!
                    </span>
                  </div>
                  <div className="h-1.5 bg-rose-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-600 rounded-full"
                      style={{ width: `${Math.min((state.total / 10000) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Security Badges */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <Shield size={16} />
                  <span>Secure SSL encrypted checkout</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Truck size={16} />
                  <span>Delivery in 3-7 business days</span>
                </div>
              </div>
              
              {/* Payment Icons */}
              <div className="mt-6 flex flex-wrap gap-2">
                <div className="px-2 py-1 bg-gray-100 text-xs rounded">Visa</div>
                <div className="px-2 py-1 bg-gray-100 text-xs rounded">MasterCard</div>
                <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Easypaisa</div>
                <div className="px-2 py-1 bg-gray-100 text-xs rounded">JazzCash</div>
              </div>
              
              {/* Return Policy */}
              <div className="mt-6 p-4 bg-rose-50 rounded-lg">
                <p className="text-sm text-rose-800">
                  <strong>30-Day Return Policy:</strong> Easy returns with free pickup.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}