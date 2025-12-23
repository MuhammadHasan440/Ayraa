import React from "react";
import { 
  Heart, 
  Shield, 
  Truck, 
  Users, 
  Award, 
  Globe, 
  Leaf, 
  Target,
  Star,
  CheckCircle
} from "lucide-react";

export const metadata = {
  title: "About Us | Your E-commerce Store",
  description: "Learn about our story, values, and commitment to quality products and customer satisfaction",
};

export default function AboutPage() {
  const values = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Quality Assurance",
      description: "Every product undergoes rigorous quality checks before reaching you"
    },
    {
      icon: <Truck className="w-8 h-8" />,
      title: "Fast Delivery",
      description: "Express shipping across Pakistan with real-time tracking"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Customer First",
      description: "Your satisfaction is our top priority"
    },
    {
      icon: <Leaf className="w-8 h-8" />,
      title: "Sustainable",
      description: "Eco-friendly packaging and sustainable practices"
    }
  ];

  const stats = [
    { number: "100+", label: "Happy Customers" },
    { number: "2+", label: "Cities Served" },
    { number: "99%", label: "Positive Reviews" },
    { number: "24/7", label: "Customer Support" }
  ];

  const team = [
    {
      name: "Ali Hassan",
      role: "CEO & Founder",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
    },
    {
      name: "Sara Khan",
      role: "Head of Operations",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w-400&h=400&fit=crop&crop=face"
    },
    {
      name: "Ahmed Raza",
      role: "Tech Lead",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face"
    },
    {
      name: "Fatima Noor",
      role: "Customer Experience",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face"
    }
  ];

  const milestones = [
    { year: "2020", event: "Founded with a vision to revolutionize online shopping in Pakistan" },
    { year: "2021", event: "Launched mobile app and expanded to 50+ cities" },
    { year: "2022", event: "Crossed 5,000 customers with 98% satisfaction rate" },
    { year: "2023", event: "Introduced eco-friendly packaging and carbon-neutral shipping" },
    { year: "2024", event: "Awarded 'Best E-commerce Platform' in Pakistan" }
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-rose-50 to-pink-100 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              Our Story
            </h1>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Born from a passion for quality and convenience, we're on a mission to 
              transform the shopping experience across Pakistan. We believe everyone 
              deserves access to premium products with seamless delivery.
            </p>
            <div className="flex flex-wrap justify-center gap-6 mt-10">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="text-3xl font-bold text-rose-600">{stat.number}</div>
                  <div className="text-gray-600 mt-2">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Target className="w-10 h-10 text-rose-600" />
                <h2 className="text-3xl font-bold">Our Mission</h2>
              </div>
              <p className="text-lg text-gray-700">
                To empower Pakistani shoppers with access to premium quality products, 
                delivered right to their doorstep with unmatched speed and reliability. 
                We're committed to creating a seamless shopping experience that puts 
                customer satisfaction above all.
              </p>
              <ul className="space-y-3">
                {[
                  "100% Authentic Products",
                  "Secure Payment Gateway",
                  "30-Day Return Policy",
                  "Free Shipping Over PKR 10,000"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-pink-100 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Globe className="w-10 h-10 text-rose-600" />
                <h2 className="text-3xl font-bold">Our Vision</h2>
              </div>
              <p className="text-lg text-gray-700">
                To become Pakistan's most trusted online marketplace, setting new 
                standards in e-commerce through innovation, sustainability, and 
                customer-centricity. We envision a future where shopping is not just 
                convenient, but delightful.
              </p>
              <div className="mt-8 p-6 bg-white rounded-2xl shadow-sm">
                <div className="flex items-center gap-4">
                  <Award className="w-12 h-12 text-yellow-500" />
                  <div>
                    <h3 className="font-bold text-lg">Award Winning Service</h3>
                    <p className="text-gray-600">Recognized as Pakistan's Best E-commerce 2024</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Core Values</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              These principles guide everything we do, from selecting products to serving customers
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-6 text-rose-600">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Journey</h2>
            <p className="text-gray-600">Milestones that shaped our growth</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-rose-200 md:left-1/2 md:-translate-x-1/2"></div>
              
              {milestones.map((milestone, index) => (
                <div key={index} className={`relative mb-12 md:flex ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <div className="text-rose-600 font-bold text-lg mb-2">{milestone.year}</div>
                      <p className="text-gray-700">{milestone.event}</p>
                    </div>
                  </div>
                  <div className="absolute left-4 w-8 h-8 bg-rose-600 rounded-full border-4 border-white md:left-1/2 md:-translate-x-1/2">
                    <div className="w-full h-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-white" fill="white" />
                    </div>
                  </div>
                  <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:pl-12' : 'md:pr-12'}`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-rose-600 to-pink-600">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl font-bold mb-6">Ready to Experience Premium Shopping?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of satisfied customers who trust us for quality products and exceptional service
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 bg-white text-rose-600 rounded-full font-bold hover:bg-gray-100 transition-colors">
                Start Shopping
              </button>
              <button className="px-8 py-3 border-2 border-white text-white rounded-full font-bold hover:bg-white/10 transition-colors">
                Contact Us
              </button>
            </div>
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold">100%</div>
                <div className="text-sm opacity-90">Secure Payments</div>
              </div>
              <div>
                <div className="text-2xl font-bold">3-5</div>
                <div className="text-sm opacity-90">Days Delivery</div>
              </div>
              <div>
                <div className="text-2xl font-bold">30-Day</div>
                <div className="text-sm opacity-90">Easy Returns</div>
              </div>
              <div>
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-sm opacity-90">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}