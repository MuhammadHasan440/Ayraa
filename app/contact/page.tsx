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
      details: ['+1 (555) 123-4567', '+1 (555) 987-6543'],
      description: 'Mon-Fri, 9am-6pm EST',
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Visit Us',
      details: ['123 Fashion Street', 'Suite 100, New York, NY 10001'],
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
      answer: 'We offer a 30-day return policy for all unworn items with original tags. Returns are free for orders over $100.',
    },
    {
      question: 'How long does shipping take?',
      answer: 'Standard shipping takes 3-5 business days. Express shipping (2-day) is available for an additional fee.',
    },
    {
      question: 'Do you ship internationally?',
      answer: 'Yes! We ship to over 50 countries worldwide. Shipping rates and times vary by location.',
    },
    {
      question: 'Can I modify or cancel my order?',
      answer: 'You can modify or cancel your order within 1 hour of placement by contacting our customer service team.',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold mb-4"
        >
          Get in Touch
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-gray-600 max-w-3xl mx-auto"
        >
          Have questions? We're here to help. Reach out to us and we'll get back to you as soon as possible.
        </motion.p>
      </div>

      {/* Success Message */}
      {isSubmitted && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
        >
          <CheckCircle className="text-green-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-800">Message sent successfully!</p>
            <p className="text-green-700 text-sm">We'll get back to you within 24 hours.</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-rose-500'
                    }`}
                    placeholder="John Doe"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-rose-500'
                    }`}
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.subject ? 'border-red-500 focus:ring-red-500' : 'focus:ring-rose-500'
                  }`}
                  placeholder="How can we help?"
                />
                {errors.subject && (
                  <p className="text-red-500 text-sm mt-1">{errors.subject}</p>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.message ? 'border-red-500 focus:ring-red-500' : 'focus:ring-rose-500'
                  }`}
                  placeholder="Tell us more about your inquiry..."
                />
                {errors.message && (
                  <p className="text-red-500 text-sm mt-1">{errors.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto px-8 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="space-y-8">
          {/* Contact Cards */}
          <div className="space-y-6">
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <div className="text-rose-600">
                      {info.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{info.title}</h3>
                    <div className="space-y-1">
                      {info.details.map((detail, i) => (
                        <p key={i} className="text-gray-700">{detail}</p>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{info.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold text-xl mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0">
                  <h4 className="font-medium mb-2">{faq.question}</h4>
                  <p className="text-gray-600 text-sm">{faq.answer}</p>
                </div>
              ))}
              <a
                href="/faq"
                className="inline-flex items-center text-rose-600 hover:text-rose-700 font-medium text-sm"
              >
                View all FAQs
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          {/* Emergency Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 mb-2">Need Immediate Assistance?</h4>
                <p className="text-amber-700 text-sm mb-3">
                  For urgent inquiries regarding your order, please call our customer service hotline.
                </p>
                <a
                  href="tel:+15551234567"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                >
                  <Phone size={14} />
                  Call Now: +1 (555) 123-4567
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="mt-16">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Map Info */}
            <div className="p-8">
              <h3 className="text-2xl font-bold mb-6">Find Our Store</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="text-rose-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">AYRAA Flagship Store</p>
                    <p className="text-gray-600">123 Fashion Street, Suite 100</p>
                    <p className="text-gray-600">New York, NY 10001</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="text-rose-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">Store Hours</p>
                    <p className="text-gray-600">Monday - Saturday: 10am - 8pm</p>
                    <p className="text-gray-600">Sunday: 12pm - 6pm</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 space-y-3">
                <p className="text-gray-600">
                  Visit our flagship store to experience our collection in person and receive personalized styling advice from our experts.
                </p>
                <button className="px-6 py-3 border-2 border-rose-600 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors font-medium">
                  Get Directions
                </button>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-gray-100 min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-rose-100 rounded-full flex items-center justify-center">
                  <MapPin className="text-rose-600" size={48} />
                </div>
                <p className="text-gray-600 font-medium">Interactive Map</p>
                <p className="text-gray-500 text-sm">Map integration would be here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}