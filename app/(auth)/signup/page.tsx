'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, Check, Crown, Shield, Sparkles, Gift, Star } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

export default function SignupPage() {
  const router = useRouter();
  const { signUp, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
  });

  const validatePassword = (password: string) => {
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!passwordStrength.hasMinLength) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      await signUp(formData.email, formData.password, formData.name);
      router.push('/');
    } catch (error: any) {
      setError(error.message || 'Failed to create account. Please try again.');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setFormData({ ...formData, password: newPassword });
    validatePassword(newPassword);
  };

  const benefits = [
    { icon: <Gift className="w-4 h-4" />, text: 'Welcome gift on first order' },
    { icon: <Star className="w-4 h-4" />, text: 'Exclusive member discounts' },
    { icon: <Sparkles className="w-4 h-4" />, text: 'Early access to new collections' },
    { icon: <Shield className="w-4 h-4" />, text: 'Priority customer support' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 py-12 px-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Benefits */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="hidden lg:block"
          >
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-8 h-full">
              {/* Logo */}
              <div className="mb-8">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-2 rounded-lg">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 bg-clip-text text-transparent">
                    AYRAA
                  </h1>
                </div>
                <p className="text-slate-400 mt-2">Premium Fashion Experience</p>
              </div>

              {/* Benefits */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-amber-200">Join Our Fashion Family</h2>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-800/30 to-slate-900/30 border border-slate-700"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-amber-900/30 to-amber-800/30 flex items-center justify-center">
                        <div className="text-amber-400">{benefit.icon}</div>
                      </div>
                      <span className="text-slate-300">{benefit.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Testimonial */}
                <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 italic">
                    "AYRAA transformed my wardrobe with their exquisite collections. The quality and service are exceptional!"
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600"></div>
                    <div>
                      <p className="text-sm font-medium text-amber-300">Fatima K.</p>
                      <p className="text-xs text-slate-500">Loyal Member since 2023</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Signup Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 shadow-2xl p-8 backdrop-blur-sm">
              {/* Mobile Logo */}
              <div className="lg:hidden text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-2 rounded-lg">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 bg-clip-text text-transparent">
                    AYRAA
                  </h1>
                </div>
                <p className="text-slate-400">Create Your Premium Account</p>
              </div>

              <div className="lg:hidden mb-6">
                <div className="grid grid-cols-2 gap-3">
                  {benefits.slice(0, 2).map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-slate-800/30 to-slate-900/30 border border-slate-700">
                      <div className="text-amber-400">{benefit.icon}</div>
                      <span className="text-xs text-slate-300">{benefit.text}</span>
                    </div>
                  ))}
                </div>
              </div>

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
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500"
                      placeholder="Ali Khan"
                      required
                    />
                  </div>
                </div>

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
                      onChange={handlePasswordChange}
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

                  {/* Password Strength */}
                  <div className="mt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${passwordStrength.hasMinLength ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-slate-700'}`}>
                          {passwordStrength.hasMinLength && <Check size={10} className="text-white" />}
                        </div>
                        <span className={`text-xs ${passwordStrength.hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                          8+ characters
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${passwordStrength.hasUpperCase ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-slate-700'}`}>
                          {passwordStrength.hasUpperCase && <Check size={10} className="text-white" />}
                        </div>
                        <span className={`text-xs ${passwordStrength.hasUpperCase ? 'text-emerald-400' : 'text-slate-500'}`}>
                          Uppercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${passwordStrength.hasLowerCase ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-slate-700'}`}>
                          {passwordStrength.hasLowerCase && <Check size={10} className="text-white" />}
                        </div>
                        <span className={`text-xs ${passwordStrength.hasLowerCase ? 'text-emerald-400' : 'text-slate-500'}`}>
                          Lowercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${passwordStrength.hasNumber ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-slate-700'}`}>
                          {passwordStrength.hasNumber && <Check size={10} className="text-white" />}
                        </div>
                        <span className={`text-xs ${passwordStrength.hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                          Number
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full pl-10 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-amber-400 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Terms */}
                <div>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      className="w-4 h-4 mt-1 bg-slate-800/50 border-slate-700 rounded focus:ring-amber-500 text-amber-500"
                      required
                    />
                    <span className="ml-2 text-sm text-slate-400">
                      I agree to the{' '}
                      <Link href="/terms" className="text-amber-400 hover:text-amber-300 hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-amber-400 hover:text-amber-300 hover:underline">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
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
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Premium Account
                      <Crown size={18} />
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
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  </svg>
                  <span className="text-sm font-medium text-slate-300">Google</span>
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors">
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z"/>
                  </svg>
                  <span className="text-sm font-medium text-slate-300">Facebook</span>
                </button>
              </div>

              {/* Login Link */}
              <div className="mt-8 pt-6 border-t border-slate-700 text-center">
                <p className="text-slate-400">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="font-medium text-amber-400 hover:text-amber-300 hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Security Info */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Shield size={12} className="text-emerald-400" />
          <span>Your data is protected with 256-bit SSL encryption</span>
          <Shield size={12} className="text-emerald-400" />
        </div>
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