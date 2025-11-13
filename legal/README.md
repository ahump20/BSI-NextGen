# Legal Compliance Framework

**Blaze Sports Intelligence**
**Version:** 1.0
**Last Updated:** January 11, 2025

---

## Overview

This directory contains comprehensive legal compliance documentation for blazesportsintel.com, covering privacy, data protection, intellectual property, and regulatory compliance across multiple jurisdictions (US, EU, California, Texas).

**Compliance Status:** Pre-Production Ready
**Attorney Review:** Recommended before publication

---

## Directory Structure

```
legal/
├── README.md                           # This file
├── policies/                           # User-facing legal policies
│   ├── PRIVACY-POLICY.md              # GDPR, CCPA, COPPA compliant
│   ├── TERMS-OF-SERVICE.md            # Platform rules, disclaimers, arbitration
│   ├── COOKIE-POLICY.md               # ePrivacy Directive compliant
│   └── DMCA-POLICY.md                 # Copyright infringement procedures
├── templates/                          # Implementation templates
│   ├── cookie-consent-banner.html     # GDPR/CCPA cookie consent UI
│   ├── data-processing-agreement.md   # DPA template (future)
│   └── privacy-rights-request-form.md # GDPR/CCPA request form (future)
├── compliance/                         # Internal compliance documentation
│   ├── COMPLIANCE-CHECKLIST.md        # Pre-launch and ongoing checklist
│   ├── DATA-RETENTION-POLICY.md       # Internal data lifecycle policy
│   ├── INCIDENT-RESPONSE-PLAN.md      # Breach response (future)
│   └── SECURITY-STANDARDS.md          # Technical security requirements (future)
└── scripts/                            # Automation scripts (future)
    ├── anonymize-ip-addresses.sql     # Daily IP anonymization
    ├── purge-deleted-accounts.js      # Account deletion automation
    └── generate-privacy-report.js     # Quarterly compliance report
```

---

## Quick Start

### Pre-Launch Checklist (Critical)

**Before making blazesportsintel.com public, complete these steps:**

1. **[ ] Review Policies with Attorney**
   - Estimated cost: $2,000 - $5,000
   - Timeline: 1-2 weeks
   - Deliverable: Attorney sign-off letter

2. **[ ] Publish Policies**
   - Copy Markdown files to `/legal` route on website
   - Add footer links: Privacy Policy, Terms, Cookie Policy, DMCA
   - Ensure accessible from all pages

3. **[ ] Implement Cookie Consent Banner**
   - Deploy `cookie-consent-banner.html` to all pages
   - Test in Chrome, Firefox, Safari, Edge
   - Verify mobile responsiveness
   - Test accessibility (keyboard navigation, screen reader)

4. **[ ] Configure Compliance Email Addresses**
   - privacy@blazesportsintel.com → Forward to your email
   - dmca@blazesportsintel.com → Forward to your email
   - legal@blazesportsintel.com → Forward to your email
   - dpo@blazesportsintel.com → Forward to your email (or attorney)

5. **[ ] Register DMCA Agent**
   - Visit: [U.S. Copyright Office DMCA Portal](https://www.copyright.gov/dmca-directory/)
   - Fee: $6 (one-time)
   - Information needed: Agent name, address, email, phone
   - Confirmation: Save registration number

6. **[ ] Sign Data Processing Agreements**
   - [ ] SportsDataIO (request DPA from vendor)
   - [ ] Cloudflare (automatic with Enterprise plan, or request via support)
   - [ ] Google Analytics (sign in Analytics settings)
   - [ ] Vercel/Netlify (check terms, request DPA if needed)

7. **[ ] Accessibility Audit**
   - Run automated tools: [axe DevTools](https://www.deque.com/axe/devtools/), [WAVE](https://wave.webaim.org/), Lighthouse
   - Fix critical issues (color contrast, keyboard navigation, alt text)
   - Document remaining issues for post-launch fixes

8. **[ ] Security Baseline**
   - [ ] HTTPS enabled (TLS 1.3)
   - [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
   - [ ] Password hashing (bcrypt, scrypt, or Argon2)
   - [ ] CSRF protection enabled
   - [ ] Rate limiting configured

---

## Policy Summaries

### 1. Privacy Policy

**File:** `/legal/policies/PRIVACY-POLICY.md`
**Compliance:** GDPR, CCPA, COPPA, PIPEDA
**Length:** ~15,000 words (comprehensive)

**Covers:**
- Data collection and usage
- Third-party services and sharing
- User rights (access, deletion, portability)
- Cookie policy integration
- Children's privacy (COPPA)
- International data transfers
- California-specific rights (CCPA)
- EU-specific rights (GDPR)

**Key Features:**
- Plain language summaries
- Data inventory tables
- Cookie audit log
- Contact information for privacy requests
- Version history

**Publication Requirements:**
- Must be accessible from footer on all pages
- Link: `/legal/privacy-policy`
- Accepted during account creation (checkbox)
- Version number tracked in database

---

### 2. Terms of Service

**File:** `/legal/policies/TERMS-OF-SERVICE.md`
**Compliance:** State and federal law, arbitration requirements
**Length:** ~12,000 words

**Covers:**
- Acceptable use policy
- Account terms and eligibility
- Intellectual property rights
- User-generated content rules (future)
- Disclaimers (analytics, gambling, data accuracy)
- Limitation of liability
- Arbitration agreement (with 30-day opt-out)
- Dispute resolution
- Governing law (Texas)

**Key Features:**
- Gambling disclaimer (analytics ≠ betting advice)
- NIL valuation disclaimer (future - estimates only)
- Data accuracy disclaimer (verify with official sources)
- Class action waiver
- State-specific provisions (CA, NJ, TX)

**Publication Requirements:**
- Accessible from footer on all pages
- Link: `/legal/terms-of-service`
- Accepted during account creation (checkbox)
- Version number tracked in database

---

### 3. Cookie Policy

**File:** `/legal/policies/COOKIE-POLICY.md`
**Compliance:** ePrivacy Directive, GDPR, CCPA
**Length:** ~8,000 words

**Covers:**
- What cookies are and how they work
- Types of cookies used (essential, analytics, performance)
- Third-party cookies (Google Analytics, Cloudflare)
- Cookie management and opt-out
- Do Not Track (DNT) support
- Legal basis for cookie use (GDPR)

**Key Features:**
- Detailed cookie inventory tables
- Browser-specific opt-out instructions
- Third-party privacy policy links
- Cookie lifespan and expiration
- Quarterly cookie audit log

**Publication Requirements:**
- Accessible from footer and cookie banner
- Link: `/legal/cookie-policy`
- Consent collected via cookie banner
- Preference changes allowed anytime

---

### 4. DMCA Policy

**File:** `/legal/policies/DMCA-POLICY.md`
**Compliance:** 17 U.S.C. § 512 (Digital Millennium Copyright Act)
**Length:** ~6,000 words

**Covers:**
- Copyright infringement notification (takedown)
- Counter-notification (dispute)
- DMCA agent contact information
- Repeat infringer policy
- Fair use considerations
- Third-party data attribution

**Key Features:**
- Sample takedown notice template
- Sample counter-notification template
- Step-by-step procedures
- Timeline expectations (5-7 days for takedown)
- Examples and FAQs

**Publication Requirements:**
- Accessible from footer on all pages
- Link: `/legal/dmca-policy`
- DMCA agent registered with U.S. Copyright Office
- Agent email: dmca@blazesportsintel.com

---

## Implementation Guide

### Cookie Consent Banner

**File:** `/legal/templates/cookie-consent-banner.html`
**Framework:** Vanilla JavaScript (no dependencies)
**Size:** ~12KB (uncompressed)

**Features:**
- GDPR/CCPA compliant consent collection
- Granular consent options (essential, analytics, performance)
- Cookie preference management
- Do Not Track (DNT) support
- Accessibility (WCAG 2.1 AA)
- Mobile-responsive
- LocalStorage fallback

**Integration:**

```html
<!-- Add to <head> of all pages -->
<link rel="stylesheet" href="/legal/templates/cookie-consent-banner.css">

<!-- Add before </body> of all pages -->
<script src="/legal/templates/cookie-consent-banner.js"></script>

<!-- Configure Google Analytics Measurement ID -->
<script>
  window.GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // Replace with your ID
</script>
```

**Customization:**

Edit these variables in `cookie-consent-banner.html`:

```javascript
const CONSENT_COOKIE_NAME = 'bsi_cookie_consent'; // Cookie name
const CONSENT_DURATION_DAYS = 365; // Consent validity (12 months)
const POLICY_VERSION = '1.0'; // Increment when policy changes
```

**Testing:**

1. **Functional Testing:**
   - Click "Accept All" → All cookies enabled
   - Click "Reject Non-Essential" → Only essential cookies
   - Click "Customize" → Granular preferences saved
   - Close and reopen browser → Preferences persist

2. **Accessibility Testing:**
   - Tab through all buttons (keyboard navigation)
   - Screen reader announces all elements
   - Focus indicators visible
   - Escape key closes modal

3. **Cross-Browser Testing:**
   - Chrome, Firefox, Safari, Edge (desktop)
   - Chrome, Safari (mobile iOS/Android)

4. **Do Not Track Testing:**
   - Enable DNT in browser settings
   - Visit site → Only essential cookies set
   - Analytics disabled automatically

---

## Privacy Rights Implementation

### User Data Export

**Endpoint:** `/api/privacy/export-data`
**Method:** POST
**Authentication:** Required (JWT)

**Response Format:**

```json
{
  "user": {
    "email": "user@example.com",
    "username": "johndoe",
    "created_at": "2024-01-15T10:30:00Z",
    "preferences": {
      "theme": "dark",
      "timezone": "America/Chicago"
    }
  },
  "usage": {
    "total_visits": 42,
    "last_login": "2025-01-10T14:22:00Z",
    "favorite_teams": ["Cardinals", "Longhorns"]
  },
  "generated": "2025-01-11T16:00:00Z",
  "format": "json",
  "includes": ["account", "usage", "preferences"]
}
```

**Implementation:**

```javascript
// Example API route (Cloudflare Workers)
export async function onRequestPost({ request, env }) {
  const user = await authenticateUser(request);
  const userData = await db.query(
    'SELECT * FROM users WHERE user_id = ?',
    [user.id]
  );

  const exportData = {
    user: sanitizeData(userData),
    usage: await getUserUsageData(user.id),
    generated: new Date().toISOString(),
    format: 'json',
    includes: ['account', 'usage', 'preferences']
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="blaze-data-export-${user.id}.json"`
    }
  });
}
```

---

### User Account Deletion

**Endpoint:** `/api/privacy/delete-account`
**Method:** POST
**Authentication:** Required (JWT)

**Flow:**

1. **User initiates deletion** (Account Settings or email request)
2. **Verification email sent** (confirmation link valid 7 days)
3. **User confirms** (clicks link)
4. **Immediate actions:**
   - Account access disabled
   - Login prevented
   - Sessions invalidated
5. **Within 24 hours:**
   - Personal data anonymized in live database
   - Email → Random UUID
   - Username → "Deleted User [ID]"
6. **Within 30 days:**
   - All personal data purged from production
7. **Within 90 days:**
   - Backups purged (next rotation)

**Implementation:**

```javascript
// Example deletion logic
async function deleteUserAccount(userId) {
  // Step 1: Soft delete (immediate)
  await db.execute(
    'UPDATE users SET deleted_at = NOW(), status = "deleted" WHERE user_id = ?',
    [userId]
  );

  // Step 2: Anonymize (within 24 hours - run via cron)
  await db.execute(`
    UPDATE users SET
      email = ?,
      username = ?,
      password_hash = NULL
    WHERE user_id = ? AND deleted_at < NOW() - INTERVAL 1 DAY
  `, [generateUUID(), `deleted_user_${userId}`, userId]);

  // Step 3: Hard delete (within 30 days - run via cron)
  await db.execute(
    'DELETE FROM users WHERE user_id = ? AND deleted_at < NOW() - INTERVAL 30 DAY',
    [userId]
  );

  // Log to audit trail
  await auditLog.log({
    event: 'account_deletion_requested',
    user_id: userId,
    timestamp: new Date(),
    retention: '7 years'
  });
}
```

---

## Compliance Monitoring

### Quarterly Review Process

**Schedule:** January 15, April 15, July 15, October 15

**Checklist:**

1. **[ ] Policy Review**
   - Check for legal/regulatory changes
   - Update policies if needed
   - Attorney review (if material changes)

2. **[ ] Cookie Audit**
   - Inventory all cookies on site
   - Update cookie policy
   - Remove unused cookies

3. **[ ] DPA Review**
   - Verify all service providers have DPAs
   - Check for new providers
   - Renew expiring agreements

4. **[ ] Privacy Rights Requests**
   - Review request volume and response times
   - Identify process improvements
   - Document any issues

5. **[ ] Security Audit**
   - Vulnerability scan (Nessus, Qualys, etc.)
   - Review access logs for anomalies
   - Update security procedures

6. **[ ] Accessibility Check**
   - Run automated tools on new features
   - Review user feedback
   - Fix critical issues

7. **[ ] Compliance Report**
   - Metrics: Request volume, response times, incidents
   - Issues identified and resolved
   - Recommendations for next quarter

---

## Legal Contacts

### Internal

| Role | Name | Email | Responsibility |
|------|------|-------|----------------|
| **Founder/CEO** | Austin Humphrey | ahump20@outlook.com | Final approval, legal decisions |
| **DMCA Agent** | Austin Humphrey | dmca@blazesportsintel.com | Copyright claims |
| **Privacy Officer** | [TBD] | privacy@blazesportsintel.com | Privacy requests |
| **Data Protection Officer** | [TBD or Attorney] | dpo@blazesportsintel.com | GDPR compliance |

### External

| Service | Provider | Contact | Purpose |
|---------|----------|---------|---------|
| **Legal Counsel** | [Attorney Name] | [Email/Phone] | Policy review, legal advice |
| **Trademark Attorney** | [Attorney Name] | [Email/Phone] | Trademark registration and enforcement |
| **Security Auditor** | [Firm Name] | [Email/Phone] | Annual penetration testing |
| **Privacy Consultant** | [Consultant Name] | [Email/Phone] | GDPR/CCPA compliance (optional) |

---

## Cost Estimates

### One-Time Costs

| Item | Estimated Cost | Notes |
|------|----------------|-------|
| **Attorney Policy Review** | $2,000 - $5,000 | Essential before launch |
| **DMCA Agent Registration** | $6 | U.S. Copyright Office fee |
| **Trademark Application (Federal)** | $350 - $1,000 per class | Recommended: Classes 9, 35, 41, 42 |
| **Initial Security Audit** | $2,000 - $5,000 | Penetration test, vulnerability scan |
| **Privacy Compliance Tools** | $0 - $2,000 | Cookie consent, data mapping (optional) |
| **Total Initial** | **$4,500 - $15,000** | Varies by scope |

### Annual Recurring Costs

| Item | Estimated Cost | Notes |
|------|----------------|-------|
| **Attorney Retainer** | $3,000 - $10,000/year | Ongoing advice, policy updates |
| **Trademark Monitoring** | $500 - $1,500/year | Automated infringement monitoring |
| **Annual Security Audit** | $2,000 - $5,000/year | Required for compliance |
| **Cyber Liability Insurance** | $1,000 - $5,000/year | Data breach coverage |
| **D&O Insurance** | $1,000 - $5,000/year | Directors & Officers liability |
| **Total Annual** | **$7,500 - $26,500** | Essential for business protection |

---

## FAQ

### Do I need all these policies before launching?

**Yes.** Privacy Policy, Terms of Service, and Cookie Policy are legally required before collecting any user data or using analytics cookies. DMCA Policy is required if you allow user-generated content or want safe harbor protection.

### Can I use these policies as-is, or do I need an attorney?

**Attorney review strongly recommended.** These policies are comprehensive templates based on current law, but an attorney can customize them for your specific business model, ensure compliance with the latest regulations, and provide legal defense if needed.

### What happens if I don't register my DMCA agent?

You lose DMCA safe harbor protection. If a user posts copyrighted material, you could be liable for damages even if you remove it promptly. Registration costs $6 and takes 10 minutes—it's worth it.

### How much does trademark registration cost?

**Federal (USPTO):** $350 - $450 per class (recommend 4 classes = $1,400 - $1,800)
**Attorney fees:** $500 - $2,000 per class (optional but recommended)
**Total:** $1,400 - $9,800 depending on DIY vs. attorney-assisted

### Do I need cyber liability insurance?

**Highly recommended.** A single data breach can cost $50,000 - $500,000+ in notification costs, legal fees, and regulatory fines. Cyber insurance typically costs $1,000 - $5,000/year and covers these expenses.

### What are the penalties for non-compliance?

**GDPR:** Up to €20 million or 4% of global revenue (whichever is higher)
**CCPA:** $2,500 per violation (unintentional), $7,500 per violation (intentional)
**COPPA:** Up to $46,517 per violation (FTC enforcement)
**Data breach notification:** Varies by state, can include statutory damages and attorney fees

### Can I copy policies from other websites?

**No.** Copyright infringement aside, policies must be tailored to your specific business practices, data collection, and services. Generic policies won't protect you if they don't accurately reflect your operations.

### How often should I update policies?

**Annually** (minimum), or when:
- Laws change (e.g., new privacy regulations)
- Business practices change (new features, data collection)
- User feedback reveals gaps
- Attorney recommends updates

---

## Resources

### Legal Information

- **GDPR Full Text:** [EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- **CCPA Full Text:** [California Legislative Information](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?division=3.&part=4.&lawCode=CIV&title=1.81.5)
- **COPPA Information:** [FTC COPPA Guide](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)
- **DMCA Text:** [17 U.S.C. § 512](https://www.copyright.gov/legislation/dmca.pdf)

### Compliance Tools

- **Cookie Consent:** [Cookiebot](https://www.cookiebot.com/), [OneTrust](https://www.onetrust.com/), DIY (this template)
- **Privacy Policy Generators:** [TermsFeed](https://www.termsfeed.com/), [Termly](https://termly.io/) (basic versions)
- **Accessibility Testing:** [axe DevTools](https://www.deque.com/axe/devtools/), [WAVE](https://wave.webaim.org/), [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- **Security Scanning:** [Qualys](https://www.qualys.com/), [Nessus](https://www.tenable.com/products/nessus), [OWASP ZAP](https://www.zaproxy.org/)

### Legal Services

- **Find an Attorney:** [Avvo](https://www.avvo.com/), [Martindale-Hubbell](https://www.martindale.com/), state bar associations
- **Trademark Search:** [USPTO TESS](https://www.uspto.gov/trademarks/search)
- **DMCA Agent Registration:** [U.S. Copyright Office](https://www.copyright.gov/dmca-directory/)

### Industry Organizations

- **International Association of Privacy Professionals (IAPP):** [iapp.org](https://iapp.org/)
- **Future of Privacy Forum:** [fpf.org](https://fpf.org/)
- **Electronic Frontier Foundation (EFF):** [eff.org](https://www.eff.org/)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-01-11 | Initial comprehensive legal framework | Blaze Sports Intelligence Legal |

---

## Contact

**Questions about this legal framework?**

**Email:** legal@blazesportsintel.com
**Subject:** "[Legal Framework] - Your Question"

**For specific legal advice, consult a licensed attorney in your jurisdiction.**

---

**END OF README**

*This legal framework is provided for informational purposes and does not constitute legal advice. Consult with a licensed attorney before relying on these templates for compliance.*
