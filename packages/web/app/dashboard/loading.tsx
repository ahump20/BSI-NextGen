export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-16 w-48 animate-pulse rounded-full bg-white/10" />
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-56 animate-pulse rounded-3xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}
