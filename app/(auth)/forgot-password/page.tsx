"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { motion } from "framer-motion";
import { 
  Mail, 
  Lock, 
  ArrowLeft, 
  Shield, 
  CheckCircle,
  AlertCircle,
  Key,
  Sparkles
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });

      setSuccess(
        "A password reset link has been sent to your email. Please check your inbox or spam folder."
      );
      setEmail("");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { text: "Secure reset link", icon: <Shield size={14} className="text-emerald-400" /> },
    { text: "Valid for 1 hour", icon: <Key size={14} className="text-amber-400" /> },
    { text: "One-click access", icon: <Lock size={14} className="text-blue-400" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 py-12 px-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-2 rounded-lg">
              <Key className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 bg-clip-text text-transparent">
              Reset Password
            </h1>
          </div>
          <p className="text-slate-400">Enter your email to reset your password</p>
        </div>

        {/* Card */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 shadow-2xl p-8 backdrop-blur-sm">
          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 rounded-xl border border-emerald-700/50 flex items-center gap-3"
            >
              <CheckCircle className="text-emerald-400 flex-shrink-0" />
              <p className="text-emerald-300 text-sm">{success}</p>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-gradient-to-r from-red-900/20 to-red-800/20 rounded-xl border border-red-800/30 flex items-center gap-3"
            >
              <AlertCircle className="text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Instructions */}
          <div className="mb-6">
            <p className="text-slate-300 text-center mb-4">
              Enter your registered email and we'll send you a secure reset link
            </p>
            
            {/* Features */}
            <div className="flex items-center justify-center gap-4 mb-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-1 text-xs text-slate-400">
                  {feature.icon}
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Email Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500"
                disabled={!!success}
              />
            </div>
            {!success && (
              <p className="text-xs text-slate-500 mt-2">
                We'll send a secure link to reset your password
              </p>
            )}
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            disabled={loading || !!success}
            className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
              success
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white"
                : "bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-700 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
            } shadow-lg`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending reset link...
              </>
            ) : success ? (
              <>
                <CheckCircle size={18} />
                Link Sent Successfully
              </>
            ) : (
              <>
                Send Reset Link
                <Mail size={18} />
              </>
            )}
          </button>

          {/* Back to Login */}
          <div className="mt-8 pt-6 border-t border-slate-700 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 hover:underline"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>

          {/* Security Info */}
          <div className="mt-6 p-4 bg-gradient-to-r from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-700">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mb-2">
              <Shield size={12} className="text-emerald-400" />
              <span>Secure SSL encrypted connection</span>
              <Shield size={12} className="text-emerald-400" />
            </div>
            <p className="text-xs text-slate-500 text-center">
              Reset links expire in 1 hour for security
            </p>
          </div>

          {/* Help Section */}
          {!success && (
            <div className="mt-6">
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <AlertCircle size={14} className="text-amber-400" />
                <span className="font-medium">Need help?</span>
              </div>
              <ul className="text-xs text-slate-500 space-y-1 ml-6">
                <li>• Check your spam or junk folder</li>
                <li>• Ensure you're using the correct email</li>
                <li>• Contact support if issues persist</li>
              </ul>
            </div>
          )}
        </div>

        {/* Additional Links */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-amber-400 hover:text-amber-300 hover:underline"
            >
              Create account
            </Link>
          </p>
        </div>

        {/* Security Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 grid grid-cols-3 gap-4"
        >
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700">
            <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-r from-amber-900/30 to-amber-800/30 flex items-center justify-center">
              <Lock size={16} className="text-amber-400" />
            </div>
            <p className="text-xs text-slate-400">Secure Process</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700">
            <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-r from-emerald-900/30 to-emerald-800/30 flex items-center justify-center">
              <Shield size={16} className="text-emerald-400" />
            </div>
            <p className="text-xs text-slate-400">Data Protected</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700">
            <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-r from-blue-900/30 to-blue-800/30 flex items-center justify-center">
              <Sparkles size={16} className="text-blue-400" />
            </div>
            <p className="text-xs text-slate-400">Quick Reset</p>
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
