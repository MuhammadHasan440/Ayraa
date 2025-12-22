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
  MoreVertical,
  BarChart3,
  IndianRupee // Changed from Rupee to IndianRupee
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

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

  if (loading || dashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
      icon: <IndianRupee className="w-6 h-6" />, // Changed here
      change: '+12.5%',
      description: 'Revenue this month',
      color: 'bg-green-50 text-green-700',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: <ShoppingBag className="w-6 h-6" />,
      change: '+8.2%',
      description: 'Orders this month',
      color: 'bg-blue-50 text-blue-700',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Avg Order Value',
      value: formatPKR(stats.averageOrderValue),
      icon: <BarChart3 className="w-6 h-6" />,
      change: '+4.3%',
      description: 'Average per order',
      color: 'bg-purple-50 text-purple-700',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: <Clock className="w-6 h-6" />,
      change: '-3.1%',
      description: 'Require attention',
      color: 'bg-amber-50 text-amber-700',
      bgColor: 'bg-amber-100',
    },
  ];

  const getStatusBadge = (status?: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock size={14} /> },
      processing: { color: 'bg-blue-100 text-blue-800', icon: <Package size={14} /> },
      shipped: { color: 'bg-indigo-100 text-indigo-800', icon: <TrendingUp size={14} /> },
      delivered: { color: 'bg-green-100 text-green-800', icon: <CheckCircle size={14} /> },
      cancelled: { color: 'bg-red-100 text-red-800', icon: <XCircle size={14} /> },
    };

    const actualStatus = status || 'pending';
    const config = statusConfig[actualStatus] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {actualStatus.charAt(0).toUpperCase() + actualStatus.slice(1)}
      </span>
    );
  };

  const getPaymentMethodBadge = (method?: string) => {
    const methodConfig: Record<string, string> = {
      'credit-card': 'bg-gray-100 text-gray-800',
      'easypaisa': 'bg-green-100 text-green-800',
      'jazzcash': 'bg-purple-100 text-purple-800',
      'cash-on-delivery': 'bg-amber-100 text-amber-800',
    };
    
    const actualMethod = method || 'credit-card';
    const config = methodConfig[actualMethod] || methodConfig['credit-card'];
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config}`}>
        {actualMethod.replace('-', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-5 bottom-0 w-64 bg-white border-r shadow-sm">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-rose-700 flex items-center gap-2">
            <IndianRupee className="w-6 h-6" /> {/* Changed here */}
            AYRAA Admin
          </h1>
          <p className="text-xs text-gray-500 mt-1">Pakistani Fashion Store</p>
        </div>
        <nav className="p-4 space-y-1">
          {[
            { name: 'Dashboard', href: '/admin/dashboard', icon: <TrendingUp size={20} /> },
            { name: 'Products', href: '/admin/products', icon: <Package size={20} /> },
            { name: 'Orders', href: '/admin/orders', icon: <ShoppingBag size={20} /> },
            { name: 'Users', href: '/admin/users', icon: <Users size={20} /> },
            { name: 'Analytics', href: '/admin/analytics', icon: <BarChart3 size={20} /> },
          ].map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-rose-50 hover:text-rose-700 transition-colors text-gray-700"
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </a>
          ))}
        </nav>
        
        {/* Admin Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
              <span className="font-bold text-rose-700">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{user?.email}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold">Dashboard Overview</h2>
            <p className="text-gray-600">
              Welcome back, Admin! Here's what's happening with your store today.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Currency:</span> Pakistani Rupees (PKR)
            </div>
            <button className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium">
              Generate Report
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <div className={stat.color}>
                    {stat.icon}
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">{stat.description}</p>
                  <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
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
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">Recent Orders</h3>
                  <p className="text-sm text-gray-600">Latest customer orders</p>
                </div>
                <span className="text-xs text-gray-500">
                  Showing {Math.min(recentOrders.length, 5)} of {stats.totalOrders} orders
                </span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <span className="font-mono text-sm font-medium">#{order.id.slice(0, 8)}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium">{order.userName || 'N/A'}</p>
                          <p className="text-xs text-gray-600">{order.userEmail || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString('en-PK', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }) : 'N/A'}
                      </td>
                      <td className="py-4 px-6 font-medium">
                        {formatPKR(order.totalAmount || 0)}
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(order.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t">
              <a
                href="/admin/orders"
                className="inline-flex items-center text-rose-600 hover:text-rose-700 font-medium"
              >
                View all orders
                <TrendingUp size={16} className="ml-2" />
              </a>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            {/* Payment Methods */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-bold mb-4">Payment Methods</h3>
              <div className="space-y-3">
                {[
                  { method: 'easypaisa', percentage: 45, color: 'bg-green-500' },
                  { method: 'credit-card', percentage: 35, color: 'bg-blue-500' },
                  { method: 'jazzcash', percentage: 15, color: 'bg-purple-500' },
                  { method: 'cash-on-delivery', percentage: 5, color: 'bg-amber-500' },
                ].map((item) => (
                  <div key={item.method} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium capitalize">{item.method.replace('-', ' ')}</span>
                      <span className="text-sm text-gray-600">{item.percentage}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                  <Package size={18} />
                  <span className="font-medium">Add New Product</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                  <Users size={18} />
                  <span className="font-medium">View Customers</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                  <BarChart3 size={18} />
                  <span className="font-medium">Sales Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl p-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h3 className="text-xl font-bold mb-2">Store Performance Summary</h3>
              <p className="opacity-90">
                Your store has processed {stats.totalOrders} orders with {formatPKR(stats.totalRevenue)} in total revenue.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button className="px-6 py-2 bg-white text-rose-600 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                Download Full Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}