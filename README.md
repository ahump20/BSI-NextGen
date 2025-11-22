# BSI-NextGen – Blaze Sports Intel Platform

A production-grade sports intelligence platform with **real-time data** from official APIs. Mobile‑first. No mock scores. No placeholder stats.

## 🔥 Key Features

- **Real Sports Data**  
  MLB Stats API, SportsDataIO for NFL/NBA, and official feeds (including ESPN) for NCAA.

- **College Baseball Priority**  
  Full box scores, batting/pitching lines, and series context – explicitly targeting gaps in mainstream coverage.

- **User Authentication (Auth0)**  
  OAuth 2.0 with Auth0, JWT-based sessions, and role-based access control for different user tiers.

- **Mobile-First Design**  
  Layouts and interactions optimized for phones and tablets; desktop is a first-class citizen but not the default assumption.

- **Real-Time Updates**  
  Live scores and stats with automatic refresh (default: every 30 seconds).

- **Professional Architecture**  
  TypeScript monorepo with `pnpm` workspaces and shared types between API and web.

- **Single Deployment Target: Cloudflare Pages**  
  All production deployments are done **only** through Cloudflare Pages.  
  Vercel, Netlify, and other providers are **not supported** for this project.

---

## 🏗️ Architecture

```text
bsi-nextgen/
├── packages/
│   ├── shared/          # Shared types and utilities
│   ├── api/             # Sports data adapters (MLB, NFL, NBA, NCAA, College Baseball)
│   └── web/             # Next.js web application (UI + routing)
├── .env.example         # Example environment configuration
├── .github/workflows/   # CI/CD – lint/test/build/deploy hooks
└── README.md
```

> Note: Any legacy deployment configs like `netlify.toml` or `vercel.json` are considered deprecated and should **not** be used for new deployments. Cloudflare Pages is the only supported provider.

---

## 🧰 Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js ≥ 18
- **Frontend:** Next.js (React)
- **Package Manager / Monorepo:** `pnpm` workspaces
- **Auth:** Auth0 (OAuth 2.0 / OpenID Connect)
- **Hosting / Deployment:** Cloudflare Pages (single provider)
- **CI/CD:** GitHub Actions (tests, build, deploy hooks)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18.0.0
- **pnpm** ≥ 8.0.0
- **SportsDataIO** account & API key (for NFL/NBA data)
- **MLB Stats API** access (for MLB data)
- **Auth0** tenant (for authentication)

### Installation

```bash
# Clone the repository
git clone https://github.com/ahump20/BSI-NextGen.git
cd BSI-NextGen

# Install dependencies for all workspaces
pnpm install

# Configure environment variables
cp .env.example .env
# Edit .env and add your API keys (see sections below)

# Build all packages
pnpm build

# Start development server
pnpm dev
```

By default, the web app runs at:  
`http://localhost:3000`

---

### Environment Configuration

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Open `.env` and populate the values. Use `.env.example` as the source of truth for:
   - Auth0 domain, client ID, and client secret
   - SportsDataIO API key(s)
   - Any MLB / NCAA / ESPN keys or secrets
   - App base URLs (local + production)

3. Restart the dev server after updating `.env`:

   ```bash
   pnpm dev
   ```

---

## 🔐 Authentication (Auth0)

The platform uses Auth0 for login and session management.

High-level setup:

1. **Create an Auth0 Tenant**
   - Go to https://auth0.com/
   - Sign up and create a new tenant

2. **Create an Application**
   - In Auth0 Dashboard: **Applications → Applications → Create Application**
   - Type: **Single Page Application** or **Regular Web App** (depending on the exact integration used in this repo)
   - Name it something like `BSI-NextGen`

3. **Configure Allowed URLs**
   - **Allowed Callback URLs:**  
     - `http://localhost:3000/*` for local development  
     - `https://<your-cloudflare-pages-domain>/*` for production
   - **Allowed Logout URLs:**  
     - Same hostnames as above
   - **Allowed Web Origins:**  
     - `http://localhost:3000`  
     - `https://<your-cloudflare-pages-domain>`

4. **Environment Variables**
   - In `.env`, set the Auth0 values referenced in `.env.example`, such as:
     - `AUTH0_DOMAIN=...`
     - `AUTH0_CLIENT_ID=...`
     - `AUTH0_CLIENT_SECRET=...`
     - `AUTH0_AUDIENCE=...` (if using API authorization)
   - Exact variable names should match what the app code and `.env.example` expect.

5. **Verify Locally**
   - Run `pnpm dev`
   - Hit `http://localhost:3000`, trigger login, and confirm Auth0 redirects and callbacks are working.

For detailed wiring, follow Auth0’s official Next.js / React quickstart and align it with the variables used in this repo.

---

## 📊 Data Providers

BSI-NextGen is built around **real** sports data:

- **MLB Stats API**
  - Used for MLB games, box scores, and advanced stats.
- **SportsDataIO**
  - Primary source for NFL and NBA schedules, scores, and player stats.
  - Requires a paid or trial API key.
- **NCAA / College Feeds (incl. ESPN)**
  - Used for college baseball and other NCAA data.
- **Rate Limits & Keys**
  - All keys are injected via environment variables.
  - Respect provider rate limits; the code is designed with caching and throttling points in mind.

Check provider docs for quota and pricing details before pushing a production workload.

---

## 🌐 Deployment – Cloudflare Pages (Only)

All production deployments are performed **exclusively via Cloudflare Pages**. Other providers (Vercel, Netlify, etc.) are not supported.

### 1. Create a Cloudflare Pages Project

1. Log into Cloudflare.
2. Go to **Pages → Create a project**.
3. Choose **Connect to Git** and select the `BSI-NextGen` repository.
4. When prompted:
   - **Framework preset:** `Next.js`
   - **Root directory:**  
     - Typically the repo root, or `packages/web` if the Next.js app lives there.
   - **Build command:**  
     - Use the root build script defined in `package.json`, e.g.:
       ```bash
       pnpm install && pnpm build
       ```
     - This will build all workspaces (including the web client).
   - **Output directory:**  
     - Leave the default that Cloudflare sets for the Next.js preset, unless your configuration explicitly documents otherwise.

5. Select **Production branch** (usually `main`).

### 2. Configure Environment Variables in Cloudflare

Under your Cloudflare Pages project:

1. Go to **Settings → Environment Variables**.
2. Mirror the same variables you use in `.env` for:
   - Auth0 (`AUTH0_*`)
   - SportsDataIO keys
   - Any other API secrets
3. Add variables for:
   - `APP_BASE_URL=https://<your-cloudflare-pages-domain>`
   - Any environment-specific toggles (e.g. log level, refresh intervals).

Re-run the build if you add or change variables.

### 3. Provider Policy (Important)

- **Cloudflare Pages is the only supported deployment target.**
- Vercel, Netlify, Render, and similar providers are **not** part of the supported deployment story.
- Legacy provider config files (like `netlify.toml` or `vercel.json`) should be treated as historical artifacts and can be safely removed in forks or future cleanups.
- Pull requests reintroducing alternate deployment providers will be reviewed carefully and are likely to be rejected unless there is a compelling architectural reason.

---

## ✅ CI/CD

- GitHub Actions workflows live under `.github/workflows/`.
- Recommended CI steps for every push and PR:
  - Type checks
  - Lint
  - Unit / integration tests (if configured)
  - `pnpm build`
- Deployments are handled by **Cloudflare Pages’ GitHub integration**, which will:
  - Build on every push
  - Provide preview URLs for branches
  - Promote the configured production branch

If you add or modify workflows, keep Cloudflare Pages as the single deployment target.

---

## 🤝 Contributing

1. Open an issue describing the change you want (data sources, UI, performance, etc.).
2. Keep contributions:
   - Based on **real** sports data (no fake scores or static mockups in production paths).
   - Friendly to mobile users.
   - Compatible with the Cloudflare Pages deployment pipeline.
3. Submit a pull request referencing the issue.
