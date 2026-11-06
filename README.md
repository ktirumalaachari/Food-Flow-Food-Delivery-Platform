<div align="center">

# 🍔 Food Flow — Modern Multi-Vendor Food Delivery Platform
### ⚡ High-Performance Progressive Web App (PWA) • Real-Time GPS Tracking • Multi-Tier AI Concierge

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js 4](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![Razorpay Payments](https://img.shields.io/badge/Razorpay-UPI_&_Cards-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF)](https://razorpay.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Production_Ready-FF5722?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Google Gemini AI](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75B2?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](LICENSE)

<br />

<p align="center">
  <b>Food Flow</b> is an enterprise-grade, full-stack multi-vendor food delivery ecosystem designed to connect <b>Customers</b>, <b>Restaurants</b>, <b>Delivery Riders</b>, and <b>Platform Super Admins</b> in real-time. Built with a decoupled architecture featuring a modern <b>Next.js 16 App Router</b> frontend with a <b>Swiggy-inspired UI</b>, full <b>Progressive Web App (PWA)</b> offline capabilities, <b>Razorpay payment gateway</b>, <b>Live GPS Leaflet Rider Tracking</b>, and a multi-tier <b>AI Concierge & Food Studio</b> powered by Google Gemini and DeepSeek.
</p>

---

[📖 Quick Setup](#-quickstart--installation-guide) • [📱 PWA Guide](#-progressive-web-app-pwa-features) • [🚴 Live Rider GPS](#-live-rider-gps-tracking--maps) • [🛠️ Tech Stack](#%EF%B8%8F-technology-stack--icon-pack) • [🔄 Architecture](#-system-architecture) • [✨ Key Modules](#-platform-ecosystem--modules) • [🔐 Environment Variables](#-environment-variable-setup) • [🚀 GitHub Push Guide](#-github-code-push-guide)

---

</div>

## 🌟 Executive Summary & Key Highlights

- **Swiggy-Inspired Modern Interface:** Vibrant Swiggy orange (`#FC8019`) theme, micro-animations, fast live category filters, restaurant badges, and smooth Framer Motion transitions.
- **Production Progressive Web App (PWA):**
  - High-performance Service Worker (`sw.js`) with cache versioning (`foodflow-v1.0.0`), static asset caching, and Stale-While-Revalidate caching for images.
  - Dedicated offline fallback page (`/offline` & `offline.html`) and live online/offline network detection.
  - Custom "Install App" prompt banners, iOS Safari install guidance, and standalone desktop/mobile launcher support.
  - Web Push notifications with VAPID key exchange and subscription management.
- **Multi-Role RBAC System:** Four distinct dashboards for **Customers**, **Restaurant Partners**, **Delivery Riders**, and **Super Admins**.
- **Real-Time WebSocket Engine:** Instant sound & visual notifications for new orders, kitchen state transitions (`Pending` ➔ `Preparing` ➔ `Ready` ➔ `On the Way` ➔ `Delivered`), and live rider movement via Socket.IO.
- **Smart GPS Order Tracking:** Live tracking on OpenStreetMap with Leaflet. Auto-centers the map dynamically as the rider moves toward the customer's delivery destination.
- **Dual Payment Workflows:** Secure online payments powered by **Razorpay Checkout (UPI, Google Pay, PhonePe, Cards, NetBanking, Wallets)** and traditional **Cash on Delivery (COD)** with Delivery OTP verification.
- **Multi-Tier AI Concierge & Food Studio:**
  - **AI Food Studio:** Automated food presentation enhancement and dish imagery creation using Google Gemini Vision.
  - **Conversational Food Bot:** Multi-provider fallback (Google Gemini 2.5 + Groq / OpenRouter DeepSeek) for dietary recommendations, calorie estimations, and instant dish queries.
- **Automated Digital Invoicing:** Instant client-side PDF receipt generation with company branding, tax breakdown, and itemization via `jsPDF`.
- **Better Auth & Secure Sessions:** Next-generation session security with Better Auth MongoDB adapter, Google OAuth 2.0 social login, and JWT fallbacks.

---

## 🛠️ Technology Stack & Icon Pack

### 🎨 Frontend Ecosystem (Client)
<div align="left">

| Technology | Badge / Icon | Category | Role in Project |
| :--- | :---: | :--- | :--- |
| **Next.js 16** | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg" width="28"/> | Framework | App Router (v16.3), Server Actions, SSR & Client Hydration |
| **React 19** | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="28"/> | Core Library | Modern concurrent React UI components & hooks |
| **TypeScript 5** | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="28"/> | Language | Strict compile-time type safety across all interfaces |
| **Tailwind CSS v4**| <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/tailwindcss/tailwindcss-original.svg" width="28"/> | Styling | Swiggy orange theme (`#FC8019`), atomic CSS, responsive layouts |
| **PWA & Service Worker**| <img src="https://web.dev/images/collections/pwa.svg" width="28"/> | Mobile/PWA | Offline caching, App Manifest, Install Prompt, Web Push |
| **Framer Motion** | <img src="https://camo.githubusercontent.com/11ae9e327da2ab3b01ff25661073867c87c711a37c35a828ad94d2165b4c107f/68747470733a2f2f7062732e7477696d672e636f6d2f70726f66696c655f696d616765732f313337323136363032393030363233373639362f6c5f72785f7a46575f343030783430302e6a7067" width="28"/> | Animation | Micro-interactions, smooth modals, and route transitions |
| **Leaflet & OSM** | <img src="https://leafletjs.com/docs/images/logo.png" width="28"/> | Maps | Interactive OpenStreetMap GPS tracking & live rider animations |
| **Razorpay SDK** | <img src="https://razorpay.com/favicon.ico" width="28"/> | Payments | Razorpay Checkout modal (UPI, Cards, NetBanking, Wallets) |
| **Better Auth** | <img src="https://better-auth.com/favicon.ico" width="28"/> | Authentication | Modern TypeScript auth engine with MongoDB adapter |
| **Socket.io Client**| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/socketio/socketio-original.svg" width="28"/> | Realtime | Real-time push updates for orders and GPS coordinates |
| **Lucide Icons** | <img src="https://lucide.dev/logo.light.svg" width="28"/> | UI Icons | Modern SVG icon sets throughout all user dashboards |
| **jsPDF & html2pdf**| <img src="https://raw.githubusercontent.com/parallax/jsPDF/master/art/jsPDF-Logo.png" width="28"/> | Export | Instant client-side download of order invoices & receipts |

</div>

### ⚙️ Backend Ecosystem (Server)
<div align="left">

| Technology | Badge / Icon | Category | Role in Project |
| :--- | :---: | :--- | :--- |
| **Node.js 18+** | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="28"/> | Runtime | High-throughput asynchronous JavaScript runtime |
| **Express.js 4** | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" width="28"/> | Web Framework | Modular REST API routing, CORS handling & middleware |
| **MongoDB Atlas** | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg" width="28"/> | Database | Cloud NoSQL document storage with high availability |
| **Mongoose 8** | <img src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/mongoose/mongoose.png" width="28"/> | ODM | Schema validation, relationship modeling, and queries |
| **Socket.io Server**| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/socketio/socketio-original.svg" width="28"/> | WebSockets | Room-based real-time event broadcasting (`orderId` rooms) |
| **Razorpay Node SDK**| <img src="https://razorpay.com/favicon.ico" width="28"/> | Payments | Order creation, HMAC-SHA256 signature verification & refunds |
| **Google GenAI** | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" width="28"/> | AI Vision | Official `@google/genai` SDK for dish image enhancement |
| **Groq / OpenRouter**| <img src="https://groq.com/wp-content/uploads/2024/03/groq-favicon.png" width="28"/> | AI Engine | High-speed LLM fallback for conversational food concierge |
| **TSX & TypeScript**| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="28"/> | Dev Tooling | Instant TypeScript execution & hot-reload in development |

</div>

---

## 🔄 System Architecture

```
                                  ┌─────────────────────────────┐
                                  │      CLIENT APPLICATION     │
                                  │   (Next.js 16 + React 19)   │
                                  │    Progressive Web App      │
                                  └──────────────┬──────────────┘
                                                 │
                   ┌─────────────────────────────┼─────────────────────────────┐
                   │ HTTP REST / Server Actions  │ WebSocket (Bidirectional)   │ OAuth 2.0
                   ▼                             ▼                             ▼
       ┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
       │     API ROUTING      │      │   SOCKET.IO SERVER   │      │     GOOGLE CLOUD     │
       │    (Express.js 4)    │      │  (Order Rooms / GPS) │      │     (OAuth Login)    │
       └───────────┬──────────┘      └──────────┬───────────┘      └──────────────────────┘
                   │                            │
   ┌───────────────┼───────────────┬────────────┴──────────────────┐
   ▼               ▼               ▼                               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ ┌──────────────────────┐
│   MONGODB    │ │   RAZORPAY   │ │     AI MODEL POOL        │ │     EMAIL / PUSH     │
│    ATLAS     │ │   PAYMENTS   │ │ (Gemini 2.5 + DeepSeek)  │ │ (Web Push + SMTP/OTP)│
└──────────────┘ └──────────────┘ └──────────────────────────┘ └──────────────────────┘
```

---

## 📱 Progressive Web App (PWA) Features

FoodFlow is a **Production-Grade Progressive Web App** offering a native mobile app experience on any device without going through an app store:

1. **Web App Manifest (`manifest.json` & `manifest.ts`):**
   - Configured with `display: standalone` for an immersive full-screen native feel.
   - Theme color `#FC8019` matching Swiggy's brand identity.
   - 14 multi-resolution icons (`72x72` up to `512x512`), maskable icons for Android adaptive launchers, and Apple touch icons for iOS.
2. **Service Worker (`sw.js`):**
   - **Cache Version Management:** `foodflow-v1.0.0` with automatic cleanup of outdated caches.
   - **Cache-First Strategy:** Static UI assets, compiled scripts, CSS stylesheets, and web fonts.
   - **Stale-While-Revalidate Strategy:** Menu dish pictures and restaurant storefront thumbnails.
   - **Network-First Strategy:** Real-time dynamic order endpoints and customer dashboards.
   - **Strict Never-Cache Rules:** Authentication routes (`/api/auth/*`), payments (`/api/payment/*`), and user tokens are never cached.
3. **Offline Resilience (`/offline` & `offline.html`):**
   - Instant fallback UI when network connectivity is lost.
   - Live online/offline network detector badge (`OfflineDetector.tsx`) notifying customers when connection is restored.
4. **App Installation Prompt (`PwaInstallPrompt.tsx` & `PwaInstallButton.tsx`):**
   - Non-intrusive install banner with `beforeinstallprompt` event interception.
   - Direct "Install App" triggers in both the top navigation bar and footer.
   - Step-by-step instructions for Safari iOS users (*Tap Share ➔ Add to Home Screen*).
5. **Web Push Notifications:**
   - Full VAPID key architecture (`/api/push/vapid-key`, `/api/push/subscribe`, `/api/push/send`).
   - Push notifications for order status changes and delivery updates.

---

## 🚴 Live Rider GPS Tracking & Maps

FoodFlow features an **interactive, real-time delivery tracking map** using Leaflet and OpenStreetMap:

- **Berhampur Operational Hub:** Map default coordinates center around Berhampur, Odisha (`19.3150° N, 84.7941° E`).
- **Dynamic Camera Auto-Centering:** The `MapFollowCenter` component smoothly re-centers the camera on the delivery rider as real-time coordinates arrive via WebSockets.
- **Bi-Directional Socket.IO Rooms:** Delivery updates are broadcasted to both `orderId` and `order_${orderId}` rooms, keeping customer and rider screens in sync with zero latency.
- **Rider Movement Persistence:** Real-time lat/lng coordinates stream to MongoDB (`OrderService.updateRiderLocation`), ensuring the map state persists even if the customer refreshes their browser.
- **OTP Verification Handshake:** Safe 4-digit Delivery OTP generated upon order dispatch, verified by the rider before marking the delivery complete.

---

## 📂 Project Repository Structure

```
Food Flow/
├── Client/                             # Next.js 16 Frontend Application (PWA)
│   ├── public/                         # Public static assets & brand graphics
│   │   ├── icons/                      # PWA icons (72x72 to 512x512, maskable, apple)
│   │   ├── manifest.json               # Web App Manifest
│   │   ├── sw.js                       # Production Service Worker
│   │   ├── offline.html                # Standalone Offline Fallback Page
│   │   └── foodNav.png                 # FoodFlow Brand Logo
│   ├── src/
│   │   ├── app/                        # Next.js 16 App Router
│   │   │   ├── (auth)/                 # Login, Register, Forgot Password, Reset OTP
│   │   │   ├── about/                  # Company story, mission & statistics
│   │   │   ├── ai/                     # AI Food Studio & Chatbot Assistant
│   │   │   ├── api/                    # Server Actions & API Route Handlers
│   │   │   │   ├── auth/               # Better Auth routes & OTP dispatch
│   │   │   │   ├── payment/            # Razorpay order creation & signature verification
│   │   │   │   └── push/               # VAPID key exchange & Web Push subscribers
│   │   │   ├── checkout/               # Razorpay & Cash on Delivery workflows
│   │   │   ├── contact/                # Support contact form with automated email
│   │   │   ├── dashboard/              # 4 Role-Based Dashboards:
│   │   │   │   ├── admin/              # Super Admin analytics, restaurants, coupons
│   │   │   │   ├── customer/           # Order tracking, order history, profile
│   │   │   │   ├── restaurant/         # Menu CRUD, kitchen order pipeline
│   │   │   │   └── rider/              # Delivery dispatch, GPS broadcast, earnings
│   │   │   ├── dishes/                 # Food catalog with filters, search & pagination
│   │   │   ├── offline/                # Next.js App Router offline route
│   │   │   ├── order-tracking/         # Leaflet GPS delivery tracking
│   │   │   └── restaurants/            # Vendor directory & individual storefronts
│   │   ├── components/                 # Reusable UI component ecosystem
│   │   │   ├── common/                 # Navbar, Footer, Modal, Skeleton loaders
│   │   │   ├── dashboardComponents/    # Tailored components for each role
│   │   │   └── pwa/                    # PwaRegister, OfflineDetector, PwaInstallPrompt
│   │   ├── contexts/                   # AuthContext, CartContext, SocketContext
│   │   ├── lib/                        # Better Auth, DB connectors, PDF Invoicing, PWA
│   │   └── types/                      # TypeScript definitions (Order, Food, User, etc.)
│   ├── .env.example                    # Template for Client environment variables
│   ├── package.json                    # Client dependencies & scripts
│   └── tsconfig.json                   # TypeScript compiler options
│
└── Server/                             # Express.js + TypeScript Backend Service
    ├── src/
    │   ├── server.ts                   # Entrypoint, HTTP server & Socket.io setup
    │   ├── app.ts                      # Express app, middlewares, CORS, router mounts
    │   └── app/
    │       ├── config/                 # DB connectors & environment resolvers
    │       ├── middlewares/            # RBAC verification, auth tokens, input validation
    │       ├── socket.ts               # Socket.io room handlers & real-time dispatcher
    │       └── modules/                # Feature-based modular architecture:
    │           ├── admin/              # Admin oversight & system metrics
    │           ├── ai/                 # Gemini Vision & LLM concierge endpoints
    │           ├── auth/               # User authentication & token generation
    │           ├── cart/               # Persistent cloud cart sync
    │           ├── coupon/             # Promo codes & discount engines
    │           ├── food/               # Dish catalog & culinary management
    │           ├── order/              # Lifecycle management & Razorpay orders
    │           ├── restaurant/         # Vendor profile & menu management
    │           ├── rider/              # Courier dispatching & location tracking
    │           └── zone/               # Geographic delivery zones & pricing
    ├── .env.example                    # Template for Server environment variables
    ├── package.json                    # Backend dependencies & scripts
    └── tsconfig.json                   # TypeScript compiler options
```

---

## ✨ Platform Ecosystem & Modules

### 1. 👤 Customer Experience
- **Interactive Marketplace:** Browse nearby restaurants, cuisine categories, dietary preferences, and rating filters.
- **Custom Meal Customizer:** Select sizes, preparation variations, spice levels, add-on toppings, and kitchen instructions.
- **Dynamic Cart & Checkout:** Real-time coupon application, automated delivery fee calculation based on zones, and multi-method payment.
- **Real-Time GPS Map Tracking:** Watch rider progress from kitchen pickup to doorstep via interactive Leaflet maps.
- **PDF Invoice Export:** Download branded, printable PDF receipts with itemized order breakdowns.

### 2. 🏪 Restaurant Partner Portal
- **Menu Management:** Create, update, or pause dishes; set stock limits, upload images, and manage price variations.
- **Kitchen Order Pipeline:** Real-time audio alerts for incoming orders. Transition orders: `Pending` ➔ `Accepted` ➔ `Preparing` ➔ `Ready for Pickup`.
- **Business Analytics:** Daily revenue figures, popular dishes, and customer rating summaries.

### 3. 🚴 Delivery Rider Command Center
- **Smart Dispatch:** Real-time notifications for nearby orders ready for pickup.
- **Delivery Workflow:** Accept deliveries, update transit milestones (`Picked Up` ➔ `In Transit` ➔ `Delivered`), and broadcast live coordinates.
- **Earnings & Metrics:** Daily and weekly trip summaries, completed deliveries, and tip tallies.

### 4. 👑 Super Admin Command Center
- **Platform Analytics:** Real-time Gross Merchandise Value (GMV), active customer count, total orders, and net commission.
- **Approvals & Onboarding:** Review and approve restaurant partner applications and rider licenses.
- **Platform Configuration:** Set commission percentages, manage global discount coupons, define delivery zones, and ban/unban users.

### 5. 🤖 AI Food Studio & Smart Concierge
- **AI Dish Image Enhancement:** Auto-generate or retouch culinary imagery with custom prompt controls via Google Gemini.
- **Conversational Meal Assistant:** Multi-tier AI chatbot answers questions about dishes, ingredients, dietary requirements, and meal planning.

---

## 🚀 Quickstart & Installation Guide

### Prerequisites
Before running the application, make sure your machine has:
- **Node.js**: `v18.x` or later ([Download Node.js](https://nodejs.org/))
- **npm** (included with Node.js) or **pnpm** / **yarn**
- **Git** ([Download Git](https://git-scm.com/))
- A free **MongoDB Atlas** account ([Sign Up](https://cloud.mongodb.com/))

---

### Step 1: Clone the Repository
```bash
git clone <your-repository-url>
cd Food-Flow-Food-Delivery-Platform
```

---

### Step 2: Backend Server Setup
Open a terminal in the `Server` directory:
```bash
cd Server

# 1. Install backend dependencies
npm install

# 2. Create your environment configuration file
cp .env.example .env

# 3. Configure your keys in Server/.env (see Environment Guide below)

# 4. Start the server in development mode
npm run dev
```
The server will start listening at:
- 🚀 **API Base:** `http://localhost:5000`
- 💓 **Health Check:** `http://localhost:5000/health`

---

### Step 3: Frontend Client Setup
Open a second terminal in the `Client` directory:
```bash
cd Client

# 1. Install frontend dependencies
npm install

# 2. Create your environment configuration file
cp .env.example .env

# 3. Configure your keys in Client/.env (see Environment Guide below)

# 4. Start the Next.js development server
npm run dev
```
Open your browser and navigate to:
- 🌐 **Web Application:** `http://localhost:3000`

---

## 🔐 Environment Variable Setup

Both the **Client** and **Server** require environment configuration. Below is the comprehensive guide to obtaining each key:

### 1. MongoDB Database Connection (`MONGODB_URI`)
- **Applies to:** `Client/.env` & `Server/.env`
- **Where to get:** [MongoDB Atlas](https://cloud.mongodb.com/)
- **Setup Steps:**
  1. Register or log in to MongoDB Atlas.
  2. Create a free shared cluster (M0 tier).
  3. Under **Security ➔ Database Access**, create a user (e.g. `foodflow_admin`) with a password.
  4. Under **Security ➔ Network Access**, click **Add IP Address** and choose **Allow Access from Anywhere** (`0.0.0.0/0`) for development.
  5. Under **Deployment ➔ Database**, click **Connect** ➔ **Drivers** ➔ Copy the Connection String.
     ```env
     MONGODB_URI=mongodb+srv://foodflow_admin:YOUR_PASSWORD@cluster0.mongodb.net/?retryWrites=true&w=majority
     DB_NAME=food-delivery-platform
     ```

### 2. Authentication & JWT Secrets (`BETTER_AUTH_SECRET`, `JWT_SECRET`)
- **Applies to:** `Client/.env` & `Server/.env`
- **Where to get:** Generate locally via terminal or OpenSSL:
  ```bash
  # In PowerShell:
  -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
  ```
  Paste the output into:
  ```env
  BETTER_AUTH_SECRET=your_generated_32_character_key_here
  BETTER_AUTH_URL=http://localhost:3000
  NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
  JWT_SECRET=your_generated_32_character_key_here
  ```

### 3. Razorpay Payments (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`)
- **Applies to:** `Client/.env` & `Server/.env`
- **Where to get:** [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys)
- **Setup Steps:**
  1. Create a free Razorpay account and switch to **Test Mode**.
  2. Navigate to **Account & Settings ➔ API Keys**.
  3. Click **Generate Test Key**.
  4. Copy **Key ID** (`rzp_test_...`) and **Key Secret** and add them:
     ```env
     RAZORPAY_KEY_ID=rzp_test_your_key_id
     RAZORPAY_KEY_SECRET=your_razorpay_secret
     NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
     ```

### 4. Google Gemini AI Vision (`GEMINI_API_KEY`)
- **Applies to:** `Client/.env` & `Server/.env`
- **Where to get:** [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Setup Steps:**
  1. Sign in to Google AI Studio.
  2. Click **Create API Key**.
  3. Add the key:
     ```env
     GEMINI_API_KEY=your_gemini_api_key_here
     ```

### 5. Conversational LLM Engine (`GROQ_API_KEY` / `OPENROUTER_API_KEY`)
- **Applies to:** `Client/.env` & `Server/.env`
- **Where to get:** [Groq Console](https://console.groq.com/) or [OpenRouter](https://openrouter.ai/)
- **Setup Steps:**
  ```env
  GROQ_API_KEY=gsk_your_groq_key
  OPENROUTER_API_KEY=sk-or-v1-your_openrouter_key
  OPENROUTER_MODEL=deepseek/deepseek-chat
  ```

### 6. Email Notifications & OTP (`SMTP_HOST`, `SMTP_PASS`)
- **Applies to:** `Client/.env`
- **Where to get:** [Google Account App Passwords](https://myaccount.google.com/apppasswords)
  ```env
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=foodflow.support@gmail.com
  SMTP_PASS=your_16_digit_app_password
  EMAIL_FROM="Food Flow <foodflow.support@gmail.com>"
  ```

---

## 📲 How to Install FoodFlow as a PWA

### 🤖 On Android (Google Chrome)
1. Open Chrome and navigate to `http://localhost:3000` (or your production URL).
2. Look for the **"Install Food Flow App"** prompt banner at the bottom or click the **"Install App"** button in the header/footer.
3. Tap **Install**. The app will be added to your home screen with its custom splash screen and standalone display.

### 🍏 On iPhone / iPad (Safari)
1. Open Safari and navigate to your FoodFlow URL.
2. Tap the **Share** button (box with an upward arrow) at the bottom of the screen.
3. Scroll down and tap **"Add to Home Screen"**.
4. Confirm by tapping **Add**. The FoodFlow icon will appear on your home screen.

### 💻 On Desktop (Chrome / Edge)
1. In Google Chrome or Microsoft Edge, look for the **Install App icon** in the right side of the address bar.
2. Click **Install**. FoodFlow will open in its own dedicated, clean window without browser address bars.

---

## 🚀 GitHub Code Push Guide

Follow these exact steps to push this project to a new GitHub repository cleanly and securely:

### 1. Verify Ignored Files
Ensure sensitive files (`.env`, `node_modules`, `.next`, `dist`) are ignored:
```bash
# Check git status to confirm .env files are NOT listed
git status
```

### 2. Initialize Git & Create Initial Commit
From the root directory (`Food-Flow-Food-Delivery-Platform`):
```bash
# Initialize git repository
git init

# Add all project files
git add .

# Check staged files
git status

# Commit the changes
git commit -m "feat: complete FoodFlow PWA platform with Swiggy UI, live GPS tracking, and AI concierge"
```

### 3. Connect to GitHub & Push
Create a new empty repository on [GitHub](https://github.com/new) (do **not** check "Initialize with README"), then run:
```bash
# Rename the primary branch to main
git branch -M main

# Add your GitHub repository remote URL
git remote add origin https://github.com/<your-username>/<your-repo-name>.git

# Push the code to GitHub
git push -u origin main
```

---

## 🧪 NPM Scripts Overview

### Client Scripts
```bash
npm run dev      # Launch Next.js dev server on http://localhost:3000
npm run build    # Create optimized Next.js production build
npm run start    # Start production server
npm run lint     # Run ESLint rules
```

### Server Scripts
```bash
npm run dev      # Start server with TSX watch on http://localhost:5000
npm run build    # Compile TypeScript into JavaScript (dist/)
npm run start    # Start compiled production server (dist/server.js)
```

---

## 🏢 Support & Official Contact

- **Headquarters:** Berhampur, Odisha, India (`19.3150° N, 84.7941° E`)
- **Toll-Free Helpline:** `+91 1800-202-3344` (24/7 Customer & Rider Support)
- **Official Support Email:** `foodflow.support@gmail.com`
- **Live Status:** Online & Monitored 24/7

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).

<div align="center">

## 👨‍💻 Author

**K Tirumala Achari**  
Full Stack Developer | Aspiring Software Engineer

<a href="mailto:ktirumalachari@gmail.com">
  <img src="https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Gmail"/>
</a>
<a href="https://www.linkedin.com/in/k-tirumala-achari-921106307/">
  <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/>
</a>
<a href="https://github.com/ktirumalaachari">
  <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
</a>
<a href="https://www.ktirumalaachari.me">
  <img src="https://img.shields.io/badge/Portfolio-FF6B35?style=for-the-badge&logo=firefox&logoColor=white" alt="Portfolio"/>
</a>
<br/><br/>

> _"Passionate about building impactful, user-centric solutions through technology,_
> _committed to continuous learning and innovation."_

<div align="center">
**⭐ If you found this project helpful or inspiring, please give it a star! ⭐**

<br/>
Made with ❤️ by **K Tirumala Achari**

[![GitHub](https://img.shields.io/badge/GitHub-ktirumalaachari-blue?style=flat&logo=github)](https://github.com/ktirumalaachari)

</div>