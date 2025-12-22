
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/context/AuthContext';
import { CartProvider } from '@/lib/context/CartContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AYRAA - Premium Women Clothing',
  description: 'Discover elegant and modern women clothing at AYRAA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head><script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
      
    </html>
  );
}