export default function OrganizerLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8" aria-busy="true" aria-label="Loading tournaments">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-44 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-9 w-36 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-800"
          >
            <div className="space-y-2">
              <div className="h-5 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-3.5 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
