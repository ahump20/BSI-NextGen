'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * GDPR-compliant Cookie Consent Banner
 *
 * Requirements:
 * - Must appear before setting any cookies
 * - Must provide clear opt-in for non-essential cookies
 * - Must link to privacy policy
 * - Must respect user's choice persistently
 *
 * Cookie Categories:
 * - Essential: Required for site functionality (authentication, preferences)
 * - Analytics: Usage tracking and performance monitoring
 * - Marketing: Not currently used but included for future
 */

type ConsentPreferences = {
  essential: boolean; // Always true - required for site functionality
  analytics: boolean;
  marketing: boolean;
};

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const preferences: ConsentPreferences = {
      essential: true,
      analytics: true,
      marketing: true,
    };
    saveConsent(preferences);
    setShowBanner(false);
  };

  const handleAcceptEssential = () => {
    const preferences: ConsentPreferences = {
      essential: true,
      analytics: false,
      marketing: false,
    };
    saveConsent(preferences);
    setShowBanner(false);
  };

  const handleCustomize = () => {
    setShowDetails(true);
  };

  const handleSaveCustom = (preferences: ConsentPreferences) => {
    saveConsent(preferences);
    setShowBanner(false);
  };

  const saveConsent = (preferences: ConsentPreferences) => {
    const consentData = {
      preferences,
      timestamp: new Date().toISOString(),
      version: '1.0', // Update when privacy policy changes
    };
    localStorage.setItem('cookie-consent', JSON.stringify(consentData));

    // Dispatch event so other components can react to consent
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: consentData }));
  };

  if (!showBanner) return null;

  if (showDetails) {
    return <DetailedConsentForm onSave={handleSaveCustom} onClose={() => setShowDetails(false)} />;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white p-4 md:p-6 shadow-2xl border-t-2 border-orange-500">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-2">🍪 Cookie Consent</h3>
            <p className="text-sm text-gray-300 mb-2">
              We use cookies to enhance your experience, analyze site usage, and provide personalized content.
              By clicking "Accept All", you consent to our use of cookies.
            </p>
            <p className="text-xs text-gray-400">
              <Link href="/privacy" className="underline hover:text-orange-400">
                Privacy Policy
              </Link>
              {' • '}
              <Link href="/cookies" className="underline hover:text-orange-400">
                Cookie Policy
              </Link>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={handleAcceptEssential}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium text-sm transition-colors"
            >
              Essential Only
            </button>
            <button
              onClick={handleCustomize}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium text-sm transition-colors"
            >
              Customize
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-medium text-sm transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailedConsentForm({
  onSave,
  onClose,
}: {
  onSave: (preferences: ConsentPreferences) => void;
  onClose: () => void;
}) {
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Cookie Preferences</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Essential Cookies */}
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Essential Cookies</h3>
                  <p className="text-sm text-gray-600">
                    Required for the website to function properly. Cannot be disabled.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Examples: Authentication, session management, security features
                  </p>
                </div>
                <div className="ml-4">
                  <div className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-sm font-medium">
                    Always Active
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Analytics Cookies</h3>
                  <p className="text-sm text-gray-600">
                    Help us understand how visitors interact with our website by collecting and reporting
                    information anonymously.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Examples: Cloudflare Analytics, page views, user journey tracking
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() =>
                      setPreferences((prev) => ({ ...prev, analytics: !prev.analytics }))
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.analytics ? 'bg-orange-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.analytics ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="pb-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Marketing Cookies</h3>
                  <p className="text-sm text-gray-600">
                    Used to track visitors across websites and display personalized ads.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Note: Currently not used by Blaze Sports Intel
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() =>
                      setPreferences((prev) => ({ ...prev, marketing: !prev.marketing }))
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.marketing ? 'bg-orange-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.marketing ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => onSave({ essential: true, analytics: false, marketing: false })}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium text-gray-900 transition-colors"
            >
              Essential Only
            </button>
            <button
              onClick={() => onSave(preferences)}
              className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to check if user has consented to a specific cookie category
 *
 * Usage:
 * ```tsx
 * const { hasConsent } = useCookieConsent('analytics');
 *
 * if (hasConsent) {
 *   // Initialize analytics tracking
 * }
 * ```
 */
export function useCookieConsent(category: keyof ConsentPreferences) {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const checkConsent = () => {
      const consentStr = localStorage.getItem('cookie-consent');
      if (!consentStr) {
        setHasConsent(false);
        return;
      }

      try {
        const consent = JSON.parse(consentStr);
        setHasConsent(consent.preferences?.[category] || false);
      } catch {
        setHasConsent(false);
      }
    };

    checkConsent();

    // Listen for consent updates
    window.addEventListener('cookie-consent-updated', checkConsent);
    return () => window.removeEventListener('cookie-consent-updated', checkConsent);
  }, [category]);

  return { hasConsent };
}
