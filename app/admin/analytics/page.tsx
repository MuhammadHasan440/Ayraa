'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingBag,
  Package,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  Filter,
  RefreshCw,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Star,
  Clock,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Globe,
  Smartphone,
  Home,
  Settings,
  LogOut,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  CreditCard,
  Truck,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  where,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { formatPKR } from '@/lib/utils/currency';

interface Order {
  id: string;
  userId: string;
  email: string;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: any[];
  createdAt: string;
  paymentMethod: string;
}

interface User {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  sold: number;
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { user: currentUser, isAdmin, loading: authLoading, signOutUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedSection, setExpandedSection] = useState<string>('overview');

  // Check authentication
  useEffect(() => {
    if (authLoading) return;
    
    if (!currentUser || !isAdmin) {
      router.push('/admin-login');
    }
  }, [currentUser, isAdmin, authLoading, router]);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!currentUser || !isAdmin || authLoading) return;

      try {
        setLoading(true);

        // Calculate date range
        const now = new Date();
        let startDate = new Date();
        
        switch(timeRange) {
          case '7days':
            startDate.setDate(now.getDate() - 7);
            break;
          case '30days':
            startDate.setDate(now.getDate() - 30);
            break;
          case '90days':
            startDate.setDate(now.getDate() - 90);
            break;
          case '1year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            startDate.setDate(now.getDate() - 30);
        }

        // Fetch orders
        const ordersQuery = query(
          collection(db, 'orders'),
          where('createdAt', '>=', Timestamp.fromDate(startDate)),
          orderBy('createdAt', 'desc')
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];
        setOrders(ordersData);

        // Fetch users
        const usersQuery = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = await Promise.all(
          usersSnapshot.docs.map(async (userDoc) => {
            const userData = userDoc.data();
            
            // Fetch user's orders
            const userOrdersQuery = query(
              collection(db, 'orders'),
              where('userId', '==', userDoc.id)
            );
            const userOrdersSnapshot = await getDocs(userOrdersQuery);
            const totalSpent = userOrdersSnapshot.docs.reduce(
              (sum, orderDoc) => sum + (orderDoc.data().totalAmount || 0), 0
            );
            
            return {
              uid: userDoc.id,
              email: userData.email || '',
              displayName: userData.displayName || userData.email?.split('@')[0] || 'User',
              createdAt: userData.createdAt || new Date().toISOString(),
              ordersCount: userOrdersSnapshot.size,
              totalSpent
            };
          })
        );
        setUsers(usersData);

        // Fetch products
        const productsQuery = query(
          collection(db, 'products'),
          orderBy('createdAt', 'desc')
        );
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productsData);

        setSuccessMessage('Analytics data loaded successfully');
        setTimeout(() => setSuccessMessage(''), 3000);

      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setErrorMessage('Failed to load analytics data. Please try again.');
        setTimeout(() => setErrorMessage(''), 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [currentUser, isAdmin, authLoading, timeRange]);

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

  // Calculate metrics
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalOrders = orders.length;
  const totalUsers = users.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Orders by status
  const ordersByStatus = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Revenue growth (last period vs previous period)
  const currentPeriodRevenue = totalRevenue;
  const previousPeriodRevenue = 0; // You would need to fetch previous period data
  const revenueGrowth = previousPeriodRevenue > 0 
    ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
    : 100;

  // Top selling products
  const topProducts = [...products]
    .sort((a, b) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 5);

  // Recent orders
  const recentOrders = orders.slice(0, 5);

  // Revenue by day (for chart)
  const revenueByDay = orders.reduce((acc, order) => {
    const date = new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
    acc[date] = (acc[date] || 0) + order.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  // User growth
  const newUsers = users.filter(user => {
    const userDate = new Date(user.createdAt);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));
    return userDate >= startDate;
  }).length;

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

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    change, 
    color = 'blue' 
  }: { 
    title: string;
    value: string | number;
    icon: any;
    trend?: 'up' | 'down';
    change?: string;
    color?: 'blue' | 'green' | 'purple' | 'amber' | 'rose' | 'emerald';
  }) => {
    const colorClasses = {
      blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
      green: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
      purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
      amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
      rose: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400',
      emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    };

    return (
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses[color]}`}>
            <Icon size={24} />
          </div>
          {trend && change && (
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
              trend === 'up' 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {change}
            </div>
          )}
        </div>
        <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
        <p className="text-sm text-slate-400">{title}</p>
      </div>
    );
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
      <aside className="fixed left-0 top-20 bottom-0 w-64 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 shadow-xl z-40">
        
        
        <nav className="p-4 space-y-1 mt-5 pt-20">
          {[
            { name: 'Dashboard', href: '/admin/dashboard', icon: <TrendingUp size={20} />, active: false },
            { name: 'Products', href: '/admin/products', icon: <Package size={20} />, active: false },
            { name: 'Orders', href: '/admin/orders', icon: <ShoppingBag size={20} />, active: false },
            { name: 'Users', href: '/admin/users', icon: <Users size={20} />, active: false },
            { name: 'Analytics', href: '/admin/analytics', icon: <BarChart3 size={20} />, active: true },
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
                  <BarChart3 className="w-6 h-6 text-amber-400" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 bg-clip-text text-transparent">
                  Analytics Dashboard
                </h1>
              </div>
              <p className="text-slate-400">Track and analyze your store performance</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Time Range Selector */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white appearance-none"
                >
                  <option value="7days" className="bg-slate-800">Last 7 Days</option>
                  <option value="30days" className="bg-slate-800">Last 30 Days</option>
                  <option value="90days" className="bg-slate-800">Last 90 Days</option>
                  <option value="1year" className="bg-slate-800">Last Year</option>
                </select>
              </div>
              
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2.5 border border-slate-700 rounded-xl bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors flex items-center gap-2"
              >
                <RefreshCw size={18} />
                Refresh
              </button>
              
              <button
                className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl hover:from-amber-700 hover:to-amber-600 transition-all flex items-center gap-2"
              >
                <Download size={18} />
                Export Report
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
              <CheckCircle className="text-emerald-400" size={20} />
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

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Revenue"
              value={formatPKR(totalRevenue)}
              icon={DollarSign}
              trend="up"
              change="+12.5%"
              color="emerald"
            />
            
            <StatCard
              title="Total Orders"
              value={totalOrders}
              icon={ShoppingBag}
              trend="up"
              change="+8.2%"
              color="blue"
            />
            
            <StatCard
              title="Average Order Value"
              value={formatPKR(averageOrderValue)}
              icon={CreditCard}
              trend="up"
              change="+4.3%"
              color="purple"
            />
            
            <StatCard
              title="New Customers"
              value={newUsers}
              icon={UserCheck}
              trend="up"
              change="+15.7%"
              color="amber"
            />
          </div>

          {/* Charts and Detailed Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Revenue Overview</h3>
                  <p className="text-sm text-slate-400">Revenue trends over time</p>
                </div>
                <button
                  onClick={() => toggleSection('revenue')}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400"
                >
                  {expandedSection === 'revenue' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>
              
              {expandedSection === 'revenue' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="overflow-hidden"
                >
                  <div className="h-64 flex items-end justify-between pt-8">
                    {Object.entries(revenueByDay).map(([day, revenue]) => (
                      <div key={day} className="flex flex-col items-center flex-1">
                        <div className="text-xs text-slate-400 mb-2">{day}</div>
                        <div
                          className="w-8 bg-gradient-to-t from-amber-500 to-amber-600 rounded-t-lg transition-all hover:opacity-80"
                          style={{ height: `${(revenue / Math.max(...Object.values(revenueByDay))) * 120}px` }}
                        ></div>
                        <div className="text-xs text-slate-400 mt-2">{formatPKR(revenue)}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Order Status Distribution */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Order Status</h3>
                  <p className="text-sm text-slate-400">Distribution by status</p>
                </div>
                <button
                  onClick={() => toggleSection('orders')}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400"
                >
                  {expandedSection === 'orders' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>
              
              {expandedSection === 'orders' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  {Object.entries(ordersByStatus).map(([status, count]) => {
                    const percentage = (count / totalOrders) * 100;
                    const color = {
                      pending: 'bg-amber-500',
                      processing: 'bg-blue-500',
                      shipped: 'bg-purple-500',
                      delivered: 'bg-emerald-500',
                      cancelled: 'bg-rose-500'
                    }[status] || 'bg-slate-500';

                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-300 capitalize">{status}</span>
                          <span className="text-white font-medium">{count} orders</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${color} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </div>

          {/* Bottom Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 backdrop-blur-sm">
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Top Selling Products</h3>
                    <p className="text-sm text-slate-400">Best performing products</p>
                  </div>
                  <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between p-3 hover:bg-slate-800/30 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-amber-500/20 to-amber-600/10 rounded-lg flex items-center justify-center border border-amber-500/30">
                          <Package size={18} className="text-amber-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{product.name}</h4>
                          <p className="text-xs text-slate-400">{product.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-white">{product.sold || 0} sold</div>
                        <div className="text-sm text-amber-400">{formatPKR(product.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 backdrop-blur-sm">
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Recent Orders</h3>
                    <p className="text-sm text-slate-400">Latest customer orders</p>
                  </div>
                  <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {recentOrders.map((order) => {
                    const statusColor = {
                      pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                      processing: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                      shipped: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                      delivered: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                      cancelled: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }[order.status] || 'bg-slate-500/20 text-slate-300 border-slate-500/30';

                    return (
                      <div key={order.id} className="flex items-center justify-between p-3 hover:bg-slate-800/30 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-blue-600/10 rounded-lg flex items-center justify-center border border-blue-500/30">
                            <ShoppingBag size={18} className="text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-white">Order #{order.id.substring(0, 8)}</h4>
                            <p className="text-xs text-slate-400">{order.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-white">{formatPKR(order.totalAmount)}</div>
                          <div className={`text-xs px-2 py-1 rounded-full border ${statusColor} capitalize`}>
                            {order.status}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {/* Customer Metrics */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm">
              <h4 className="text-lg font-semibold text-white mb-4">Customer Metrics</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Customers</span>
                  <span className="text-white font-medium">{totalUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Active Customers</span>
                  <span className="text-emerald-400 font-medium">
                    {users.filter(u => u.ordersCount > 0).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Repeat Rate</span>
                  <span className="text-amber-400 font-medium">
                    {totalUsers > 0 ? ((users.filter(u => u.ordersCount > 1).length / totalUsers) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Product Metrics */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm">
              <h4 className="text-lg font-semibold text-white mb-4">Product Metrics</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Products</span>
                  <span className="text-white font-medium">{products.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Low Stock</span>
                  <span className="text-rose-400 font-medium">
                    {products.filter(p => p.stock < 10).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Out of Stock</span>
                  <span className="text-rose-400 font-medium">
                    {products.filter(p => p.stock === 0).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Conversion Metrics */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm">
              <h4 className="text-lg font-semibold text-white mb-4">Conversion Metrics</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Cart Abandonment</span>
                  <span className="text-white font-medium">24.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Checkout Completion</span>
                  <span className="text-emerald-400 font-medium">72.3%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Avg. Session Duration</span>
                  <span className="text-blue-400 font-medium">4m 32s</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}