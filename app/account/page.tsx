'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Eye, 
  EyeOff, 
  Check,
  Calendar,
  Shield,
  LogOut,
  Package,
  Heart,
  CreditCard,
  Bell,
  Globe,
  ShoppingBag,
  Truck,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, signOut } from 'firebase/auth';
import { doc, updateDoc, getDoc, collection, query, where, orderBy, getDocs, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import toast from 'react-hot-toast';

// Simple date formatter (remove date-fns dependency)
const formatDate = (date: any): string => {
  if (!date) return 'N/A';
  
  try {
    let dateObj: Date;
    
    // Handle Firestore Timestamp
    if (date.toDate && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date.seconds) {
      // Firestore timestamp with seconds
      dateObj = new Date(date.seconds * 1000);
    } else {
      dateObj = new Date();
    }
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    // Format date in Pakistani style
    return dateObj.toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

// PKR currency formatter
const formatPKR = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Pakistani cities for dropdown
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

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  address?: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  preferences?: {
    newsletter: boolean;
    smsNotifications: boolean;
    emailNotifications: boolean;
  };
  createdAt: string;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
  color?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  shippingCost: number;
  taxAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod: string;
  shippingAddress: any;
  createdAt: any;
  updatedAt: any;
}

interface WishlistItem {
  id: string;
  productId: string;
  userId: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    category: string;
    isNewArrival: boolean;
    createdAt: any;
  };
  addedAt: any;
}

export default function AccountPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'orders' | 'wishlist' | 'notifications'>('profile');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '+92',
    address: {
      street: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'Pakistan',
    },
    dateOfBirth: '',
    gender: 'prefer-not-to-say' as 'male' | 'female' | 'other' | 'prefer-not-to-say',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [preferences, setPreferences] = useState({
    newsletter: true,
    smsNotifications: false,
    emailNotifications: true,
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        
        // Fetch additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data() as DocumentData;
        
        const userProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || userData?.name || '',
          email: user.email || '',
          phoneNumber: user.phoneNumber || userData?.phone || '+92',
          photoURL: user.photoURL || '',
          address: userData?.address || {
            street: '',
            city: '',
            province: '',
            postalCode: '',
            country: 'Pakistan',
          },
          dateOfBirth: userData?.dateOfBirth || '',
          gender: userData?.gender || 'prefer-not-to-say',
          preferences: userData?.preferences || {
            newsletter: true,
            smsNotifications: false,
            emailNotifications: true,
          },
          createdAt: user.metadata.creationTime || new Date().toISOString(),
        };

        setProfile(userProfile);
        setFormData({
          displayName: userProfile.displayName,
          email: userProfile.email,
          phoneNumber: userProfile.phoneNumber || '+92',
          address: userProfile.address || {
            street: '',
            city: '',
            province: '',
            postalCode: '',
            country: 'Pakistan',
          },
          dateOfBirth: userProfile.dateOfBirth || '',
          gender: userProfile.gender || 'prefer-not-to-say',
        });
        setPreferences(userProfile.preferences || {
          newsletter: true,
          smsNotifications: false,
          emailNotifications: true,
        });

      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, router]);

  // Fetch user's orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        const ordersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];
        
        setOrders(ordersData);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders');
      }
    };

    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [user, activeTab]);

  // Fetch user's wishlist
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) return;

      setIsLoadingWishlist(true);
      try {
        const wishlistQuery = query(
          collection(db, 'wishlist'),
          where('userId', '==', user.uid),
          orderBy('addedAt', 'desc')
        );
        const wishlistSnapshot = await getDocs(wishlistQuery);
        
        const wishlistItems: WishlistItem[] = [];
        
        for (const wishlistDoc of wishlistSnapshot.docs) {
          const data = wishlistDoc.data() as DocumentData;
          const productDoc = await getDoc(doc(db, 'products', data.productId));
          
          if (productDoc.exists()) {
            const productData = productDoc.data() as DocumentData;
            wishlistItems.push({
              id: wishlistDoc.id,
              productId: data.productId,
              userId: data.userId,
              product: {
                id: productDoc.id,
                name: productData.name || '',
                price: productData.price || 0,
                images: productData.images || [],
                category: productData.category || '',
                isNewArrival: productData.isNewArrival || false,
                createdAt: productData.createdAt
              },
              addedAt: data.addedAt
            });
          }
        }
        
        setWishlist(wishlistItems);
      } catch (error) {
        console.error('Error fetching wishlist:', error);
        toast.error('Failed to load wishlist');
      } finally {
        setIsLoadingWishlist(false);
      }
    };

    if (activeTab === 'wishlist') {
      fetchWishlist();
    }
  }, [user, activeTab]);

  // Remove item from wishlist
  const removeFromWishlist = async (wishlistId: string) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'wishlist', wishlistId), {
        isActive: false,
        removedAt: new Date()
      });
      
      setWishlist(prev => prev.filter(item => item.id !== wishlistId));
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    }
  };

  // Move to cart from wishlist
  const moveToCart = async (productId: string) => {
    // You would implement your cart logic here
    toast.success('Product added to cart');
    // You might want to remove from wishlist after moving to cart
  };

  const handleProfileChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePreferencesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const validateProfileForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    // Pakistani phone validation
    const phoneRegex = /^(\+92|0)[1-9][0-9]{9}$/;
    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Valid Pakistani phone number required (e.g., +92 3XX XXXXXXX)';
    }
    
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dob >= today) {
        newErrors.dateOfBirth = 'Date of birth must be in the past';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateProfileForm() || !user) return;
    
    try {
      setLoading(true);
      setErrors({});
      
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: formData.displayName,
      });
      
      // Update additional data in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        name: formData.displayName,
        phone: formData.phoneNumber,
        address: formData.address,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        updatedAt: new Date().toISOString(),
      });
      
      setSuccessMessage('Profile updated successfully!');
      toast.success('Profile updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setErrors({ submit: error.message || 'Failed to update profile' });
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm() || !user || !user.email) return;
    
    try {
      setLoading(true);
      setErrors({});
      
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );
      
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, passwordData.newPassword);
      
      setSuccessMessage('Password updated successfully!');
      toast.success('Password updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Clear password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
    } catch (error: any) {
      console.error('Error updating password:', error);
      let errorMessage = 'Failed to update password';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'New password is too weak';
      }
      
      setErrors({ submit: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setLoading(true);
      
      await updateDoc(doc(db, 'users', user.uid), {
        preferences,
        updatedAt: new Date().toISOString(),
      });
      
      setSuccessMessage('Preferences updated successfully!');
      toast.success('Preferences updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error updating preferences:', error);
      setErrors({ submit: 'Failed to update preferences' });
      toast.error('Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 h-64 bg-gray-200 rounded-xl"></div>
              <div className="lg:col-span-3 h-96 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
          <p className="text-gray-600">Manage your profile, orders, and preferences</p>
        </motion.div>

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"
          >
            <Check className="text-green-600" size={20} />
            <span className="text-green-700 font-medium">{successMessage}</span>
          </motion.div>
        )}

        {/* Error Message */}
        {errors.submit && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
          >
            <span className="text-red-700 font-medium">{errors.submit}</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border p-6 sticky top-8">
              {/* User Info */}
              <div className="flex items-center gap-4 mb-8">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-rose-100 to-pink-100 flex items-center justify-center">
                    {profile?.photoURL ? (
                      <img
                        src={profile.photoURL}
                        alt={profile.displayName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="text-rose-600" size={32} />
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{profile?.displayName}</h3>
                  <p className="text-sm text-gray-600">{profile?.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Member since {profile ? formatDate(profile.createdAt) : ''}
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'profile'
                      ? 'bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border border-rose-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <User size={20} />
                  <span className="font-medium">Profile Information</span>
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'security'
                      ? 'bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border border-rose-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Shield size={20} />
                  <span className="font-medium">Security & Password</span>
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'orders'
                      ? 'bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border border-rose-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Package size={20} />
                  <span className="font-medium">My Orders</span>
                  <span className="ml-auto px-2 py-1 bg-rose-100 text-rose-700 text-xs rounded-full">
                    {orders.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('wishlist')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'wishlist'
                      ? 'bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border border-rose-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Heart size={20} />
                  <span className="font-medium">Wishlist</span>
                  <span className="ml-auto px-2 py-1 bg-rose-100 text-rose-700 text-xs rounded-full">
                    {wishlist.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'notifications'
                      ? 'bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border border-rose-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Bell size={20} />
                  <span className="font-medium">Notifications</span>
                </button>
              </nav>

              {/* Logout Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                >
                  <LogOut size={20} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Information Tab */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-sm border p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                  <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">
                    Personal Details
                  </span>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <User size={16} />
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleProfileChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all ${
                          errors.displayName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your full name"
                      />
                      {errors.displayName && (
                        <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Mail size={16} />
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleProfileChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="your@email.com"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Phone size={16} />
                        Phone Number (Pakistan)
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleProfileChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all ${
                          errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="+92 3XX XXXXXXX"
                      />
                      {errors.phoneNumber && (
                        <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Format: +92 followed by 10 digits</p>
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Calendar size={16} />
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleProfileChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all ${
                          errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.dateOfBirth && (
                        <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
                      )}
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <User size={16} />
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all bg-white"
                      >
                        <option value="prefer-not-to-say">Prefer not to say</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin size={20} />
                      Shipping Address (Pakistan)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Street Address
                        </label>
                        <input
                          type="text"
                          name="address.street"
                          value={formData.address.street}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                          placeholder="House #123, Street #456, Area Name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <select
                          name="address.city"
                          value={formData.address.city}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all bg-white"
                        >
                          <option value="">Select a city</option>
                          {PAKISTANI_CITIES.map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Province
                        </label>
                        <select
                          name="address.province"
                          value={formData.address.province}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all bg-white"
                        >
                          <option value="">Select a province</option>
                          {PAKISTANI_PROVINCES.map(province => (
                            <option key={province} value={province}>{province}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          name="address.postalCode"
                          value={formData.address.postalCode}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                          placeholder="54000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <div className="px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-700">
                          Pakistan
                        </div>
                        <input type="hidden" name="address.country" value="Pakistan" />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Last updated: {profile ? formatDate(profile.createdAt) : ''}
                      </span>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl hover:from-rose-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Security & Password Tab */}
            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-sm border p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Security & Password</h2>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    Account Security
                  </span>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  {/* Current Password */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Lock size={16} />
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.current ? "text" : "password"}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all pr-12 ${
                          errors.currentPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword.current ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Lock size={16} />
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.new ? "text" : "password"}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all pr-12 ${
                          errors.newPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter new password (min. 6 characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword.new ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Lock size={16} />
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.confirm ? "text" : "password"}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all pr-12 ${
                          errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Password Requirements */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Password Requirements</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${passwordData.newPassword.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        At least 6 characters long
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(passwordData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        Contains uppercase letter (A-Z)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${/[a-z]/.test(passwordData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        Contains lowercase letter (a-z)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${/\d/.test(passwordData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        Contains number (0-9)
                      </li>
                    </ul>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Last password change:</p>
                        <p className="text-sm font-medium text-gray-900">
                          {profile ? formatDate(profile.createdAt) : 'Never changed'}
                        </p>
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
                      >
                        {loading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-sm border p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">My Orders</h2>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {orders.length} Orders
                  </span>
                </div>

                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="p-6 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-bold text-gray-900 text-lg">Order #{order.id.substring(0, 8).toUpperCase()}</h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                order.paymentStatus === 'paid' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {order.paymentStatus === 'paid' ? 'Paid' : 'Pending Payment'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Placed on {formatDate(order.createdAt)} • {order.items.length} items
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              {formatPKR(order.totalAmount)}
                            </p>
                            <p className="text-sm text-gray-600">
                              via {order.paymentMethod === 'easypaisa' ? 'Easypaisa' : 'Credit Card'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Order Items Preview */}
                        <div className="mb-4">
                          <div className="flex items-center gap-3 overflow-x-auto pb-2">
                            {order.items.slice(0, 5).map((item, index) => (
                              <div key={index} className="flex-shrink-0">
                                <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden relative">
                                  <img 
                                    src={item.image} 
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                  {index === 4 && order.items.length > 5 && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                      <span className="text-white text-sm font-medium">
                                        +{order.items.length - 5}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Shipping Address</p>
                            <p className="text-sm font-medium text-gray-900">
                              {order.shippingAddress?.street}, {order.shippingAddress?.city}
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Delivery Status</p>
                            <div className="flex items-center gap-2">
                              {order.status === 'delivered' ? (
                                <CheckCircle size={16} className="text-green-500" />
                              ) : order.status === 'shipped' ? (
                                <Truck size={16} className="text-blue-500" />
                              ) : (
                                <Clock size={16} className="text-yellow-500" />
                              )}
                              <p className="text-sm font-medium text-gray-900 capitalize">
                                {order.status}
                              </p>
                            </div>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Contact</p>
                            <p className="text-sm font-medium text-gray-900">
                              {order.shippingAddress?.phone || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                          <button
                            onClick={() => router.push(`/orders/${order.id}`)}
                            className="text-rose-600 hover:text-rose-700 font-medium text-sm flex items-center gap-2"
                          >
                            <ShoppingBag size={16} />
                            View Order Details
                          </button>
                          {order.status === 'delivered' && (
                            <button className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium">
                              Rate & Review
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Package size={40} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
                    <button
                      onClick={() => router.push('/products')}
                      className="px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
                    >
                      Start Shopping
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-sm border p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">My Wishlist</h2>
                  <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
                    {wishlist.length} Items
                  </span>
                </div>

                {isLoadingWishlist ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading your wishlist...</p>
                  </div>
                ) : wishlist.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative">
                          <div className="aspect-square overflow-hidden bg-gray-100">
                            <img
                              src={item.product.images[0] || '/placeholder.jpg'}
                              alt={item.product.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          {item.product.isNewArrival && (
                            <span className="absolute top-2 left-2 px-2 py-1 bg-rose-600 text-white text-xs rounded-full">
                              New
                            </span>
                          )}
                          <button
                            onClick={() => removeFromWishlist(item.id)}
                            className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                            title="Remove from wishlist"
                          >
                            <Heart size={16} className="text-rose-600 fill-rose-600" />
                          </button>
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-gray-900 truncate">{item.product.name}</h3>
                            <span className="text-rose-600 font-bold">{formatPKR(item.product.price)}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            Added on {formatDate(item.addedAt)}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => moveToCart(item.product.id)}
                              className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                            >
                              <ShoppingBag size={16} />
                              Add to Cart
                            </button>
                            <button
                              onClick={() => router.push(`/products/${item.product.id}`)}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-4 bg-pink-100 rounded-full flex items-center justify-center">
                      <Heart size={40} className="text-pink-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Your wishlist is empty</h3>
                    <p className="text-gray-600 mb-6">Save your favorite items to purchase later</p>
                    <button
                      onClick={() => router.push('/products')}
                      className="px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl hover:from-pink-700 hover:to-rose-700 transition-all font-medium shadow-lg"
                    >
                      Browse Products
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-sm border p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    Stay Updated
                  </span>
                </div>

                <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                          <Mail className="text-rose-600" size={20} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Email Newsletter</h4>
                          <p className="text-sm text-gray-600">Get updates about new products and offers</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="newsletter"
                          checked={preferences.newsletter}
                          onChange={handlePreferencesChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Bell className="text-blue-600" size={20} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Email Notifications</h4>
                          <p className="text-sm text-gray-600">Order updates and account activity</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="emailNotifications"
                          checked={preferences.emailNotifications}
                          onChange={handlePreferencesChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Phone className="text-green-600" size={20} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">SMS Notifications (Pakistan)</h4>
                          <p className="text-sm text-gray-600">Order updates and delivery alerts via SMS</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="smsNotifications"
                          checked={preferences.smsNotifications}
                          onChange={handlePreferencesChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-6 border-t border-gray-200">
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
                      >
                        {loading ? 'Saving...' : 'Save Preferences'}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}