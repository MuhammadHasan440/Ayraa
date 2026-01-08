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
  ShoppingBag,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Settings,
  Key,
  Sparkles,
  AlertCircle,
  Star,
  History
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, signOut } from 'firebase/auth';
import { doc, updateDoc, getDoc, collection, query, where, orderBy, getDocs, DocumentData } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import toast from 'react-hot-toast';

// Simple date formatter
const formatDate = (date: any): string => {
  if (!date) return 'N/A';
  
  try {
    let dateObj: Date;
    
    if (date.toDate && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date.seconds) {
      dateObj = new Date(date.seconds * 1000);
    } else {
      dateObj = new Date();
    }
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
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

  // Fetch orders
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

  // Fetch wishlist
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

  const moveToCart = async (productId: string) => {
    toast.success('Product added to cart');
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
      
      await updateProfile(user, {
        displayName: formData.displayName,
      });
      
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
      
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );
      
      await reauthenticateWithCredential(user, credential);
      
      await updatePassword(user, passwordData.newPassword);
      
      setSuccessMessage('Password updated successfully!');
      toast.success('Password updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      
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
      case 'delivered': return 'bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 text-emerald-300 border border-emerald-700/50';
      case 'shipped': return 'bg-gradient-to-r from-blue-900/20 to-blue-800/20 text-blue-300 border border-blue-700/50';
      case 'processing': return 'bg-gradient-to-r from-amber-900/20 to-amber-800/20 text-amber-300 border border-amber-700/50';
      case 'pending': return 'bg-gradient-to-r from-orange-900/20 to-orange-800/20 text-orange-300 border border-orange-700/50';
      case 'cancelled': return 'bg-gradient-to-r from-red-900/20 to-red-800/20 text-red-300 border border-red-700/50';
      default: return 'bg-gradient-to-r from-slate-800/20 to-slate-700/20 text-slate-300 border border-slate-700/50';
    }
  };

  const securityFeatures = [
    { text: "SSL Encrypted", icon: <Shield size={14} className="text-emerald-400" /> },
    { text: "2FA Ready", icon: <Key size={14} className="text-amber-400" /> },
    { text: "Secure Login", icon: <Lock size={14} className="text-blue-400" /> },
  ];

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 py-12 px-4 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-800 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 h-64 bg-slate-800 rounded-xl"></div>
            <div className="lg:col-span-3 h-96 bg-slate-800 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 py-12 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-3 rounded-xl">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 bg-clip-text text-transparent">
              My Account
            </h1>
          </div>
          <p className="text-slate-400">Manage your profile, orders, and preferences</p>
        </motion.div>

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 rounded-xl border border-emerald-700/50 flex items-center gap-3"
          >
            <CheckCircle className="text-emerald-400 flex-shrink-0" />
            <p className="text-emerald-300 text-sm">{successMessage}</p>
          </motion.div>
        )}

        {/* Error Message */}
        {errors.submit && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-gradient-to-r from-red-900/20 to-red-800/20 rounded-xl border border-red-800/30 flex items-center gap-3"
          >
            <AlertCircle className="text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{errors.submit}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm sticky top-6">
              {/* User Info */}
              <div className="flex items-center gap-4 mb-8">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-600/20 to-amber-500/20 flex items-center justify-center border border-amber-500/30">
                    {profile?.photoURL ? (
                      <img
                        src={profile.photoURL}
                        alt={profile.displayName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="text-amber-400" size={32} />
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-800"></div>
                </div>
                <div>
                  <h3 className="font-bold text-white">{profile?.displayName}</h3>
                  <p className="text-sm text-slate-400">{profile?.email}</p>
                  <p className="text-xs text-slate-500 mt-1">
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
                      ? 'bg-gradient-to-r from-amber-600/20 to-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <User size={20} />
                  <span className="font-medium">Profile Information</span>
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'security'
                      ? 'bg-gradient-to-r from-amber-600/20 to-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <Shield size={20} />
                  <span className="font-medium">Security & Password</span>
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'orders'
                      ? 'bg-gradient-to-r from-amber-600/20 to-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <Package size={20} />
                  <span className="font-medium">My Orders</span>
                  <span className="ml-auto px-2 py-1 bg-amber-600/20 text-amber-300 text-xs rounded-full border border-amber-500/30">
                    {orders.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('wishlist')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'wishlist'
                      ? 'bg-gradient-to-r from-amber-600/20 to-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <Heart size={20} />
                  <span className="font-medium">Wishlist</span>
                  <span className="ml-auto px-2 py-1 bg-amber-600/20 text-amber-300 text-xs rounded-full border border-amber-500/30">
                    {wishlist.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'notifications'
                      ? 'bg-gradient-to-r from-amber-600/20 to-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  <Bell size={20} />
                  <span className="font-medium">Notifications</span>
                </button>
              </nav>

              {/* Security Features */}
              <div className="mt-8 pt-6 border-t border-slate-700">
                <div className="flex items-center justify-center gap-4 mb-4">
                  {securityFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-1 text-xs text-slate-400">
                      {feature.icon}
                      <span>{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logout Button */}
              <div className="mt-6 pt-6 border-t border-slate-700">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600/20 to-red-500/20 text-red-300 rounded-xl hover:from-red-700/20 hover:to-red-600/20 transition-all border border-red-500/30 font-medium"
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
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Profile Information</h2>
                  <span className="px-3 py-1 bg-gradient-to-r from-amber-600/20 to-amber-500/20 text-amber-300 rounded-full text-sm font-medium border border-amber-500/30">
                    Personal Details
                  </span>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                        <User size={16} />
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleProfileChange}
                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500 ${
                          errors.displayName ? 'border-red-500/50' : 'border-slate-700'
                        }`}
                        placeholder="Enter your full name"
                      />
                      {errors.displayName && (
                        <p className="mt-1 text-sm text-red-400">{errors.displayName}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                        <Mail size={16} />
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleProfileChange}
                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500 ${
                          errors.email ? 'border-red-500/50' : 'border-slate-700'
                        }`}
                        placeholder="your@email.com"
                        disabled
                      />
                      <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                        <Phone size={16} />
                        Phone Number (Pakistan)
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleProfileChange}
                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500 ${
                          errors.phoneNumber ? 'border-red-500/50' : 'border-slate-700'
                        }`}
                        placeholder="+92 3XX XXXXXXX"
                      />
                      {errors.phoneNumber && (
                        <p className="mt-1 text-sm text-red-400">{errors.phoneNumber}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">Format: +92 followed by 10 digits</p>
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                        <Calendar size={16} />
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleProfileChange}
                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500 ${
                          errors.dateOfBirth ? 'border-red-500/50' : 'border-slate-700'
                        }`}
                      />
                      {errors.dateOfBirth && (
                        <p className="mt-1 text-sm text-red-400">{errors.dateOfBirth}</p>
                      )}
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                        <User size={16} />
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white"
                      >
                        <option value="prefer-not-to-say" className="bg-slate-800">Prefer not to say</option>
                        <option value="male" className="bg-slate-800">Male</option>
                        <option value="female" className="bg-slate-800">Female</option>
                        <option value="other" className="bg-slate-800">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="pt-6 border-t border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <MapPin size={20} />
                      Shipping Address (Pakistan)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Street Address
                        </label>
                        <input
                          type="text"
                          name="address.street"
                          value={formData.address.street}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500"
                          placeholder="House #123, Street #456, Area Name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          City
                        </label>
                        <select
                          name="address.city"
                          value={formData.address.city}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white"
                        >
                          <option value="" className="bg-slate-800">Select a city</option>
                          {PAKISTANI_CITIES.map(city => (
                            <option key={city} value={city} className="bg-slate-800">{city}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Province
                        </label>
                        <select
                          name="address.province"
                          value={formData.address.province}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white"
                        >
                          <option value="" className="bg-slate-800">Select a province</option>
                          {PAKISTANI_PROVINCES.map(province => (
                            <option key={province} value={province} className="bg-slate-800">{province}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          name="address.postalCode"
                          value={formData.address.postalCode}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500"
                          placeholder="54000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Country
                        </label>
                        <div className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-300">
                          Pakistan
                        </div>
                        <input type="hidden" name="address.country" value="Pakistan" />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-6 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        Last updated: {profile ? formatDate(profile.createdAt) : ''}
                      </span>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl hover:from-amber-700 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check size={18} />
                            Save Changes
                          </>
                        )}
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
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Security & Password</h2>
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-600/20 to-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30">
                    Account Security
                  </span>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  {/* Current Password */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                      <Lock size={16} />
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.current ? "text" : "password"}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500 pr-12 ${
                          errors.currentPassword ? 'border-red-500/50' : 'border-slate-700'
                        }`}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword.current ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.currentPassword && (
                      <p className="mt-1 text-sm text-red-400">{errors.currentPassword}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                      <Key size={16} />
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.new ? "text" : "password"}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500 pr-12 ${
                          errors.newPassword ? 'border-red-500/50' : 'border-slate-700'
                        }`}
                        placeholder="Enter new password (min. 6 characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword.new ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <p className="mt-1 text-sm text-red-400">{errors.newPassword}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                      <Lock size={16} />
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.confirm ? "text" : "password"}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500 pr-12 ${
                          errors.confirmPassword ? 'border-red-500/50' : 'border-slate-700'
                        }`}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Password Requirements */}
                  <div className="p-4 bg-gradient-to-r from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-700">
                    <h4 className="font-medium text-white mb-2">Password Requirements</h4>
                    <ul className="space-y-1 text-sm text-slate-400">
                      <li className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${passwordData.newPassword.length >= 6 ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                        At least 6 characters long
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(passwordData.newPassword) ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                        Contains uppercase letter (A-Z)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${/[a-z]/.test(passwordData.newPassword) ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                        Contains lowercase letter (a-z)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${/\d/.test(passwordData.newPassword) ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                        Contains number (0-9)
                      </li>
                    </ul>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-6 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Last password change:</p>
                        <p className="text-sm font-medium text-white">
                          {profile ? formatDate(profile.createdAt) : 'Never changed'}
                        </p>
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl hover:from-amber-700 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <Shield size={18} />
                            Update Password
                          </>
                        )}
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
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">My Orders</h2>
                  <span className="px-3 py-1 bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium border border-emerald-500/30">
                    {orders.length} Orders
                  </span>
                </div>

                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="p-6 bg-gradient-to-r from-slate-800/30 to-slate-900/30 border border-slate-700 rounded-xl hover:bg-slate-800/50 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <h4 className="font-bold text-white text-lg">Order #{order.id.substring(0, 8).toUpperCase()}</h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                order.paymentStatus === 'paid' 
                                  ? 'bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 text-emerald-300 border border-emerald-700/50' 
                                  : 'bg-gradient-to-r from-amber-900/20 to-amber-800/20 text-amber-300 border border-amber-700/50'
                              }`}>
                                {order.paymentStatus === 'paid' ? 'Paid' : 'Pending Payment'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-400">
                              Placed on {formatDate(order.createdAt)} • {order.items.length} items
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-white">
                              {formatPKR(order.totalAmount)}
                            </p>
                            <p className="text-sm text-slate-400">
                              via {order.paymentMethod === 'easypaisa' ? 'Easypaisa' : 'Credit Card'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Order Items Preview */}
                        <div className="mb-4">
                          <div className="flex items-center gap-3 overflow-x-auto pb-2">
                            {order.items.slice(0, 5).map((item, index) => (
                              <div key={index} className="flex-shrink-0">
                                <div className="w-20 h-20 rounded-lg bg-slate-800/50 overflow-hidden relative border border-slate-700">
                                  <img 
                                    src={item.image} 
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                  {index === 4 && order.items.length > 5 && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
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
                          <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                            <p className="text-sm text-slate-400 mb-1">Shipping Address</p>
                            <p className="text-sm font-medium text-white">
                              {order.shippingAddress?.street}, {order.shippingAddress?.city}
                            </p>
                          </div>
                          <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                            <p className="text-sm text-slate-400 mb-1">Delivery Status</p>
                            <div className="flex items-center gap-2">
                              {order.status === 'delivered' ? (
                                <CheckCircle size={16} className="text-emerald-400" />
                              ) : order.status === 'shipped' ? (
                                <Truck size={16} className="text-blue-400" />
                              ) : (
                                <Clock size={16} className="text-amber-400" />
                              )}
                              <p className="text-sm font-medium text-white capitalize">
                                {order.status}
                              </p>
                            </div>
                          </div>
                          <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                            <p className="text-sm text-slate-400 mb-1">Contact</p>
                            <p className="text-sm font-medium text-white">
                              {order.shippingAddress?.phone || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                          <button
                            onClick={() => router.push(`/orders/${order.id}`)}
                            className="text-amber-400 hover:text-amber-300 font-medium text-sm flex items-center gap-2"
                          >
                            <ShoppingBag size={16} />
                            View Order Details
                          </button>
                          {order.status === 'delivered' && (
                            <button className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-lg hover:from-amber-700 hover:to-amber-600 transition-colors text-sm font-medium">
                              Rate & Review
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-full flex items-center justify-center border border-slate-700">
                      <Package size={40} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">No orders yet</h3>
                    <p className="text-slate-400 mb-6">Start shopping to see your orders here</p>
                    <button
                      onClick={() => router.push('/products')}
                      className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl hover:from-amber-700 hover:to-amber-600 transition-all font-medium shadow-lg"
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
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">My Wishlist</h2>
                  <span className="px-3 py-1 bg-gradient-to-r from-pink-600/20 to-rose-600/20 text-pink-300 rounded-full text-sm font-medium border border-pink-500/30">
                    {wishlist.length} Items
                  </span>
                </div>

                {isLoadingWishlist ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400">Loading your wishlist...</p>
                  </div>
                ) : wishlist.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((item) => (
                      <div key={item.id} className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow hover:border-amber-500/30">
                        <div className="relative">
                          <div className="aspect-square overflow-hidden bg-slate-800">
                            <img
                              src={item.product.images[0] || '/placeholder.jpg'}
                              alt={item.product.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          {item.product.isNewArrival && (
                            <span className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-amber-600 to-amber-500 text-white text-xs rounded-full">
                              New
                            </span>
                          )}
                          <button
                            onClick={() => removeFromWishlist(item.id)}
                            className="absolute top-2 right-2 p-2 bg-slate-900/90 backdrop-blur-sm rounded-full hover:bg-slate-800 transition-colors border border-slate-700"
                            title="Remove from wishlist"
                          >
                            <Heart size={16} className="text-pink-400 fill-pink-400" />
                          </button>
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-white truncate">{item.product.name}</h3>
                            <span className="text-amber-400 font-bold">{formatPKR(item.product.price)}</span>
                          </div>
                          <p className="text-sm text-slate-400 mb-3">
                            Added on {formatDate(item.addedAt)}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => moveToCart(item.product.id)}
                              className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-lg hover:from-amber-700 hover:to-amber-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                            >
                              <ShoppingBag size={16} />
                              Add to Cart
                            </button>
                            <button
                              onClick={() => router.push(`/products/${item.product.id}`)}
                              className="px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800/50 transition-colors text-sm font-medium"
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
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-full flex items-center justify-center border border-slate-700">
                      <Heart size={40} className="text-pink-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Your wishlist is empty</h3>
                    <p className="text-slate-400 mb-6">Save your favorite items to purchase later</p>
                    <button
                      onClick={() => router.push('/products')}
                      className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl hover:from-amber-700 hover:to-amber-600 transition-all font-medium shadow-lg"
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
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Notification Preferences</h2>
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-300 rounded-full text-sm font-medium border border-purple-500/30">
                    Stay Updated
                  </span>
                </div>

                <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800/30 to-slate-900/30 border border-slate-700 rounded-xl hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-amber-600/20 to-amber-500/20 rounded-lg flex items-center justify-center border border-amber-500/30">
                          <Mail className="text-amber-400" size={20} />
                        </div>
                        <div>
                          <h4 className="font-medium text-white">Email Newsletter</h4>
                          <p className="text-sm text-slate-400">Get updates about new products and offers</p>
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
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-slate-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800/30 to-slate-900/30 border border-slate-700 rounded-xl hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                          <Bell className="text-blue-400" size={20} />
                        </div>
                        <div>
                          <h4 className="font-medium text-white">Email Notifications</h4>
                          <p className="text-sm text-slate-400">Order updates and account activity</p>
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
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-slate-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800/30 to-slate-900/30 border border-slate-700 rounded-xl hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30">
                          <Phone className="text-emerald-400" size={20} />
                        </div>
                        <div>
                          <h4 className="font-medium text-white">SMS Notifications (Pakistan)</h4>
                          <p className="text-sm text-slate-400">Order updates and delivery alerts via SMS</p>
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
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-slate-900 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-6 border-t border-slate-700">
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl hover:from-amber-700 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check size={18} />
                            Save Preferences
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </div>
        </div>

        {/* Background Decoration */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-800/20 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}