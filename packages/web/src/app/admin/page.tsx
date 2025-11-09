'use client';

import { useState, useEffect } from 'react';
import { AdminStats } from '@/components/admin/AdminStats';
import { SiteHealthMonitor } from '@/components/admin/SiteHealthMonitor';
import { QuickActions } from '@/components/admin/QuickActions';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { ApiEndpointStatus } from '@/components/admin/ApiEndpointStatus';

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-400">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 border-b border-orange-700">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <span>⚙️</span>
                <span>Admin Dashboard</span>
              </h1>
              <p className="text-orange-100 mt-2">
                Site management, monitoring, and analytics
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-orange-100">Last Updated</div>
              <div className="text-lg font-mono">
                {new Date().toLocaleTimeString('en-US', {
                  timeZone: 'America/Chicago',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>
              <div className="text-xs text-orange-200">America/Chicago</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <AdminStats />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Site Health Monitor */}
          <div className="lg:col-span-2">
            <SiteHealthMonitor />
          </div>

          {/* Quick Actions */}
          <div>
            <QuickActions />
          </div>
        </div>

        {/* API Endpoint Status */}
        <div className="mt-8">
          <ApiEndpointStatus />
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
