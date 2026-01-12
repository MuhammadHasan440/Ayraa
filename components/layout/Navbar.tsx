'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  User, 
  Menu, 
  X, 
  Search,
  Home,
  Package,
  Sparkles,
  Watch,
  Pipette,
  Footprints,
  Phone,
  Shield,
  ChevronDown,
  Crown,
  Gem,
  Shirt,
  LogOut,
  Settings,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { useCart } from '@/lib/context/CartContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const { user, userData, signOutUser, isAdmin } = useAuth();
  const { state } = useCart();
  const pathname = usePathname();

  // All categories with icons
  const categories = [
    {
      name: 'Traditional Wear',
      href: '/products?category=traditional',
      icon: <Crown size={16} />,
      color: 'text-amber-400'
    },
    {
      name: 'Party Wear',
      href: '/products?category=party',
      icon: <Gem size={16} />,
      color: 'text-purple-400'
    },
    {
      name: 'Casual Wear',
      href: '/products?category=casual',
      icon: <Shirt size={16} />,
      color: 'text-emerald-400'
    },
    {
      name: 'Luxury Watches',
      href: '/products?category=watches',
      icon: <Watch size={16} />,
      color: 'text-slate-300'
    },
    {
      name: 'Designer Perfumes',
      href: '/products?category=perfumes',
      icon: <Pipette size={16} />,
      color: 'text-rose-400'
    },
    {
      name: "Men's Shoes",
      href: '/products?category=shoes',
      icon: <Footprints size={16} />,
      color: 'text-blue-400'
    }
  ];

  const navItems = [
    { name: 'Home', href: '/', icon: <Home size={18} /> },
    { 
      name: 'Shop',
      href: '#',
      icon: <Package size={18} />,
      hasDropdown: true
    },
    { name: 'New Arrivals', href: '/products?new=true', icon: <Sparkles size={18} /> },
    { name: 'Contact', href: '/contact', icon: <Phone size={18} /> },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-lg">
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 text-sm md:text-base">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">Free shipping on orders over Rs: 10,000</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">30-day return policy</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Main Navbar */}
        <div className="flex items-center justify-between py-3 md:py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-1.5 rounded-lg">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 bg-clip-text text-transparent">
              AYRAA
            </span>
          </Link>

          {/* Desktop Navigation - Center */}
          <div className="hidden lg:flex items-center space-x-6">
            {navItems.map((item) => (
              <div key={item.name} className="relative">
                {item.hasDropdown ? (
                  <button
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-all duration-200 group"
                  >
                    {item.icon}
                    <span className="font-medium">{item.name}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 ${
                      pathname === item.href
                        ? 'bg-slate-700 text-amber-300 font-semibold'
                        : 'hover:bg-slate-700/50 hover:text-amber-200'
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )}

                {/* Categories Mega Menu */}
                {item.hasDropdown && isCategoryOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-0 top-full mt-2 w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      {categories.map((category) => (
                        <Link
                          key={category.name}
                          href={category.href}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors group"
                          onClick={() => setIsCategoryOpen(false)}
                        >
                          <div className={`p-2 rounded-lg bg-slate-700/50 ${category.color}`}>
                            {category.icon}
                          </div>
                          <div>
                            <div className="font-medium text-white">{category.name}</div>
                            <div className="text-sm text-slate-400">Shop now →</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3 md:space-x-4">
            {/* Search - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:block relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-48 lg:w-64 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-400"
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
            </form>

            {/* User & Cart */}
            <div className="flex items-center space-x-2 md:space-x-3">
              {/* User Menu (Desktop) */}
              {user ? (
                <div className="hidden md:flex items-center gap-2">
                  {/* Admin Dashboard Link - FIXED! */}
                  {isAdmin && (
                    <Link 
                      href="/admin/dashboard"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-900/30 hover:bg-emerald-800/50 transition-colors text-emerald-300 group"
                    >
                      <LayoutDashboard size={18} />
                      <span className="text-sm font-medium">Dashboard</span>
                    </Link>
                  )}
                  
                  {/* User Account Dropdown */}
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors">
                      <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                        <User size={16} />
                      </div>
                      <span className="text-sm font-medium max-w-[100px] truncate">
                        {userData?.name || user.email?.split('@')[0]}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="p-2">
                        <Link
                          href="/account"
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                        >
                          <Settings size={16} />
                          <span>My Account</span>
                        </Link>
                        
                        <Link
                          href="/account/orders"
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                        >
                          <Package size={16} />
                          <span>My Orders</span>
                        </Link>
                        
                        <button
                          onClick={signOutUser}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-red-900/30 transition-colors text-red-400"
                        >
                          <LogOut size={16} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Link 
                  href="/login"
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <User size={20} />
                  <span className="font-medium">Sign In</span>
                </Link>
              )}
              
              {/* Cart */}
              <Link 
                href="/cart" 
                className="p-2 rounded-full hover:bg-slate-700/50 transition-colors relative group"
              >
                <ShoppingBag size={22} className="text-slate-300 group-hover:text-amber-300" />
                {state.itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {state.itemCount}
                  </span>
                )}
              </Link>


              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 rounded-full hover:bg-slate-700/50 transition-colors"
              >
                {isMenuOpen ? (
                  <X size={24} className="text-slate-300" />
                ) : (
                  <Menu size={24} className="text-slate-300" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar - Shows when menu is open or on mobile */}
        <div className="lg:hidden py-3 border-t border-slate-700">
          <form onSubmit={handleSearch} className="px-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-white placeholder-slate-400"
              />
              <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            </div>
          </form>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden"
            >
              <div className="py-4 space-y-1 border-t border-slate-700">
                {/* Main Navigation */}
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.hasDropdown ? '#' : item.href}
                    onClick={(e) => {
                      if (item.hasDropdown) {
                        e.preventDefault();
                        setIsCategoryOpen(!isCategoryOpen);
                      } else {
                        setIsMenuOpen(false);
                      }
                    }}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                      pathname === item.href
                        ? 'bg-slate-700 text-amber-300 font-semibold'
                        : 'hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                    {item.hasDropdown && (
                      <ChevronDown className={`w-4 h-4 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                    )}
                  </Link>
                ))}

                {/* Categories Dropdown */}
                <AnimatePresence>
                  {isCategoryOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-8 space-y-1"
                    >
                      {categories.map((category) => (
                        <Link
                          key={category.name}
                          href={category.href}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-300"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsCategoryOpen(false);
                          }}
                        >
                          <div className={category.color}>
                            {category.icon}
                          </div>
                          <span>{category.name}</span>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Auth Section */}
                <div className="pt-4 mt-4 border-t border-slate-700">
                  {user ? (
                    <div className="space-y-2 px-4">
                      <div className="flex items-center gap-3 py-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                          <User size={16} />
                        </div>
                        <div>
                          <div className="font-medium">{userData?.name || user.email?.split('@')[0]}</div>
                          <div className="text-sm text-slate-400">Signed in</div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <Link
                          href="/account"
                          className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Settings size={16} />
                          <span>My Account</span>
                        </Link>
                        
                        <Link
                          href="/account"
                          className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Package size={16} />
                          <span>My Orders</span>
                        </Link>
                        
                        {/* Admin Dashboard Link in Mobile Menu */}
                        {isAdmin && (
                          <Link
                            href="/admin/dashboard"
                            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-emerald-900/30 transition-colors text-emerald-400"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <LayoutDashboard size={16} />
                            <span>Admin Dashboard</span>
                          </Link>
                        )}
                        
                        <button
                          onClick={() => {
                            signOutUser();
                            setIsMenuOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg hover:bg-red-900/30 transition-colors text-red-400"
                        >
                          <LogOut size={16} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 px-4">
                      <Link
                        href="/login"
                        className="py-3 text-center bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/signup"
                        className="py-3 text-center bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-lg transition-colors font-medium"
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
        </AnimatePresence>
      </div>

      {/* Desktop User Status Bar */}
      <div className="hidden md:block border-t border-slate-700">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-2 text-sm">
            <div className="flex items-center gap-4 text-slate-400">
              {user ? (
                <>
                  <span>Welcome back, <span className="text-amber-300 font-medium">{userData?.name || user.email}</span></span>
                  {isAdmin && (
                    <Link href="/admin/dashboard" className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300">
                      <LayoutDashboard size={12} />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <span>Welcome to AYRAA Luxury Fashion</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <button 
                  onClick={signOutUser}
                  className="flex items-center gap-1 text-slate-400 hover:text-red-400 transition-colors text-sm"
                >
                  <LogOut size={12} />
                  <span>Sign Out</span>
                </button>
              ) : (
                <>
                  <Link href="/login" className="text-slate-400 hover:text-amber-300 transition-colors">
                    Sign In
                  </Link>
                  <Link href="/signup" className="text-amber-400 hover:text-amber-300 transition-colors">
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 