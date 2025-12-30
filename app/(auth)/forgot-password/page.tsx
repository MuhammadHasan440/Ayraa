"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-semibold text-pink-600 text-center">
          Forgot Password
        </h2>

        <p className="text-sm text-gray-500 text-center mt-2">
          Enter your registered email and we’ll send you a reset link.
        </p>

        {/* Email Input */}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mt-6 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
        />

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-500 mt-3 text-center">{error}</p>
        )}

        {/* Success Message */}
        {success && (
          <div className="mt-4 rounded-xl bg-pink-100 px-4 py-3 text-sm text-pink-700 text-center">
            {success}
          </div>
        )}

        {/* Button */}
        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full mt-6 bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl font-medium transition disabled:opacity-60"
        >
          {loading ? "Sending reset link..." : "Send Reset Link"}
        </button>

        {/* Back to Login */}
        <p className="text-sm text-center text-gray-500 mt-6">
          Remember your password?{" "}
          <a href="/login" className="text-pink-600 hover:underline">
            Back to login
          </a>
        </p>
      </div>
    </div>
  );
}
