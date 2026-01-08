'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  Globe,
  MessageSquare,
  Shield,
  Sparkles,
  Key,
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Form submitted:', formData);
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
      
      // Reset success message after 5 seconds
      setTimeout(() => setIsSubmitted(false), 5000);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const contactInfo = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Email Us',
      details: ['support@ayraa.com', 'sales@ayraa.com'],
      description: 'We\'ll reply within 24 hours',
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: 'Call Us',
      details: ['+92 300 1234567', '+92 321 9876543'],
      description: 'Mon-Fri, 9am-6pm PKT',
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Visit Us',
      details: ['123 Fashion Avenue', 'DHA Phase 5, Karachi, Pakistan'],
      description: 'By appointment only',
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Business Hours',
      details: ['Monday - Friday: 9am - 6pm', 'Saturday: 10am - 4pm'],
      description: 'Closed on Sundays',
    },
  ];

  const faqs = [
    {
      question: 'What is your return policy?',
      answer: 'We offer a 30-day return policy for all unworn items with original tags. Returns are free for orders over 10,000 PKR.',
    },
    {
      question: 'How long does shipping take?',
      answer: 'Standard shipping takes 3-5 business days. Express shipping (2-day) is available for major cities.',
    },
    {
      question: 'Do you ship internationally?',
      answer: 'Yes! We ship worldwide. Shipping rates and times vary by location. Contact for specific rates.',
    },
    {
      question: 'Can I modify or cancel my order?',
      answer: 'You can modify or cancel your order within 1 hour of placement by contacting our customer service team.',
    },
  ];

  const securityFeatures = [
    { text: "SSL Encrypted", icon: <Shield size={14} className="text-emerald-400" /> },
    { text: "Secure Form", icon: <Key size={14} className="text-amber-400" /> },
    { text: "Privacy Protected", icon: <Globe size={14} className="text-blue-400" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 py-12 px-4">
      <div className="container mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-3 rounded-xl">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 bg-clip-text text-transparent">
              Get in Touch
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-400 max-w-3xl mx-auto"
          >
            Have questions? We're here to help. Reach out to us and we'll get back to you as soon as possible.
          </motion.p>
        </div>

        {/* Success Message */}
        {isSubmitted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 rounded-xl border border-emerald-700/50 flex items-center gap-3"
          >
            <CheckCircle className="text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-emerald-300">Message sent successfully!</p>
              <p className="text-emerald-400 text-sm">We'll get back to you within 24 hours.</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-6 md:p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-bold mb-6 text-white">Send us a message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500 ${
                        errors.name ? 'border-red-500/50' : 'border-slate-700'
                      }`}
                      placeholder="John Doe"
                    />
                    {errors.name && (
                      <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500 ${
                        errors.email ? 'border-red-500/50' : 'border-slate-700'
                      }`}
                      placeholder="you@example.com"
                    />
                    {errors.email && (
                      <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500 ${
                      errors.subject ? 'border-red-500/50' : 'border-slate-700'
                    }`}
                    placeholder="How can we help?"
                  />
                  {errors.subject && (
                    <p className="text-red-400 text-sm mt-1">{errors.subject}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-slate-500 ${
                      errors.message ? 'border-red-500/50' : 'border-slate-700'
                    }`}
                    placeholder="Tell us more about your inquiry..."
                  />
                  {errors.message && (
                    <p className="text-red-400 text-sm mt-1">{errors.message}</p>
                  )}
                </div>

                {/* Security Features */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  {securityFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-1 text-xs text-slate-400">
                      {feature.icon}
                      <span>{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl hover:from-amber-700 hover:to-amber-600 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            {/* Contact Cards */}
            <div className="space-y-4">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={info.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700 p-5 backdrop-blur-sm hover:border-amber-500/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-amber-600/20 to-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-amber-500/30">
                      <div className="text-amber-400">
                        {info.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-white">{info.title}</h3>
                      <div className="space-y-1">
                        {info.details.map((detail, i) => (
                          <p key={i} className="text-slate-300">{detail}</p>
                        ))}
                      </div>
                      <p className="text-sm text-slate-500 mt-2">{info.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* FAQ Section */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700 p-5 backdrop-blur-sm">
              <h3 className="font-bold text-xl mb-4 text-white">Frequently Asked Questions</h3>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="border-b border-slate-700 pb-4 last:border-b-0">
                    <h4 className="font-medium mb-2 text-slate-300">{faq.question}</h4>
                    <p className="text-slate-400 text-sm">{faq.answer}</p>
                  </div>
                ))}
                <a
                  href="/faq"
                  className="inline-flex items-center text-amber-400 hover:text-amber-300 font-medium text-sm"
                >
                  View all FAQs
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Emergency Notice */}
            <div className="bg-gradient-to-r from-amber-900/20 to-amber-800/20 rounded-xl border border-amber-700/50 p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-300 mb-2">Need Immediate Assistance?</h4>
                  <p className="text-amber-400/80 text-sm mb-3">
                    For urgent inquiries regarding your order, please call our customer service hotline.
                  </p>
                  <a
                    href="tel:+923001234567"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-lg hover:from-amber-700 hover:to-amber-600 transition-all text-sm font-medium shadow-lg"
                  >
                    <Phone size={14} />
                    Call Now: +92 300 1234567
                  </a>
                </div>
              </div>
            </div>

            {/* Additional Contact Info */}
            <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-xl border border-slate-700 p-4">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mb-2">
                <Shield size={12} className="text-emerald-400" />
                <span>24/7 Customer Support</span>
                <Shield size={12} className="text-emerald-400" />
              </div>
              <p className="text-xs text-slate-500 text-center">
                Average response time: 2 hours
              </p>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-12">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 overflow-hidden backdrop-blur-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Map Info */}
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-r from-amber-600/20 to-amber-500/20 p-2 rounded-lg">
                    <MapPin className="text-amber-400" size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Find Our Store</h3>
                </div>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="text-amber-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-white">AYRAA Flagship Store</p>
                      <p className="text-slate-400">123 Fashion Avenue, DHA Phase 5</p>
                      <p className="text-slate-400">Karachi, Pakistan</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="text-amber-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-white">Store Hours</p>
                      <p className="text-slate-400">Monday - Saturday: 10am - 8pm</p>
                      <p className="text-slate-400">Sunday: 12pm - 6pm</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-slate-400">
                    Visit our flagship store to experience our collection in person and receive personalized styling advice from our experts.
                  </p>
                  <button className="px-6 py-3 border-2 border-amber-600 text-amber-400 rounded-xl hover:bg-amber-600/10 transition-all font-medium hover:border-amber-500 hover:text-amber-300">
                    Get Directions
                  </button>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 min-h-[300px] lg:min-h-[400px] flex items-center justify-center border-t lg:border-t-0 lg:border-l border-slate-700">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-full flex items-center justify-center border border-slate-700">
                    <MapPin className="text-amber-400" size={48} />
                  </div>
                  <p className="text-slate-300 font-medium">Interactive Map</p>
                  <p className="text-slate-500 text-sm">Map integration would be here</p>
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-800/20 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}