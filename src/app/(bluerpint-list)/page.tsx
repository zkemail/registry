'use client';
import { Suspense, useEffect } from 'react';
import SearchBar from '@/app/components/SearchBar';
import BlueprintList from './BlueprintList';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import FilterAndSortButton from './FilterAndSortButton';
import { Status } from '@zk-email/sdk';
import { useBlueprintFiltersStore } from '@/lib/stores/useBlueprintFiltersStore';

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { search, filters, sort, updateFromUrl, clearFilters } = useBlueprintFiltersStore();

  // Restore filters and sort from store on page load if URL is clean
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    const urlFilters = searchParams.get('filter');
    const urlSort = searchParams.get('sort');

    // If URL has no parameters but store has data, restore filters and sort (but not search)
    if (!urlFilters && !urlSort && (filters.length > 0 || sort !== 'totalProofs')) {
      const params = new URLSearchParams();
      if (filters.length > 0) params.set('filter', filters.join(','));
      if (sort && sort !== 'totalProofs') params.set('sort', sort);
      
      const queryString = params.toString();
      if (queryString) {
        router.replace(`${pathname}?${queryString}`);
      }
    }
  }, [searchParams, filters, sort, router, pathname, updateFromUrl]);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex flex-col gap-2 items-start justify-between md:flex-row md:items-center">
        <h1 className="text-2xl font-bold">Blueprints</h1>
        <div className="flex items-center gap-4">
          <SearchBar />
          <FilterAndSortButton />
        </div>
      </div>

      <Suspense>
        <BlueprintListWrapper />
      </Suspense>
    </div>
  );
}

function BlueprintListWrapper() {
  const searchParams = useSearchParams();

  // Use URL parameters for immediate API calls
  const urlSearch = searchParams.get('search');
  const urlFilters = (searchParams.get('filter')?.split(',').filter(Boolean) as unknown as Status[]) || [];
  const urlSort = searchParams.get('sort') || 'totalProofs';

  // Use URL values for API calls (immediate response)
  const searchValue = urlSearch || null;

  console.log(searchValue, urlFilters, urlSort, "blueprint list wrapper");

  return (
    <div className="">
      <BlueprintList search={searchValue} filters={urlFilters} sort={urlSort} />
    </div>
  );
}
