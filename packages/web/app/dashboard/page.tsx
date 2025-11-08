import dynamic from 'next/dynamic';
import { SiteHeader } from '@/components/site-header';
import { fetchDashboardData } from '@/lib/api';

const DashboardContent = dynamic(() => import('@/components/dashboard-content'), { ssr: false, loading: () => <p className="text-white/60">Preparing live analytics…</p> });

export const dynamicParams = true;
export const revalidate = 15;

export default async function DashboardPage() {
  const data = await fetchDashboardData();

  return (
    <div className="space-y-12">
      <SiteHeader />
      <DashboardContent data={data} />
    </div>
  );
}
