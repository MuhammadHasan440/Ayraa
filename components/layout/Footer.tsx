'use client';

import { motion } from 'framer-motion';
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Heart,
  Shield,
  Truck,
  CreditCard,
  Sparkles,
  Crown,
  Package,
  Clock,
  CheckCircle,
  CreditCard as CardIcon,
  Smartphone,
  HeadphonesIcon,
} from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  const footerLinks = {
    'Women\'s Wear': [
      { name: 'Traditional Wear', href: '/products?category=traditional' },
      { name: 'Party Wear', href: '/products?category=party' },
      { name: 'Casual Wear', href: '/products?category=casual' },
      { name: 'New Arrivals', href: '/products?new=true' },
      { name: 'Best Sellers', href: '/products?sort=popular' },
    ],
    'Accessories': [
      { name: 'Luxury Watches', href: '/products?category=watches' },
      { name: 'Designer Perfumes', href: '/products?category=perfumes' },
      { name: "Men's Shoes", href: '/products?category=shoes' },
      { name: 'Handbags', href: '/products?category=bags' },
      { name: 'Jewelry', href: '/products?category=jewelry' },
    ],
    'Support': [
      { name: 'Contact Us', href: '/contact' },
      { name: 'FAQ & Help Center', href: '/faq' },
      { name: 'Shipping & Delivery', href: '/shipping' },
      { name: 'Returns & Exchanges', href: '/returns' },
      { name: 'Size Guide', href: '/size-guide' },
    ],
    'Company': [
      { name: 'About AYRAA', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Sustainability', href: '/sustainability' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
    ],
  };

  const features = [
    {
      icon: <Truck className="w-5 h-5 md:w-6 md:h-6" />,
      title: 'Free Shipping',
      description: 'On orders over Rs: 10,000',
      color: 'text-teal-400',
      bg: 'bg-teal-900/30'
    },
    {
      icon: <Clock className="w-5 h-5 md:w-6 md:h-6" />,
      title: '30-Day Returns',
      description: 'Easy & free returns',
      color: 'text-amber-400',
      bg: 'bg-amber-900/30'
    },
    {
      icon: <Shield className="w-5 h-5 md:w-6 md:h-6" />,
      title: 'Secure Payment',
      description: '100% safe transactions',
      color: 'text-emerald-400',
      bg: 'bg-emerald-900/30'
    },
    {
      icon: <HeadphonesIcon className="w-5 h-5 md:w-6 md:h-6" />,
      title: '24/7 Support',
      description: 'Premium customer service',
      color: 'text-blue-400',
      bg: 'bg-blue-900/30'
    },
  ];

  const paymentMethods = ['Visa', 'Mastercard', 'American Express', 'PayPal', 'Apple Pay', 'Google Pay'];

  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      {/* Features Bar */}
      <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 py-8 border-y border-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors group"
              >
                <div className={`p-2 md:p-3 rounded-lg ${feature.bg} ${feature.color} group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-sm md:text-base">{feature.title}</h4>
                  <p className="text-xs md:text-sm text-slate-400">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-1.5 rounded-lg">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 bg-clip-text text-transparent">
                AYRAA
              </span>
            </div>
            
            <p className="text-slate-400 mb-6 max-w-md text-sm md:text-base leading-relaxed">
              Redefining luxury fashion with curated collections of traditional elegance, contemporary party wear, 
              and premium accessories for the modern individual.
            </p>
            
            {/* Newsletter */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 text-amber-200">Join Our Fashion Circle</h3>
              <form className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder-slate-500"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all font-medium"
                >
                  Subscribe
                </button>
              </form>
              <p className="text-xs text-slate-500 mt-2">
                Subscribe for exclusive offers, style tips, and new arrivals
              </p>
            </div>

            {/* Social Links */}
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3">Follow Our Style</h4>
              <div className="flex items-center gap-3">
                {[
                  { icon: <Instagram size={20} />, label: 'Instagram', color: 'hover:bg-pink-600/30' },
                  { icon: <Facebook size={20} />, label: 'Facebook', color: 'hover:bg-blue-600/30' },
                  { icon: <Twitter size={20} />, label: 'Twitter', color: 'hover:bg-sky-500/30' },
                  { icon: <Youtube size={20} />, label: 'YouTube', color: 'hover:bg-red-600/30' },
                ].map((social) => (
                  <a
                    key={social.label}
                    href="#"
                    className={`w-10 h-10 bg-slate-800/50 rounded-full flex items-center justify-center hover:scale-110 transition-all ${social.color}`}
                    aria-label={social.label}
                  >
                    <div className="text-slate-300 hover:text-white">
                      {social.icon}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-4 md:mb-6 text-amber-200">{category}</h3>
              <ul className="space-y-2 md:space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-slate-400 hover:text-amber-300 transition-colors text-sm md:text-base flex items-center gap-2 group"
                    >
                      <Sparkles className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span>{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact & Info */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-900/30 text-amber-400">
                <Phone size={20} />
              </div>
              <div>
                <h4 className="font-medium mb-1">Customer Support</h4>
                <p className="text-slate-400 text-sm">+92 300 1234567</p>
                <p className="text-slate-400 text-sm">Mon-Sun, 9AM-11PM PKT</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-900/30 text-emerald-400">
                <Mail size={20} />
              </div>
              <div>
                <h4 className="font-medium mb-1">Email Us</h4>
                <p className="text-slate-400 text-sm">support@ayraa.com</p>
                <p className="text-slate-400 text-sm">sales@ayraa.com</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-900/30 text-blue-400">
                <MapPin size={20} />
              </div>
              <div>
                <h4 className="font-medium mb-1">Visit Us</h4>
                <p className="text-slate-400 text-sm">AYRAA Fashion House</p>
                <p className="text-slate-400 text-sm">Lahore, Pakistan</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4 md:gap-6">
            {/* Copyright */}
            <div className="text-slate-500 text-sm text-center lg:text-left">
              © {new Date().getFullYear()} AYRAA Fashion House. All rights reserved.
            </div>
            
            {/* Legal Links */}
            <div className="flex items-center flex-wrap justify-center gap-4 text-sm">
              <Link 
                href="/terms" 
                className="text-slate-400 hover:text-amber-300 transition-colors hover:underline"
              >
                Terms of Service
              </Link>
              <span className="text-slate-700">•</span>
              <Link 
                href="/privacy" 
                className="text-slate-400 hover:text-amber-300 transition-colors hover:underline"
              >
                Privacy Policy
              </Link>
              <span className="text-slate-700">•</span>
              <Link 
                href="/cookies" 
                className="text-slate-400 hover:text-amber-300 transition-colors hover:underline"
              >
                Cookie Policy
              </Link>
              <span className="text-slate-700">•</span>
              <Link 
                href="/sitemap" 
                className="text-slate-400 hover:text-amber-300 transition-colors hover:underline"
              >
                Sitemap
              </Link>
            </div>
            
            {/* Made with Love */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Made with</span>
              <Heart size={14} className="text-rose-500 fill-rose-500 animate-pulse" />
              <span>in Pakistan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-slate-900/50 py-4 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <CardIcon size={16} />
              <span>Secure Payment Methods</span>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3">
              {paymentMethods.map((method) => (
                <div 
                  key={method}
                  className="px-3 py-1.5 bg-slate-800/50 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 hover:bg-slate-800 hover:border-slate-600 transition-colors"
                >
                  {method}
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle size={12} />
              <span>SSL Encrypted Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile App Badge */}
      <div className="bg-gradient-to-r from-slate-900/80 to-slate-950/80 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold mb-2 text-amber-200">Get the AYRAA App</h3>
              <p className="text-slate-400 text-sm">Shop on the go with exclusive app-only offers</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                <Smartphone size={18} />
                <span className="text-sm">Download App</span>
              </button>
              <div className="text-xs text-slate-500">
                Available on iOS & Android
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}