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
  Check
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { collection, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Order } from '@/types';
import { 
  Users, 
  DollarSign, 
  TrendingUp,
  ShoppingBag,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatPKR, formatPKRWithDecimals } from '@/lib/utils/currency'; // Import your currency formatter

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

  // Function to view order details
  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetailModal(true);
  };

  // Function to generate invoice
  const generateInvoice = (order: Order) => {
    setSelectedOrder(order);
    setShowInvoiceModal(true);
  };

  // Function to download invoice as PDF
  const downloadInvoice = async (order: Order) => {
    try {
      setGeneratingInvoice(true);
      
      // Create a temporary div to render the invoice
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
          <h1 style="color: #e11d48; font-size: 32px; margin: 0;">AYRAA</h1>
          <p style="color: #666; margin: 5px 0;">Luxury Fashion & Accessories</p>
          <p style="color: #666; margin: 5px 0;">Karachi, Pakistan</p>
          <p style="color: #666; margin: 5px 0;">Phone: +92 300 1234567</p>
          <p style="color: #666; margin: 5px 0;">Email: support@ayraa.com</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #e11d48; padding-bottom: 20px;">
          <div>
            <h2 style="font-size: 28px; color: #e11d48; margin: 0 0 10px 0;">INVOICE</h2>
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
            <h3 style="color: #e11d48; margin-bottom: 10px;">Bill To:</h3>
            <p style="margin: 5px 0;"><strong>${order.userName}</strong></p>
            <p style="margin: 5px 0;">${order.userEmail}</p>
            <p style="margin: 5px 0;">${order.shippingAddress.phone}</p>
          </div>
          <div>
            <h3 style="color: #e11d48; margin-bottom: 10px;">Ship To:</h3>
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
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; border-top: 2px solid #e11d48; padding-top: 10px;">
            <span>Total:</span>
            <span>${formatPKRWithDecimals(order.totalAmount)}</span>
          </div>
        </div>
        
        <div style="border-top: 2px solid #e11d48; padding-top: 20px; margin-bottom: 40px;">
          <h3 style="color: #e11d48; margin-bottom: 10px;">Payment Information:</h3>
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
      
      // Generate PDF
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
      
      // Clean up
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
        return <Clock className="text-yellow-500" size={16} />;
      case 'processing':
        return <Package className="text-blue-500" size={16} />;
      case 'shipped':
        return <Truck className="text-indigo-500" size={16} />;
      case 'delivered':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'cancelled':
        return <XCircle className="text-red-500" size={16} />;
      default:
        return <Clock className="text-gray-500" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  // Format date time
  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPageOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 ml-64 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
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

  // Calculate total revenue in PKR
  const totalRevenuePKR = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const avgOrderValuePKR = orders.length > 0 ? totalRevenuePKR / orders.length : 0;

  return (
    <div className="min-h-screen bg-gray-50 ml-64">
      {/* Sidebar */}
      <aside className="fixed left-0 top-5 bottom-0 w-64 bg-white border-r">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-rose-700">AYRAA Admin</h1>
        </div>
        <nav className="p-4 space-y-1">
          {[
            { name: 'Dashboard', href: '/admin/dashboard', icon: <TrendingUp size={20} /> },
            { name: 'Products', href: '/admin/products', icon: <Package size={20} /> },
            { name: 'Orders', href: '/admin/orders', icon: <ShoppingBag size={20} /> },
            { name: 'Users', href: '/admin/users', icon: <Users size={20} /> },
            { name: 'Analytics', href: '/admin/analytics', icon: <DollarSign size={20} /> },
          ].map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-rose-50 hover:text-rose-700 transition-colors"
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="p-8">
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

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Order Management</h1>
            <p className="text-gray-600">View and manage customer orders</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
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
            
            return (
              <div
                key={status.id}
                className={`bg-white rounded-xl shadow-sm border p-4 cursor-pointer transition-all ${
                  statusFilter === status.id ? 'ring-2 ring-rose-500' : ''
                }`}
                onClick={() => setStatusFilter(status.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{status.name}</p>
                    <p className="text-2xl font-bold mt-2">{statusOrders.length}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatPKR(revenuePKR)}
                    </p>
                  </div>
                  <div className={`p-2 rounded-full ${status.id !== 'all' ? getStatusColor(status.id) : 'bg-gray-100'}`}>
                    {status.id !== 'all' ? getStatusIcon(status.id) : <Package className="text-gray-600" size={20} />}
                  </div>
                </div>
              </div>
            );
          })}
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
                  placeholder="Search orders by customer, email, or order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Date Filter */}
            <div className="w-full md:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 appearance-none">
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
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
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
                    Items
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total (PKR)
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentPageOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="font-mono text-sm font-medium">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.paymentMethod}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium">{order.userName}</p>
                        <p className="text-sm text-gray-600">{order.userEmail}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {order.shippingAddress.city}, {order.shippingAddress.country}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm">
                        {order.createdAt.toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatPKR(order.totalAmount)}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium">
                      {formatPKR(order.totalAmount)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="text-sm border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        >
                          <option value={order.status}>
                            Update Status
                          </option>
                          {getStatusOptions(order.status).map(status => (
                            <option key={status} value={status}>
                              Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                        >
                          <Eye size={14} />
                          View
                        </button>
                        <button 
                          onClick={() => generateInvoice(order)}
                          className="flex items-center gap-1 px-3 py-1 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors text-sm"
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
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Package size={48} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No orders found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {filteredOrders.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length} orders
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

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-medium mb-4">Revenue Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Revenue</span>
                <span className="font-bold">
                  {formatPKR(totalRevenuePKR)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg. Order Value</span>
                <span className="font-bold">
                  {formatPKR(avgOrderValuePKR)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Orders</span>
                <span className="font-bold">{orders.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-medium mb-4">Status Distribution</h3>
            <div className="space-y-2">
              {statusOptions.slice(1).map(status => {
                const count = orders.filter(o => o.status === status.id).length;
                const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;
                
                return (
                  <div key={status.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{status.name}</span>
                      <span>{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getStatusColor(status.id).split(' ')[0]}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-medium mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {orders.slice(0, 3).map(order => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-gray-500">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold">Order Details</h3>
                <p className="text-gray-600">Order #{selectedOrder.id.toUpperCase()}</p>
              </div>
              <button
                onClick={() => {
                  setShowOrderDetailModal(false);
                  setSelectedOrder(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="font-medium">{formatDateTime(selectedOrder.createdAt)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-xl font-bold text-rose-700">{formatPKRWithDecimals(selectedOrder.totalAmount)}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-gray-900">Customer Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <p>{selectedOrder.userName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-400" />
                      <p>{selectedOrder.userEmail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-400" />
                      <p>{selectedOrder.shippingAddress.phone}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3 text-gray-900">Shipping Address</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-gray-400" />
                      <p>{selectedOrder.shippingAddress.street}</p>
                    </div>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-3 text-gray-900">Order Items</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 px-4 text-left">Product</th>
                        <th className="py-2 px-4 text-left">Price</th>
                        <th className="py-2 px-4 text-left">Quantity</th>
                        <th className="py-2 px-4 text-left">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-3 px-4">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-600">Size: {item.size} | Color: {item.color}</div>
                          </td>
                          <td className="py-3 px-4">{formatPKRWithDecimals(item.price)}</td>
                          <td className="py-3 px-4">{item.quantity}</td>
                          <td className="py-3 px-4">{formatPKRWithDecimals(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="font-medium mb-4 text-gray-900">Payment Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatPKRWithDecimals(selectedOrder.subtotal || selectedOrder.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>{formatPKRWithDecimals(selectedOrder.shippingCost || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span>{formatPKRWithDecimals(selectedOrder.tax || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold text-lg">
                    <span>Total</span>
                    <span>{formatPKRWithDecimals(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard size={16} className="text-gray-400" />
                    <p><span className="text-gray-600">Payment Method:</span> {selectedOrder.paymentMethod}</p>
                  </div>
                  <p><span className="text-gray-600">Payment Status:</span> {selectedOrder.paymentStatus}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowOrderDetailModal(false);
                    generateInvoice(selectedOrder);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                >
                  <FileText size={18} />
                  Generate Invoice
                </button>
                <button
                  onClick={() => setShowOrderDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <FileText className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Generate Invoice</h3>
                <p className="text-sm text-gray-600">Download invoice for Order #{selectedOrder.id.toUpperCase()}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium mb-2">Order Summary</p>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">Customer:</span> {selectedOrder.userName}</p>
                  <p><span className="text-gray-600">Date:</span> {selectedOrder.createdAt.toLocaleDateString()}</p>
                  <p><span className="text-gray-600">Items:</span> {selectedOrder.items.length} products</p>
                  <p><span className="text-gray-600">Total:</span> {formatPKRWithDecimals(selectedOrder.totalAmount)}</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-700 font-medium mb-2">📝 Invoice Preview</p>
                <p className="text-sm text-blue-600">
                  The invoice will include all order details, customer information, 
                  itemized list, and total amount in PKR format.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={generatingInvoice}
              >
                Cancel
              </button>
              <button
                onClick={() => downloadInvoice(selectedOrder)}
                disabled={generatingInvoice}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
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
    </div>
  );
}