'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Users, 
  User, 
  Mail, 
  Phone, 
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
  X,
  Loader2
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
import { formatPKR } from '@/lib/utils/currency'; // Import PKR formatter

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
  const { user: currentUser, isAdmin, loading: authLoading } = useAuth();
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

  // Check authentication - Wait for auth to load before redirecting
  useEffect(() => {
    if (authLoading) return; // Don't redirect while auth is loading
    
    if (!currentUser || !isAdmin) {
      router.push('/admin-login');
    }
  }, [currentUser, isAdmin, authLoading, router]);

  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      // Don't fetch if not admin or auth is still loading
      if (!currentUser || !isAdmin || authLoading) return;

      try {
        setLoading(true);
        
        const usersCollection = collection(db, 'users');
        const usersQuery = query(usersCollection, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(usersQuery);
        
        const usersData: UserData[] = await Promise.all(
          snapshot.docs.map(async (userDoc) => {
            const userData = userDoc.data();
            
            // Fetch user's orders count
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

  // Filter users based on search and status
  useEffect(() => {
    let result = [...users];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user =>
        user.displayName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phoneNumber?.toLowerCase().includes(query) ||
        user.uid.toLowerCase().includes(query)
      );
    }

    // Status filter
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

  // Loading state for initial auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-rose-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Check if user is not admin - return null while redirecting
  if (!currentUser || !isAdmin) {
    return null;
  }

  // Loading state for users data
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 ml-64 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const handleDeleteUser = async (userData: UserData) => {
    try {
      // First, delete from Firestore
      await deleteDoc(doc(db, 'users', userData.uid));
      
      // Delete user's orders
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', userData.uid)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const deleteOrderPromises = ordersSnapshot.docs.map(orderDoc =>
        deleteDoc(doc(db, 'orders', orderDoc.id))
      );
      await Promise.all(deleteOrderPromises);
      
      // Delete user's wishlist
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
      
      // Remove from state
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
      // Update user's banned status in Firestore
      await updateDoc(doc(db, 'users', userData.uid), {
        isBanned: !userData.isBanned,
        updatedAt: new Date().toISOString(),
      });
      
      // Update local state
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

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPageUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Stats
  const totalUsers = users.length;
  const adminUsers = users.filter(u => u.isAdmin).length;
  const bannedUsers = users.filter(u => u.isBanned).length;
  const verifiedUsers = users.filter(u => u.emailVerified).length;
  const activeUsers = users.filter(u => !u.isBanned).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-rose-700">AYRAA Admin</h1>
        </div>
        <nav className="p-4 space-y-1">
          {[
            { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
            { name: 'Products', href: '/admin/products', icon: '👚' },
            { name: 'Orders', href: '/admin/orders', icon: '📦' },
            { name: 'Users', href: '/admin/users', icon: '👥', active: true },
            { name: 'Analytics', href: '/admin/analytics', icon: '📈' },
          ].map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                item.active
                  ? 'bg-rose-50 text-rose-700'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-gray-600">Manage all registered users in your system</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <Check className="text-green-600" size={20} />
            <span className="text-green-700 font-medium">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="text-red-600" size={20} />
            <span className="text-red-700 font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold mt-2">{totalUsers}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Admin Users</p>
                <p className="text-2xl font-bold mt-2">{adminUsers}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-full">
                <Shield className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold mt-2">{activeUsers}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <UserCheck className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Banned Users</p>
                <p className="text-2xl font-bold mt-2">{bannedUsers}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-full">
                <UserX className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search users by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 appearance-none bg-white"
                >
                  <option value="all">All Users</option>
                  <option value="admin">Admins Only</option>
                  <option value="banned">Banned Users</option>
                  <option value="verified">Verified Email</option>
                  <option value="active">Active Users</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedUsers.length} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={18} />
                  Delete Selected
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-6">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === currentPageUsers.length && currentPageUsers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                    />
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentPageUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.uid)}
                        onChange={() => handleSelectUser(user.uid)}
                        className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-rose-100 to-pink-100 flex items-center justify-center">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="text-rose-600" size={20} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 flex items-center gap-2">
                            {user.displayName}
                            {user.uid === currentUser?.uid && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            ID: {user.uid.substring(0, 8)}...
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Joined: {formatDate(user.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-gray-400" />
                          <span className="text-sm">{user.email}</span>
                          {user.emailVerified && (
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                              Verified
                            </span>
                          )}
                        </div>
                        {user.phoneNumber && (
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-gray-400" />
                            <span className="text-sm">{user.phoneNumber}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Globe size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-600">{user.providerId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-2">
                        {user.isAdmin ? (
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                            <Shield size={12} />
                            Admin
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium w-fit">
                            User
                          </span>
                        )}
                        
                        {user.isBanned ? (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                            <UserX size={12} />
                            Banned
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                            <UserCheck size={12} />
                            Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Orders:</span>
                          <span className="font-medium">{user.ordersCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Spent:</span>
                          <span className="font-medium">{formatPKR(user.totalSpent || 0)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {/* View Orders */}
                        {user.ordersCount! > 0 && (
                          <button
                            onClick={() => router.push(`/admin/orders?user=${user.uid}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Orders"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        
                        {/* Toggle Admin */}
                        <button
                          onClick={() => handleToggleAdmin(user)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.isAdmin
                              ? 'text-purple-600 hover:bg-purple-50'
                              : 'text-gray-600 hover:bg-gray-100'
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
                          className={`p-2 rounded-lg transition-colors ${
                            user.isBanned
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-yellow-600 hover:bg-yellow-50'
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
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Users size={48} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No users found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'No users registered yet'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} users
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`w-10 h-10 rounded-lg ${
                        currentPage === number
                          ? 'bg-rose-600 text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete User</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg mb-6">
              <p className="text-red-700 font-medium">⚠️ Warning</p>
              <p className="text-sm text-red-600 mt-1">
                This will permanently delete {userToDelete.email} from the database. 
                All associated data (orders, wishlist, etc.) will also be deleted.
              </p>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                  <User className="text-rose-600" size={16} />
                </div>
                <div>
                  <p className="font-medium">{userToDelete.displayName}</p>
                  <p className="text-sm text-gray-600">{userToDelete.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Orders</p>
                  <p className="font-medium">{userToDelete.ordersCount || 0}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Total Spent</p>
                  <p className="font-medium">{formatPKR(userToDelete.totalSpent || 0)}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(userToDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 size={18} />
                Delete User Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban/Unban Confirmation Modal */}
      {showBanModal && userToBan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                userToBan.isBanned ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
                {userToBan.isBanned ? (
                  <UserCheck className="text-green-600" size={24} />
                ) : (
                  <UserX className="text-yellow-600" size={24} />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {userToBan.isBanned ? 'Unban User' : 'Ban User'}
                </h3>
                <p className="text-sm text-gray-600">
                  {userToBan.isBanned 
                    ? 'Restore user access to the platform'
                    : 'Prevent user from accessing the platform'}
                </p>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg mb-6 ${
              userToBan.isBanned ? 'bg-green-50' : 'bg-yellow-50'
            }`}>
              <p className={`font-medium ${
                userToBan.isBanned ? 'text-green-700' : 'text-yellow-700'
              }`}>
                {userToBan.isBanned ? '🔓 Unban User' : '⚠️ Ban User'}
              </p>
              <p className={`text-sm mt-1 ${
                userToBan.isBanned ? 'text-green-600' : 'text-yellow-600'
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
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBanUser(userToBan)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  userToBan.isBanned
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                }`}
              >
                {userToBan.isBanned ? <UserCheck size={18} /> : <UserX size={18} />}
                {userToBan.isBanned ? 'Unban User' : 'Ban User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}