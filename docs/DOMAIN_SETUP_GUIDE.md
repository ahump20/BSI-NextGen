# Custom Domain Setup Guide

**Date:** 2025-01-11
**Domain:** blazesportsintel.com → Netlify
**Current URL:** https://blazesportsintelligence.netlify.app

---

## Step 1: Add Domain in Netlify Dashboard

### 1.1 Navigate to Domain Settings

1. Go to [Netlify Dashboard](https://app.netlify.com/projects/blazesportsintelligence)
2. Click **Domain settings** in the sidebar
3. Click **Add custom domain** button

### 1.2 Add Primary Domain

1. Enter: `blazesportsintel.com`
2. Click **Verify**
3. Netlify will prompt: "This domain is already registered"
4. Click **Add domain**

### 1.3 Add WWW Subdomain

1. Click **Add domain alias**
2. Enter: `www.blazesportsintel.com`
3. Click **Add domain**

---

## Step 2: Configure DNS Records

You'll need to update DNS records at your domain registrar (where you purchased blazesportsintel.com).

### Option A: Netlify DNS (Recommended)

**Benefits:**
- Automatic SSL certificate
- Faster propagation
- Netlify-managed DNS

**Steps:**
1. In Netlify → Domain settings → Click **Set up Netlify DNS**
2. Follow the wizard to add nameservers
3. Update nameservers at your registrar to Netlify's nameservers:
   ```
   dns1.p01.nsone.net
   dns2.p01.nsone.net
   dns3.p01.nsone.net
   dns4.p01.nsone.net
   ```
4. DNS propagation: 24-48 hours

### Option B: External DNS (Keep Current Registrar)

**Add these records at your DNS provider:**

#### Apex Domain (blazesportsintel.com)

**A Record:**
```
Type: A
Name: @
Value: 75.2.60.5
TTL: 3600
```

**AAAA Record (IPv6 - optional but recommended):**
```
Type: AAAA
Name: @
Value: 2600:1f18:2148:bc00:fc0f:d0dd:c28f:9c7e
TTL: 3600
```

#### WWW Subdomain

**CNAME Record:**
```
Type: CNAME
Name: www
Value: blazesportsintelligence.netlify.app
TTL: 3600
```

---

## Step 3: Enable SSL Certificate

### 3.1 Automatic SSL (Free via Let's Encrypt)

1. After DNS propagation, go to Netlify → Domain settings
2. Scroll to **HTTPS** section
3. Click **Verify DNS configuration**
4. Once verified, click **Provision certificate**
5. Certificate provisioning: 1-5 minutes
6. Status will change to **Certificate active**

### 3.2 Force HTTPS

1. In **HTTPS** section, toggle **Force HTTPS** to ON
2. All HTTP requests will redirect to HTTPS

---

## Step 4: Verify Domain Configuration

### 4.1 DNS Propagation Check

```bash
# Check A record
dig blazesportsintel.com +short
# Should return: 75.2.60.5

# Check CNAME record
dig www.blazesportsintel.com +short
# Should return: blazesportsintelligence.netlify.app

# Check nameservers (if using Netlify DNS)
dig NS blazesportsintel.com +short
# Should return: dns1.p01.nsone.net, etc.
```

### 4.2 SSL Certificate Check

```bash
# Verify SSL certificate
curl -I https://blazesportsintel.com | grep -i "HTTP\|ssl"
# Should return: HTTP/2 200

# Check SSL details
openssl s_client -connect blazesportsintel.com:443 -servername blazesportsintel.com < /dev/null 2>/dev/null | grep -A 2 "Certificate chain"
```

### 4.3 Test All URLs

```bash
# Test apex domain
curl -I https://blazesportsintel.com
# Expected: HTTP/2 200

# Test www subdomain
curl -I https://www.blazesportsintel.com
# Expected: HTTP/2 200 or 301 redirect to apex

# Test HTTP redirect
curl -I http://blazesportsintel.com
# Expected: 301 redirect to https://blazesportsintel.com
```

---

## Step 5: Update Application Configuration

### 5.1 Update Environment Variables

Create or update `.env.production`:

```bash
# Production domain
NEXT_PUBLIC_SITE_URL=https://blazesportsintel.com
NEXT_PUBLIC_API_URL=https://blazesportsintel.com/api

# Auth0 configuration
AUTH0_BASE_URL=https://blazesportsintel.com
AUTH0_ISSUER_BASE_URL=https://ahump20.us.auth0.com
AUTH0_CLIENT_ID=<your-client-id>
AUTH0_CLIENT_SECRET=<your-client-secret>
AUTH0_SECRET=<generate-new-secret>

# Sports API keys
SPORTSDATAIO_API_KEY=6ca2adb39404482da5406f0a6cd7aa37
MLB_STATS_API_KEY=<if-needed>
```

### 5.2 Add to Netlify Environment Variables

1. Go to Netlify Dashboard → Site settings → Environment variables
2. Click **Add a variable**
3. Add each variable from `.env.production`
4. Set **Scopes** to: Production, Deploy previews, Branch deploys

**Required Variables:**
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_API_URL`
- `SPORTSDATAIO_API_KEY`
- `AUTH0_BASE_URL`
- `AUTH0_ISSUER_BASE_URL`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`
- `AUTH0_SECRET`

### 5.3 Redeploy Site

After adding environment variables:

```bash
# Trigger redeploy
netlify deploy --prod

# Or push to main branch to trigger auto-deploy
git commit --allow-empty -m "chore: Trigger redeploy after env var update"
git push origin main
```

---

## Step 6: Update Auth0 Application Settings

### 6.1 Update Allowed Callback URLs

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Navigate to **Applications** → Your application
3. Update **Allowed Callback URLs**:
   ```
   https://blazesportsintel.com/api/auth/callback
   https://www.blazesportsintel.com/api/auth/callback
   https://blazesportsintelligence.netlify.app/api/auth/callback
   ```

### 6.2 Update Allowed Logout URLs

```
https://blazesportsintel.com
https://www.blazesportsintel.com
https://blazesportsintelligence.netlify.app
```

### 6.3 Update Allowed Web Origins

```
https://blazesportsintel.com
https://www.blazesportsintel.com
https://blazesportsintelligence.netlify.app
```

---

## Step 7: Update Sitemap and Metadata

### 7.1 Update sitemap.xml

```xml
<!-- public/sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://blazesportsintel.com</loc>
    <lastmod>2025-01-11</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://blazesportsintel.com/sports/mlb</loc>
    <lastmod>2025-01-11</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- Add other pages -->
</urlset>
```

### 7.2 Update robots.txt

```txt
# public/robots.txt
User-agent: *
Allow: /

Sitemap: https://blazesportsintel.com/sitemap.xml
```

### 7.3 Update Metadata in app/layout.tsx

```typescript
export const metadata: Metadata = {
  metadataBase: new URL('https://blazesportsintel.com'),
  title: {
    default: 'Blaze Sports Intel',
    template: '%s | Blaze Sports Intel'
  },
  description: 'Professional sports intelligence platform with real-time data',
  openGraph: {
    title: 'Blaze Sports Intel',
    description: 'Professional sports intelligence platform',
    url: 'https://blazesportsintel.com',
    siteName: 'Blaze Sports Intel',
    images: [
      {
        url: 'https://blazesportsintel.com/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blaze Sports Intel',
    description: 'Professional sports intelligence platform',
    images: ['https://blazesportsintel.com/og-image.png'],
  },
};
```

---

## Step 8: Test Production Domain

### 8.1 Smoke Tests

```bash
# Homepage loads
curl -s https://blazesportsintel.com | grep -q "Blaze Sports Intel" && echo "✅ Homepage OK" || echo "❌ Homepage FAIL"

# API endpoints respond
curl -s https://blazesportsintel.com/api/sports/mlb/teams | jq -e '.data' && echo "✅ MLB API OK" || echo "❌ MLB API FAIL"

# College Baseball API
curl -s https://blazesportsintel.com/api/sports/college-baseball/games | jq -e '.data' && echo "✅ College Baseball API OK" || echo "❌ College Baseball API FAIL"

# SSL certificate valid
echo | openssl s_client -connect blazesportsintel.com:443 2>/dev/null | grep -q "Verify return code: 0" && echo "✅ SSL Valid" || echo "❌ SSL Invalid"
```

### 8.2 Full Test Suite

```bash
# Run comprehensive verification
./verify-deployment.sh https://blazesportsintel.com
```

---

## Timeline

| Step | Action | Duration |
|------|--------|----------|
| 1-2 | Add domain in Netlify | 5 minutes |
| 3 | Configure DNS records | 10 minutes |
| 4 | DNS propagation | 24-48 hours |
| 5 | SSL provisioning | 1-5 minutes |
| 6 | Update environment variables | 10 minutes |
| 7 | Update Auth0 settings | 5 minutes |
| 8 | Update metadata | 5 minutes |
| 9 | Test and verify | 10 minutes |

**Total Active Time:** ~45 minutes
**Total Wait Time:** 24-48 hours (DNS propagation)

---

## Troubleshooting

### DNS Not Propagating

**Issue:** Domain still shows old IP or doesn't resolve

**Solutions:**
```bash
# Flush DNS cache (macOS)
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Flush DNS cache (Windows)
ipconfig /flushdns

# Check DNS propagation globally
# Visit: https://dnschecker.org
# Enter: blazesportsintel.com
```

### SSL Certificate Won't Provision

**Issue:** "Certificate provisioning failed"

**Solutions:**
1. Verify DNS is fully propagated (check with `dig`)
2. Remove and re-add the domain in Netlify
3. Check for CAA records at DNS provider (should allow Let's Encrypt)
4. Wait 24 hours for DNS to stabilize, then retry

### HTTP Not Redirecting to HTTPS

**Issue:** Site loads on HTTP but doesn't redirect

**Solutions:**
1. Enable "Force HTTPS" in Netlify Domain settings
2. Verify SSL certificate is active
3. Clear browser cache

### Auth0 Login Fails

**Issue:** "Callback URL mismatch" error

**Solutions:**
1. Verify `AUTH0_BASE_URL` matches production domain
2. Check Auth0 dashboard → Allowed Callback URLs includes new domain
3. Redeploy after updating environment variables

---

## Rollback Procedure

If domain causes issues:

1. **Remove custom domain** in Netlify → Domain settings
2. **Keep Netlify subdomain** active: `https://blazesportsintelligence.netlify.app`
3. **Revert Auth0 settings** to use Netlify subdomain
4. **Update environment variables** to use Netlify subdomain
5. **Redeploy** with updated configuration

---

## Next Steps After Domain Setup

1. ✅ Domain configured and live
2. ⏭️ Submit sitemap to Google Search Console
3. ⏭️ Set up Google Analytics
4. ⏭️ Configure CDN caching rules
5. ⏭️ Set up uptime monitoring
6. ⏭️ Create status page

---

## Success Criteria

✅ Domain resolves to Netlify IP
✅ SSL certificate active and valid
✅ HTTP redirects to HTTPS
✅ www redirects to apex (or vice versa)
✅ All pages load correctly
✅ All API endpoints respond
✅ Auth0 login works
✅ No mixed content warnings
✅ SEO metadata correct

---

**Domain Setup Complete!** 🎉
