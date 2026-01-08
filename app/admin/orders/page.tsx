'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  Printer,
  Loader2,
  AlertCircle,
  Check,
  Home,
  Settings,
  LogOut,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Users,
  BarChart3,
  Shield,
  Sparkles,
  Key,
  Globe
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { collection, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Order } from '@/types';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatPKR, formatPKRWithDecimals } from '@/lib/utils/currency';

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/admin-login');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !isAdmin) return;

      try {
        const ordersQuery = query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(ordersQuery);
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Order[];
        
        setOrders(ordersData);
        setFilteredOrders(ordersData);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setErrorMessage('Failed to load orders. Please try again.');
        setTimeout(() => setErrorMessage(''), 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, isAdmin]);

  useEffect(() => {
    let result = [...orders];

    // Search filter
    if (searchQuery) {
      result = result.filter(order =>
        order.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(result);
    setCurrentPage(1);
  }, [searchQuery, statusFilter, orders]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/admin-login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date(),
      });

      // Update local state
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus as any } : order
      ));

      setSuccessMessage('Order status updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating order status:', error);
      setErrorMessage('Failed to update order status');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetailModal(true);
  };

  const generateInvoice = (order: Order) => {
    setSelectedOrder(order);
    setShowInvoiceModal(true);
  };

  const downloadInvoice = async (order: Order) => {
    try {
      setGeneratingInvoice(true);
      
      const invoiceDiv = document.createElement('div');
      invoiceDiv.style.cssText = `
        position: absolute;
        left: -9999px;
        top: -9999px;
        width: 210mm;
        min-height: 297mm;
        padding: 20mm;
        background: white;
        font-family: Arial, sans-serif;
        color: #000;
      `;
      
      invoiceDiv.innerHTML = `
        <div style="margin-bottom: 30px;">
          <h1 style="color: #f59e0b; font-size: 32px; margin: 0;">AYRAA</h1>
          <p style="color: #666; margin: 5px 0;">Luxury Fashion & Accessories</p>
          <p style="color: #666; margin: 5px 0;">Karachi, Pakistan</p>
          <p style="color: #666; margin: 5px 0;">Phone: +92 300 1234567</p>
          <p style="color: #666; margin: 5px 0;">Email: support@ayraa.com</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #f59e0b; padding-bottom: 20px;">
          <div>
            <h2 style="font-size: 28px; color: #f59e0b; margin: 0 0 10px 0;">INVOICE</h2>
            <p style="margin: 5px 0;"><strong>Invoice #:</strong> ${order.id.toUpperCase()}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${order.createdAt.toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${order.status.toUpperCase()}</p>
          </div>
          <div style="text-align: right;">
            <h3 style="margin: 0 0 10px 0;">AYRAA</h3>
            <p style="margin: 5px 0;">Business Registration No: 123456789</p>
            <p style="margin: 5px 0;">Karachi, Pakistan</p>
            <p style="margin: 5px 0;">www.ayraa.com</p>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
          <div>
            <h3 style="color: #f59e0b; margin-bottom: 10px;">Bill To:</h3>
            <p style="margin: 5px 0;"><strong>${order.userName}</strong></p>
            <p style="margin: 5px 0;">${order.userEmail}</p>
            <p style="margin: 5px 0;">${order.shippingAddress.phone}</p>
          </div>
          <div>
            <h3 style="color: #f59e0b; margin-bottom: 10px;">Ship To:</h3>
            <p style="margin: 5px 0;"><strong>${order.shippingAddress.fullName || order.userName}</strong></p>
            <p style="margin: 5px 0;">${order.shippingAddress.street}</p>
            <p style="margin: 5px 0;">${order.shippingAddress.city}, ${order.shippingAddress.state}</p>
            <p style="margin: 5px 0;">${order.shippingAddress.country} </p>
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Item</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Price</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Qty</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td style="padding: 12px; border: 1px solid #ddd;">
                  <div><strong>${item.name}</strong></div>
                  <div style="color: #666; font-size: 12px;">Size: ${item.size} | Color: ${item.color}</div>
                </td>
                <td style="padding: 12px; border: 1px solid #ddd;">${formatPKRWithDecimals(item.price)}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${item.quantity}</td>
                <td style="padding: 12px; border: 1px solid #ddd;">${formatPKRWithDecimals(item.price * item.quantity)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="margin-left: auto; width: 300px; margin-bottom: 40px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span>Subtotal:</span>
            <span>${formatPKRWithDecimals(order.subtotal || order.totalAmount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span>Shipping:</span>
            <span>${formatPKRWithDecimals(order.shippingCost || 0)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span>Tax:</span>
            <span>${formatPKRWithDecimals(order.tax || 0)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; border-top: 2px solid #f59e0b; padding-top: 10px;">
            <span>Total:</span>
            <span>${formatPKRWithDecimals(order.totalAmount)}</span>
          </div>
        </div>
        
        <div style="border-top: 2px solid #f59e0b; padding-top: 20px; margin-bottom: 40px;">
          <h3 style="color: #f59e0b; margin-bottom: 10px;">Payment Information:</h3>
          <p style="margin: 5px 0;"><strong>Method:</strong> ${order.paymentMethod}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> ${order.paymentStatus}</p>
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order.id}</p>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px;">
          <p>Thank you for shopping with AYRAA!</p>
          <p>If you have any questions, contact us at support@ayraa.com</p>
          <p>This is a computer-generated invoice. No signature required.</p>
        </div>
      `;
      
      document.body.appendChild(invoiceDiv);
      
      const canvas = await html2canvas(invoiceDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      
      pdf.addImage(imgData, 'PNG', imgX, 10, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`invoice-${order.id}.pdf`);
      
      document.body.removeChild(invoiceDiv);
      
      setSuccessMessage('Invoice downloaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error generating invoice:', error);
      setErrorMessage('Failed to generate invoice. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setGeneratingInvoice(false);
      setShowInvoiceModal(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-amber-400" size={16} />;
      case 'processing':
        return <Package className="text-blue-400" size={16} />;
      case 'shipped':
        return <Truck className="text-indigo-400" size={16} />;
      case 'delivered':
        return <CheckCircle className="text-emerald-400" size={16} />;
      case 'cancelled':
        return <XCircle className="text-red-400" size={16} />;
      default:
        return <Clock className="text-slate-500" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gradient-to-r from-amber-900/20 to-amber-800/20 text-amber-300 border border-amber-700/50';
      case 'processing':
        return 'bg-gradient-to-r from-blue-900/20 to-blue-800/20 text-blue-300 border border-blue-700/50';
      case 'shipped':
        return 'bg-gradient-to-r from-indigo-900/20 to-indigo-800/20 text-indigo-300 border border-indigo-700/50';
      case 'delivered':
        return 'bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 text-emerald-300 border border-emerald-700/50';
      case 'cancelled':
        return 'bg-gradient-to-r from-red-900/20 to-red-800/20 text-red-300 border border-red-700/50';
      default:
        return 'bg-gradient-to-r from-slate-800/20 to-slate-900/20 text-slate-300 border border-slate-700/50';
    }
  };

  const getStatusOptions = (currentStatus: string) => {
    const allStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    return allStatuses.filter(status => status !== currentStatus);
  };

  const getPaymentIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'credit card':
        return <CreditCard size={16} />;
      case 'cod':
        return <DollarSign size={16} />;
      case 'bank transfer':
        return <FileText size={16} />;
      default:
        return <CreditCard size={16} />;
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPageOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const statusOptions = [
    { id: 'all', name: 'All Status' },
    { id: 'pending', name: 'Pending' },
    { id: 'processing', name: 'Processing' },
    { id: 'shipped', name: 'Shipped' },
    { id: 'delivered', name: 'Delivered' },
    { id: 'cancelled', name: 'Cancelled' },
  ];

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const totalRevenuePKR = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const avgOrderValuePKR = orders.length > 0 ? totalRevenuePKR / orders.length : 0;

  const securityFeatures = [
    { text: "Secure Admin", icon: <Shield size={14} className="text-emerald-400" /> },
    { text: "Real-time Data", icon: <Globe size={14} className="text-blue-400" /> },
    { text: "SSL Protected", icon: <Key size={14} className="text-amber-400" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-lg text-slate-300 hover:text-amber-400 transition-colors"
        >
          {sidebarOpen ? <X size={24} /> : <Search size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-20 pt-20 bottom-0 w-64 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 shadow-xl z-40 transition-transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        

        {/* Navigation */}
        <nav className="p-4 space-y-1 mt-3">
          {[
            { name: 'Dashboard', href: '/admin/dashboard', icon: <TrendingUp size={20} /> },
            { name: 'Products', href: '/admin/products', icon: <Package size={20} /> },
            { name: 'Orders', href: '/admin/orders', icon: <ShoppingBag size={20} />, active: true },
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
        {/* Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 rounded-xl border border-emerald-700/50 flex items-center gap-3">
            <Check className="text-emerald-400" size={20} />
            <span className="text-emerald-300 font-medium">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-900/20 to-red-800/20 rounded-xl border border-red-700/50 flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <span className="text-red-300 font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gradient-to-r from-amber-600/20 to-amber-500/20 p-2 rounded-lg border border-amber-500/30">
                <ShoppingBag className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Order Management</h1>
                <p className="text-slate-400">View and manage customer orders</p>
              </div>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl hover:from-amber-700 hover:to-amber-600 transition-all font-medium shadow-lg">
            <Download size={20} />
            Export Orders
          </button>
        </div>

        {/* Status Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {statusOptions.map((status) => {
            const statusOrders = status.id === 'all' 
              ? orders 
              : orders.filter(o => o.status === status.id);
            const revenuePKR = statusOrders.reduce((sum, order) => sum + order.totalAmount, 0);
            const gradient = status.id === 'all' 
              ? 'from-slate-800/50 to-slate-900/50 border-slate-700'
              : getStatusColor(status.id).split(' ').slice(0, 4).join(' ');
            
            return (
              <div
                key={status.id}
                className={`bg-gradient-to-br ${gradient} rounded-2xl border p-4 cursor-pointer transition-all backdrop-blur-sm hover:border-amber-500/30 ${
                  statusFilter === status.id ? 'ring-2 ring-amber-500' : ''
                }`}
                onClick={() => setStatusFilter(status.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">{status.name}</p>
                    <p className="text-xl md:text-2xl font-bold mt-2 text-white">{statusOrders.length}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {formatPKR(revenuePKR)}
                    </p>
                  </div>
                  <div className={`p-2 rounded-xl ${
                    status.id === 'all' 
                      ? 'bg-gradient-to-r from-slate-800/20 to-slate-900/20 border border-slate-700'
                      : 'bg-gradient-to-r from-slate-800/30 to-slate-900/30 border border-slate-700'
                  }`}>
                    {status.id !== 'all' ? (
                      <div className={status.id === 'pending' ? 'text-amber-400' : 
                                    status.id === 'processing' ? 'text-blue-400' :
                                    status.id === 'shipped' ? 'text-indigo-400' :
                                    status.id === 'delivered' ? 'text-emerald-400' : 'text-red-400'}>
                        {getStatusIcon(status.id)}
                      </div>
                    ) : <Package className="text-slate-400" size={20} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 mb-8 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
                <input
                  type="text"
                  placeholder="Search orders by customer, email, or order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500"
                />
              </div>
            </div>

            {/* Date Filter */}
            <div className="w-full md:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
                <select className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white appearance-none">
                  <option>Last 30 days</option>
                  <option>Last 7 days</option>
                  <option>This month</option>
                  <option>Last month</option>
                  <option>Custom range</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 overflow-hidden backdrop-blur-sm">
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
                    Items
                  </th>
                  <th className="py-3 px-4 md:px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Total (PKR)
                  </th>
                  <th className="py-3 px-4 md:px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-4 md:px-6 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {currentPageOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/50">
                    <td className="py-4 px-4 md:px-6">
                      <div className="font-mono text-sm font-medium text-slate-300">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </div>
                      <div className="text-xs text-slate-500">
                        {order.paymentMethod}
                      </div>
                    </td>
                    <td className="py-4 px-4 md:px-6">
                      <div>
                        <p className="font-medium text-white">{order.userName}</p>
                        <p className="text-sm text-slate-400">{order.userEmail}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {order.shippingAddress.city}, {order.shippingAddress.country}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4 md:px-6">
                      <div className="text-sm text-slate-300">
                        {order.createdAt.toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-500">
                        {order.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-4 px-4 md:px-6">
                      <div className="text-sm text-white">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                      </div>
                      <div className="text-xs text-slate-400">
                        {formatPKR(order.totalAmount)}
                      </div>
                    </td>
                    <td className="py-4 px-4 md:px-6 font-medium text-white">
                      {formatPKR(order.totalAmount)}
                    </td>
                    <td className="py-4 px-4 md:px-6">
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="text-sm bg-slate-800/50 border border-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500 text-white"
                        >
                          <option value={order.status} className="bg-slate-800">
                            Update Status
                          </option>
                          {getStatusOptions(order.status).map(status => (
                            <option key={status} value={status} className="bg-slate-800">
                              Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="py-4 px-4 md:px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-600/20 to-blue-500/20 text-blue-300 hover:text-blue-200 rounded-lg transition-all border border-blue-500/30 text-sm"
                        >
                          <Eye size={14} />
                          View
                        </button>
                        <button 
                          onClick={() => generateInvoice(order)}
                          className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-slate-800/20 to-slate-900/20 text-slate-300 hover:text-amber-300 rounded-lg transition-all border border-slate-700 text-sm hover:border-amber-500/30"
                        >
                          <FileText size={14} />
                          Invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-full flex items-center justify-center border border-slate-700">
                <Package size={48} className="text-slate-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No orders found</h3>
              <p className="text-slate-400 mb-6">Try adjusting your search or filters</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="px-6 py-2 bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl hover:border-amber-500/30 transition-all text-slate-300 hover:text-white"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {filteredOrders.length > 0 && (
            <div className="px-4 md:px-6 py-4 border-t border-slate-800">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-slate-400">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length} orders
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl hover:border-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 hover:text-white"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`w-10 h-10 rounded-xl ${
                        currentPage === number
                          ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white'
                          : 'bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700 text-slate-300 hover:text-white hover:border-amber-500/30'
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl hover:border-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 hover:text-white"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm">
            <h3 className="font-medium mb-4 text-white">Revenue Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Revenue</span>
                <span className="font-bold text-white">
                  {formatPKR(totalRevenuePKR)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Avg. Order Value</span>
                <span className="font-bold text-white">
                  {formatPKR(avgOrderValuePKR)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Orders</span>
                <span className="font-bold text-white">{orders.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm">
            <h3 className="font-medium mb-4 text-white">Status Distribution</h3>
            <div className="space-y-2">
              {statusOptions.slice(1).map(status => {
                const count = orders.filter(o => o.status === status.id).length;
                const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;
                const color = status.id === 'pending' ? 'bg-amber-500' :
                            status.id === 'processing' ? 'bg-blue-500' :
                            status.id === 'shipped' ? 'bg-indigo-500' :
                            status.id === 'delivered' ? 'bg-emerald-500' : 'bg-red-500';
                
                return (
                  <div key={status.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">{status.name}</span>
                      <span className="text-white">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 backdrop-blur-sm">
            <h3 className="font-medium mb-4 text-white">Recent Activity</h3>
            <div className="space-y-3">
              {orders.slice(0, 3).map(order => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-slate-500">
                      {order.userName} • {order.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {showOrderDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Order Details</h3>
                <p className="text-slate-400">Order #{selectedOrder.id.toUpperCase()}</p>
              </div>
              <button
                onClick={() => {
                  setShowOrderDetailModal(false);
                  setSelectedOrder(null);
                }}
                className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 rounded-xl border border-slate-700">
                  <p className="text-sm text-slate-400">Order Date</p>
                  <p className="font-medium text-white">{formatDateTime(selectedOrder.createdAt)}</p>
                </div>
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 rounded-xl border border-slate-700">
                  <p className="text-sm text-slate-400">Status</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 rounded-xl border border-slate-700">
                  <p className="text-sm text-slate-400">Total Amount</p>
                  <p className="text-xl font-bold text-amber-400">{formatPKRWithDecimals(selectedOrder.totalAmount)}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-white">Customer Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-slate-500" />
                      <p className="text-slate-300">{selectedOrder.userName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-slate-500" />
                      <p className="text-slate-300">{selectedOrder.userEmail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-slate-500" />
                      <p className="text-slate-300">{selectedOrder.shippingAddress.phone}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3 text-white">Shipping Address</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-slate-500" />
                      <p className="text-slate-300">{selectedOrder.shippingAddress.street}</p>
                    </div>
                    <p className="text-slate-300">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</p>
                    <p className="text-slate-300">{selectedOrder.shippingAddress.country}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-3 text-white">Order Items</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-slate-800 to-slate-900">
                      <tr>
                        <th className="py-2 px-4 text-left text-slate-400">Product</th>
                        <th className="py-2 px-4 text-left text-slate-400">Price</th>
                        <th className="py-2 px-4 text-left text-slate-400">Quantity</th>
                        <th className="py-2 px-4 text-left text-slate-400">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-800">
                          <td className="py-3 px-4">
                            <div className="font-medium text-white">{item.name}</div>
                            <div className="text-sm text-slate-500">Size: {item.size} | Color: {item.color}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-300">{formatPKRWithDecimals(item.price)}</td>
                          <td className="py-3 px-4 text-slate-300">{item.quantity}</td>
                          <td className="py-3 px-4 text-slate-300">{formatPKRWithDecimals(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 rounded-xl border border-slate-700">
                <h4 className="font-medium mb-4 text-white">Payment Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-slate-300">{formatPKRWithDecimals(selectedOrder.subtotal || selectedOrder.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Shipping</span>
                    <span className="text-slate-300">{formatPKRWithDecimals(selectedOrder.shippingCost || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tax</span>
                    <span className="text-slate-300">{formatPKRWithDecimals(selectedOrder.tax || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-700 pt-2 font-bold text-lg">
                    <span className="text-white">Total</span>
                    <span className="text-amber-400">{formatPKRWithDecimals(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard size={16} className="text-slate-500" />
                    <p className="text-slate-300"><span className="text-slate-500">Payment Method:</span> {selectedOrder.paymentMethod}</p>
                  </div>
                  <p className="text-slate-300"><span className="text-slate-500">Payment Status:</span> {selectedOrder.paymentStatus}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowOrderDetailModal(false);
                    generateInvoice(selectedOrder);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl hover:from-amber-700 hover:to-amber-600 transition-all shadow-lg"
                >
                  <FileText size={18} />
                  Generate Invoice
                </button>
                <button
                  onClick={() => setShowOrderDetailModal(false)}
                  className="px-4 py-2 bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl hover:border-amber-500/30 transition-all text-slate-300 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Generation Modal */}
      {showInvoiceModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <FileText className="text-emerald-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Generate Invoice</h3>
                <p className="text-sm text-slate-400">Download invoice for Order #{selectedOrder.id.toUpperCase()}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700">
                <p className="font-medium mb-2 text-white">Order Summary</p>
                <div className="space-y-1 text-sm text-slate-300">
                  <p><span className="text-slate-500">Customer:</span> {selectedOrder.userName}</p>
                  <p><span className="text-slate-500">Date:</span> {selectedOrder.createdAt.toLocaleDateString()}</p>
                  <p><span className="text-slate-500">Items:</span> {selectedOrder.items.length} products</p>
                  <p><span className="text-slate-500">Total:</span> {formatPKRWithDecimals(selectedOrder.totalAmount)}</p>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-900/20 to-blue-800/20 rounded-xl border border-blue-700/50">
                <p className="text-blue-300 font-medium mb-2">📝 Invoice Preview</p>
                <p className="text-sm text-blue-400/80">
                  The invoice will include all order details, customer information, 
                  itemized list, and total amount in PKR format.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2 bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl hover:border-amber-500/30 transition-all text-slate-300 hover:text-white disabled:opacity-50"
                disabled={generatingInvoice}
              >
                Cancel
              </button>
              <button
                onClick={() => downloadInvoice(selectedOrder)}
                disabled={generatingInvoice}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg disabled:opacity-50"
              >
                {generatingInvoice ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Download Invoice PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-800/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}