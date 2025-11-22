/**
 * Enterprise Analytics Dashboard Page
 *
 * Showcases the enhanced Command Center v9.0 with all enterprise features
 */

import React from 'react';
import EnhancedCommandCenter from '@/components/enterprise/EnhancedCommandCenter';

export const metadata = {
  title: 'Enterprise Analytics | Blaze Sports Intel',
  description: 'AI-powered sports analytics platform with real-time predictions, natural language queries, and advanced visualizations',
};

export default function EnterpriseAnalyticsPage() {
  return (
    <main className="min-h-screen bg-black">
      <EnhancedCommandCenter />
    </main>
  );
}
