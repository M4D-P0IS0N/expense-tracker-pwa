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
| 📱 **PWA Ready** | Installable on iOS and Android — cached shell; cloud transactions require a connection |
| 🔒 **Row Level Security** | Each user's data is isolated at the database level |

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla JavaScript, HTML5, Tailwind CSS 3 (compiled locally at build time)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Backend/Auth:** [Supabase](https://supabase.com/) (PostgreSQL + Auth + RLS)
- **Hosting:** GitHub Pages via GitHub Actions CI/CD
- **Design:** Glassmorphism, neural background animations, detailed RPG avatar system

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20.19+ or 22.12+ (CI uses Node 22)
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

# Apply the Supabase schema / migrations, including RLS policies
# Fresh project: run supabase_schema.sql, then
# supabase_migration_user_profiles_bootstrap.sql.
# Existing project: apply only missing versioned migrations.
# This release adds supabase_migration_atomic_transaction_edit.sql.
# Never run a fresh schema over an existing database.

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
- Any table exposed in the `public` schema must have **RLS enabled and explicit policies**
- Service Worker **excludes Supabase API calls** from caching
- Auth Guard redirects unauthenticated users to the login page

---

## 📄 License

This project is for personal use. Feel free to fork and adapt for your own needs.


## Reliability, backups and releases

- `AGENTS.md` is the common project policy. Before broad changes, preserve a verified Git tag or source ZIP; after validation, build, commit and push automatically. GitHub Pages runs tests before building/deploying.
- Recovery point before the September 2026 audit fixes: `backup/pre-audit-fixes-20260916` (`64038e9`). Prefer `git revert <release-commit>` for code recovery; test/build before pushing. Git does not restore financial data.
- Browser budgets, savings goals, RPG profile, notes and preferences are scoped to the signed-in account. On first upgrade, the app asks whether unidentified legacy data belongs to that account. Original keys remain as a recovery copy; existing scoped values are preserved.
- Export JSON before restoring a backup. Backup format 1.1 retains compatibility with 1.0. Import validates the whole file (maximum 25 MB), previews section counts before confirmation, accepts only application data keys, and never replaces authentication/session keys. Legacy deletion queues are recognized but never replayed. Cloud writes remain sequential: a failure lists completed sections and may leave earlier batches restored; retrying uses upserts.
- Installment edits run in one Supabase transaction under the caller's RLS. Legacy installments are linked only when purchase metadata and month offsets match. Ambiguous duplicates and legacy recurring series without a group are rejected for manual review. Reducing the total requires explicitly deleting excess installments first; editing never silently deletes financial rows.
- Calibration requires successful cloud persistence. Transaction reads and backups paginate beyond the API page limit; failures are not reported as empty data or a zero balance.
- Notes retain a local copy and attempt cloud synchronization. The save label explicitly confirms device storage; inspect connectivity before relying on another device.
- Password recovery is unchanged; it remains managed through Supabase for this personal app.

Run `npm test` and `npm run build` inside `pwa-frontend`. Regression tests exercise real DOM rendering, malformed backups, account isolation, pagination and persistence errors. `npm audit` checks known dependency advisories.

The Tailwind build follows the [official PostCSS integration](https://v3.tailwindcss.com/docs/installation/using-postcss); there is no runtime Tailwind CDN script.
