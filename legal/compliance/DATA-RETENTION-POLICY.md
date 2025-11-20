# Data Retention and Deletion Policy

**Blaze Sports Intelligence**
**Effective Date:** January 11, 2025
**Last Updated:** January 11, 2025

---

## 1. Purpose

This Data Retention and Deletion Policy establishes guidelines for how long Blaze Sports Intelligence ("we," "our," or "us") retains personal and non-personal data, and the procedures for secure deletion when retention periods expire.

**Legal Compliance:** This policy complies with GDPR Article 5(1)(e) (storage limitation principle), CCPA data minimization requirements, and industry best practices.

---

## 2. Retention Principles

### 2.1 Data Minimization
**We collect only the data necessary for specified purposes and retain it only as long as needed.**

### 2.2 Purpose Limitation
**Data retained for one purpose may not be used for incompatible purposes without consent.**

### 2.3 Storage Limitation
**Data is retained no longer than necessary for the purposes for which it was collected.**

### 2.4 Security
**Retained data is protected with appropriate technical and organizational measures.**

---

## 3. Retention Schedules by Data Category

### 3.1 User Account Data

| Data Type | Retention Period | Legal Basis | Deletion Method |
|-----------|------------------|-------------|-----------------|
| **Email Address** | Until account deletion + 30 days | Contract performance | Overwrite with random string, then purge |
| **Username** | Until account deletion + 30 days | Contract performance | Overwrite with random string, then purge |
| **Hashed Password** | Until account deletion (immediate) | Security | Overwrite with zeros, then purge |
| **Account Creation Date** | Until account deletion + 30 days | Legitimate interest (analytics) | Purge |
| **Last Login Date** | Until account deletion + 30 days | Legitimate interest (security) | Purge |
| **User Preferences (theme, timezone)** | Until account deletion (immediate) | Contract performance | Purge |
| **Favorite Teams/Players** | Until account deletion (immediate) | Contract performance | Purge |

**Inactive Account Handling:**
- **3+ years of inactivity:** Email notification sent
- **90-day grace period:** User can reactivate
- **After 120 days:** Account automatically deleted per schedule above

### 3.2 User-Generated Content (Future Feature)

| Data Type | Retention Period | Legal Basis | Deletion Method |
|-----------|------------------|-------------|-----------------|
| **Comments** | Until account deletion or user-initiated deletion | Contract performance | Soft delete (anonymize), hard delete after 30 days |
| **Predictions** | Until account deletion or user-initiated deletion | Contract performance | Anonymize author, retain aggregated stats |
| **Custom Analytics** | Until account deletion or user-initiated deletion | Contract performance | Purge |
| **Uploaded Images** | Until account deletion or user-initiated deletion + 30 days | Contract performance | Overwrite file, purge from storage and CDN |

**User Deletion Rights:**
- Users can delete individual posts anytime
- Deleted posts soft-deleted (hidden) for 30 days, then purged
- Quoted or referenced content may remain (without personal identifiers)

### 3.3 Usage and Analytics Data

| Data Type | Retention Period | Legal Basis | Deletion Method |
|-----------|------------------|-------------|-----------------|
| **IP Addresses (full)** | 30 days | Legitimate interest (security) | Anonymize (last octet zeroed) |
| **IP Addresses (anonymized)** | 24 months | Legitimate interest (analytics) | Purge |
| **Page Views** | 24 months | Legitimate interest (analytics) | Purge |
| **Feature Usage Data** | 24 months | Legitimate interest (product improvement) | Purge |
| **Error Logs** | 90 days | Legitimate interest (debugging) | Purge |
| **Performance Metrics** | 24 months | Legitimate interest (optimization) | Purge |
| **Session Data** | Session end + 7 days | Legitimate interest (fraud prevention) | Purge |

**Google Analytics Data:**
- Retention: 14 months (configured in Google Analytics settings)
- Anonymization: IP anonymization enabled (`anonymizeIP: true`)
- User deletion: Handled via Google Analytics User Deletion API

### 3.4 Communication Data

| Data Type | Retention Period | Legal Basis | Deletion Method |
|-----------|------------------|-------------|-----------------|
| **Support Tickets** | 3 years after resolution | Legitimate interest (customer service) | Purge (retain anonymized summary) |
| **Marketing Emails Sent** | 5 years | Legal requirement (CAN-SPAM) | Purge metadata (retain unsubscribe list indefinitely) |
| **Unsubscribe List** | Indefinitely | Legal requirement (CAN-SPAM) | Never delete (prevents re-subscription) |
| **Email Bounce Data** | 6 months | Legitimate interest (deliverability) | Purge |
| **Consent Records** | 7 years after withdrawal | Legal requirement (proof of consent) | Purge |

### 3.5 Transaction Data (Future - When Subscriptions Launch)

| Data Type | Retention Period | Legal Basis | Deletion Method |
|-----------|------------------|-------------|-----------------|
| **Payment Receipts** | 7 years | Legal requirement (tax/accounting) | Purge |
| **Subscription History** | 7 years after cancellation | Legal requirement (financial records) | Purge |
| **Refund Records** | 7 years | Legal requirement (tax/accounting) | Purge |
| **Invoices** | 7 years | Legal requirement (IRS) | Purge |
| **Credit Card Details** | Never stored | N/A (third-party processor) | N/A (Stripe handles) |

**Tax and Accounting Compliance:**
- IRS requires 7-year retention for financial records
- Aggregated revenue data retained indefinitely for financial reporting

### 3.6 Legal and Compliance Data

| Data Type | Retention Period | Legal Basis | Deletion Method |
|-----------|------------------|-------------|-----------------|
| **Privacy Rights Requests** | 7 years | Legal requirement (proof of compliance) | Purge |
| **DMCA Notices** | 3 years | Legal requirement (safe harbor defense) | Purge |
| **Security Incident Reports** | 7 years | Legal requirement (breach notification laws) | Purge |
| **Consent Withdrawal Records** | 7 years | Legal requirement (proof of compliance) | Purge |
| **Data Processing Agreements** | 7 years after termination | Legal requirement (contract law) | Purge |

### 3.7 Youth Sports Data (Future - Perfect Game Integration)

| Data Type | Retention Period | Legal Basis | Deletion Method |
|-----------|------------------|-------------|-----------------|
| **Youth Player Stats** | Until 18th birthday + 1 year (with parental consent to retain) | Consent | Purge or anonymize |
| **Parental Consent Records** | Until child turns 18 + 7 years | Legal requirement (COPPA compliance proof) | Purge |
| **Youth Profile Data** | Until account deletion or 18th birthday | Consent | Purge |

**COPPA Compliance:**
- Parental consent required for data collection (under 13)
- Parents can request deletion anytime
- Data not shared with third parties (except publicly available stats)

---

## 4. Deletion Procedures

### 4.1 User-Initiated Deletion

**Account Deletion Process:**

1. **User Request:**
   - Account Settings > Privacy > Delete Account
   - Email to privacy@blazesportsintel.com with subject "Account Deletion"

2. **Verification:**
   - Email confirmation sent to registered address
   - User must click confirmation link within 7 days

3. **Deletion Timeline:**
   - **Immediate:** Account access disabled, login prevented
   - **Within 24 hours:** Personal data anonymized in live databases
   - **Within 30 days:** All personal data purged from production systems
   - **Within 90 days:** Backups purged (next backup rotation)

4. **Exceptions:**
   - Financial records retained for 7 years (tax compliance)
   - Legal hold data retained as required by law
   - Anonymized analytics retained indefinitely

### 4.2 Automated Deletion

**Scheduled Deletion Jobs:**

| Job Name | Frequency | Target Data | Method |
|----------|-----------|-------------|--------|
| `anonymize_ip_addresses` | Daily at 2:00 AM CT | IP addresses >30 days old | Last octet → 0 |
| `purge_error_logs` | Weekly (Sundays) | Error logs >90 days old | Delete from database |
| `purge_session_data` | Daily at 3:00 AM CT | Sessions >7 days old | Delete from KV store |
| `purge_deleted_accounts` | Daily at 4:00 AM CT | Accounts deleted >30 days ago | Overwrite + delete |
| `purge_backup_data` | Quarterly | Backups >90 days old | Secure deletion |
| `cleanup_soft_deletes` | Weekly (Saturdays) | Soft-deleted content >30 days | Hard delete |

**Monitoring:**
- All deletion jobs logged to audit trail
- Failed jobs trigger alerts to engineering team
- Monthly audit of deletion job completion

### 4.3 Backup Purging

**Backup Retention:**
- **Daily Backups:** 7 days
- **Weekly Backups:** 4 weeks
- **Monthly Backups:** 3 months
- **Quarterly Backups:** 1 year

**Deleted Data in Backups:**
- User requests deletion at Day 0
- Data removed from live database at Day 30
- Oldest backup containing data purged at Day 90 (next rotation)

**Immediate Purge (Emergency):**
- For legal reasons or serious privacy violations
- Manual process requiring VP/CTO approval
- All backups purged, new backup cycle started

### 4.4 Third-Party Data Deletion

**When user deletes account, we request deletion from third parties:**

| Service | Data | Deletion Method | Timeline |
|---------|------|-----------------|----------|
| **Google Analytics** | User ID, session data | User Deletion API | 24-48 hours |
| **Cloudflare** | Logs (if identifiable) | Request via support | 7 days |
| **Sentry** | Error context (if identifiable) | Request via support | 30 days |
| **Email Provider (Postmark/SendGrid)** | Email address, send history | Suppression list (permanent) | Immediate |

**Verification:**
- Confirmation received from each service
- Logged to audit trail
- Follow-up if not confirmed within timeline

---

## 5. Legal Holds and Exceptions

### 5.1 Legal Hold Procedures

**When legal hold required:**

1. **Triggers:**
   - Lawsuit filed against company
   - Government investigation
   - Subpoena or court order received
   - Anticipated litigation

2. **Process:**
   - Legal counsel notifies Data Protection Officer
   - Affected data identified and flagged in system
   - Automated deletion suspended for flagged data
   - Hold documented with reason, date, and scope

3. **Hold Release:**
   - Legal counsel confirms hold no longer needed
   - Data unflagged
   - Normal retention schedule resumes

**Documentation:**
- All holds logged in Legal Hold Register
- Periodic review (quarterly) to confirm ongoing necessity
- Audit trail of hold creation, modification, and release

### 5.2 Regulatory Exceptions

**Data retained longer than standard schedule when:**

| Reason | Example | Extended Retention |
|--------|---------|-------------------|
| **Tax/Accounting** | Financial transactions | 7 years (IRS requirement) |
| **COPPA Compliance** | Parental consent records | 7 years (FTC recommendation) |
| **Breach Notification** | Security incident reports | 7 years (state laws) |
| **Litigation** | Lawsuit-related data | Until case resolution + 7 years |
| **Contract Disputes** | Service agreements | 7 years (statute of limitations) |

---

## 6. Data Anonymization

### 6.1 Anonymization Standards

**Truly anonymized data is not personal data under GDPR/CCPA.**

**Anonymization Techniques:**

| Data Type | Anonymization Method | Example |
|-----------|---------------------|---------|
| **Email Address** | Replace with random UUID | `user_a7f3c8e2-b5d1-4f9a-8c3e-1d2f3g4h5i6j` |
| **Username** | Replace with "Deleted User [ID]" | `Deleted User 12345` |
| **IP Address** | Zero last octet | `192.168.1.0` |
| **User ID** | Keep as numeric ID (no linkage) | `54321` (no other identifiers) |
| **Timestamps** | Round to month/year | `2024-03-01` instead of `2024-03-15 14:32:17` |

**Pseudonymization vs. Anonymization:**
- **Pseudonymization:** Can be re-identified (still personal data)
- **Anonymization:** Cannot be re-identified (not personal data)

**We use anonymization, not pseudonymization, for deleted users.**

### 6.2 Aggregated Data Retention

**Aggregated data retained indefinitely:**

- Total users per month (no individual data)
- Feature usage statistics (no user linkage)
- Performance metrics (no personal identifiers)
- Prediction accuracy (no individual predictions)

**Requirements for aggregation:**
- Minimum 10 users per aggregated statistic (k-anonymity)
- No outliers that could identify individuals
- No combination of fields that could re-identify users

---

## 7. Data Subject Rights

### 7.1 Right to Erasure ("Right to be Forgotten")

**GDPR Article 17 and CCPA requirements:**

**Users can request deletion if:**
- Data no longer necessary for original purpose
- Consent withdrawn (and no other legal basis)
- Data processed unlawfully
- Legal obligation to delete

**Exceptions (we may refuse deletion if):**
- Legal obligation to retain (e.g., tax records)
- Legal claims (defense or establishment)
- Public interest (research, statistics)

**Process:**
- Email to privacy@blazesportsintel.com
- Verification of identity
- Deletion within 30 days (GDPR) or 45 days (CCPA)
- Confirmation sent to user

### 7.2 Right to Restriction of Processing

**Users can request we stop using their data while:**
- Accuracy of data is disputed (during verification)
- Processing is unlawful (but user doesn't want deletion)
- We no longer need data (but user needs it for legal claims)

**Implementation:**
- Data flagged as "restricted" in database
- Only stored, not processed (except with consent or legal claims)
- User notified before restriction lifted

---

## 8. Audit and Monitoring

### 8.1 Retention Policy Audits

**Quarterly Audits:**
- Review data inventory for compliance with retention schedules
- Verify deletion jobs running successfully
- Check for data retained beyond schedule
- Update retention schedules for new data types

**Annual Audits:**
- Comprehensive review by Data Protection Officer
- External audit (if resources permit)
- Attorney review of legal retention requirements
- Board/management report

### 8.2 Audit Trail

**All data lifecycle events logged:**

| Event | Logged Information | Retention of Log |
|-------|-------------------|------------------|
| **Account Creation** | User ID, timestamp, IP (anonymized) | 7 years |
| **Account Deletion** | User ID, timestamp, method (user/auto) | 7 years |
| **Data Export** | User ID, timestamp, data types exported | 7 years |
| **Consent Change** | User ID, timestamp, consent type, status | 7 years |
| **Legal Hold** | Data types, reason, start/end dates | 7 years |
| **Deletion Job Run** | Job name, timestamp, records deleted | 3 years |

**Audit Log Security:**
- Append-only (no editing or deletion)
- Encrypted at rest
- Access restricted to authorized personnel
- Backed up separately from production data

---

## 9. Responsibilities

### 9.1 Data Protection Officer (DPO)

**Responsibilities:**
- Oversee retention policy implementation
- Approve retention schedule changes
- Conduct audits
- Report to management and board

### 9.2 Engineering Team

**Responsibilities:**
- Implement automated deletion jobs
- Maintain deletion systems
- Log all data lifecycle events
- Alert DPO to retention issues

### 9.3 Legal Counsel

**Responsibilities:**
- Advise on legal retention requirements
- Review retention schedules annually
- Manage legal holds
- Approve exceptions to policy

### 9.4 All Employees

**Responsibilities:**
- Comply with retention policy
- Do not retain personal data locally beyond policy
- Report retention policy violations
- Complete annual data privacy training

---

## 10. Policy Updates

### 10.1 Review Cycle

**This policy reviewed:**
- Annually (minimum)
- When laws change (GDPR, CCPA amendments)
- When business practices change (new features, data types)
- After audits reveal gaps

### 10.2 Notification of Changes

**Material changes communicated via:**
- Email to all users (30 days advance notice)
- Privacy Policy update
- Platform banner notification

---

## 11. Contact Information

**Data Protection Officer:**
Email: dpo@blazesportsintel.com

**Privacy Inquiries:**
Email: privacy@blazesportsintel.com

**Legal Counsel:**
Email: legal@blazesportsintel.com

**Mailing Address:**
Blaze Sports Intelligence
ATTN: Data Retention Inquiries
[Your Business Address]
Boerne, TX [ZIP Code]

---

## Appendix A: Data Inventory

**Comprehensive list of all personal data collected, stored, and processed:**

[See separate Data Mapping document for detailed inventory]

**Data Categories:**
1. Account Data (email, username, password hash)
2. Usage Data (page views, feature usage, session data)
3. Communication Data (support tickets, email history)
4. Transaction Data (future - subscriptions, payments)
5. User-Generated Content (future - comments, predictions)
6. Youth Sports Data (future - COPPA-protected data)

---

## Appendix B: Deletion Job Specifications

### Job: `anonymize_ip_addresses`

**Language:** SQL (Cloudflare D1)
**Schedule:** Daily at 2:00 AM CT
**Target:** `access_logs` table

```sql
UPDATE access_logs
SET ip_address = CONCAT(
  SUBSTRING_INDEX(ip_address, '.', 3),
  '.0'
)
WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
AND ip_address NOT LIKE '%.0';
```

**Monitoring:** Alert if zero rows updated (indicates job failure)

### Job: `purge_error_logs`

**Language:** SQL
**Schedule:** Weekly (Sundays at 1:00 AM CT)
**Target:** `error_logs` table

```sql
DELETE FROM error_logs
WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

**Monitoring:** Log rows deleted, alert if >100,000 rows (potential issue)

### Job: `purge_deleted_accounts`

**Language:** Node.js script
**Schedule:** Daily at 4:00 AM CT
**Target:** Multiple tables

```javascript
// Pseudo-code
const deletedUsers = await db.query(
  'SELECT user_id FROM users WHERE deleted_at < NOW() - INTERVAL 30 DAY'
);

for (const user of deletedUsers) {
  // Overwrite personal data with random strings
  await db.execute(
    'UPDATE users SET email = ?, username = ?, password_hash = NULL WHERE user_id = ?',
    [randomUUID(), `deleted_${randomUUID()}`, user.user_id]
  );

  // Delete related data
  await db.execute('DELETE FROM user_preferences WHERE user_id = ?', [user.user_id]);
  await db.execute('DELETE FROM user_sessions WHERE user_id = ?', [user.user_id]);

  // Hard delete user record
  await db.execute('DELETE FROM users WHERE user_id = ?', [user.user_id]);

  // Log deletion
  await auditLog.log({
    event: 'account_purged',
    user_id: user.user_id,
    timestamp: new Date()
  });
}
```

**Monitoring:** Log purge count, alert if job fails or times out

---

## Document Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-01-11 | Initial release | Blaze Sports Intelligence Legal |

---

**END OF DATA RETENTION AND DELETION POLICY**

*This policy complies with GDPR Article 5(1)(e), CCPA data minimization principles, and industry best practices. Consult with legal counsel and data protection experts before implementation.*
