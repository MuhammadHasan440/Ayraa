'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Truck, Shield, RefreshCw } from 'lucide-react';
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
        const productsQuery = query(productsRef, limit(8));
        const snapshot = await getDocs(productsQuery);
        
        const products = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        
        setFeaturedProducts(products.slice(0, 4));
        setNewArrivals(products.filter(p => p.isNewArrival).slice(0, 4));
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const features = [
    {
      icon: <Truck className="w-8 h-8" />,
      title: 'Free Shipping',
      description: 'On orders over Rs:5000',
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Secure Payment',
      description: '100% secure transactions',
    },
    {
      icon: <RefreshCw className="w-8 h-8" />,
      title: 'Easy Returns',
      description: '30-day return policy',
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'Premium Quality',
      description: 'Carefully crafted designs',
    },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative h-[600px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-50 to-pink-50">
          <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5" />
        </div>
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-100 text-rose-700 text-sm font-medium mb-4">
              <Sparkles size={16} />
              New Collection 2024
            </span>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Elegant Style
              <span className="block text-rose-700">For Modern Women</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-lg">
              Discover our curated collection of premium women's clothing, blending traditional elegance with contemporary fashion.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-8 py-3 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors font-medium"
              >
                Shop Now
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/products?category=traditional"
                className="inline-flex items-center gap-2 px-8 py-3 border-2 border-rose-600 text-rose-600 rounded-full hover:bg-rose-50 transition-colors font-medium"
              >
                Traditional Wear
              </Link>
            </div>
          </motion.div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden lg:block">
          <div className="relative h-full">
            <div className="absolute inset-0 bg-gradient-to-l from-white to-transparent" />
            <Image
              src="/hero-model.jpg"
              alt="AYRAA Model"
              fill
              className="object-cover object-center"
              priority
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 text-rose-600 mb-4">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
            <p className="text-gray-600">Handpicked collection for you</p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 font-medium"
          >
            View All
            <ArrowRight size={20} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-80 rounded-lg"></div>
                <div className="h-4 bg-gray-200 rounded mt-4"></div>
                <div className="h-4 bg-gray-200 rounded mt-2 w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* New Arrivals */}
      <section className="bg-gradient-to-r from-rose-50 to-pink-50 py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="text-rose-600" />
            <h2 className="text-3xl font-bold text-gray-900">New Arrivals</h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-80 rounded-lg"></div>
                  <div className="h-4 bg-gray-200 rounded mt-4"></div>
                  <div className="h-4 bg-gray-200 rounded mt-2 w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newArrivals.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              href="/products?new=true"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white border-2 border-rose-600 text-rose-600 rounded-full hover:bg-rose-50 transition-colors font-medium"
            >
              View All New Arrivals
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Shop By Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative h-96 rounded-2xl overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
            <div className="absolute inset-0 bg-[url('/traditional-bg.jpg')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-20 h-full flex flex-col justify-end p-8">
              <h3 className="text-4xl font-bold text-white mb-4">Traditional Wear</h3>
              <p className="text-white/90 mb-6 max-w-md">
                Elegant traditional outfits with modern touches
              </p>
              <Link
                href="/products?category=traditional"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-rose-700 rounded-full hover:bg-rose-50 transition-colors font-medium w-fit"
              >
                Explore Collection
                <ArrowRight size={20} />
              </Link>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative h-96 rounded-2xl overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
            <div className="absolute inset-0 bg-[url('/casual-bg.jpg')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-20 h-full flex flex-col justify-end p-8">
              <h3 className="text-4xl font-bold text-white mb-4">Casual Wear</h3>
              <p className="text-white/90 mb-6 max-w-md">
                Comfortable and stylish everyday wear
              </p>
              <Link
                href="/products?category=casual"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-rose-700 rounded-full hover:bg-rose-50 transition-colors font-medium w-fit"
              >
                Explore Collection
                <ArrowRight size={20} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}