# Cloudflare Pages GitHub Integration Setup

**Date:** January 13, 2025
**Domain:** blazesportsintel.com
**Project:** blazesportsintel (Cloudflare Pages)
**Repository:** https://github.com/ahump20/BSI-NextGen

---

## 🎯 What You Need to Do

Connect the BSI-NextGen GitHub repository to the `blazesportsintel` Cloudflare Pages project to enable automatic deployments.

---

## ✅ Step-by-Step Instructions

### Step 1: Access Cloudflare Pages Dashboard

1. Go to: https://dash.cloudflare.com/
2. Log in with your Cloudflare account
3. Select your account: `a12cb329d84130460eed99b816e4d0d3`
4. Click **"Workers & Pages"** in the left sidebar
5. Find and click on **"blazesportsintel"** project

### Step 2: Check Current Git Integration

In the project overview, check if GitHub is connected:

**If you see "Connected to GitHub: ahump20/BSI":**
- This is the WRONG repository!
- You need to reconnect to `ahump20/BSI-NextGen`
- Continue to Step 3

**If you see "No git integration":**
- Continue to Step 3

### Step 3: Connect to GitHub

1. In the `blazesportsintel` project page, click **"Settings"**
2. Scroll to **"Build & deployments"** section
3. Click **"Connect to Git"** or **"Change source"** (if already connected)
4. Select **"GitHub"**
5. Authorize Cloudflare to access your GitHub account (if needed)
6. Select repository: **ahump20/BSI-NextGen**
7. Choose branch: **main**

### Step 4: Configure Build Settings

Set these build configuration options:

**Framework preset:**
```
Next.js
```

**Build command:**
```bash
cd packages/web && npm install && npm run build
```

**Build output directory:**
```
packages/web/.next
```

**Root directory:**
```
/
```

**Environment variables:**
Add these in the Cloudflare dashboard:

| Variable | Value |
|----------|-------|
| `NODE_VERSION` | `20` |
| `REAL_API_BASE_URL` | `https://api.blazesportsintel.com` |
| `NCAA_API_BASE_URL` | `https://ncaa-api.henrygd.me` |
| `SPORTSDATAIO_API_KEY` | (your API key) |
| `NEXT_PUBLIC_APP_URL` | `https://blazesportsintel.com` |

### Step 5: Trigger First Deployment

**Option A: Automatic (after git connection)**
- Cloudflare will automatically trigger a build after connecting to GitHub
- Wait 3-5 minutes for build to complete

**Option B: Manual trigger**
1. In the project page, click **"Deployments"** tab
2. Click **"Create deployment"**
3. Select branch: **main**
4. Click **"Save and Deploy"**

### Step 6: Verify Deployment

After deployment completes (3-5 minutes):

**1. Check Project Dashboard:**
- Green checkmark next to latest deployment
- Deployment status: "Success"

**2. Test NCAA Fusion Dashboard:**
```bash
curl https://blazesportsintel.com/college/fusion?sport=basketball&teamId=251
# Should return HTML (not 404)
```

**3. Visit in Browser:**
- Homepage: https://blazesportsintel.com
- NCAA Fusion: https://blazesportsintel.com/college/fusion?sport=basketball&teamId=251
- API: https://blazesportsintel.com/api/edge/ncaa/fusion?sport=basketball&teamId=251

---

## 🔄 Automatic Deployment Flow

Once connected, every push to `main` branch will:

1. **Trigger Build** (within 30 seconds of push)
2. **Run Build Command** (3-5 minutes)
3. **Deploy to Edge** (30 seconds)
4. **Live on blazesportsintel.com** (Total: ~5 minutes)

---

## 🚨 Important Notes

### Wrong Repository Warning

The `blazesportsintel` project might currently be connected to `ahump20/BSI` (old repo).

**You MUST change it to `ahump20/BSI-NextGen` (new repo)** because:
- ✅ `BSI-NextGen` has the NCAA Fusion Dashboard code
- ✅ `BSI-NextGen` has the latest build configuration
- ✅ `BSI-NextGen` has all the fixes and improvements
- ❌ `BSI` is outdated and doesn't have NCAA Fusion

### Build Command Note

The build command uses `npm` instead of `pnpm` because:
- Cloudflare Pages doesn't have `pnpm` pre-installed by default
- You can add pnpm by including a `.nvmrc` file
- For now, `npm` will work fine for the build

**Alternative with pnpm:**
If you want to use pnpm, add this to build command:
```bash
npm install -g pnpm && cd packages/web && pnpm install && pnpm build
```

---

## 🧪 Post-Deployment Verification

Once deployed, verify everything works:

### 1. Homepage
```bash
curl https://blazesportsintel.com
# Should show championship theme design
```

### 2. NCAA Fusion Dashboard
```bash
curl https://blazesportsintel.com/college/fusion?sport=basketball&teamId=251
# Should return HTML with Texas Longhorns data
```

### 3. Edge API
```bash
curl "https://blazesportsintel.com/api/edge/ncaa/fusion?sport=basketball&teamId=251"
# Should return JSON with team analytics
```

### 4. Visual Check
Visit in browser:
- [ ] Homepage loads with championship design
- [ ] NCAA Fusion card visible (if added to homepage)
- [ ] NCAA Fusion dashboard loads at `/college/fusion`
- [ ] Texas Longhorns data displays correctly
- [ ] Pythagorean metrics show real data
- [ ] Standings table renders

---

## 📊 Expected Build Output

When build succeeds, you'll see in Cloudflare logs:

```
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (16/16)
✓ Collecting build traces
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    3.81 kB         105 kB
├ ƒ /college/fusion                      181 B          87.5 kB
├ ƒ /api/edge/ncaa/fusion                0 B                0 B
...
```

---

## 🔧 Troubleshooting

### Issue: Build fails with "pnpm not found"

**Solution:** Use the npm-based build command:
```bash
cd packages/web && npm install && npm run build
```

### Issue: Build fails with "Cannot find module"

**Solution:** Make sure root directory is set to `/` (not `/packages/web`)

### Issue: 404 on NCAA Fusion routes

**Solution:**
1. Check build logs to verify routes were generated
2. Make sure Next.js version is 14.2.33
3. Verify output directory is `packages/web/.next`

### Issue: Old version deployed

**Solution:**
1. Check that you're connected to `BSI-NextGen` (not `BSI`)
2. Verify branch is set to `main`
3. Clear Cloudflare cache if needed

---

## 📞 Quick Links

- **Cloudflare Dashboard:** https://dash.cloudflare.com/
- **Pages Project:** https://dash.cloudflare.com/workers-and-pages
- **GitHub Repository:** https://github.com/ahump20/BSI-NextGen
- **Live Site:** https://blazesportsintel.com

---

## ✅ Success Checklist

- [ ] Cloudflare Pages connected to `ahump20/BSI-NextGen`
- [ ] Branch set to `main`
- [ ] Build command configured correctly
- [ ] Environment variables added
- [ ] First deployment triggered
- [ ] Build completed successfully (3-5 minutes)
- [ ] NCAA Fusion Dashboard live at blazesportsintel.com
- [ ] API endpoints return real data
- [ ] Future pushes to main auto-deploy

---

**Status:** Ready to configure
**Next Action:** Follow steps above to connect GitHub
**Expected Time:** 10 minutes setup + 5 minutes first build

