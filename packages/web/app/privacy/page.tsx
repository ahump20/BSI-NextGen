import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Blaze Sports Intel',
  description: 'Privacy policy and data protection information for Blaze Sports Intel',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/" className="text-blue-600 hover:text-blue-800 mb-6 inline-block">
        ← Back to Home
      </Link>

      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

      <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
        <p className="text-sm text-gray-500">
          <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { timeZone: 'America/Chicago' })}
        </p>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">1.1 Information You Provide</h3>
          <p>
            When you create an account or use our services, we may collect:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Name and email address</li>
            <li>Account credentials (securely hashed)</li>
            <li>Profile preferences</li>
            <li>Communication preferences</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">1.2 Automatically Collected Information</h3>
          <p>
            When you visit our website, we automatically collect:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>IP address and browser type</li>
            <li>Device information</li>
            <li>Pages visited and time spent</li>
            <li>Referring website</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Provide and improve our sports analytics services</li>
            <li>Personalize your experience</li>
            <li>Send important service updates</li>
            <li>Analyze usage patterns and improve performance</li>
            <li>Prevent fraud and ensure security</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Data Sharing and Disclosure</h2>
          <p>
            We do not sell your personal information. We may share data with:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              <strong>Service Providers:</strong> Cloudflare (hosting), Auth0 (authentication), and analytics providers
            </li>
            <li>
              <strong>Legal Requirements:</strong> When required by law or to protect our rights
            </li>
            <li>
              <strong>Business Transfers:</strong> In connection with a merger, sale, or acquisition
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar technologies to enhance your experience. See our{' '}
            <Link href="/cookies" className="text-blue-600 hover:text-blue-800 underline">
              Cookie Policy
            </Link>{' '}
            for details.
          </p>
          <p className="mt-2">
            You can manage cookie preferences through our cookie consent banner or your browser settings.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights and Choices</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              <strong>Access:</strong> Request a copy of your personal data
            </li>
            <li>
              <strong>Rectification:</strong> Correct inaccurate information
            </li>
            <li>
              <strong>Deletion:</strong> Request deletion of your data
            </li>
            <li>
              <strong>Portability:</strong> Receive your data in a structured format
            </li>
            <li>
              <strong>Objection:</strong> Object to processing of your data
            </li>
            <li>
              <strong>Withdraw Consent:</strong> Withdraw previously given consent
            </li>
          </ul>
          <p className="mt-4">
            To exercise these rights, contact us at{' '}
            <a href="mailto:privacy@blazesportsintel.com" className="text-blue-600 hover:text-blue-800 underline">
              privacy@blazesportsintel.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Security</h2>
          <p>
            We implement industry-standard security measures including:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>HTTPS encryption for all data transmission</li>
            <li>Secure authentication with Auth0</li>
            <li>Regular security audits</li>
            <li>Access controls and monitoring</li>
          </ul>
          <p className="mt-2">
            However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Children's Privacy</h2>
          <p>
            Our service is not directed to children under 13. We do not knowingly collect personal information from
            children under 13. If you believe we have collected such information, please contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in the United States or other countries where our
            service providers operate. We ensure appropriate safeguards are in place for such transfers.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to provide our services and comply with legal
            obligations. When you delete your account, we will delete or anonymize your data within 30 days, except
            where we are required to retain it by law.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of significant changes by posting
            a notice on our website or sending you an email.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
          <p>
            If you have questions about this privacy policy or our data practices, contact us:
          </p>
          <ul className="list-none ml-0 space-y-1">
            <li>
              <strong>Email:</strong>{' '}
              <a href="mailto:privacy@blazesportsintel.com" className="text-blue-600 hover:text-blue-800 underline">
                privacy@blazesportsintel.com
              </a>
            </li>
            <li>
              <strong>Address:</strong> Blaze Sports Intel, Boerne, Texas
            </li>
          </ul>
        </section>

        <div className="mt-12 pt-6 border-t border-gray-300">
          <p className="text-sm text-gray-600">
            For California residents, see our{' '}
            <Link href="/ccpa" className="text-blue-600 hover:text-blue-800 underline">
              CCPA Privacy Notice
            </Link>
            .
          </p>
          <p className="text-sm text-gray-600 mt-2">
            For EU/EEA residents, see our{' '}
            <Link href="/gdpr" className="text-blue-600 hover:text-blue-800 underline">
              GDPR Information
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
