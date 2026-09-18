# SIH Tracker 2026
### Real-Time Smart India Hackathon Problem Statement Submission Tracker

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black.svg?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248.svg?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![ntfy](https://img.shields.io/badge/Notifications-ntfy.sh-0099FF.svg?style=flat&logo=pushbullet)](https://ntfy.sh)

SIH Tracker is a production-grade web application and background monitoring engine designed to continuously track Smart India Hackathon (SIH 2026) Problem Statement submission counts in real time.

When a monitored Problem Statement reaches or crosses a user's custom submission threshold (e.g. `SIH26171` reaching `50/500`), the application immediately delivers a push notification to the user's phone via **ntfy**.

---

## 🌟 Key Features

- **⚡ Live SIH Data Scraper**: Directly fetches and parses `https://sih.gov.in/sih2026PS` using Cheerio. Evaluates all ~240+ Problem Statements in a single request in under 2 seconds.
- **🔄 Continuous Background Monitoring**: Dedicated background worker (`worker/index.ts`) polls SIH continuously independent of whether the web app is open.
- **🔔 Phone Push Alerts via ntfy**: Delivers instant push alerts to Android/iOS devices without requiring expensive SMS or proprietary push infrastructure.
- **🛡️ Duplicate Notification Prevention**: State persistence in MongoDB ensures users receive notifications **exactly once** per target threshold.
- **📊 Modern Glassmorphic Dashboard**: View live submitted counts (`26/500`), target thresholds, submissions remaining, progress bars, and status indicators.
- **👥 Multi-User & Multi-Tracker**: Supports multiple users with unique notification topics tracking the same or different Problem Statements with independent thresholds.
- **🛠️ Built-in Test Suite**: Safe development & demo utilities for testing scraper, threshold detection, and phone alert delivery.

---

## 🏗️ System Architecture

```
                       ┌──────────────────────────────────────┐
                       │  SIH 2026 Official Website           │
                       │  https://sih.gov.in/sih2026PS        │
                       └──────────────────┬───────────────────┘
                                          │
                               1 Fetch per Cycle
                                          │
                       ┌──────────────────▼───────────────────┐
                       │  Background Monitoring Worker        │
                       │  (worker/index.ts / monitorService)  │
                       └──────────────────┬───────────────────┘
                                          │
                  ┌───────────────────────┼───────────────────────┐
                  │ Evaluates Thresholds  │ Updates DB State      │
                  ▼                       ▼                       ▼
      ┌───────────────────────┐ ┌──────────────────┐ ┌─────────────────────────┐
      │ ntfy Push Gateway     │ │ MongoDB Database │ │ Next.js Web App         │
      │ https://ntfy.sh       │ │ Trackers, Users  │ │ React Dashboard & APIs  │
      └───────────┬───────────┘ └──────────────────┘ └─────────────────────────┘
                  │
                  ▼
      ┌───────────────────────┐
      │ User Mobile Phone     │
      │ (ntfy Android/iOS)    │
      └───────────────────────┘
```

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- Node.js v18+ & npm 9+
- MongoDB running locally (`mongodb://127.0.0.1:27017/sih_tracker`) or MongoDB Atlas URI

### 1. Clone & Install Dependencies
```bash
cd "l:\Smart India Hackathon\Tracker"
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Example `.env.local`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/sih_tracker
NEXTAUTH_SECRET=sih-tracker-super-secret-key-32chars-min
NEXTAUTH_URL=http://localhost:3000
NTFY_SERVER_URL=https://ntfy.sh
POLL_INTERVAL_MS=30000
DEMO_MODE=false
```

### 3. Run Development Server & Worker
You can run the web server and background monitoring worker together or in separate terminals:

**Option A: Run Both Together**
```bash
npm run dev:all
```

**Option B: Run Independently**
Terminal 1 (Web Dashboard & APIs):
```bash
npm run dev
```

Terminal 2 (Continuous Background Monitoring Worker):
```bash
npm run worker
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 Setting Up ntfy Phone Notifications

1. **Install ntfy App**: Install **ntfy** from Google Play Store or Apple App Store.
2. **Subscribe to Topic**:
   - Open ntfy -> tap `+` (Subscribe to topic).
   - Enter your topic name (e.g. `sanjay-sih-alert-7x92k4`).
3. **Configure in SIH Tracker**:
   - Open SIH Tracker -> Go to **Notification Settings** (`/settings`).
   - Enter your topic name and click **Save Topic**.
4. **Send Test Alert**:
   - Click **Send Test Notification** in settings to verify instant phone delivery!

---

## 🧪 Testing Utilities

The application includes standalone test scripts to verify every layer:

### Test 1: Live SIH Scraper Test
Fetches live SIH data, extracts sample PS counts (`SIH26171`, `SIH26001`, `SIH26005`, `SIH26106`, `SIH26196`), and prints parsed output:
```bash
npm run test:scraper
```

### Test 2: ntfy Notification Delivery Test
Sends a test verification message and simulated threshold alert to ntfy topic:
```bash
npm run test:notification your-topic-name
```

---

## 📂 Project Structure

```
Tracker/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── trackers/route.ts
│   │   ├── trackers/[id]/route.ts
│   │   ├── trackers/preview/route.ts
│   │   ├── notifications/route.ts
│   │   ├── notifications/test/route.ts
│   │   └── system/route.ts
│   ├── auth/signin/page.tsx
│   ├── dashboard/page.tsx
│   ├── settings/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AddTrackerModal.tsx
│   ├── EditTrackerModal.tsx
│   ├── TrackerCard.tsx
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── Providers.tsx
├── lib/
│   ├── auth.ts
│   └── mongodb.ts
├── models/
│   ├── User.ts
│   ├── Tracker.ts
│   └── SubmissionSnapshot.ts
├── services/
│   ├── sihScraper.ts
│   ├── notificationService.ts
│   └── monitorService.ts
├── worker/
│   └── index.ts
├── scripts/
│   ├── testScraper.ts
│   └── testNotification.ts
├── .env.example
├── package.json
└── README.md
```

---

## 🌐 Production Deployment Architecture

Because serverless environments (e.g., Vercel API routes) terminate after HTTP responses, deploy the system using this recommended architecture:

1. **Frontend & REST API**: Deploy to **Vercel** or **Netlify**.
2. **Database**: **MongoDB Atlas** (Free M0 or Shared Cluster).
3. **Background Worker**: Deploy `npm run worker` to **Render** (Background Worker service), **Railway**, or **Fly.io**.
4. **Notifications**: **ntfy.sh** public gateway or self-hosted ntfy server.
