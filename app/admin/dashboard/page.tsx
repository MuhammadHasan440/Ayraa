'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Users, 
  Package, 
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  DollarSign,
  Settings,
  LogOut,
  Home,
  CreditCard,
  Activity,
  Shield,
  Bell,
  Menu,
  X,
  Sparkles,
  Key,
  Globe
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

// PKR currency formatter
const formatPKR = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

interface FirestoreOrder {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  items?: any[];
  totalAmount?: number;
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    phone?: string;
  };
  status?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    averageOrderValue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<FirestoreOrder[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/admin-login');
    }
  }, [user, isAdmin, loading, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || !isAdmin) return;

      try {
        // Fetch users count
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnapshot.size;

        // Fetch orders
        const ordersQuery = query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc')
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const orders = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FirestoreOrder[];
        
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(order => order.status === 'pending').length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Recent orders
        const recentOrdersQuery = query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentSnapshot = await getDocs(recentOrdersQuery);
        const recentOrdersData = recentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FirestoreOrder[];

        setStats({
          totalUsers,
          totalOrders,
          totalRevenue,
          pendingOrders,
          averageOrderValue,
        });
        setRecentOrders(recentOrdersData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, isAdmin]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/admin-login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading || dashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatPKR(stats.totalRevenue),
      icon: <DollarSign className="w-6 h-6" />,
      change: '+12.5%',
      description: 'Revenue this month',
      color: 'text-emerald-400',
      gradient: 'from-emerald-500/20 to-emerald-600/20',
      border: 'border-emerald-500/30',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: <ShoppingBag className="w-6 h-6" />,
      change: '+8.2%',
      description: 'Orders this month',
      color: 'text-blue-400',
      gradient: 'from-blue-500/20 to-blue-600/20',
      border: 'border-blue-500/30',
    },
    {
      title: 'Avg Order Value',
      value: formatPKR(stats.averageOrderValue),
      icon: <Activity className="w-6 h-6" />,
      change: '+4.3%',
      description: 'Average per order',
      color: 'text-purple-400',
      gradient: 'from-purple-500/20 to-purple-600/20',
      border: 'border-purple-500/30',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: <Clock className="w-6 h-6" />,
      change: '-3.1%',
      description: 'Require attention',
      color: 'text-amber-400',
      gradient: 'from-amber-500/20 to-amber-600/20',
      border: 'border-amber-500/30',
    },
  ];

  const securityFeatures = [
    { text: "Secure Admin", icon: <Shield size={14} className="text-emerald-400" /> },
    { text: "Real-time Data", icon: <Globe size={14} className="text-blue-400" /> },
    { text: "SSL Protected", icon: <Key size={14} className="text-amber-400" /> },
  ];

  const getStatusBadge = (status?: string) => {
    const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
      pending: { 
        color: 'text-amber-300', 
        bg: 'bg-gradient-to-r from-amber-900/20 to-amber-800/20 border-amber-700/50',
        icon: <Clock size={14} className="text-amber-400" />
      },
      processing: { 
        color: 'text-blue-300', 
        bg: 'bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-blue-700/50',
        icon: <Package size={14} className="text-blue-400" />
      },
      shipped: { 
        color: 'text-indigo-300', 
        bg: 'bg-gradient-to-r from-indigo-900/20 to-indigo-800/20 border-indigo-700/50',
        icon: <TrendingUp size={14} className="text-indigo-400" />
      },
      delivered: { 
        color: 'text-emerald-300', 
        bg: 'bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 border-emerald-700/50',
        icon: <CheckCircle size={14} className="text-emerald-400" />
      },
      cancelled: { 
        color: 'text-red-300', 
        bg: 'bg-gradient-to-r from-red-900/20 to-red-800/20 border-red-700/50',
        icon: <XCircle size={14} className="text-red-400" />
      },
    };

    const actualStatus = status || 'pending';
    const config = statusConfig[actualStatus] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.color}`}>
        {config.icon}
        {actualStatus.charAt(0).toUpperCase() + actualStatus.slice(1)}
      </span>
    );
  };

  const getPaymentMethodBadge = (method?: string) => {
    const methodConfig: Record<string, { color: string; bg: string }> = {
      'credit-card': { color: 'text-slate-300', bg: 'bg-gradient-to-r from-slate-800/20 to-slate-900/20 border-slate-700/50' },
      'easypaisa': { color: 'text-emerald-300', bg: 'bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 border-emerald-700/50' },
      'jazzcash': { color: 'text-purple-300', bg: 'bg-gradient-to-r from-purple-900/20 to-purple-800/20 border-purple-700/50' },
      'cash-on-delivery': { color: 'text-amber-300', bg: 'bg-gradient-to-r from-amber-900/20 to-amber-800/20 border-amber-700/50' },
    };
    
    const actualMethod = method || 'credit-card';
    const config = methodConfig[actualMethod] || methodConfig['credit-card'];
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs border ${config.bg} ${config.color}`}>
        {actualMethod.replace('-', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 ">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-lg text-slate-300 hover:text-amber-400 transition-colors"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-12 pt-20 bottom-0 w-64 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 shadow-xl z-40 transition-transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        

        {/* Navigation */}
        <nav className="p-4 space-y-1 mt-5 pt-10">
          {[
            { name: 'Dashboard', href: '/admin/dashboard', icon: <TrendingUp size={20} />, active: true },
            { name: 'Products', href: '/admin/products', icon: <Package size={20} /> },
            { name: 'Orders', href: '/admin/orders', icon: <ShoppingBag size={20} /> },
            { name: 'Users', href: '/admin/users', icon: <Users size={20} /> },
            { name: 'Analytics', href: '/admin/analytics', icon: <BarChart3 size={20} /> },
            
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
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-white truncate">{user?.email}</p>
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
      <div className="lg:ml-64 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Dashboard Overview</h2>
            <p className="text-slate-400">
              Welcome back, Admin! Here's what's happening with your store today.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-400">
              <span className="font-medium text-amber-300">Currency:</span> Pakistani Rupees (PKR)
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl hover:from-amber-700 hover:to-amber-600 transition-all font-medium shadow-lg flex items-center gap-2">
              <Bell size={16} />
              Generate Report
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border ${stat.border} p-5 md:p-6 backdrop-blur-sm hover:shadow-xl transition-all hover:border-amber-500/30`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-slate-400">{stat.title}</p>
                  <p className="text-xl md:text-2xl font-bold mt-2 text-white">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} border ${stat.border}`}>
                  <div className={stat.color}>
                    {stat.icon}
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-700 pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-slate-500">{stat.description}</p>
                  <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Orders & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 overflow-hidden backdrop-blur-sm">
            <div className="p-5 md:p-6 border-b border-slate-700">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-gradient-to-r from-amber-600/20 to-amber-500/20 p-1 rounded-lg">
                      <ShoppingBag size={18} className="text-amber-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Recent Orders</h3>
                  </div>
                  <p className="text-sm text-slate-400">Latest customer orders</p>
                </div>
                <span className="text-xs text-slate-500">
                  Showing {Math.min(recentOrders.length, 5)} of {stats.totalOrders} orders
                </span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-800 to-slate-900">
                  <tr>
                    <th className="py-3 px-4 md:px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="py-3 px-4 md:px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="py-3 px-4 md:px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="py-3 px-4 md:px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="py-3 px-4 md:px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-800/50">
                      <td className="py-4 px-4 md:px-6">
                        <span className="font-mono text-sm font-medium text-slate-300">#{order.id.slice(0, 8)}</span>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <div>
                          <p className="font-medium text-white">{order.userName || 'N/A'}</p>
                          <p className="text-xs text-slate-500">{order.userEmail || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 md:px-6 text-sm text-slate-400">
                        {order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString('en-PK', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }) : 'N/A'}
                      </td>
                      <td className="py-4 px-4 md:px-6 font-medium text-white">
                        {formatPKR(order.totalAmount || 0)}
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        {getStatusBadge(order.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-5 md:p-6 border-t border-slate-700">
              <a
                href="/admin/orders"
                className="inline-flex items-center text-amber-400 hover:text-amber-300 font-medium"
              >
                View all orders
                <TrendingUp size={16} className="ml-2" />
              </a>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            {/* Payment Methods */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-5 md:p-6 backdrop-blur-sm">
              <h3 className="text-lg font-bold mb-4 text-white">Payment Methods</h3>
              <div className="space-y-3">
                {[
                  { method: 'easypaisa', percentage: 45, color: 'bg-gradient-to-r from-emerald-500 to-emerald-600' },
                  { method: 'credit-card', percentage: 35, color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
                  { method: 'jazzcash', percentage: 15, color: 'bg-gradient-to-r from-purple-500 to-purple-600' },
                  { method: 'cash-on-delivery', percentage: 5, color: 'bg-gradient-to-r from-amber-500 to-amber-600' },
                ].map((item) => (
                  <div key={item.method} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-300 capitalize">{item.method.replace('-', ' ')}</span>
                      <span className="text-sm text-slate-400">{item.percentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} rounded-full`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-5 md:p-6 backdrop-blur-sm">
              <h3 className="text-lg font-bold mb-4 text-white">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 text-emerald-300 rounded-xl hover:from-emerald-700/20 hover:to-emerald-600/20 transition-all border border-emerald-500/30">
                  <Package size={18} />
                  <span className="font-medium">Add New Product</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600/20 to-blue-500/20 text-blue-300 rounded-xl hover:from-blue-700/20 hover:to-blue-600/20 transition-all border border-blue-500/30">
                  <Users size={18} />
                  <span className="font-medium">View Customers</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-600/20 to-purple-500/20 text-purple-300 rounded-xl hover:from-purple-700/20 hover:to-purple-600/20 transition-all border border-purple-500/30">
                  <BarChart3 size={18} />
                  <span className="font-medium">Sales Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 rounded-2xl p-5 md:p-6 text-white shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h3 className="text-xl font-bold mb-2">Store Performance Summary</h3>
              <p className="opacity-90">
                Your store has processed {stats.totalOrders} orders with {formatPKR(stats.totalRevenue)} in total revenue.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button className="px-6 py-2 bg-white/10 backdrop-blur-sm text-white rounded-xl font-medium hover:bg-white/20 transition-all border border-white/20">
                Download Full Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-800/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}