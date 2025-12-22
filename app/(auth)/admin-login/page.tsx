'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export default function AdminLoginPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Check if user has admin role
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      if (userData.role !== 'admin') {
        await auth.signOut();
        throw new Error('Access denied. Admin privileges required.');
      }

      // Redirect to admin dashboard
      router.push('/admin/dashboard');
    } catch (error: any) {
      console.error('Admin login error:', error);
      setError(error.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Admin Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-600 rounded-full mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">AYRAA Admin</h1>
          <p className="text-gray-300 mt-2">Administrator Portal</p>
        </div>

        {/* Admin Login Card */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
              <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
              <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
            </div>
            <p className="text-sm text-center text-gray-400">
              Restricted access. Authorized personnel only.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg flex items-center gap-3">
              <AlertCircle className="text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent placeholder-gray-500"
                  placeholder="admin@ayraa.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent placeholder-gray-500"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <div className="flex items-start gap-3">
                <Shield size={16} className="text-rose-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-400">
                  This is a secure administrator portal. All activities are logged and monitored.
                  Unauthorized access attempts will be reported.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-600 text-white py-3 rounded-lg hover:bg-rose-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Authenticating...
                </>
              ) : (
                <>
                  Access Admin Dashboard
                  <Shield size={18} />
                </>
              )}
            </button>
          </form>

          {/* Back to Store */}
          <div className="mt-8 pt-6 border-t border-gray-700 text-center">
            <a
              href="/"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Store
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}