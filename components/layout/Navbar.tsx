'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  User, 
  Menu, 
  X, 
  Search,
  Home,
  Info,
  Phone,
  Shield
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { useCart } from '@/lib/context/CartContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, userData, signOutUser, isAdmin } = useAuth();
  const { state } = useCart();
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/', icon: <Home size={18} /> },
    { name: 'Shop', href: '/products', icon: <ShoppingBag size={18} /> },
    { name: 'Traditional', href: '/products?category=traditional' },
    { name: 'Casual', href: '/products?category=casual' },
    { name: 'New Arrivals', href: '/products?new=true' },
    { name: 'About', href: './about', icon: <Info size={18} /> },
    { name: 'Contact', href: '/contact', icon: <Phone size={18} /> },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="hidden md:flex justify-between items-center py-2 border-b text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>Free shipping on orders over Rs: 5000</span>
            <span className="hidden lg:inline">•</span>
            <span className="hidden lg:inline">30-day return policy</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span>Welcome, {userData?.name || user.email}</span>
                {isAdmin && (
                  <Link href="/admin/dashboard" className="flex items-center gap-1 hover:text-rose-600">
                    <Shield size={14} />
                    <span>Admin</span>
                  </Link>
                )}
                <button 
                  onClick={signOutUser}
                  className="hover:text-rose-600 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-rose-600 transition-colors">
                  Sign In
                </Link>
                <Link href="/signup" className="hover:text-rose-600 transition-colors">
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Main Navbar */}
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="text-3xl font-bold text-rose-700">
            AYRAA
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-1 transition-colors ${
                  pathname === item.href
                    ? 'text-rose-700 font-semibold'
                    : 'text-gray-700 hover:text-rose-600'
                }`}
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </form>

            {/* User & Cart */}
            <div className="flex items-center space-x-4">
              <Link 
                href={user ? '/account' : '/login'}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <User size={24} className="text-gray-700" />
              </Link>
              
              <Link 
                href="/cart" 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
              >
                <ShoppingBag size={24} className="text-gray-700" />
                {state.itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {state.itemCount}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-full"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t"
          >
            <div className="py-4 space-y-3">
              <form onSubmit={handleSearch} className="px-2">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </form>
              
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-2 py-2 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-rose-50 text-rose-700 font-semibold'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.name}</span>
                  </div>
                </Link>
              ))}
              
              <div className="pt-4 border-t">
                {user ? (
                  <div className="space-y-2 px-2">
                    <div className="text-sm text-gray-600">
                      Signed in as <span className="font-semibold">{user.email}</span>
                    </div>
                    {isAdmin && (
                      <Link
                        href="/admin/dashboard"
                        className="block py-2 text-rose-700 hover:bg-rose-50 rounded-lg"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        signOutUser();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 px-2">
                    <Link
                      href="/login"
                      className="py-2 text-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="py-2 text-center bg-rose-600 text-white hover:bg-rose-700 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;