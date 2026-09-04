export function LoadingSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-20 rounded-lg bg-gray-200 animate-pulse"
        />
      ))}
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      <p className="text-sm text-gray-700 dark:text-gray-400">Učitavanje...</p>
    </div>
  );
}


