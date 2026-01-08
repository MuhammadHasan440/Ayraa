'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Sparkles, 
  Truck, 
  Shield, 
  RefreshCw, 
  Clock, 
  Shirt, 
  Gem, 
  Crown,
  Watch, 
  Footprints, 
  Scissors,
  ChevronRight,
  Star,
  Zap
} from 'lucide-react';
import ProductCard from '../components/products/productCard';
import { Product } from '@/types';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsRef = collection(db, 'products');
        const productsQuery = query(productsRef, limit(12));
        const snapshot = await getDocs(productsQuery);
        
        const products = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        
        setFeaturedProducts(products.slice(0, 6));
        setNewArrivals(products.filter(p => p.isNewArrival).slice(0, 6));
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // NEW COLOR THEME: Deep Navy + Gold + White + Teal accents
  const features = [
    {
      icon: <Truck className="w-6 h-6 md:w-8 md:h-8" />,
      title: 'Free Shipping',
      description: 'Over Rs:10,000',
      color: 'bg-teal-50 border-teal-100',
      iconColor: 'text-teal-600'
    },
    {
      icon: <Shield className="w-6 h-6 md:w-8 md:h-8" />,
      title: 'Secure Payment',
      description: '100% Secure',
      color: 'bg-blue-50 border-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      icon: <RefreshCw className="w-6 h-6 md:w-8 md:h-8" />,
      title: 'Easy Returns',
      description: '30-Day Policy',
      color: 'bg-amber-50 border-amber-100',
      iconColor: 'text-amber-600'
    },
    {
      icon: <Zap className="w-6 h-6 md:w-8 md:h-8" />,
      title: 'Fast Delivery',
      description: '2-3 Days',
      color: 'bg-rose-50 border-rose-100',
      iconColor: 'text-rose-600'
    },
    {
      icon: <Star className="w-6 h-6 md:w-8 md:h-8" />,
      title: 'Premium Quality',
      description: 'Luxury Materials',
      color: 'bg-violet-50 border-violet-100',
      iconColor: 'text-violet-600'
    }
  ];

  // Updated categories with new color scheme
  const categories = [
    {
      id: 'traditional',
      name: 'Traditional Wear',
      description: 'Elegant ethnic & bridal collections',
      icon: <Crown className="w-8 h-8 md:w-10 md:h-10" />,
      gradient: 'from-amber-600 to-amber-700',
      bg: 'bg-gradient-to-br from-amber-50 to-amber-100',
      href: '/products?category=traditional'
    },
    {
      id: 'party',
      name: 'Party Wear',
      description: 'Glamorous occasion outfits',
      icon: <Gem className="w-8 h-8 md:w-10 md:h-10" />,
      gradient: 'from-purple-600 to-violet-700',
      bg: 'bg-gradient-to-br from-purple-50 to-violet-100',
      href: '/products?category=party'
    },
    {
      id: 'casual',
      name: 'Casual Wear',
      description: 'Everyday comfortable fashion',
      icon: <Shirt className="w-8 h-8 md:w-10 md:h-10" />,
      gradient: 'from-teal-600 to-emerald-700',
      bg: 'bg-gradient-to-br from-teal-50 to-emerald-100',
      href: '/products?category=casual'
    },
    {
      id: 'watches',
      name: 'Luxury Watches',
      description: 'Men & Women designer watches',
      icon: <Watch className="w-8 h-8 md:w-10 md:h-10" />,
      gradient: 'from-slate-700 to-slate-900',
      bg: 'bg-gradient-to-br from-slate-100 to-slate-200',
      href: '/products?category=watches'
    },
    {
      id: 'perfumes',
      name: 'Designer Perfumes',
      description: 'Signature fragrances collection',
      icon: <Scissors className="w-8 h-8 md:w-10 md:h-10" />,
      gradient: 'from-rose-600 to-pink-700',
      bg: 'bg-gradient-to-br from-rose-50 to-pink-100',
      href: '/products?category=perfumes'
    },
    {
      id: 'shoes',
      name: "Men's Shoes",
      description: 'Premium footwear collection',
      icon: <Footprints className="w-8 h-8 md:w-10 md:h-10" />,
      gradient: 'from-blue-600 to-cyan-700',
      bg: 'bg-gradient-to-br from-blue-50 to-cyan-100',
      href: '/products?category=shoes'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Modern & Responsive */}
      <section className="relative min-h-[85vh] md:min-h-[90vh] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-amber-50">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-r from-amber-200/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-l from-slate-200/30 to-transparent rounded-full blur-3xl" />

        <div className="relative container mx-auto px-4 md:px-6 h-full flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center w-full">
            {/* Content - Left Column */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-700 text-sm md:text-base font-medium mb-6 md:mb-8"
              >
                <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                <span>Premium Fashion Collection 2026</span>
              </motion.div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 mb-4 md:mb-6 leading-tight">
                <span className="block">Redefining</span>
                <span className="block">
                  <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 bg-clip-text text-transparent">
                    Luxury Fashion
                  </span>
                </span>
              </h1>

              <p className="text-lg md:text-xl text-slate-600 mb-8 md:mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Experience curated elegance across traditional wear, party outfits, 
                luxury watches, signature perfumes, and premium footwear.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/products"
                  className="group inline-flex items-center justify-center gap-3 px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-full hover:shadow-xl hover:shadow-slate-200 transition-all duration-300 font-medium text-base md:text-lg"
                >
                  <span>Shop All Collections</span>
                  <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/products?category=new"
                  className="group inline-flex items-center justify-center gap-3 px-6 py-3 md:px-8 md:py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-full hover:border-amber-500 hover:text-amber-600 transition-all duration-300 font-medium text-base md:text-lg"
                >
                  <Zap className="w-4 h-4 md:w-5 md:h-5" />
                  <span>View New Arrivals</span>
                </Link>
              </div>

              {/* Mobile Hero Image for small screens */}
              <div className="mt-8 lg:hidden">
                <div className="relative h-64 md:h-80 w-full rounded-2xl overflow-hidden">
                  <Image
                    src="/images/ayra-model.jpg"
                    alt="AYRAA Luxury Fashion"
                    fill
                    className="object-cover"
                    priority
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              </div>
            </motion.div>

            {/* Hero Image - Right Column (Desktop) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block relative h-[500px] xl:h-[600px] rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/10 to-amber-900/5 z-10" />
              <Image
                src="/images/ayra-model.jpg"
                alt="AYRAA Luxury Fashion"
                fill
                className="object-cover object-center"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {/* Decorative Frame */}
              <div className="absolute inset-8 border-2 border-white/20 rounded-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Features - Responsive Grid */}
      <section className="py-8 md:py-12 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`${feature.color} p-4 md:p-6 rounded-xl border hover:shadow-md transition-all duration-300 text-center`}
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg mb-3 md:mb-4 ${feature.iconColor} bg-white`}>
                  {feature.icon}
                </div>
                <h3 className="font-bold text-sm md:text-base mb-1 text-slate-800">{feature.title}</h3>
                <p className="text-xs md:text-sm text-slate-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Grid - Responsive */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 md:mb-4">
              Explore Collections
            </h2>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto px-4">
              Discover premium fashion across all categories
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Link
                  href={category.href}
                  className={`block ${category.bg} p-6 md:p-8 rounded-2xl hover:shadow-xl transition-all duration-300 h-full`}
                >
                  <div className="flex items-start justify-between mb-4 md:mb-6">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${category.gradient} text-white`}>
                      {category.icon}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>

                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2 md:mb-3">
                    {category.name}
                  </h3>

                  <p className="text-sm md:text-base text-slate-600 mb-4 md:mb-6">
                    {category.description}
                  </p>

                  <div className="flex items-center text-sm md:text-base font-medium text-slate-700 group-hover:text-slate-900">
                    <span>Shop Now</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products - Responsive */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12">
            <div className="mb-6 md:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                Featured Products
              </h2>
              <p className="text-base md:text-lg text-slate-600">
                Handpicked luxury from all collections
              </p>
            </div>
            <Link
              href="/products"
              className="group inline-flex items-center justify-center md:justify-start gap-2 px-6 py-3 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-medium text-base md:text-lg w-fit"
            >
              <span>View All</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-slate-200 h-48 md:h-64 rounded-xl"></div>
                  <div className="h-4 bg-slate-200 rounded mt-3 md:mt-4"></div>
                  <div className="h-3 bg-slate-200 rounded mt-2 w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="transform-gpu" // GPU acceleration for smooth animations
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals - Responsive */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12">
            <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-0">
              <div className="p-2 md:p-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                  New Arrivals
                </h2>
                <p className="text-base md:text-lg text-slate-600">
                  Fresh styles just added
                </p>
              </div>
            </div>

            <Link
              href="/products?new=true"
              className="group inline-flex items-center justify-center md:justify-start gap-2 px-6 py-3 rounded-full border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-all duration-300 font-medium text-base md:text-lg w-fit"
            >
              <span>View All New</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-slate-200 h-48 md:h-64 rounded-xl"></div>
                  <div className="h-4 bg-slate-200 rounded mt-3 md:mt-4"></div>
                  <div className="h-3 bg-slate-200 rounded mt-2 w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
              {newArrivals.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="transform-gpu"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}

          {/* Category Highlights - Responsive */}
          <div className="mt-12 md:mt-20 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Traditional Wear Showcase */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="relative h-64 md:h-80 lg:h-96 rounded-2xl md:rounded-3xl overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent z-10" />
              <div 
                className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                style={{ backgroundImage: "url('/traditional-showcase.jpg')" }}
              />
              <div className="relative z-20 h-full flex flex-col justify-end p-6 md:p-10">
                <span className="text-amber-300 text-sm md:text-base font-medium mb-2">
                  Premium Collection
                </span>
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 md:mb-4">
                  Traditional Elegance
                </h3>
                <p className="text-white/80 text-sm md:text-base mb-4 md:mb-6 max-w-md">
                  Exquisite ethnic wear with intricate embroidery
                </p>
                <Link
                  href="/products?category=traditional"
                  className="inline-flex items-center gap-2 md:gap-3 px-5 py-2.5 md:px-8 md:py-4 bg-white text-slate-900 rounded-full hover:bg-amber-50 transition-all duration-300 font-medium text-sm md:text-base w-fit group/btn"
                >
                  <span>Explore Collection</span>
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* Accessories Showcase */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="relative h-64 md:h-80 lg:h-96 rounded-2xl md:rounded-3xl overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent z-10" />
              <div 
                className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                style={{ backgroundImage: "url('/accessories-showcase.jpg')" }}
              />
              <div className="relative z-20 h-full flex flex-col justify-end p-6 md:p-10">
                <span className="text-teal-300 text-sm md:text-base font-medium mb-2">
                  Luxury Accessories
                </span>
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 md:mb-4">
                  Complete Your Style
                </h3>
                <p className="text-white/80 text-sm md:text-base mb-4 md:mb-6 max-w-md">
                  Watches, perfumes & premium footwear
                </p>
                <Link
                  href="/products?category=watches"
                  className="inline-flex items-center gap-2 md:gap-3 px-5 py-2.5 md:px-8 md:py-4 bg-white text-slate-900 rounded-full hover:bg-teal-50 transition-all duration-300 font-medium text-sm md:text-base w-fit group/btn"
                >
                  <span>Shop Accessories</span>
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}