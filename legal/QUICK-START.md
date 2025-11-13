# Legal Compliance Quick Start Guide

**Blaze Sports Intelligence**
**For:** Austin Humphrey
**Estimated Time:** 2-4 weeks
**Budget:** $4,500 - $15,000

---

## Critical Path to Launch

### Week 1: Review & Attorney

**Day 1-2: Review Policies**

- [ ] Read `/legal/policies/PRIVACY-POLICY.md` (15 min)
- [ ] Read `/legal/policies/TERMS-OF-SERVICE.md` (12 min)
- [ ] Read `/legal/policies/COOKIE-POLICY.md` (8 min)
- [ ] Read `/legal/policies/DMCA-POLICY.md` (6 min)
- [ ] Review `/legal/LEGAL-COMPLIANCE-SUMMARY.md` (10 min)

**Day 3-5: Find Attorney**

- [ ] Search Texas State Bar: [texasbar.com](https://www.texasbar.com/AM/Template.cfm?Section=Lawyer_Referral_Service_LRIS_)
- [ ] Search Avvo: [avvo.com](https://www.avvo.com/) (filter: Technology Law, San Antonio/Austin)
- [ ] Schedule consultations with 2-3 attorneys (free 30-min calls)
- [ ] Select attorney (budget: $2,000 - $5,000)

**Day 6-7: Submit to Attorney**

- [ ] Send all 4 policies for review
- [ ] Share business model overview
- [ ] Request 1-2 week turnaround

---

### Week 2: Technical Setup

**While attorney reviews, start technical implementation:**

**Configure Email Forwarding** (30 minutes)

```bash
# Set up these email addresses to forward to ahump20@outlook.com:
privacy@blazesportsintel.com
dmca@blazesportsintel.com
legal@blazesportsintel.com
dpo@blazesportsintel.com
support@blazesportsintel.com
```

**Provider Instructions:**
- **Cloudflare Email Routing:** [Cloudflare Email Routing Docs](https://developers.cloudflare.com/email-routing/)
- **Google Workspace:** [Gmail Forwarding](https://support.google.com/mail/answer/10957?hl=en)
- **Custom Domain Email:** Check your DNS provider (Cloudflare, Namecheap, etc.)

**Deploy Cookie Consent Banner** (2-4 hours)

1. **Copy HTML file:**
   ```bash
   cp /Users/AustinHumphrey/BSI-NextGen/legal/templates/cookie-consent-banner.html \
      /Users/AustinHumphrey/BSI-NextGen/apps/web/public/legal/cookie-banner.html
   ```

2. **Add to layout template** (in `apps/web/app/layout.tsx` or equivalent):
   ```tsx
   // In <head>
   <Script src="/legal/cookie-banner.js" strategy="afterInteractive" />

   // Configure Google Analytics
   <Script id="ga-config" strategy="afterInteractive">
     {`window.GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';`}
   </Script>
   ```

3. **Test:**
   - Open site in incognito/private mode
   - Verify banner appears
   - Click "Accept All" → Check cookies set
   - Click "Reject Non-Essential" → Only essential cookies
   - Click "Customize" → Modal opens, preferences saved

**Register DMCA Agent** (30 minutes)

1. Visit: [U.S. Copyright Office DMCA Portal](https://www.copyright.gov/dmca-directory/)
2. Click "Interim Designation" (or "Designation" if interim period ended)
3. Fill out form:
   - **Agent Name:** Austin Humphrey
   - **Email:** dmca@blazesportsintel.com
   - **Phone:** (210) 273-5538
   - **Address:** [Your Business Address, Boerne, TX]
4. Pay $6 fee (credit card)
5. Save confirmation number
6. Update `/legal/policies/DMCA-POLICY.md` with confirmation number

**Security Baseline** (4-8 hours)

- [ ] **Verify HTTPS:** All pages load with `https://`
- [ ] **Add Security Headers** (in `next.config.js` or Cloudflare Workers):
  ```javascript
  const securityHeaders = [
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload'
    },
    {
      key: 'X-Frame-Options',
      value: 'SAMEORIGIN'
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff'
    },
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin'
    },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=()'
    }
  ];
  ```
- [ ] **CSRF Protection:** Verify enabled (Next.js has built-in)
- [ ] **Rate Limiting:** Configure Cloudflare rate limiting rules

---

### Week 3: Attorney Review & Revisions

**Attorney Provides Feedback** (1-2 weeks)

- [ ] Review attorney comments
- [ ] Make requested changes to policies
- [ ] Ask clarifying questions
- [ ] Get final sign-off

**Publish Policies** (1 day)

1. **Convert Markdown to HTML** (or use Markdown renderer):
   - Option 1: Use Next.js with `react-markdown` package
   - Option 2: Use static site generator (Hugo, Jekyll)
   - Option 3: Manual HTML conversion (labor-intensive)

2. **Create routes:**
   - `/legal/privacy-policy` → `PRIVACY-POLICY.md`
   - `/legal/terms-of-service` → `TERMS-OF-SERVICE.md`
   - `/legal/cookie-policy` → `COOKIE-POLICY.md`
   - `/legal/dmca-policy` → `DMCA-POLICY.md`

3. **Add footer links** (on all pages):
   ```tsx
   <footer>
     <a href="/legal/privacy-policy">Privacy Policy</a>
     <a href="/legal/terms-of-service">Terms of Service</a>
     <a href="/legal/cookie-policy">Cookie Policy</a>
     <a href="/legal/dmca-policy">DMCA</a>
     <button onClick={() => window.openCookiePreferences()}>
       Cookie Settings
     </button>
   </footer>
   ```

4. **Add to account creation:**
   ```tsx
   <Checkbox required>
     I agree to the{' '}
     <a href="/legal/terms-of-service" target="_blank">
       Terms of Service
     </a>{' '}
     and{' '}
     <a href="/legal/privacy-policy" target="_blank">
       Privacy Policy
     </a>
   </Checkbox>
   ```

**Sign Data Processing Agreements** (1 week)

- [ ] **SportsDataIO:** Email sales/support, request DPA
- [ ] **Google Analytics:** Sign in [Google Analytics settings](https://support.google.com/analytics/answer/3379636)
- [ ] **Cloudflare:** Check account (may be automatic) or contact support
- [ ] **Vercel/Netlify:** Review terms, request DPA if needed

---

### Week 4: Testing & Final Checks

**Accessibility Audit** (3-5 days)

1. **Install Tools:**
   - [axe DevTools](https://www.deque.com/axe/devtools/) (browser extension)
   - [WAVE](https://wave.webaim.org/extension/) (browser extension)
   - [Lighthouse](https://developers.google.com/web/tools/lighthouse) (built into Chrome DevTools)

2. **Run Tests on All Pages:**
   ```bash
   # Example pages to test:
   - Homepage (/)
   - Team page (/mlb/teams/cardinals)
   - Analytics page (/analytics/pythagorean)
   - Legal pages (/legal/privacy-policy, etc.)
   ```

3. **Fix Critical Issues:**
   - Color contrast ratio ≥ 4.5:1 (normal text)
   - Alt text on all images
   - Keyboard navigation (tab through all interactive elements)
   - Screen reader compatibility

4. **Document Remaining Issues:**
   - Create GitHub issues for non-critical fixes
   - Prioritize for post-launch sprints

**Cross-Browser Testing** (1 day)

- [ ] **Desktop:**
  - Chrome (latest)
  - Firefox (latest)
  - Safari (latest)
  - Edge (latest)

- [ ] **Mobile:**
  - iOS Safari (iPhone)
  - Chrome (Android)

- [ ] **Test Scenarios:**
  - Cookie banner displays and functions
  - Policies load and are readable
  - Forms work (account creation, newsletter signup)
  - Analytics tracking (check GA real-time reports)

**Pre-Launch Checklist** (1 hour)

Review `/legal/compliance/COMPLIANCE-CHECKLIST.md` and verify:

- [ ] Privacy Policy published and linked
- [ ] Terms of Service published and linked
- [ ] Cookie Policy published and linked
- [ ] DMCA Policy published and linked
- [ ] Cookie consent banner deployed and tested
- [ ] Compliance emails configured (privacy@, dmca@, legal@)
- [ ] DMCA agent registered with U.S. Copyright Office
- [ ] DPAs signed with all service providers
- [ ] Security headers configured
- [ ] HTTPS enabled on all pages
- [ ] Accessibility audit completed (critical issues fixed)
- [ ] Attorney sign-off received

**If all items checked: You're ready to launch! 🚀**

---

## Post-Launch (Within 3 Months)

### Trademark Registration

**Timeline:** 1-3 months
**Cost:** $1,400 - $10,000 (depending on DIY vs. attorney)

1. **Trademark Search** (1 week):
   - Use [USPTO TESS](https://www.uspto.gov/trademarks/search)
   - Search "Blaze Sports Intelligence" and similar variations
   - Check domain squatters and social media handles

2. **File Application** (1-2 weeks):
   - **DIY:** [USPTO TEAS](https://www.uspto.gov/trademarks/apply) ($350 - $450 per class)
   - **Attorney:** Request attorney to file ($500 - $2,000 per class)
   - **Recommended Classes:**
     - Class 9: Software, mobile apps
     - Class 35: Advertising, business services
     - Class 41: Education, entertainment, sports
     - Class 42: Software as a Service (SaaS)
   - **Total:** $1,400 - $1,800 (DIY) or $3,400 - $9,800 (attorney)

3. **Monitor Application** (6-12 months):
   - USPTO reviews application
   - Respond to office actions (if any)
   - Receive registration (if approved)

### Privacy Rights System

**Timeline:** 2 weeks
**Cost:** $0 (engineering time)

**Build APIs:**

1. **Data Export** (`/api/privacy/export-data`):
   ```typescript
   // Return JSON with all user data
   {
     "user": { /* account data */ },
     "usage": { /* analytics */ },
     "preferences": { /* settings */ }
   }
   ```

2. **Account Deletion** (`/api/privacy/delete-account`):
   - Send verification email
   - User confirms via link
   - Soft delete (immediate)
   - Anonymize (24 hours)
   - Hard delete (30 days)

3. **UI Components:**
   - Account Settings > Privacy > Download Data
   - Account Settings > Privacy > Delete Account

### Data Retention Automation

**Timeline:** 1 week
**Cost:** $0 (engineering time)

**Implement Cron Jobs:**

1. **Anonymize IP Addresses** (daily at 2:00 AM CT):
   ```sql
   UPDATE access_logs
   SET ip_address = CONCAT(SUBSTRING_INDEX(ip_address, '.', 3), '.0')
   WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
   ```

2. **Purge Error Logs** (weekly on Sundays):
   ```sql
   DELETE FROM error_logs
   WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
   ```

3. **Delete Accounts** (daily at 4:00 AM CT):
   - See `/legal/compliance/DATA-RETENTION-POLICY.md` Appendix B

4. **Purge Backups** (quarterly):
   - Delete backups older than 90 days

### Security Audit

**Timeline:** 1 week (vendor) + 1-2 weeks (remediation)
**Cost:** $2,000 - $5,000

**Vendors to Consider:**
- [Qualys](https://www.qualys.com/)
- [Tenable (Nessus)](https://www.tenable.com/)
- [Cobalt](https://www.cobalt.io/)
- [Bugcrowd](https://www.bugcrowd.com/)

**Scope:**
- Penetration testing (web app, API)
- Vulnerability scanning
- Authentication/authorization review
- Data encryption review

**Deliverables:**
- Written report with findings
- Risk ratings (critical, high, medium, low)
- Remediation recommendations

---

## Ongoing Compliance (Quarterly)

### Q1 (January - March)

- [ ] Annual policy review with attorney
- [ ] Security audit (penetration testing)
- [ ] Accessibility audit (new features)
- [ ] DPA review (all providers current)

### Q2 (April - June)

- [ ] Privacy rights requests review (volume, response times)
- [ ] Cookie compliance audit (inventory update)
- [ ] API compliance check (provider terms)

### Q3 (July - September)

- [ ] Trademark maintenance (monitor for infringement)
- [ ] DMCA compliance review (takedown notices)
- [ ] Email compliance audit (CAN-SPAM)

### Q4 (October - December)

- [ ] Annual legal review (attorney consultation)
- [ ] Year-end data purge (inactive accounts)
- [ ] Regulatory updates (new laws)
- [ ] Budget planning for next year

---

## Emergency Contacts

### Data Breach

**Immediate Actions:**
1. Contain breach (isolate affected systems)
2. Call attorney: [Attorney Phone]
3. Call security vendor: [Vendor Phone]
4. Notify users (within 72 hours if EU users)
5. Notify regulators (within 72 hours - GDPR)

**Regulatory Contacts:**
- **EU (GDPR):** Local data protection authority (if EU users)
- **California (CCPA):** California Attorney General
- **FTC (COPPA):** If children's data affected

### Legal Emergency

**Attorney:** [Attorney Name], [Attorney Phone]
**Insurance:** [Cyber Insurance Provider], [Policy Number]

### Security Emergency

**Cloudflare:** [Support Phone]
**Hosting Provider:** [Vercel/Netlify Support]
**Security Vendor:** [Vendor Contact]

---

## Resources

### Legal

- **Texas State Bar:** [texasbar.com](https://www.texasbar.com)
- **USPTO (Trademarks):** [uspto.gov/trademarks](https://www.uspto.gov/trademarks)
- **U.S. Copyright Office:** [copyright.gov](https://www.copyright.gov)
- **FTC (Privacy):** [ftc.gov/privacy](https://www.ftc.gov/privacy)

### Compliance

- **IAPP (Privacy Professionals):** [iapp.org](https://iapp.org)
- **GDPR Info:** [gdpr.eu](https://gdpr.eu)
- **CCPA Info:** [oag.ca.gov/privacy/ccpa](https://oag.ca.gov/privacy/ccpa)
- **COPPA Info:** [ftc.gov/coppa](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)

### Tools

- **axe DevTools:** [deque.com/axe](https://www.deque.com/axe/devtools/)
- **WAVE:** [wave.webaim.org](https://wave.webaim.org/)
- **Lighthouse:** [Built into Chrome DevTools]
- **Google Analytics:** [analytics.google.com](https://analytics.google.com)

### Security

- **Qualys:** [qualys.com](https://www.qualys.com/)
- **Nessus:** [tenable.com](https://www.tenable.com/)
- **OWASP:** [owasp.org](https://owasp.org/)
- **Have I Been Pwned:** [haveibeenpwned.com](https://haveibeenpwned.com/)

---

## FAQ

**Q: Can I launch without attorney review?**
A: Technically yes, but **strongly not recommended**. Attorney review protects you from liability and ensures policies match your business practices.

**Q: How long does attorney review take?**
A: Typically 1-2 weeks, depending on attorney workload. Budget $2,000 - $5,000 for 5-10 hours of work.

**Q: Do I need trademark registration immediately?**
A: No, but recommended within 3 months. You have common law trademark rights from first use, but federal registration provides stronger protection.

**Q: What if I can't afford cyber insurance?**
A: Prioritize attorney review, DMCA registration, and DPAs first. Add insurance when budget allows (typically $1,000 - $5,000/year).

**Q: Can I use free privacy policy generators?**
A: Not recommended. Free generators are generic and may not cover your specific data practices. Custom policies provide better legal protection.

**Q: What if I skip cookie consent banner?**
A: You risk GDPR fines (up to €20M) and CCPA violations ($7,500 per violation). Cookie consent is legally required in EU and California.

---

## Checklist Summary

**Pre-Launch (Must Complete):**
- [ ] Attorney review ($2,000 - $5,000)
- [ ] Publish policies (1 day)
- [ ] Deploy cookie banner (2 days)
- [ ] Configure emails (1 hour)
- [ ] Register DMCA agent ($6)
- [ ] Sign DPAs (1 week)
- [ ] Accessibility audit (3-5 days)
- [ ] Security baseline (2 days)

**Post-Launch (Within 3 Months):**
- [ ] Trademark application ($1,400 - $10,000)
- [ ] Privacy rights system (2 weeks)
- [ ] Data retention automation (1 week)
- [ ] Security audit ($2,000 - $5,000)

**Ongoing (Quarterly):**
- [ ] Policy reviews
- [ ] Cookie audits
- [ ] Security audits (annual)
- [ ] Privacy rights request handling

---

**Questions?**

Email: legal@blazesportsintel.com
Phone: (210) 273-5538

**All files located at:**
`/Users/AustinHumphrey/BSI-NextGen/legal/`

---

**Good luck with your launch! 🚀**
