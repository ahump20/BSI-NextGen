import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy | Blaze Sports Intel',
  description: 'Cookie policy and tracking technology information for Blaze Sports Intel',
};

export default function CookiePolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/" className="text-blue-600 hover:text-blue-800 mb-6 inline-block">
        ← Back to Home
      </Link>

      <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>

      <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
        <p className="text-sm text-gray-500">
          <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { timeZone: 'America/Chicago' })}
        </p>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What Are Cookies?</h2>
          <p>
            Cookies are small text files stored on your device when you visit a website. They help websites remember
            your preferences and understand how you use the site.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Cookies</h2>
          <p>We use cookies for the following purposes:</p>

          <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">2.1 Essential Cookies (Always Active)</h3>
          <p>
            These cookies are necessary for the website to function properly. They enable core functionality such as:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>User authentication and session management</li>
            <li>Security features and fraud prevention</li>
            <li>Cookie consent preferences</li>
            <li>Load balancing</li>
          </ul>
          <p className="mt-2 text-sm bg-gray-100 p-3 rounded">
            <strong>Examples:</strong> Session cookies, authentication tokens, CSRF tokens
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">2.2 Analytics Cookies (Optional)</h3>
          <p>
            These cookies help us understand how visitors use our website:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Page views and navigation patterns</li>
            <li>Performance metrics and error tracking</li>
            <li>User journey analysis</li>
            <li>Traffic sources</li>
          </ul>
          <p className="mt-2 text-sm bg-gray-100 p-3 rounded">
            <strong>Provider:</strong> Cloudflare Analytics (privacy-preserving, no personal data stored)
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">2.3 Marketing Cookies (Optional)</h3>
          <p>
            Currently not used. If we implement marketing cookies in the future, we will:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Update this policy and notify users</li>
            <li>Require explicit opt-in consent</li>
            <li>Provide clear information about third parties involved</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Cookie Details</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Cookie Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Purpose</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Category</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-mono">cookie-consent</td>
                  <td className="border border-gray-300 px-4 py-2">Stores your cookie preferences</td>
                  <td className="border border-gray-300 px-4 py-2">Essential</td>
                  <td className="border border-gray-300 px-4 py-2">1 year</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-mono">auth_session</td>
                  <td className="border border-gray-300 px-4 py-2">Maintains user login session</td>
                  <td className="border border-gray-300 px-4 py-2">Essential</td>
                  <td className="border border-gray-300 px-4 py-2">7 days</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-mono">csrf_token</td>
                  <td className="border border-gray-300 px-4 py-2">Prevents cross-site request forgery attacks</td>
                  <td className="border border-gray-300 px-4 py-2">Essential</td>
                  <td className="border border-gray-300 px-4 py-2">Session</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-mono">__cf_bm</td>
                  <td className="border border-gray-300 px-4 py-2">Cloudflare bot management</td>
                  <td className="border border-gray-300 px-4 py-2">Essential</td>
                  <td className="border border-gray-300 px-4 py-2">30 minutes</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-mono">_cfduid</td>
                  <td className="border border-gray-300 px-4 py-2">Cloudflare traffic routing</td>
                  <td className="border border-gray-300 px-4 py-2">Analytics</td>
                  <td className="border border-gray-300 px-4 py-2">30 days</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Managing Cookies</h2>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">4.1 Cookie Consent Banner</h3>
          <p>
            When you first visit our website, you'll see a cookie consent banner. You can choose to:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Accept All:</strong> Allow all cookies including analytics</li>
            <li><strong>Essential Only:</strong> Only allow essential cookies</li>
            <li><strong>Customize:</strong> Choose which categories to enable</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">4.2 Browser Settings</h3>
          <p>
            You can also manage cookies through your browser settings:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                Chrome
              </a>
            </li>
            <li>
              <a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                Firefox
              </a>
            </li>
            <li>
              <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                Safari
              </a>
            </li>
            <li>
              <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                Edge
              </a>
            </li>
          </ul>
          <p className="mt-2 text-sm bg-yellow-50 border border-yellow-200 p-3 rounded">
            ⚠️ <strong>Note:</strong> Blocking essential cookies may prevent the website from functioning properly.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Third-Party Cookies</h2>
          <p>
            We use the following third-party services that may set cookies:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              <strong>Cloudflare:</strong> Hosting and CDN services. See{' '}
              <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                Cloudflare Privacy Policy
              </a>
            </li>
            <li>
              <strong>Auth0:</strong> Authentication services. See{' '}
              <a href="https://auth0.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                Auth0 Privacy Policy
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Updates to This Policy</h2>
          <p>
            We may update this cookie policy to reflect changes in our practices or for legal, operational, or
            regulatory reasons. We will notify you of significant changes by posting a notice on our website.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact Us</h2>
          <p>
            If you have questions about our use of cookies, contact us:
          </p>
          <p className="mt-2">
            <strong>Email:</strong>{' '}
            <a href="mailto:privacy@blazesportsintel.com" className="text-blue-600 hover:text-blue-800 underline">
              privacy@blazesportsintel.com
            </a>
          </p>
        </section>

        <div className="mt-12 pt-6 border-t border-gray-300">
          <p className="text-sm text-gray-600">
            For more information about how we handle your data, see our{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
