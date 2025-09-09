'use client';

import Link from 'next/link';
import BlueprintCard from '@/app/components/BlueprintCard';
import { Blueprint, Status } from '@zk-email/sdk';
import sdk from '@/lib/sdk';
import { useState, useEffect, useRef, useCallback } from 'react';
import Loader from '@/components/ui/loader';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { toast } from 'react-toastify';

const PAGINATION_LIMIT = 20;

interface BlueprintListProps {
  search: string | null;
  filters: Status[];
  sort: string;
}

export default function BlueprintList({ search, filters, sort }: BlueprintListProps) {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [userStarredSlugs, setUserStarredSlugs] = useState<string[]>([]);
  const token = useAuthStore((state) => state.token);
  const [skip, setSkip] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const observerRef = useRef<IntersectionObserver>();
  const loadingRef = useRef<HTMLDivElement>(null);
  // Tracks the active query (search/filters/sort). Any response from an older key is ignored.
  const activeQueryKeyRef = useRef(0);
  // Mirror isFirstLoad in a ref for use inside observer callback without stale closure
  const isFirstLoadRef = useRef(true);
  // Track in-flight request by query key to avoid duplicate fetches for the same key
  const inFlightRequestKeyRef = useRef<number | null>(null);
  // Track last intersection state to only trigger on transition to intersecting
  const wasIntersectingRef = useRef(false);
  // Guard against double-invoked effects (e.g., React Strict Mode) by deduping on signature
  const lastAppliedSignatureRef = useRef<string | null>(null);

  console.log(search, filters, sort, "blueprint list");

  const fetchBlueprints = useCallback(
    async (
      params?: {
        search?: string | null;
        filters?: Status[];
        sort?: string;
        force?: boolean;
        requestKey?: number;
      }
    ) => {
      const requestKey = params?.requestKey ?? activeQueryKeyRef.current;
      // Avoid duplicate fetches for the same query key
      if (params?.force) {
        if (inFlightRequestKeyRef.current === requestKey) return;
      } else {
        if (isLoading || !hasMore) return;
      }

      const currentSearch = (params?.search ?? search) || '';
      const currentFilters = params?.filters ?? filters;
      const currentSort = (params?.sort ?? sort) as 'stars' | 'updatedAt' | 'totalProofs';
      // Mark this request key as in-flight
      inFlightRequestKeyRef.current = requestKey;

      setIsLoading(true);
      setError(null);
      try {
        let results;
        let retryCount = 0;
        const maxRetries = 3;
        // When params are provided (search/filters/sort changed), start from the beginning
        // Otherwise, continue from current pagination state
        let localSkip = params ? 0 : skip;

        while (!results && retryCount < maxRetries) {
          try {
            // NOTE: An admin will see blueprints of ALL statuses of ALL users
            // A logged in non admin will only see his/her blueprints if status is not Done
            results = await sdk.listBlueprints({
              search: currentSearch,
              skip: localSkip,
              limit: PAGINATION_LIMIT,
              status: currentFilters.length > 0 ? currentFilters : undefined,
              sort: -1,
              sortBy: currentSort,
            });
          } catch (err) {
            retryCount++;
            localSkip += PAGINATION_LIMIT;
            if (retryCount === maxRetries) {
              throw err;
            }
            console.error('Error fetching blueprints: ', err);
            // Wait a bit before retrying
            await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
          }
        }

        if (results) {
          // Ignore stale responses from an outdated query key
          if (requestKey !== activeQueryKeyRef.current) {
            return;
          }
          setBlueprints((prevBlueprints) => [...prevBlueprints, ...results]);
          // If we got fewer results than the limit, we've reached the end
          setHasMore(results.length === PAGINATION_LIMIT);
          setSkip(localSkip + PAGINATION_LIMIT);
        }
      } catch (err) {
        // In React 19, errors are not re-thrown, so we handle them explicitly
        setError(err instanceof Error ? err : new Error('Failed to fetch blueprints'));
        console.error('Failed to fetch blueprints:', err);
        setHasMore(false);
      } finally {
        // Only clear first-load if this response corresponds to the active query
        if ((params?.requestKey ?? activeQueryKeyRef.current) === activeQueryKeyRef.current) {
          setIsFirstLoad(false);
        }
        // Clear in-flight if matching request key
        if (inFlightRequestKeyRef.current === requestKey) {
          inFlightRequestKeyRef.current = null;
        }
        setIsLoading(false);
      }
    },
    [search, filters, sort, skip, isLoading, hasMore]
  );

  // Reset state when search/filters/sort change
  useEffect(() => {
    const signature = `${search ?? ''}|${filters.join(',')}|${sort}`;
    if (lastAppliedSignatureRef.current === signature) {
      return;
    }
    lastAppliedSignatureRef.current = signature;

    // Bump the active query key so in-flight older requests get ignored
    activeQueryKeyRef.current += 1;
    // Ensure the UI stays in loading state during the reset to avoid empty flicker
    setIsLoading(true);
    setBlueprints([]);
    setSkip(0);
    setHasMore(true);
    setError(null);
    setIsFirstLoad(true);
    // Reset intersection transition tracking on filter change
    wasIntersectingRef.current = false;
    // Trigger an immediate fetch with the latest params after reset, bypassing guards
    fetchBlueprints({ search, filters, sort, force: true, requestKey: activeQueryKeyRef.current });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filters, sort]);

  // Initialize intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const isNowIntersecting = entries[0].isIntersecting;
        // Only trigger on transition from not-intersecting to intersecting
        if (isNowIntersecting && !wasIntersectingRef.current) {
          // Avoid triggering a second request during the initial load
          if (!isFirstLoadRef.current) {
            fetchBlueprints();
          }
        }
        wasIntersectingRef.current = isNowIntersecting;
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

  // Keep ref in sync with state
  useEffect(() => {
    isFirstLoadRef.current = isFirstLoad;
  }, [isFirstLoad]);

  useEffect(() => {
    if (token) {
      sdk
        .getStarredBlueprints()
        .then(setUserStarredSlugs)
        .catch((err) => {
          console.error('Failed to get starred blueprints: ', err);
        });
    } else {
      setUserStarredSlugs([]);
    }
  }, [token]);

  // Edited the message at the bottom to be a hotfix
  // if (error) {
  //   return (
  //     <div className="rounded-md bg-red-50 p-4 text-red-600">
  //       Error loading blueprints: {error.message}
  //     </div>
  //   );
  // }

  const onStar = async (blueprint: Blueprint) => {
    if (!token) {
      toast.info('Login to star a blueprint');
      return;
    }
    try {
      await blueprint.addStar();
      const slugs = await sdk.getStarredBlueprints();
      setUserStarredSlugs(slugs);
    } catch (err) {
      console.warn('Failed to star blueprint: ', err);
    }
  };

  const onUnStar = async (blueprint: Blueprint) => {
    if (!token) {
      toast.info('Login to star a blueprint');
      return;
    }
    try {
      await blueprint.removeStar();
      const slugs = await sdk.getStarredBlueprints();
      setUserStarredSlugs(slugs);
    } catch (err) {
      console.warn('Failed to unstar blueprint: ', err);
    }
  };

  return (
    <>
      {blueprints.map((blueprint) => (
        <div className="mb-3" key={blueprint.props.id}>
          <Link
            href={
              blueprint.props.clientStatus === Status.Draft ||
              blueprint.props.serverStatus === Status.Draft
                ? `/${encodeURIComponent(blueprint.props.id!)}/versions`
                : `/${encodeURIComponent(blueprint.props.id!)}`
            }
          >
            <BlueprintCard
              blueprint={blueprint}
              setStarred={() => onStar(blueprint)}
              setUnStarred={() => onUnStar(blueprint)}
              starred={userStarredSlugs && userStarredSlugs.includes(blueprint.props.slug!)}
            />
          </Link>
        </div>
      ))}

      <div ref={loadingRef} className="flex h-10 w-full items-center justify-center">
        {isLoading ? (
          <Loader />
        ) : error ? (
          <div className="text-red-600">Error loading more blueprints: {error.message}</div>
        ) : !hasMore && blueprints.length > 0 ? (
          <div className="text-grey-500">No more blueprints to load</div>
        ) : blueprints.length === 0 && !isLoading ? (
          search ? (
            <div>No blueprints found for "{search}"</div>
          ) : (
            <div>No blueprints found</div>
          )
        ) : null}
      </div>
    </>
  );
}
