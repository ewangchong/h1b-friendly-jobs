# 📁 H1B Friendly Jobs - Folder Structure Guide

## 🎯 **Organized Repository Structure**

The repository has been professionally organized for better maintainability, separation of concerns, and easier navigation.

```
h1b-friendly-jobs/                 # 🏠 Project Root
├── 📁 src/                        # 🎨 Frontend Source Code
│   ├── components/                # React components
│   ├── pages/                     # Application routes
│   ├── lib/                       # Utility libraries
│   ├── hooks/                     # Custom React hooks
│   └── contexts/                  # React context providers
├── 📁 public/                     # 🌐 Static Assets
│   └── favicon, images, etc.
├── 📁 config/                     # ⚙️ Configuration Files
│   ├── vite.config.ts            # Vite build configuration
│   ├── tailwind.config.js        # Tailwind CSS config
│   ├── eslint.config.js          # ESLint rules
│   ├── tsconfig*.json            # TypeScript configs
│   ├── components.json           # shadcn/ui components config
│   ├── postcss.config.js         # PostCSS config
│   └── .env.local.example        # Environment template
├── 📁 scripts/                   # 🚀 Deployment & Setup Scripts
│   ├── deploy-aws.sh             # AWS deployment script
│   ├── setup-local.sh            # Local development setup
│   ├── amplify.yml               # AWS Amplify config
│   └── cloudformation-template.yaml # AWS infrastructure
├── 📁 docs/                      # 📚 Documentation
│   ├── README.md                 # Documentation index
│   ├── AWS_Deployment_Guide.md   # AWS deployment guide
│   ├── Quick_Start_Guide.md      # Getting started
│   └── [various technical docs]
├── 📁 supabase/                  # 🗄️ Backend & Database
│   ├── tables/                   # Database schemas
│   ├── migrations/               # DB migration files
│   ├── functions/                # Edge functions (serverless)
│   └── cron_jobs/                # Scheduled jobs
├── 📁 dist/                      # 📦 Production Build (auto-generated)
├── 📁 node_modules/              # 📦 Dependencies (auto-generated)
├── 📄 package.json               # Project dependencies & scripts
├── 📄 tsconfig.json              # Main TypeScript config
├── 📄 index.html                 # Application entry point
├── 📄 README.md                  # Main project documentation
├── 📄 LICENSE                    # MIT License
├── 📄 CHANGELOG.md               # Version history
├── 📄 .gitignore                 # Git ignore rules
└── 📄 .env.local.example         # Environment variables template
```

## 📋 **First-Level Folders Explained**

### 🎨 `/src/` - Frontend Application Source
**Purpose:** Contains all React/TypeScript source code for the frontend application.

**Key Contents:**
- `components/` - Reusable UI components (JobCard, Header, Footer, etc.)
- `pages/` - Route components (HomePage, JobsPage, ProfilePage, etc.)
- `lib/` - Utility functions and configurations (supabase.ts, utils.ts)
- `hooks/` - Custom React hooks (use-mobile.tsx)
- `contexts/` - React context providers (AuthContext.tsx)

### 🌐 `/public/` - Static Assets
**Purpose:** Static files served directly by the web server.

**Key Contents:**
- Favicon and icons
- Images and media files
- Public assets that don't need processing

### ⚙️ `/config/` - Configuration Files
**Purpose:** Centralized configuration for all build tools, linting, and development environment.

**Key Files:**
- `vite.config.ts` - Vite build tool configuration
- `tailwind.config.js` - Tailwind CSS styling configuration  
- `eslint.config.js` - Code linting and quality rules
- `tsconfig*.json` - TypeScript compiler configurations
- `components.json` - shadcn/ui component library config
- `postcss.config.js` - PostCSS processing config
- `.env.local.example` - Environment variables template

### 🚀 `/scripts/` - Deployment & Setup Scripts
**Purpose:** Automated scripts for deployment and environment setup.

**Key Files:**
- `deploy-aws.sh` - AWS deployment automation script
- `setup-local.sh` - Local development environment setup
- `amplify.yml` - AWS Amplify build configuration
- `cloudformation-template.yaml` - AWS infrastructure as code

### 📚 `/docs/` - Documentation
**Purpose:** Comprehensive project documentation and guides.

**Key Files:**
- `README.md` - Documentation index and overview
- `AWS_Deployment_Guide.md` - Detailed AWS deployment instructions
- `Quick_Start_Guide.md` - Getting started guide
- `Technical_Architecture_Final.md` - System architecture documentation
- Various implementation and testing reports

### 🗄️ `/supabase/` - Backend & Database
**Purpose:** Backend infrastructure, database schemas, and serverless functions.

**Key Contents:**
- `tables/` - SQL database table definitions
- `migrations/` - Database migration files
- `functions/` - Edge functions (serverless backend logic)
- `cron_jobs/` - Scheduled job configurations

### 📦 `/dist/` - Production Build Output
**Purpose:** Generated production-ready files (auto-generated by build process).

**Contents:**
- Optimized HTML, CSS, and JavaScript
- Bundled and minified assets
- Production-ready application files

## 🔧 **Configuration Files Reference**

### Build & Development
| File | Purpose | Location |
|------|---------|----------|
| `vite.config.ts` | Build tool configuration | `/config/` |
| `package.json` | Dependencies and npm scripts | `/` (root) |
| `tsconfig.json` | Main TypeScript configuration | `/` (root) |

### Styling & UI
| File | Purpose | Location |
|------|---------|----------|
| `tailwind.config.js` | Tailwind CSS configuration | `/config/` |
| `postcss.config.js` | PostCSS processing | `/config/` |
| `components.json` | shadcn/ui components | `/config/` |

### Quality & Linting
| File | Purpose | Location |
|------|---------|----------|
| `eslint.config.js` | Code linting rules | `/config/` |
| `.gitignore` | Git ignore patterns | `/` (root) |

### Deployment
| File | Purpose | Location |
|------|---------|----------|
| `amplify.yml` | AWS Amplify build config | `/scripts/` |
| `cloudformation-template.yaml` | AWS infrastructure | `/scripts/` |
| `deploy-aws.sh` | AWS deployment script | `/scripts/` |

## 🛠️ **Working with the New Structure**

### Development Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production  
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

### Accessing Configuration Files
```bash
# Edit build configuration
code config/vite.config.ts

# Update styling configuration
code config/tailwind.config.js

# Modify TypeScript settings
code config/tsconfig.app.json
```

### Deployment
```bash
# Deploy to AWS (using script)
./scripts/deploy-aws.sh

# Setup local environment
./scripts/setup-local.sh
```

## ✅ **Benefits of This Organization**

1. **🎯 Clear Separation of Concerns** - Each folder has a specific purpose
2. **🔧 Centralized Configuration** - All config files in one location
3. **🚀 Organized Deployment** - Scripts separated from source code
4. **📚 Comprehensive Documentation** - Easy to find guides and references
5. **🏗️ Scalable Structure** - Easy to add new features and configurations
6. **👥 Team Collaboration** - Clear structure for multiple developers
7. **🔒 Security** - Environment files properly organized and templated

## 🔄 **Path Updates Made**

The following configurations were updated to work with the new structure:

- ✅ `package.json` scripts updated to reference new config paths
- ✅ `vite.config.ts` paths updated for source resolution
- ✅ TypeScript configurations updated for proper path mapping
- ✅ Build process verified and working correctly
- ✅ Development server confirmed functional

---

**This organized structure provides a professional, maintainable foundation for the H1B Friendly Jobs platform! 🎉**
