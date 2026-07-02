// Skeleton shown while the dashboard server component loads
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-8" aria-busy="true" aria-label="Loading dashboard">
      {/* Page title skeleton */}
      <div className="h-8 w-32 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`rounded-lg border border-gray-200 p-4 dark:border-gray-800 ${
              i === 2 ? 'col-span-2 sm:col-span-1' : ''
            }`}
          >
            <div className="mx-auto h-5 w-5 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
            <div className="mx-auto mt-2 h-8 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            <div className="mx-auto mt-1 h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>

      {/* Section skeleton */}
      {['Your Tournaments', 'Upcoming Matches'].map((label) => (
        <div key={label} className="space-y-3">
          <div className="h-6 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          {[0, 1].map((j) => (
            <div key={j} className="h-16 animate-pulse rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900" />
          ))}
        </div>
      ))}
    </div>
  );
}
