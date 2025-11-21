export function LiveDataSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" role="status" aria-label="Loading live data">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="bg-white/80 border border-gray-100 rounded-xl p-6 shadow-sm">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="mt-4 space-y-3">
            <div className="h-8 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-8 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-8 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
