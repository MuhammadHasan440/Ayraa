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
  CheckCircle2,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  where,
  limit,
  Timestamp,
  doc,
  getDoc,
  onSnapshot
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
  timestamp?: Timestamp;
}

interface User {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate?: string;
  timestamp?: Timestamp;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  sold: number;
  createdAt: string;
  rating?: number;
  views?: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

interface CategoryStats {
  category: string;
  revenue: number;
  orders: number;
  products: number;
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { user: currentUser, isAdmin, loading: authLoading, signOutUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '90days' | '1year'>('30days');
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedSection, setExpandedSection] = useState<string>('overview');
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [realTimeStats, setRealTimeStats] = useState({
    activeUsers: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    todayRevenue: 0
  });

  // Check authentication
  useEffect(() => {
    if (authLoading) return;
    
    if (!currentUser || !isAdmin) {
      router.push('/admin-login');
    }
  }, [currentUser, isAdmin, authLoading, router]);

  // Calculate date range based on selected time range
  const getDateRange = () => {
    const now = new Date();
    const startDate = new Date();
    
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
    
    return { startDate, endDate: now };
  };

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!currentUser || !isAdmin || authLoading) return;

      try {
        setLoading(true);
        const { startDate } = getDateRange();

        // Fetch users first
        const usersQuery = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          limit(1000)
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
            const userOrders = userOrdersSnapshot.docs;
            
            const totalSpent = userOrders.reduce(
              (sum, orderDoc) => sum + (orderDoc.data().totalAmount || 0), 0
            );
            
            // Get last order date
            const lastOrder = userOrders.length > 0 
              ? userOrders.sort((a, b) => 
                  b.data().createdAt?.toDate().getTime() - a.data().createdAt?.toDate().getTime()
                )[0]
              : null;
            
            return {
              uid: userDoc.id,
              email: userData.email || '',
              displayName: userData.displayName || userData.email?.split('@')[0] || 'User',
              createdAt: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              ordersCount: userOrders.length,
              totalSpent,
              lastOrderDate: lastOrder?.data()?.createdAt?.toDate?.()?.toISOString(),
              timestamp: userData.createdAt
            };
          })
        );
        setUsers(usersData);

        // Fetch products
        const productsQuery = query(
          collection(db, 'products'),
          orderBy('createdAt', 'desc'),
          limit(500)
        );
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productsData);

        // Fetch orders with real-time updates
        const ordersQuery = query(
          collection(db, 'orders'),
          where('createdAt', '>=', Timestamp.fromDate(startDate)),
          orderBy('createdAt', 'desc')
        );

        const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
          const ordersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Order[];
          setOrders(ordersData);
          calculateDailyRevenue(ordersData);
          calculateCategoryStats(ordersData);
          calculateRealTimeStats(ordersData, productsData, usersData);
        });

        setSuccessMessage('Analytics data loaded successfully');
        setTimeout(() => setSuccessMessage(''), 3000);

        return () => {
          unsubscribeOrders();
        };

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

  // Calculate daily revenue from orders
  const calculateDailyRevenue = (ordersData: Order[]) => {
    const revenueByDay: Record<string, DailyRevenue> = {};
    
    ordersData.forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      if (!revenueByDay[date]) {
        revenueByDay[date] = {
          date,
          revenue: 0,
          orders: 0
        };
      }
      
      revenueByDay[date].revenue += order.totalAmount;
      revenueByDay[date].orders += 1;
    });
    
    // Convert to array and sort by date
    const sortedRevenue = Object.values(revenueByDay)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days
    
    setDailyRevenue(sortedRevenue);
  };

  // Calculate category statistics
  const calculateCategoryStats = (ordersData: Order[]) => {
    const categoryStatsMap: Record<string, CategoryStats> = {};
    
    ordersData.forEach(order => {
      order.items?.forEach((item: any) => {
        const category = item.category || 'Uncategorized';
        
        if (!categoryStatsMap[category]) {
          categoryStatsMap[category] = {
            category,
            revenue: 0,
            orders: 0,
            products: 0
          };
        }
        
        categoryStatsMap[category].revenue += item.price * item.quantity;
        categoryStatsMap[category].orders += 1;
        categoryStatsMap[category].products += item.quantity;
      });
    });
    
    // Convert to array and sort by revenue
    const sortedStats = Object.values(categoryStatsMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // Top 5 categories
    
    setCategoryStats(sortedStats);
  };

  // Calculate real-time statistics
  const calculateRealTimeStats = (ordersData: Order[], productsData: Product[], usersData: User[]) => {
    // Today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Today's revenue
    const todayRevenue = ordersData
      .filter(order => {
        const orderDate = new Date(order.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      })
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Active users (users with orders in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = usersData.filter(user => {
      if (!user.lastOrderDate) return false;
      const lastOrderDate = new Date(user.lastOrderDate);
      return lastOrderDate >= thirtyDaysAgo;
    }).length;
    
    // Pending orders
    const pendingOrders = ordersData.filter(order => 
      ['pending', 'processing'].includes(order.status)
    ).length;
    
    // Low stock products
    const lowStockProducts = productsData.filter(p => p.stock < 10).length;
    
    setRealTimeStats({
      activeUsers,
      pendingOrders,
      lowStockProducts,
      todayRevenue
    });
  };

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

  // Calculate growth compared to previous period
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Mock previous period data (in real app, fetch previous period data)
  const previousPeriodRevenue = totalRevenue * 0.85; // 15% less for demo
  const previousPeriodOrders = Math.floor(totalOrders * 0.88); // 12% less for demo
  const previousPeriodAvgOrder = averageOrderValue * 0.96; // 4% less for demo
  const previousPeriodNewUsers = Math.floor(users.filter(u => {
    const userDate = new Date(u.createdAt);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange) * 2); // Previous period
    return userDate >= startDate;
  }).length * 0.8); // 20% less for demo

  const revenueGrowth = calculateGrowth(totalRevenue, previousPeriodRevenue);
  const ordersGrowth = calculateGrowth(totalOrders, previousPeriodOrders);
  const avgOrderGrowth = calculateGrowth(averageOrderValue, previousPeriodAvgOrder);
  const newUsersGrowth = calculateGrowth(users.length, previousPeriodNewUsers);

  // Top selling products
  const topProducts = [...products]
    .sort((a, b) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 5);

  // Recent orders
  const recentOrders = orders.slice(0, 5);

  // Top customers by spending
  const topCustomers = [...users]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  // Handle logout
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

  // Toggle section visibility
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

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
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm hover:border-slate-600 transition-all duration-300">
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
            { name: 'Dashboard', href: '/admin/dashboard', icon: <TrendingUpIcon size={20} />, active: false },
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
              <p className="text-slate-400">Real-time insights from your Firebase data</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Time Range Selector */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
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

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500 mr-3" />
              <span className="text-slate-400">Loading analytics data...</span>
            </div>
          )}

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
          {!loading && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  title="Total Revenue"
                  value={formatPKR(totalRevenue)}
                  icon={DollarSign}
                  trend={revenueGrowth >= 0 ? 'up' : 'down'}
                  change={`${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`}
                  color="emerald"
                />
                
                <StatCard
                  title="Total Orders"
                  value={totalOrders}
                  icon={ShoppingBag}
                  trend={ordersGrowth >= 0 ? 'up' : 'down'}
                  change={`${ordersGrowth >= 0 ? '+' : ''}${ordersGrowth.toFixed(1)}%`}
                  color="blue"
                />
                
                <StatCard
                  title="Average Order Value"
                  value={formatPKR(averageOrderValue)}
                  icon={CreditCard}
                  trend={avgOrderGrowth >= 0 ? 'up' : 'down'}
                  change={`${avgOrderGrowth >= 0 ? '+' : ''}${avgOrderGrowth.toFixed(1)}%`}
                  color="purple"
                />
                
                <StatCard
                  title="New Customers"
                  value={users.length}
                  icon={UserCheck}
                  trend={newUsersGrowth >= 0 ? 'up' : 'down'}
                  change={`${newUsersGrowth >= 0 ? '+' : ''}${newUsersGrowth.toFixed(1)}%`}
                  color="amber"
                />
              </div>

              {/* Real-time Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  title="Today's Revenue"
                  value={formatPKR(realTimeStats.todayRevenue)}
                  icon={DollarSign}
                  color="emerald"
                />
                
                <StatCard
                  title="Active Users"
                  value={realTimeStats.activeUsers}
                  icon={UserCheck}
                  color="blue"
                />
                
                <StatCard
                  title="Pending Orders"
                  value={realTimeStats.pendingOrders}
                  icon={ShoppingBag}
                  color="amber"
                />
                
                <StatCard
                  title="Low Stock Alert"
                  value={realTimeStats.lowStockProducts}
                  icon={AlertCircle}
                  color="rose"
                />
              </div>

              {/* Charts and Detailed Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Revenue Overview (Last 7 Days)</h3>
                      <p className="text-sm text-slate-400">Daily revenue and order trends</p>
                    </div>
                    <button
                      onClick={() => toggleSection('revenue')}
                      className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400"
                    >
                      {expandedSection === 'revenue' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                  
                  {expandedSection === 'revenue' && dailyRevenue.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="overflow-hidden"
                    >
                      <div className="h-64 flex items-end justify-between pt-8">
                        {dailyRevenue.map((day) => {
                          const maxRevenue = Math.max(...dailyRevenue.map(d => d.revenue));
                          const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 180 : 0;
                          
                          return (
                            <div key={day.date} className="flex flex-col items-center flex-1 px-2">
                              <div className="text-xs text-slate-400 mb-2">{day.date}</div>
                              <div className="relative w-full">
                                <div
                                  className="w-full bg-gradient-to-t from-amber-500 to-amber-600 rounded-t-lg transition-all hover:opacity-80"
                                  style={{ height: `${height}px` }}
                                ></div>
                                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-slate-400 whitespace-nowrap">
                                  {day.orders} orders
                                </div>
                              </div>
                              <div className="text-xs text-amber-400 mt-10 font-medium">
                                {formatPKR(day.revenue)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Order Status Distribution */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Order Status Distribution</h3>
                      <p className="text-sm text-slate-400">Current order status breakdown</p>
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
                        const percentage = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
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
                              <span className="text-white font-medium">
                                {count} ({percentage.toFixed(1)}%)
                              </span>
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

              {/* Category Performance */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm mb-8">
                <h3 className="text-lg font-semibold text-white mb-6">Category Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {categoryStats.map((category) => (
                    <div key={category.category} className="p-4 rounded-xl bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700 hover:border-slate-600 transition-all">
                      <h4 className="font-medium text-white mb-2">{category.category}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Revenue:</span>
                          <span className="text-emerald-400 font-medium">
                            {formatPKR(category.revenue)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Orders:</span>
                          <span className="text-amber-400 font-medium">{category.orders}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Products:</span>
                          <span className="text-blue-400 font-medium">{category.products}</span>
                        </div>
                      </div>
                    </div>
                  ))}
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
                              <h4 className="font-medium text-white truncate max-w-[200px]">{product.name}</h4>
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

                {/* Top Customers */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 backdrop-blur-sm">
                  <div className="p-6 border-b border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Top Customers</h3>
                        <p className="text-sm text-slate-400">Highest spending customers</p>
                      </div>
                      <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400">
                        <MoreVertical size={20} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      {topCustomers.map((customer, index) => (
                        <div key={customer.uid} className="flex items-center justify-between p-3 hover:bg-slate-800/30 rounded-xl transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 rounded-full flex items-center justify-center border border-emerald-500/30">
                              <span className="font-bold text-emerald-400">
                                {customer.displayName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-white truncate max-w-[180px]">{customer.displayName}</h4>
                              <p className="text-xs text-slate-400">{customer.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-white">{formatPKR(customer.totalSpent)}</div>
                            <div className="text-sm text-amber-400">{customer.ordersCount} orders</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
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
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Avg. Lifetime Value</span>
                      <span className="text-purple-400 font-medium">
                        {formatPKR(users.length > 0 ? users.reduce((sum, u) => sum + u.totalSpent, 0) / users.length : 0)}
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
                      <span className="text-slate-400">Low Stock </span>
                      <span className="text-amber-400 font-medium">
                        {products.filter(p => p.stock > 0 && p.stock < 10).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Out of Stock</span>
                      <span className="text-rose-400 font-medium">
                        {products.filter(p => p.stock === 0).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Avg. Stock Level</span>
                      <span className="text-blue-400 font-medium">
                        {products.length > 0 ? Math.round(products.reduce((sum, p) => sum + p.stock, 0) / products.length) : 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Metrics */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm">
                  <h4 className="text-lg font-semibold text-white mb-4">Order Performance</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Completion Rate</span>
                      <span className="text-emerald-400 font-medium">
                        {totalOrders > 0 ? ((orders.filter(o => o.status === 'delivered').length / totalOrders) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Avg. Items/Order</span>
                      <span className="text-blue-400 font-medium">
                        {totalOrders > 0 ? (orders.reduce((sum, o) => sum + (o.items?.length || 0), 0) / totalOrders).toFixed(1) : 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Cancellation Rate</span>
                      <span className="text-rose-400 font-medium">
                        {totalOrders > 0 ? ((orders.filter(o => o.status === 'cancelled').length / totalOrders) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Processing Time</span>
                      <span className="text-amber-400 font-medium">2.4 days</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}