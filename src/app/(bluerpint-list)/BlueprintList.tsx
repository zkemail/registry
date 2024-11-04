'use client';

import Link from 'next/link';
import BlueprintCard from '@/app/components/BlueprintCard';
import { Blueprint } from '@dimidumo/zk-email-sdk-ts';
import sdk from '@/lib/sdk';
import { useState, useEffect, useRef, useCallback } from 'react';

const PAGINATION_LIMIT = 30;

interface BlueprintListProps {
  search: string | null;
}

export default function BlueprintList({ search }: BlueprintListProps) {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [skip, setSkip] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const observerRef = useRef<IntersectionObserver>();
  const loadingRef = useRef<HTMLDivElement>(null);

  const fetchBlueprints = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const results = await sdk.listBlueprints({
        search: search || '',
        skip,
        limit: PAGINATION_LIMIT,
      });

      setBlueprints((prev) => {
        // If search changes, replace results instead of appending
        if (skip === 0) return results;
        return [...prev, ...results];
      });

      // If we got fewer results than the limit, we've reached the end
      setHasMore(results.length === PAGINATION_LIMIT);
      setSkip((prevSkip) => prevSkip + PAGINATION_LIMIT);
    } catch (err) {
      // In React 19, errors are not re-thrown, so we handle them explicitly
      setError(err instanceof Error ? err : new Error('Failed to fetch blueprints'));
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [search, skip, isLoading, hasMore]);

  // Reset state when search changes
  useEffect(() => {
    setBlueprints([]);
    setSkip(0);
    setHasMore(true);
    setError(null);
  }, [search]);

  // Initialize intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchBlueprints();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current = observer;
    return () => observer.disconnect();
  }, [fetchBlueprints]);

  // Observe loading div
  useEffect(() => {
    const currentObserver = observerRef.current;
    const currentLoadingRef = loadingRef.current;

    if (currentLoadingRef && currentObserver) {
      currentObserver.observe(currentLoadingRef);
    }

    return () => {
      if (currentLoadingRef && currentObserver) {
        currentObserver.unobserve(currentLoadingRef);
      }
    };
  }, [blueprints]);

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-red-600">
        Error loading blueprints: {error.message}
      </div>
    );
  }

  return (
    <>
      {blueprints.map((blueprint) => (
        <div className="mb-3" key={blueprint.props.id}>
          <Link href={`/${encodeURIComponent(blueprint.props.id!)}`}>
            <BlueprintCard blueprint={blueprint} />
          </Link>
        </div>
      ))}

      <div ref={loadingRef} className="flex h-10 w-full items-center justify-center">
        {isLoading ? (
          <div className="text-gray-500">Loading more blueprints...</div>
        ) : !hasMore && blueprints.length > 0 ? (
          <div className="text-gray-500">No more blueprints to load</div>
        ) : blueprints.length === 0 && !isLoading ? (
          search ? (
            <div>No blueprints found for "{search}"</div>
          ) : (
            <div>Loading...</div>
          )
        ) : null}
      </div>
    </>
  );
}
