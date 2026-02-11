'use client';

import { useEffect } from 'react';

export default function BlueprintError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Blueprint page error:', error);
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center py-8">
      <div className="max-w-md text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Failed to load blueprint</h2>
        <p className="mb-6 text-gray-600">
          There was a problem loading this blueprint. It may not exist or there might be a temporary issue.
        </p>
        {error.digest && (
          <p className="mb-4 text-sm text-gray-400">Error ID: {error.digest}</p>
        )}
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back to blueprints
          </a>
        </div>
      </div>
    </div>
  );
}
