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
  Phone,
  Mail,
  Package,
  MapPin,
  User,
  Home,
  Tag,
  Gift,
  Zap,
  Crown,
  Gem,
  Shirt,
  Watch,
  SprayCan,
  Footprints
} from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';
import { useAuth } from '@/lib/context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import toast, { Toaster } from 'react-hot-toast';
import { sendOrderConfirmationEmail } from '@/lib/utils/email';

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
  const [emailSending, setEmailSending] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Pakistan',
    phone: '+92',
    saveInfo: false,
  });
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [easypaisaNumber, setEasypaisaNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    
    const phoneRegex = /^(\+92|0)[1-9][0-9]{9}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Valid Pakistani phone number required (e.g., +92 3XX XXXXXXX)';
    }
    
    if (paymentMethod === 'easypaisa' && !easypaisaNumber.trim()) {
      newErrors.easypaisaNumber = 'Easypaisa number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendOrderConfirmation = async (orderId: string, orderDetails: any) => {
    if (!user?.email) {
      console.warn('No user email available for sending confirmation');
      return { success: false, message: 'No user email available' };
    }

    console.log('Starting email confirmation for order:', orderId);
    console.log('User email:', user.email);
    
    setEmailSending(true);
    try {
      const emailResult = await sendOrderConfirmationEmail(user.email, orderDetails);
      
      console.log('Email result:', emailResult);
      
      if (!emailResult.success) {
        console.warn('Email sending failed:', emailResult.message, emailResult.error);
        return { success: false, message: emailResult.message, error: emailResult.error };
      }
      
      console.log('Order confirmation email sent successfully');
      return { success: true, message: emailResult.message };
    } catch (error) {
      console.error('Error in email sending process:', error);
      return { success: false, message: 'Failed to send email', error };
    } finally {
      setEmailSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) {
      return;
    }
    
    setLoading(true);

    try {
      const taxRate = 0.16; // 16% tax for Pakistan
      const shippingCost = state.total > 10000 ? 0 : 500;
      const subtotal = state.total;
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + shippingCost + taxAmount;

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
      const orderId = orderRef.id;

      const emailOrderDetails = {
        orderId,
        userName: `${formData.firstName} ${formData.lastName}`,
        items: state.items.map(item => ({
          id: item.id,
          name: item.name,
          size: item.size,
          color: item.color,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        subtotal,
        shippingCost,
        taxAmount,
        totalAmount,
        shippingAddress: {
          street: formData.address,
          city: formData.city,
          province: formData.province,
          country: formData.country,
          postalCode: formData.postalCode,
          phone: formData.phone,
        },
        paymentMethod,
        paymentDetails: paymentMethod === 'easypaisa' ? { easypaisaNumber } : {},
      };

      const emailPromise = sendOrderConfirmation(orderId, emailOrderDetails);

      // Custom toast styling for dark theme
      toast.success(
        (t) => (
          <div className="flex items-center gap-3">
            <CheckCircle className="text-emerald-400" size={24} />
            <div>
              <p className="font-semibold text-white">Order Placed Successfully!</p>
              <p className="text-sm text-slate-400 mt-1">
                Order ID: <span className="text-amber-300">{orderId}</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Mail size={14} className="text-amber-400" />
                <span className="text-xs text-slate-500">
                  Confirmation email sent to {user.email}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    dispatch({ type: 'CLEAR_CART' });
                    toast.dismiss(t.id);
                    router.push('/products');
                  }}
                  className="flex-1 px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 text-white text-sm rounded-lg hover:from-amber-700 hover:to-amber-600 transition-all"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={() => {
                    dispatch({ type: 'CLEAR_CART' });
                    toast.dismiss(t.id);
                    router.push('/account');
                  }}
                  className="flex-1 px-4 py-1.5 border border-slate-700 text-slate-300 text-sm rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  View Orders
                </button>
              </div>
            </div>
          </div>
        ),
        {
          duration: 10000,
          position: 'top-center',
          style: {
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#fff',
            border: '1px solid #334155',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          },
        }
      );

      emailPromise.then(emailResult => {
        if (!emailResult.success) {
          toast(
            (t) => (
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-900/30 flex items-center justify-center">
                  <span className="text-amber-400 text-sm">!</span>
                </div>
                <div>
                  <p className="font-medium text-sm text-amber-300">Order placed, but email notification failed</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Your order #{orderId} was placed successfully. You can view it in your orders.
                  </p>
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="mt-2 text-xs text-amber-400 hover:text-amber-300"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ),
            {
              duration: 8000,
              position: 'bottom-right',
              icon: null,
              style: {
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: '#fff',
                border: '1px solid #475569',
                borderRadius: '8px',
              },
            }
          );
        }
      });

      dispatch({ type: 'CLEAR_CART' });

      setTimeout(() => {
        router.push('/products');
      }, 10000);

    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(
        (t) => (
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-red-900/30 flex items-center justify-center">
              <span className="text-red-400 text-sm">!</span>
            </div>
            <div>
              <p className="font-medium text-red-300">Order Processing Failed</p>
              <p className="text-sm text-slate-400 mt-1">
                There was an error processing your order. Please try again.
              </p>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="mt-2 text-sm text-amber-400 hover:text-amber-300"
              >
                Try Again
              </button>
            </div>
          </div>
        ),
        {
          duration: 8000,
          position: 'top-center',
          icon: null,
          style: {
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#fff',
            border: '1px solid #7f1d1d',
            borderRadius: '8px',
          },
        }
      );
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
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white py-8">
      <Toaster />
      
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <Lock className="text-amber-400" />
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-300 to-amber-200 bg-clip-text text-transparent">
              Secure Checkout
            </h1>
          </div>
          <p className="text-slate-400">Complete your order with Pakistani payment options</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-900/30 to-amber-800/30 rounded-full flex items-center justify-center">
                    <span className="text-amber-300 font-bold">1</span>
                  </div>
                  <h2 className="text-xl font-bold text-amber-200">Contact Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      First Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 ${
                          errors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-amber-500 focus:border-transparent'
                        } text-white placeholder-slate-500`}
                        placeholder="Ali"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-red-400 text-sm mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 ${
                        errors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-amber-500 focus:border-transparent'
                      } text-white placeholder-slate-500`}
                      placeholder="Khan"
                    />
                    {errors.lastName && (
                      <p className="text-red-400 text-sm mt-1">{errors.lastName}</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      Email Address *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500 pl-10"
                        required
                        placeholder="customer@example.com"
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Order confirmation will be sent to this email
                    </p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      Phone Number *
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 ${
                            errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-amber-500 focus:border-transparent'
                          } text-white placeholder-slate-500 pl-10`}
                          placeholder="+92 3XX XXXXXXX"
                        />
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400 px-3 py-2 bg-slate-800/30 rounded-lg border border-slate-700">
                        <span>Pakistan</span>
                      </div>
                    </div>
                    {errors.phone && (
                      <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      Format: +92 followed by 10 digits (e.g., +92 300 1234567)
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-900/30 to-amber-800/30 rounded-full flex items-center justify-center">
                    <span className="text-amber-300 font-bold">2</span>
                  </div>
                  <h2 className="text-xl font-bold text-amber-200">Shipping Address</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      Street Address *
                    </label>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 ${
                          errors.address ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-amber-500 focus:border-transparent'
                        } text-white placeholder-slate-500`}
                        placeholder="House #123, Street #456, Area Name"
                      />
                    </div>
                    {errors.address && (
                      <p className="text-red-400 text-sm mt-1">{errors.address}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      City *
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 ${
                        errors.city ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-amber-500 focus:border-transparent'
                      } text-white`}
                    >
                      <option value="" className="bg-slate-800">Select a city</option>
                      {PAKISTANI_CITIES.map(city => (
                        <option key={city} value={city} className="bg-slate-800">{city}</option>
                      ))}
                    </select>
                    {errors.city && (
                      <p className="text-red-400 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      Province *
                    </label>
                    <select
                      name="province"
                      value={formData.province}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 ${
                        errors.province ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-amber-500 focus:border-transparent'
                      } text-white`}
                    >
                      <option value="" className="bg-slate-800">Select a province</option>
                      {PAKISTANI_PROVINCES.map(province => (
                        <option key={province} value={province} className="bg-slate-800">{province}</option>
                      ))}
                    </select>
                    {errors.province && (
                      <p className="text-red-400 text-sm mt-1">{errors.province}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 ${
                        errors.postalCode ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-amber-500 focus:border-transparent'
                      } text-white placeholder-slate-500`}
                      placeholder="54000"
                    />
                    {errors.postalCode && (
                      <p className="text-red-400 text-sm mt-1">{errors.postalCode}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      Country *
                    </label>
                    <div className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-300">
                      <div className="flex items-center gap-2">
                        <MapPin className="text-amber-400" size={16} />
                        Pakistan
                      </div>
                    </div>
                    <input type="hidden" name="country" value="Pakistan" />
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="flex items-center gap-3 text-slate-300">
                    <input
                      type="checkbox"
                      name="saveInfo"
                      checked={formData.saveInfo}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded bg-slate-800/50 border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm">Save this information for next time</span>
                  </label>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-900/30 to-amber-800/30 rounded-full flex items-center justify-center">
                    <span className="text-amber-300 font-bold">3</span>
                  </div>
                  <h2 className="text-xl font-bold text-amber-200">Payment Method</h2>
                </div>
                
                <div className="space-y-3">
                  <label className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === 'credit-card' 
                      ? 'bg-gradient-to-r from-amber-900/20 to-amber-800/20 border border-amber-700/50' 
                      : 'border border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="credit-card"
                      checked={paymentMethod === 'credit-card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-600"
                    />
                    <CreditCard className="text-amber-400" size={20} />
                    <div className="flex-1">
                      <span className="font-medium text-white">Credit/Debit Card</span>
                      <p className="text-sm text-slate-400">Pay with Visa, MasterCard, or UnionPay</p>
                    </div>
                  </label>
                  
                  <label className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === 'easypaisa' 
                      ? 'bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 border border-emerald-700/50' 
                      : 'border border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="easypaisa"
                      checked={paymentMethod === 'easypaisa'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 bg-slate-800 border-slate-600"
                    />
                    <Smartphone className="text-emerald-400" size={20} />
                    <div className="flex-1">
                      <span className="font-medium text-white">Easypaisa</span>
                      <p className="text-sm text-slate-400">Pay with your Easypaisa wallet</p>
                    </div>
                  </label>
                </div>

                {/* Easypaisa Number Input */}
                {paymentMethod === 'easypaisa' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 rounded-xl border border-emerald-700/50"
                  >
                    <label className="block text-sm font-medium mb-2 text-emerald-300">
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
                      className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 ${
                        errors.easypaisaNumber ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-emerald-500 focus:border-transparent'
                      } text-white placeholder-slate-500`}
                      placeholder="03XX XXXXXXX"
                    />
                    {errors.easypaisaNumber && (
                      <p className="text-red-400 text-sm mt-1">{errors.easypaisaNumber}</p>
                    )}
                    <p className="text-xs text-emerald-400 mt-2">
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
                  className="flex items-center gap-2 px-6 py-3 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800/50 hover:border-slate-600 transition-all"
                >
                  <ArrowLeft size={20} />
                  Back to Cart
                </button>
                
                <button
                  type="submit"
                  disabled={loading || emailSending || state.items.length === 0}
                  className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl hover:from-amber-700 hover:to-amber-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[160px] shadow-lg"
                >
                  {loading || emailSending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {loading ? 'Processing...' : 'Sending Email...'}
                    </>
                  ) : (
                    <>
                      <Lock size={20} />
                      Place Order
                    </>
                  )}
                </button>
              </div>

              {/* Email Note */}
              <div className="p-4 bg-gradient-to-r from-blue-900/20 to-blue-800/20 rounded-xl border border-blue-700/50">
                <div className="flex items-start gap-3">
                  <Mail className="text-blue-400 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm font-medium text-blue-300">
                      Order Confirmation Email
                    </p>
                    <p className="text-sm text-blue-400/90 mt-1">
                      After placing your order, a confirmation email with all order details will be sent to{' '}
                      <span className="font-medium text-white">{formData.email || 'your email address'}</span>.
                      Please check your inbox (and spam folder) for the confirmation.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 sticky top-8">
              <h2 className="text-xl font-bold mb-6 text-amber-200">Order Summary</h2>
              
              {/* Items */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
                {state.items.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 flex-shrink-0 border border-slate-700">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getCategoryIcon(item.category || '')}
                        <h4 className="font-medium text-sm text-white">{item.name}</h4>
                      </div>
                      <p className="text-xs text-slate-400">
                        Size: <span className="text-amber-300">{item.size}</span> | Color: <span className="text-amber-300">{item.color}</span>
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-slate-300">
                          {formatPKR(item.price)} × {item.quantity}
                        </span>
                        <span className="font-medium text-amber-300">
                          {formatPKR(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Totals */}
              <div className="space-y-3 border-t border-slate-700 pt-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-white">{formatPKR(state.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Shipping</span>
                  <span className={state.total > 10000 ? 'text-emerald-400' : 'text-white'}>
                    {state.total > 10000 ? 'FREE' : formatPKR(500)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tax (16%)</span>
                  <span className="text-white">{formatPKR(state.total * 0.16)}</span>
                </div>
                <div className="border-t border-slate-700 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-white">Total</span>
                    <span className="bg-gradient-to-r from-amber-300 to-amber-200 bg-clip-text text-transparent">
                      {formatPKR(state.total + (state.total > 10000 ? 0 : 500) + (state.total * 0.16))}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Shipping Progress */}
              {state.total <= 10000 && (
                <div className="mt-4 p-3 bg-gradient-to-r from-amber-900/20 to-amber-800/20 rounded-xl border border-amber-800/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-amber-300">
                      Add {formatPKR(10000 - state.total)} for free shipping!
                    </span>
                  </div>
                  <div className="h-1.5 bg-amber-900/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((state.total / 10000) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Email Notification */}
              <div className="mt-4 p-3 bg-gradient-to-r from-blue-900/20 to-blue-800/20 rounded-xl border border-blue-700/50">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-blue-400" />
                  <span className="text-sm font-medium text-blue-300">Email Receipt</span>
                </div>
                <p className="text-xs text-blue-400/90 mt-1">
                  A detailed receipt with all order items and totals will be emailed to you.
                </p>
              </div>
              
              {/* Security Badges */}
              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                  <Shield size={16} className="text-emerald-400" />
                  <span>Secure SSL encrypted checkout</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Truck size={16} className="text-teal-400" />
                  <span>Delivery in 3-7 business days</span>
                </div>
              </div>
              
              {/* Payment Icons */}
              <div className="mt-6 flex flex-wrap gap-2">
                <div className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-700">Visa</div>
                <div className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-700">MasterCard</div>
                <div className="px-2 py-1 bg-emerald-900/30 text-emerald-400 text-xs rounded-lg border border-emerald-800/50">Easypaisa</div>
                <div className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-700">JazzCash</div>
              </div>
              
              {/* Return Policy */}
              <div className="mt-6 p-3 bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 rounded-xl border border-emerald-700/50">
                <p className="text-sm text-emerald-400">
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