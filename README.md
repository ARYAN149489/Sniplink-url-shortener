# 🔗 SnipLink — Real-Time URL Shortener

[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-blue?style=for-the-badge&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-darkgreen?style=for-the-badge&logo=mongodb)](https://www.mongodb.com)
[![Deployment](https://img.shields.io/badge/Hosted-Vercel%20%26%20Render-blueviolet?style=for-the-badge)](https://snipplink.vercel.app/)

A high-performance, full-stack Single Page Application (SPA) that lets users shorten URLs, configure custom aliases, set link expiration, and view granular click metrics on an interactive dashboard.

🌐 **Live Demo:** [https://snipplink.vercel.app/](https://snipplink.vercel.app/)

---

## 🔍 Profile Analyst Review
> 💡 **Developer Profile Impact**: This repository serves as a high-signal engineering benchmark. It demonstrates strong REST API design patterns, clean separation of concerns, secure state tracking (JWT), and real-time visualization of aggregations (Chart.js) without relying on bloated libraries.

---

## ⚡ Key Highlights
* **Interactive Redirection & Analytics**: Tracks browser type, operating system, device model, and traffic referrers dynamically upon link usage.
* **Dual-Mode Access**: Unlocks full dashboard suites upon registration, while keeping standard anonymous shortening open to guest visitors.
* **Smart Index Optimization**: Uses unique MongoDB sparse indexes on custom domain slugs to prevent collisions while permitting empty properties.
* **Responsive Glassmorphic UI**: Styled with responsive dark-theme glassmorphic CSS animations for a premium user experience.

---

## 📁 Repository Map

```text
├── backend/
│   ├── models/        # User, Url, and Click schemas (MongoDB / Mongoose)
│   ├── routes/        # Auth, URL management, and aggregate analytics
│   └── server.js      # Express configuration & redirection engine
└── frontend/
    ├── src/
    │   ├── api/       # Centralized API client (Auto JWT injector)
    │   ├── context/   # Auth state distribution engine
    │   ├── components/# Reusable UI components (Navbar, Protected Routes, Footer)
    │   └── pages/     # Home dashboard, Login, Signup, and Redirect Handlers
```

---

## 🛠️ Local Installation

### 1. Backend Service
```bash
cd backend
npm install
npm run dev
```
*Requires `.env` with: `MONGODB_URI`, `JWT_SECRET`, `PORT=5002`, `FRONTEND_URL=http://localhost:3000`, `BASE_URL=http://localhost:5002`.*

### 2. Frontend React Client
```bash
cd frontend
npm install
npm run dev
```
*Compiles the SPA at `http://localhost:3000` with active proxy routing.*

---

## 🌐 Production Architecture
* **Frontend**: React client deployed via **Vercel** with client-side fallback rewrites (`vercel.json`).
* **Backend**: Express service hosted on **Render** (linked with MongoDB Atlas).
