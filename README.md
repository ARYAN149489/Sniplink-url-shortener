# ⚡ SnipLink — URL Shortener with Analytics

A full-stack URL shortener web application with user authentication, real-time click analytics, QR code generation, and a beautiful dark-themed UI.

## 🎯 Features

- **URL Shortening** — Paste a long URL, get a short link instantly
- **Custom Aliases** — Choose your own branded short link slug
- **Click Analytics** — Track clicks over time with interactive charts
- **Device & Browser Tracking** — See what devices, browsers, and OS your visitors use
- **Referrer Tracking** — Know where your traffic comes from
- **QR Code Generation** — Auto-generated QR code for every short link
- **User Authentication** — JWT-based register/login with bcrypt password hashing
- **Guest Mode** — Shorten URLs without an account (limited features)
- **Link Expiration** — Set links to auto-expire after a specified time
- **Link Management** — Search, edit, and delete your links
- **Responsive Design** — Works beautifully on desktop and mobile
- **Dark Theme** — Modern glassmorphism UI with smooth animations

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js + Express.js** | Backend REST API |
| **MongoDB + Mongoose** | Database & ODM |
| **JWT + bcryptjs** | Authentication & password hashing |
| **Vanilla HTML/CSS/JS** | Frontend (no framework) |
| **Chart.js** | Analytics charts |
| **QRCode.js** | QR code generation |
| **ua-parser-js** | User-agent parsing for analytics |

## 📁 Project Structure

```
url-shortener/
├── backend/
│   ├── config/db.js          # MongoDB connection
│   ├── middleware/auth.js     # JWT authentication middleware
│   ├── models/
│   │   ├── User.js           # User schema
│   │   ├── Url.js            # URL schema
│   │   └── Click.js          # Click analytics schema
│   ├── routes/
│   │   ├── auth.js           # Auth routes (register/login)
│   │   ├── url.js            # URL CRUD routes
│   │   └── analytics.js      # Analytics routes
│   ├── utils/generateCode.js # Short code generator
│   ├── server.js             # Express app entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── index.html            # Landing page + shortener
│   ├── dashboard.html        # Analytics dashboard
│   ├── login.html            # Login page
│   ├── signup.html           # Signup page
│   ├── css/styles.css        # Design system + all styles
│   └── js/
│       ├── api.js            # API fetch wrapper
│       ├── auth.js           # Auth logic
│       ├── app.js            # Main app logic
│       └── dashboard.js      # Dashboard logic
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher) — [Download](https://nodejs.org/)
- **MongoDB Atlas** account (free) — [Sign up](https://www.mongodb.com/atlas)
- **Git** — [Download](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/sniplink.git
cd sniplink
```

### 2. Setup MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas) and create a free account
2. Create a new **Free Shared Cluster** (M0)
3. Under **Database Access**, create a new database user with a password
4. Under **Network Access**, click "Allow Access from Anywhere" (or add your IP)
5. Click **Connect** → **Connect your application** → copy the connection string
6. Replace `<password>` in the connection string with your database user's password

### 3. Configure Backend

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your values:
# - Paste your MongoDB connection string
# - Set a JWT secret (any long random string)
```

Your `.env` file should look like:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/sniplink?retryWrites=true&w=majority
JWT_SECRET=my-super-secret-key-change-this-to-something-random
PORT=5000
FRONTEND_URL=http://localhost:3000
BASE_URL=http://localhost:5000
```

### 4. Install Dependencies & Start Backend

```bash
# Install dependencies
npm install

# Start the server
npm run dev
```

You should see:
```
🚀 SnipLink server running on http://localhost:5000
✅ MongoDB connected: cluster0-shard-00-00.xxxxx.mongodb.net
```

### 5. Serve the Frontend

Open a new terminal and serve the frontend files. You can use any static file server:

```bash
# Option 1: Using npx (recommended)
cd frontend
npx serve -l 3000

# Option 2: Using Python
cd frontend
python3 -m http.server 3000

# Option 3: Using VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

### 6. Open the App

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create new account |
| `POST` | `/api/auth/login` | Login & get JWT token |
| `GET` | `/api/auth/me` | Get current user profile |

### URL Management

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/url/shorten` | Create short URL |
| `GET` | `/api/url/my-links` | Get user's links (paginated) |
| `DELETE` | `/api/url/:id` | Delete a link |
| `PATCH` | `/api/url/:id` | Update link settings |

### Analytics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics/overview` | Dashboard overview stats |
| `GET` | `/api/analytics/:code` | Detailed analytics for a link |

### URL Redirect

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/:code` | Redirect to original URL |

## 🌐 Deployment

### Backend → Render.com (Free)

1. Push your code to GitHub
2. Go to [render.com](https://render.com) and sign up
3. Click **New** → **Web Service**
4. Connect your GitHub repo
5. Configure:
   - **Name**: `sniplink-api`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
6. Add environment variables:
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — your JWT secret
   - `BASE_URL` — your Render URL (e.g., `https://sniplink-api.onrender.com`)
   - `FRONTEND_URL` — your frontend URL
7. Click **Create Web Service**

### Frontend → Netlify (Free)

1. Go to [netlify.com](https://netlify.com) and sign up
2. Click **Add new site** → **Import an existing project**
3. Connect your GitHub repo
4. Configure:
   - **Base directory**: `frontend`
   - **Publish directory**: `frontend`
5. Click **Deploy site**

After deployment, update:
- Frontend's `api.js`: Change `BASE_URL` to your Render backend URL
- Backend's `.env`: Update `FRONTEND_URL` to your Netlify URL

### Alternative: Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel
```

## 🔮 Future Improvements

- [ ] Password reset functionality
- [ ] Social login (Google, GitHub)
- [ ] Custom domains
- [ ] Team/organization accounts
- [ ] API key authentication for programmatic access
- [ ] Bulk URL shortening
- [ ] UTM parameter builder
- [ ] Link-in-bio page
- [ ] Webhook notifications on clicks
- [ ] Rate limiting and abuse prevention

## 📝 Interview Talking Points

This project demonstrates:

1. **RESTful API Design** — Clean, documented endpoints with proper HTTP methods
2. **Database Modeling** — Three related schemas with indexes and references
3. **Authentication** — JWT tokens, bcrypt hashing, middleware pattern
4. **Data Visualization** — Real-time analytics with Chart.js
5. **Responsive Design** — Mobile-first CSS with modern techniques (glassmorphism, CSS Grid)
6. **Security** — Input validation, password hashing, CORS configuration
7. **Deployment** — Experience with cloud platforms and CI/CD

## 📄 License

MIT License — feel free to use this project for your portfolio!
