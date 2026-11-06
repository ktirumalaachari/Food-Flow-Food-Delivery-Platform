// import dns from "node:dns";
// dns.setServers(["8.8.8.8", "8.8.4.4"]);

import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import ScrollToHash from "@/components/common/ScrollToHash";
import AOSInit from "@/components/common/AOSInit";
import AIChatbot from "@/components/ai/AIChatbot";
import CartSidebar from "@/components/cart/CartSidebar";
import { CartProvider } from "@/contexts/CartContext";
import LocationGuard from "@/components/common/LocationGuard";
import ToastProvider from "@/components/common/ToastProvider";
import JwtTokenSync from "@/components/auth/JwtTokenSync";
import PwaRegister from "@/components/pwa/PwaRegister";
import OfflineDetector from "@/components/pwa/OfflineDetector";
import PwaInstallPrompt from "@/components/pwa/PwaInstallPrompt";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#ff5200",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: "Food Flow — Fast Online Food Delivery",
  description:
    "Order your favorite food from the best restaurants near you with Food Flow.",
  manifest: "/manifest.webmanifest",
  applicationName: "Food Flow",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Food Flow",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/foodNav.png",
    apple: [
      { url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

import { NotificationProvider } from "@/contexts/NotificationContext";
import OrderNotificationManager from "@/components/notifications/OrderNotificationManager";

import MobileBottomNav from "@/components/common/MobileBottomNav";
import FloatingCartBar from "@/components/common/FloatingCartBar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100"
      >
        <AOSInit />
        <ScrollToHash />
        <OfflineDetector />
        <PwaRegister />
        <PwaInstallPrompt />
        <LocationGuard>
          <CartProvider>
            <NotificationProvider>
              <JwtTokenSync />
              <Navbar session={null} cartItemCount={0} />
              <main className="flex-grow pb-16 md:pb-0">{children}</main>
              <Footer></Footer>
              <CartSidebar />
              <FloatingCartBar />
              <MobileBottomNav />
              <AIChatbot />
              <ToastProvider />
              <OrderNotificationManager />
            </NotificationProvider>
          </CartProvider>
        </LocationGuard>
      </body>
    </html>
  );
}
