'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Users, 
  User, 
  Mail, 
  Phone,
  TrendingUp,
  ShoppingBag, 
  Package,
  Calendar,
  Shield,
  Search,
  Filter,
  Eye,
  Trash2,
  UserX,
  UserCheck,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Lock,
  Globe,
  Check,
  BarChart3,
  X,
  Loader2,
  Key,
  Sparkles,
  Home,
  LogOut,
  Settings
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  limit,
  where,
  updateDoc
} from 'firebase/firestore';
import { 
  deleteUser,
  getAuth
} from 'firebase/auth';
import { db } from '@/lib/firebase/config';
import { formatPKR } from '@/lib/utils/currency';

interface UserData {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  emailVerified: boolean;
  isAdmin?: boolean;
  isBanned?: boolean;
  createdAt: string;
  lastSignInTime?: string;
  providerId: string;
  ordersCount?: number;
  totalSpent?: number;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: currentUser, isAdmin, loading: authLoading, signOutUser} = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [userToBan, setUserToBan] = useState<UserData | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check authentication
  useEffect(() => {
    if (authLoading) return;
    
    if (!currentUser || !isAdmin) {
      router.push('/admin-login');
    }
  }, [currentUser, isAdmin, authLoading, router]);

  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser || !isAdmin || authLoading) return;

      try {
        setLoading(true);
        
        const usersCollection = collection(db, 'users');
        const usersQuery = query(usersCollection, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(usersQuery);
        
        const usersData: UserData[] = await Promise.all(
          snapshot.docs.map(async (userDoc) => {
            const userData = userDoc.data();
            
            const ordersQuery = query(
              collection(db, 'orders'),
              where('userId', '==', userDoc.id)
            );
            const ordersSnapshot = await getDocs(ordersQuery);
            const totalSpent = ordersSnapshot.docs.reduce(
              (sum, orderDoc) => sum + (orderDoc.data().totalAmount || 0), 0
            );
            
            return {
              uid: userDoc.id,
              displayName: userData.displayName || userData.email?.split('@')[0] || 'User',
              email: userData.email || '',
              phoneNumber: userData.phoneNumber || '',
              photoURL: userData.photoURL || '',
              emailVerified: userData.emailVerified || false,
              isAdmin: userData.isAdmin || false,
              isBanned: userData.isBanned || false,
              createdAt: userData.createdAt || new Date().toISOString(),
              lastSignInTime: userData.lastSignInTime || '',
              providerId: userData.providerId || 'email',
              ordersCount: ordersSnapshot.size,
              totalSpent,
              address: userData.address || undefined,
            };
          })
        );
        
        setUsers(usersData);
        setFilteredUsers(usersData);
        
      } catch (error) {
        console.error('Error fetching users:', error);
        setErrorMessage('Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser, isAdmin, authLoading]);

  // Filter users
  useEffect(() => {
    let result = [...users];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user =>
        user.displayName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phoneNumber?.toLowerCase().includes(query) ||
        user.uid.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'admin') {
        result = result.filter(user => user.isAdmin);
      } else if (statusFilter === 'banned') {
        result = result.filter(user => user.isBanned);
      } else if (statusFilter === 'verified') {
        result = result.filter(user => user.emailVerified);
      } else if (statusFilter === 'active') {
        result = result.filter(user => !user.isBanned);
      }
    }

    setFilteredUsers(result);
    setCurrentPage(1);
  }, [searchQuery, statusFilter, users]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 ml-64 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-slate-800 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const handleDeleteUser = async (userData: UserData) => {
    try {
      await deleteDoc(doc(db, 'users', userData.uid));
      
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', userData.uid)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const deleteOrderPromises = ordersSnapshot.docs.map(orderDoc =>
        deleteDoc(doc(db, 'orders', orderDoc.id))
      );
      await Promise.all(deleteOrderPromises);
      
      try {
        const wishlistCollection = collection(db, 'users', userData.uid, 'wishlist');
        const wishlistSnapshot = await getDocs(wishlistCollection);
        const deleteWishlistPromises = wishlistSnapshot.docs.map(wishlistDoc =>
          deleteDoc(doc(db, 'users', userData.uid, 'wishlist', wishlistDoc.id))
        );
        await Promise.all(deleteWishlistPromises);
      } catch (wishlistError) {
        console.log('No wishlist found for user:', wishlistError);
      }
      
      setUsers(prev => prev.filter(u => u.uid !== userData.uid));
      setSelectedUsers(prev => prev.filter(id => id !== userData.uid));
      
      setSuccessMessage(`User ${userData.email} deleted successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error deleting user:', error);
      setErrorMessage('Failed to delete user. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleBanUser = async (userData: UserData) => {
    try {
      await updateDoc(doc(db, 'users', userData.uid), {
        isBanned: !userData.isBanned,
        updatedAt: new Date().toISOString(),
      });
      
      setUsers(prev => prev.map(u => 
        u.uid === userData.uid 
          ? { ...u, isBanned: !userData.isBanned }
          : u
      ));
      
      setSuccessMessage(
        `User ${userData.email} ${!userData.isBanned ? 'banned' : 'unbanned'} successfully!`
      );
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error updating user status:', error);
      setErrorMessage('Failed to update user status. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setShowBanModal(false);
      setUserToBan(null);
    }
  };

  const handleToggleAdmin = async (userData: UserData) => {
    if (userData.uid === currentUser?.uid) {
      setErrorMessage('You cannot change your own admin status');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    try {
      await updateDoc(doc(db, 'users', userData.uid), {
        isAdmin: !userData.isAdmin,
        updatedAt: new Date().toISOString(),
      });
      
      setUsers(prev => prev.map(u => 
        u.uid === userData.uid 
          ? { ...u, isAdmin: !userData.isAdmin }
          : u
      ));
      
      setSuccessMessage(
        `User ${userData.email} ${!userData.isAdmin ? 'promoted to admin' : 'demoted from admin'}`
      );
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error updating admin status:', error);
      setErrorMessage('Failed to update admin status. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedUsers.length) {
      setErrorMessage('Please select users to delete');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`)) return;

    try {
      const deletePromises = selectedUsers.map(uid =>
        deleteDoc(doc(db, 'users', uid))
      );
      
      await Promise.all(deletePromises);
      
      setUsers(prev => prev.filter(u => !selectedUsers.includes(u.uid)));
      setSelectedUsers([]);
      
      setSuccessMessage(`${selectedUsers.length} users deleted successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error deleting users:', error);
      setErrorMessage('Failed to delete users. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUsers(currentPageUsers.map(u => u.uid));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPageUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalUsers = users.length;
  const adminUsers = users.filter(u => u.isAdmin).length;
  const bannedUsers = users.filter(u => u.isBanned).length;
  const verifiedUsers = users.filter(u => u.emailVerified).length;
  const activeUsers = users.filter(u => !u.isBanned).length;

  const handleLogout = async () => {
    try {
      await signOutUser();
      router.push('/admin-login');
    } catch (error) {
      console.error('Error signing out:', error);
      setErrorMessage('Failed to sign out. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
      {/* Background Decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-800/20 rounded-full blur-3xl"></div>
      </div>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-20 pt-20 bottom-0 w-64 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 shadow-xl z-40 transition-transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        

        {/* Navigation */}
        <nav className="p-4 space-y-1 mt-3">
          {[
            { name: 'Dashboard', href: '/admin/dashboard', icon: <TrendingUp size={20} />, active: false },
            { name: 'Products', href: '/admin/products', icon: <Package size={20} />, active: false },
            { name: 'Orders', href: '/admin/orders', icon: <ShoppingBag size={20} />, active: false },
            { name: 'Users', href: '/admin/users', icon: <Users size={20} />, active: true },
            { name: 'Analytics', href: '/admin/analytics', icon: <BarChart3 size={20} />, active: false },
           
          ].map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                item.active
                  ? 'bg-gradient-to-r from-amber-600/20 to-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'hover:bg-slate-800/50 text-slate-300 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </a>
          ))}
        </nav>
         {/* Admin Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-gradient-to-t from-slate-900 to-slate-950">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-amber-600/20 to-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
                      <span className="font-bold text-amber-400">
                        {currentUser?.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-white truncate">{currentUser?.email}</p>
                      <p className="text-xs text-slate-500">Administrator</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-400 hover:text-red-400"
                      title="Sign Out"
                    >
                      <LogOut size={18} />
                    </button>
                  </div>
                </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[1920px] mx-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-amber-500/20 to-amber-600/10 rounded-lg border border-amber-500/30">
                  <Users className="w-6 h-6 text-amber-400" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 bg-clip-text text-transparent">
                  User Management
                </h1>
              </div>
              <p className="text-slate-400">Manage all registered users in your system</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-slate-700 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Messages */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 rounded-xl border border-emerald-700/50 flex items-center gap-3"
            >
              <Check className="text-emerald-400" size={20} />
              <span className="text-emerald-300 font-medium">{successMessage}</span>
            </motion.div>
          )}

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-gradient-to-r from-red-900/20 to-red-800/20 rounded-xl border border-red-800/30 flex items-center gap-3"
            >
              <AlertCircle className="text-red-400" size={20} />
              <span className="text-red-300 font-medium">{errorMessage}</span>
            </motion.div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 shadow-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Users</p>
                  <p className="text-2xl font-bold text-white mt-2">{totalUsers}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500/20 to-blue-600/10 rounded-full border border-blue-500/30">
                  <Users className="text-blue-400" size={24} />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 shadow-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Admin Users</p>
                  <p className="text-2xl font-bold text-white mt-2">{adminUsers}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-500/20 to-purple-600/10 rounded-full border border-purple-500/30">
                  <Shield className="text-purple-400" size={24} />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 shadow-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Active Users</p>
                  <p className="text-2xl font-bold text-white mt-2">{activeUsers}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 rounded-full border border-emerald-500/30">
                  <UserCheck className="text-emerald-400" size={24} />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 shadow-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Banned Users</p>
                  <p className="text-2xl font-bold text-white mt-2">{bannedUsers}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-rose-500/20 to-rose-600/10 rounded-full border border-rose-500/30">
                  <UserX className="text-rose-400" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 shadow-xl p-6 mb-8 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
                  <input
                    type="text"
                    placeholder="Search users by name, email, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="w-full md:w-64">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white appearance-none"
                  >
                    <option value="all" className="bg-slate-800">All Users</option>
                    <option value="admin" className="bg-slate-800">Admins Only</option>
                    <option value="banned" className="bg-slate-800">Banned Users</option>
                    <option value="verified" className="bg-slate-800">Verified Email</option>
                    <option value="active" className="bg-slate-800">Active Users</option>
                  </select>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedUsers.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">
                    {selectedUsers.length} selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-xl hover:from-rose-700 hover:to-rose-600 transition-all"
                  >
                    <Trash2 size={18} />
                    Delete Selected
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 shadow-xl overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-800/80 to-slate-900/80">
                  <tr>
                    <th className="py-4 px-6">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === currentPageUsers.length && currentPageUsers.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-700 bg-slate-800/50 text-amber-500 focus:ring-amber-500"
                      />
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {currentPageUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-slate-800/30">
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.uid)}
                          onChange={() => handleSelectUser(user.uid)}
                          className="rounded border-slate-700 bg-slate-800/50 text-amber-500 focus:ring-amber-500"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center">
                            {user.photoURL ? (
                              <img
                                src={user.photoURL}
                                alt={user.displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="text-amber-400" size={20} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white flex items-center gap-2">
                              {user.displayName}
                              {user.uid === currentUser?.uid && (
                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              ID: {user.uid.substring(0, 8)}...
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              Joined: {formatDate(user.createdAt)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-slate-500" />
                            <span className="text-sm text-white">{user.email}</span>
                            {user.emailVerified && (
                              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs rounded-full border border-emerald-500/30">
                                Verified
                              </span>
                            )}
                          </div>
                          {user.phoneNumber && (
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="text-slate-500" />
                              <span className="text-sm text-white">{user.phoneNumber}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Globe size={14} className="text-slate-500" />
                            <span className="text-sm text-slate-400">{user.providerId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-2">
                          {user.isAdmin ? (
                            <span className="px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-purple-600/10 text-purple-300 rounded-full text-xs font-medium flex items-center gap-1 w-fit border border-purple-500/30">
                              <Shield size={12} />
                              Admin
                            </span>
                          ) : (
                            <span className="px-3 py-1.5 bg-slate-800/50 text-slate-300 rounded-full text-xs font-medium w-fit border border-slate-700">
                              User
                            </span>
                          )}
                          
                          {user.isBanned ? (
                            <span className="px-3 py-1.5 bg-gradient-to-r from-rose-500/20 to-rose-600/10 text-rose-300 rounded-full text-xs font-medium flex items-center gap-1 w-fit border border-rose-500/30">
                              <UserX size={12} />
                              Banned
                            </span>
                          ) : (
                            <span className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-300 rounded-full text-xs font-medium flex items-center gap-1 w-fit border border-emerald-500/30">
                              <UserCheck size={12} />
                              Active
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-400">Orders:</span>
                            <span className="font-medium text-white">{user.ordersCount || 0}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-400">Spent:</span>
                            <span className="font-medium text-amber-400">{formatPKR(user.totalSpent || 0)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {/* View Orders */}
                          {user.ordersCount! > 0 && (
                            <button
                              onClick={() => router.push(`/admin/orders?user=${user.uid}`)}
                              className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors border border-blue-500/20 hover:border-blue-500/40"
                              title="View Orders"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          
                          {/* Toggle Admin */}
                          <button
                            onClick={() => handleToggleAdmin(user)}
                            className={`p-2 rounded-lg transition-colors border ${
                              user.isAdmin
                                ? 'text-purple-400 hover:bg-purple-500/10 border-purple-500/30 hover:border-purple-500/50'
                                : 'text-slate-400 hover:bg-slate-700/50 border-slate-700 hover:border-slate-600'
                            }`}
                            title={user.isAdmin ? "Remove Admin" : "Make Admin"}
                            disabled={user.uid === currentUser?.uid}
                          >
                            <Shield size={16} fill={user.isAdmin ? 'currentColor' : 'none'} />
                          </button>
                          
                          {/* Ban/Unban */}
                          <button
                            onClick={() => {
                              setUserToBan(user);
                              setShowBanModal(true);
                            }}
                            className={`p-2 rounded-lg transition-colors border ${
                              user.isBanned
                                ? 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50'
                                : 'text-amber-400 hover:bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50'
                            }`}
                            title={user.isBanned ? "Unban User" : "Ban User"}
                          >
                            {user.isBanned ? <UserCheck size={16} /> : <UserX size={16} />}
                          </button>
                          
                          {/* Delete */}
                          <button
                            onClick={() => {
                              setUserToDelete(user);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-rose-500/20 hover:border-rose-500/40"
                            title="Delete User"
                            disabled={user.uid === currentUser?.uid}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-full flex items-center justify-center border border-slate-700">
                  <Users size={48} className="text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No users found</h3>
                <p className="text-slate-400 mb-6">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'No users registered yet'}
                </p>
              </div>
            )}

            {/* Pagination */}
            {filteredUsers.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-400">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} users
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                      <button
                        key={number}
                        onClick={() => paginate(number)}
                        className={`w-10 h-10 rounded-lg border ${
                          currentPage === number
                            ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white border-amber-500'
                            : 'hover:bg-slate-700/50 border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white'
                        }`}
                      >
                        {number}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-rose-500/20 to-rose-600/10 border border-rose-500/30 flex items-center justify-center">
                <Trash2 className="text-rose-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete User</h3>
                <p className="text-sm text-slate-400">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-rose-900/20 to-rose-800/20 rounded-xl border border-rose-700/50 mb-6">
              <p className="text-rose-300 font-medium">⚠️ Warning</p>
              <p className="text-sm text-rose-400 mt-1">
                This will permanently delete {userToDelete.email} from the database. 
                All associated data (orders, wishlist, etc.) will also be deleted.
              </p>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center">
                  <User className="text-amber-400" size={16} />
                </div>
                <div>
                  <p className="font-medium text-white">{userToDelete.displayName}</p>
                  <p className="text-sm text-slate-400">{userToDelete.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                  <p className="text-xs text-slate-400">Orders</p>
                  <p className="font-medium text-white">{userToDelete.ordersCount || 0}</p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                  <p className="text-xs text-slate-400">Total Spent</p>
                  <p className="font-medium text-amber-400">{formatPKR(userToDelete.totalSpent || 0)}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 border border-slate-700 rounded-xl bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(userToDelete)}
                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-xl hover:from-rose-700 hover:to-rose-600 transition-all flex items-center gap-2"
              >
                <Trash2 size={18} />
                Delete User Permanently
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Ban/Unban Confirmation Modal */}
      {showBanModal && userToBan && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full border flex items-center justify-center ${
                userToBan.isBanned 
                  ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border-emerald-500/30'
                  : 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-amber-500/30'
              }`}>
                {userToBan.isBanned ? (
                  <UserCheck className="text-emerald-400" size={24} />
                ) : (
                  <UserX className="text-amber-400" size={24} />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {userToBan.isBanned ? 'Unban User' : 'Ban User'}
                </h3>
                <p className="text-sm text-slate-400">
                  {userToBan.isBanned 
                    ? 'Restore user access to the platform'
                    : 'Prevent user from accessing the platform'}
                </p>
              </div>
            </div>
            
            <div className={`p-4 rounded-xl mb-6 border ${
              userToBan.isBanned 
                ? 'bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 border-emerald-700/50'
                : 'bg-gradient-to-r from-amber-900/20 to-amber-800/20 border-amber-700/50'
            }`}>
              <p className={`font-medium ${
                userToBan.isBanned ? 'text-emerald-300' : 'text-amber-300'
              }`}>
                {userToBan.isBanned ? '🔓 Unban User' : '⚠️ Ban User'}
              </p>
              <p className={`text-sm mt-1 ${
                userToBan.isBanned ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {userToBan.isBanned 
                  ? 'This will restore all access and permissions for this user.'
                  : 'This user will no longer be able to log in or access their account.'}
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setUserToBan(null);
                }}
                className="px-4 py-2 border border-slate-700 rounded-xl bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBanUser(userToBan)}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                  userToBan.isBanned
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600'
                    : 'bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-700 hover:to-amber-600'
                }`}
              >
                {userToBan.isBanned ? <UserCheck size={18} /> : <UserX size={18} />}
                {userToBan.isBanned ? 'Unban User' : 'Ban User'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
} 