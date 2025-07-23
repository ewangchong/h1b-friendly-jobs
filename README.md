# H1B Friendly Jobs Platform

🚀 **A comprehensive platform helping H1B visa holders find employment opportunities with H1B-friendly companies.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Available-brightgreen)](https://jv64avhgc9jw.space.minimax.io)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18+-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com/)

## 🌟 Features

- **🔍 Smart Job Search** - AI-powered matching with H1B sponsorship likelihood
- **📊 Real-time Data** - Live updates from USCIS and Department of Labor sources
- **🏢 Company Profiles** - Detailed H1B sponsorship history and approval rates
- **💾 Save Jobs** - Personal job tracking and application management
- **📈 Statistics Dashboard** - Comprehensive H1B market insights
- **👥 Community Features** - User feedback and job verification system
- **🔐 Secure Authentication** - User accounts and data protection

## 📁 Repository Structure

**📋 [View Detailed Folder Structure Guide](FOLDER_STRUCTURE.md)**

```
h1b-friendly-jobs/                 # 🏠 Project Root
├── 📁 src/                        # 🎨 Frontend Source Code
│   ├── components/ pages/ lib/    # React components, routes, utilities
│   ├── hooks/ contexts/           # Custom hooks, context providers
├── 📁 config/                     # ⚙️ Configuration Files
│   ├── vite.config.ts            # Build tool configuration
│   ├── tailwind.config.js        # Tailwind CSS config
│   ├── tsconfig*.json            # TypeScript configurations
│   └── eslint.config.js          # Linting rules
├── 📁 scripts/                   # 🚀 Deployment & Setup Scripts
│   ├── deploy-aws.sh             # AWS deployment automation
│   ├── amplify.yml               # AWS Amplify config
│   └── setup-local.sh            # Environment setup
├── 📁 docs/                      # 📚 Documentation
├── 📁 supabase/                  # 🗄️ Backend & Database
│   ├── tables/ migrations/       # Database schemas & migrations
│   ├── functions/                # Serverless edge functions
│   └── cron_jobs/                # Scheduled job configurations
├── 📁 public/                    # 🌐 Static assets
├── 📁 dist/                      # 📦 Build output (auto-generated)
└── 📄 Core files (package.json, README.md, etc.)
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **npm** (or **pnpm**)
- **Supabase** account and project
- **Git** for version control

### 1. Clone Repository

```bash
git clone https://github.com/ewangchong/h1b-friendly-jobs.git
cd h1b-friendly-jobs
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Environment Setup

```bash
# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your Supabase credentials
nano .env.local
```

**Required Environment Variables:**
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup

Set up your Supabase database using the provided schemas:

```bash
# Apply database migrations
cd supabase
supabase db reset
supabase db push
```

### 5. Run Development Server

```bash
npm run dev
# or
pnpm dev
```

Visit `http://localhost:5173` to see the application.

## 📦 Deployment Options

### Option 1: AWS Amplify (Recommended)

**Easiest deployment with automatic CI/CD from GitHub:**

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **AWS Amplify Console:**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Click "New app" → "Host web app"
   - Connect your GitHub repository
   - Branch: `main`
   - Build settings: Auto-detected (uses `amplify.yml`)

3. **Environment Variables:**
   Add in Amplify Console → App settings → Environment variables:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Custom Domain:**
   - Domain management → Add domain
   - Point `h1bfriendly.com` to your Amplify app

### Option 2: Manual AWS Deployment

**Using the provided AWS deployment script:**

```bash
# Make script executable
chmod +x deploy-aws.sh

# Set AWS credentials
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1

# Deploy
./deploy-aws.sh
```

### Option 3: Vercel

**Quick deployment to Vercel:**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Option 4: Netlify

**Deploy to Netlify:**

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist/` folder to Netlify
3. Set environment variables in Netlify dashboard

## 🏗️ Build Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🗂️ Folder Details

### `/src/` - Frontend Application

| Folder | Purpose | Key Files |
|--------|---------|-----------|
| `components/` | Reusable UI components | `JobCard.tsx`, `Header.tsx`, `Footer.tsx` |
| `components/admin/` | Admin panel components | `JobManagement.tsx`, `JobEditor.tsx` |
| `components/ui/` | Base UI components | `button.tsx` (shadcn/ui) |
| `pages/` | Application routes/pages | `HomePage.tsx`, `JobsPage.tsx`, `ProfilePage.tsx` |
| `lib/` | Utilities and configurations | `supabase.ts`, `utils.ts` |
| `hooks/` | Custom React hooks | `use-mobile.tsx` |
| `contexts/` | React context providers | `AuthContext.tsx` |

### `/supabase/` - Backend Infrastructure

| Folder | Purpose | Key Files |
|--------|---------|-----------|
| `tables/` | Database schemas | `jobs.sql`, `companies.sql`, `profiles.sql` |
| `migrations/` | Database migrations | `*_setup_rls_policies.sql` |
| `functions/` | Serverless edge functions | `job-data-processor/`, `scraping-orchestrator/` |
| `cron_jobs/` | Scheduled job configs | `job_1.json` |

### `/docs/` - Documentation

| File | Purpose |
|------|---------|
| `AWS_Deployment_Guide.md` | Detailed AWS deployment instructions |
| `Technical_Architecture_Final.md` | System architecture documentation |
| `Quick_Start_Guide.md` | Getting started guide |
| `Admin_Setup_Instructions.md` | Admin panel setup |

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite build tool configuration |
| `tailwind.config.js` | Tailwind CSS styling configuration |
| `tsconfig.json` | TypeScript compiler configuration |
| `eslint.config.js` | Code linting rules |
| `package.json` | Dependencies and npm scripts |
| `.env.local.example` | Environment variables template |
| `amplify.yml` | AWS Amplify build configuration |

## 🔐 Security Features

- **Environment Variables** - Sensitive data protected via environment variables
- **Row Level Security** - Database-level access control
- **Authentication** - Secure user authentication via Supabase Auth
- **API Keys** - Secured backend API endpoints
- **HTTPS Only** - All production deployments use SSL

## 📊 Database Schema

### Core Tables
- **`jobs`** - Job listings with H1B sponsorship data
- **`companies`** - Company profiles and H1B history
- **`profiles`** - User profiles and preferences
- **`saved_jobs`** - User's saved job listings
- **`h1b_history`** - Historical H1B petition data

## 🔄 Data Pipeline

The platform includes automated data collection:

1. **Web Scraping** - Job data from major job boards
2. **Government Data** - USCIS and DOL public records
3. **Data Processing** - AI-powered H1B classification
4. **Real-time Updates** - Continuous data refresh via cron jobs

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation:** Check the `/docs/` folder for detailed guides
- **Issues:** Report bugs via GitHub Issues
- **Community:** Join our Discord community (link coming soon)

## 🌐 Live Demo

Visit the live application: **[H1B Friendly Jobs](https://jv64avhgc9jw.space.minimax.io)**

---

**Built with ❤️ for the H1B community**

*Helping international professionals find their dream jobs in the United States.*
