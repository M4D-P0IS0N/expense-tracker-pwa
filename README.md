<div align="center">

# 🐙 Expense Tracker PWA

A **gamified personal finance tracker** built as a Progressive Web App.  
Track expenses, set budgets, grow your avatar — all from your phone's home screen.

[![Deploy](https://github.com/M4D-P0IS0N/expense-tracker-pwa/actions/workflows/deploy.yml/badge.svg)](https://github.com/M4D-P0IS0N/expense-tracker-pwa/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://m4d-p0is0n.github.io/expense-tracker-pwa/)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 💰 **Transaction Management** | Log income and expenses with categories, credit card tags, and installment tracking |
| 📊 **Dashboard Analytics** | Real-time monthly overview with category breakdowns and credit card summaries |
| 🎯 **Budget Tracking** | Set per-category spending limits and monitor progress with visual indicators |
| 🏦 **Savings Goals** | Create savings "boxes" with targets, deposits, and withdrawals |
| 🎮 **RPG Gamification** | Choose your avatar's gender and evolve (Peasant → Commoner → Noble → Ruler) by earning XP for financial actions |
| 📝 **Notebook** | Built-in note-taking with a line-diff viewer for tracking changes |
| 🔐 **Authentication** | Secure email/password auth with session persistence via Supabase |
| 📱 **PWA Ready** | Installable on iOS and Android — works offline with Service Worker caching |
| 🔒 **Row Level Security** | Each user's data is isolated at the database level |

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla JavaScript, HTML5, Tailwind CSS (CDN)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Backend/Auth:** [Supabase](https://supabase.com/) (PostgreSQL + Auth + RLS)
- **Hosting:** GitHub Pages via GitHub Actions CI/CD
- **Design:** Glassmorphism, neural background animations, detailed RPG avatar system

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- A [Supabase](https://supabase.com/) project with the `transactions` table

### Installation

```bash
# Clone the repo
git clone https://github.com/M4D-P0IS0N/expense-tracker-pwa.git
cd expense-tracker-pwa/pwa-frontend

# Install dependencies
npm install

# Create your environment file
cp .env.example .env
# Edit .env with your Supabase credentials

# Start the dev server
npm run dev
```

### Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous (public) key |

---

## 📁 Project Structure

```
pwa-frontend/
├── public/
│   ├── assets/sprites/    # High-quality avatar evolution stages (m/f)
│   ├── apple-touch-icon.png
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── manifest.json      # PWA manifest
│   └── sw.js              # Service Worker
├── src/
│   ├── services/
│   │   ├── AuthService.js          # Supabase authentication
│   │   ├── TransactionService.js   # CRUD with user-scoped queries
│   │   ├── GamificationService.js  # XP, leveling, achievements
│   │   ├── SavingsService.js       # Savings goals (localStorage)
│   │   ├── BudgetService.js        # Budget limits (localStorage)
│   │   ├── NotebookService.js      # Notes with diff tracking
│   │   └── supabaseClient.js       # Supabase client init
│   └── main.js            # App entry point & UI logic
├── index.html             # Main dashboard
├── login.html             # Authentication page
└── vite.config.js         # Vite build config (multi-page)
```

---

## 🔒 Security

- Environment variables are **never committed** — `.env` is in `.gitignore`
- Supabase credentials in production are injected via **GitHub Secrets**
- **Row Level Security (RLS)** ensures users can only access their own data
- Service Worker **excludes Supabase API calls** from caching
- Auth Guard redirects unauthenticated users to the login page

---

## 📄 License

This project is for personal use. Feel free to fork and adapt for your own needs.
