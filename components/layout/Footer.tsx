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
} from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  const footerLinks = {
    Shop: [
      { name: 'Traditional Wear', href: '/products?category=traditional' },
      { name: 'Casual Wear', href: '/products?category=casual' },
      { name: 'New Arrivals', href: '/products?new=true' },
      { name: 'Best Sellers', href: '/products?sort=popular' },
      { name: 'Sale', href: '/products?sale=true' },
    ],
    Company: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press', href: '/press' },
      { name: 'Sustainability', href: '/sustainability' },
      { name: 'Blog', href: '/blog' },
    ],
    Support: [
      { name: 'Contact Us', href: '/contact' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Shipping & Returns', href: '/shipping' },
      { name: 'Size Guide', href: '/size-guide' },
      { name: 'Privacy Policy', href: '/privacy' },
    ],
    Legal: [
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'Accessibility', href: '/accessibility' },
      { name: 'Sitemap', href: '/sitemap' },
    ],
  };

  const features = [
    {
      icon: <Truck className="w-6 h-6" />,
      title: 'Free Shipping',
      description: 'On orders over $100',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: '30-Day Returns',
      description: 'Easy & free returns',
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: 'Secure Payment',
      description: '100% secure transactions',
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: '24/7 Support',
      description: 'Dedicated customer service',
    },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Stay in the Loop</h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Subscribe to get special offers, free giveaways, and exclusive updates.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
              >
                Subscribe
              </button>
            </form>
            <p className="text-sm text-gray-500 mt-4">
              By subscribing, you agree to our Privacy Policy and consent to receive updates.
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="text-3xl font-bold text-rose-500 mb-4 inline-block">
              AYRAA
            </Link>
            <p className="text-gray-400 mb-6 max-w-md">
              Discover elegance in every stitch. AYRAA offers premium women's clothing that blends traditional craftsmanship with contemporary style.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-4 mb-6">
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
                aria-label="YouTube"
              >
                <Youtube size={20} />
              </a>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-400">
                <Phone size={18} />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Mail size={18} />
                <span>support@ayraa.com</span>
              </div>
              <div className="flex items-start gap-3 text-gray-400">
                <MapPin size={18} className="mt-1" />
                <span>123 Fashion Street, Suite 100<br />New York, NY 10001</span>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Features Bar */}
      <div className="bg-gray-800 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-rose-600 rounded-full flex items-center justify-center flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-medium">{feature.title}</h4>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} AYRAA. All rights reserved.
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/cookies" className="hover:text-white transition-colors">
                Cookies
              </Link>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Made with</span>
              <Heart size={14} className="text-rose-500 fill-rose-500" />
              <span>for fashion lovers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-black py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm">
              We accept all major payment methods
            </div>
            <div className="flex items-center gap-4">
              <div className="px-3 py-1 bg-white text-black text-xs font-medium rounded">Visa</div>
              <div className="px-3 py-1 bg-white text-black text-xs font-medium rounded">Mastercard</div>
              <div className="px-3 py-1 bg-white text-black text-xs font-medium rounded">PayPal</div>
              <div className="px-3 py-1 bg-white text-black text-xs font-medium rounded">Apple Pay</div>
              <div className="px-3 py-1 bg-white text-black text-xs font-medium rounded">Google Pay</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}