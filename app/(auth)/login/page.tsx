'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, AlertCircle, User, Shield, Crown, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle, loading } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await signIn(formData.email, formData.password);
      router.push('/');
    } catch (error: any) {
      setError(error.message || 'Failed to sign in. Please check your credentials.');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithGoogle();
      router.push('/');
    } catch (error: any) {
      setError(error.message || 'Google sign-in failed.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 py-12 px-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-2 rounded-lg">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 bg-clip-text text-transparent">
              AYRAA
            </h1>
          </div>
          <p className="text-slate-400">Sign in to your luxury fashion account</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Sparkles size={14} className="text-amber-400" />
            <span className="text-sm text-amber-300">Premium Member Access</span>
            <Sparkles size={14} className="text-amber-400" />
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 shadow-2xl p-8 backdrop-blur-sm">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-800/30 rounded-xl flex items-center gap-3"
            >
              <AlertCircle className="text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-amber-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 bg-slate-800/50 border-slate-700 rounded focus:ring-amber-500 text-amber-500"
                />
                <span className="ml-2 text-sm text-slate-400">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-amber-400 hover:text-amber-300 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-white py-3 rounded-xl hover:from-amber-700 hover:to-amber-600 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <Lock size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-slate-700"></div>
            <span className="px-4 text-sm text-slate-500">Or continue with</span>
            <div className="flex-1 border-t border-slate-700"></div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            {/* Google */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-sm font-medium text-slate-300">Continue with Google</span>
            </motion.button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-8 pt-6 border-t border-slate-700 text-center">
            <p className="text-slate-400">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="font-medium text-amber-400 hover:text-amber-300 hover:underline"
              >
                Create Account
              </Link>
            </p>
          </div>

          {/* Guest Checkout Option */}
          <div className="mt-6 p-4 bg-gradient-to-r from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-700">
            <p className="text-sm text-center text-slate-400">
              Want to checkout as guest?{' '}
              <Link
                href="/products"
                className="text-amber-400 hover:text-amber-300 hover:underline"
              >
                Continue Shopping
              </Link>
            </p>
          </div>
        </div>

        {/* Admin Login & Security Info */}
        <div className="mt-8 space-y-4">
          {/* Admin Login */}
          <div className="text-center">
            <Link
              href="/admin-login"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-amber-300 transition-colors group"
            >
              <Shield size={14} className="group-hover:text-emerald-400" />
              <span>Admin Login</span>
            </Link>
          </div>

          {/* Security Info */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Lock size={12} className="text-emerald-400" />
            <span>Secure SSL encrypted connection</span>
            <Lock size={12} className="text-emerald-400" />
          </div>
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 grid grid-cols-3 gap-4"
        >
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700">
            <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-r from-amber-900/30 to-amber-800/30 flex items-center justify-center">
              <User size={16} className="text-amber-400" />
            </div>
            <p className="text-xs text-slate-400">Personal Account</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700">
            <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-r from-emerald-900/30 to-emerald-800/30 flex items-center justify-center">
              <Shield size={16} className="text-emerald-400" />
            </div>
            <p className="text-xs text-slate-400">Secure Login</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700">
            <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-r from-blue-900/30 to-blue-800/30 flex items-center justify-center">
              <Crown size={16} className="text-blue-400" />
            </div>
            <p className="text-xs text-slate-400">Premium Access</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Background Decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-800/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}