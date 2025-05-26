'use client';
import { Suspense } from 'react';
import SearchBar from '@/app/components/SearchBar';
import BlueprintList from './BlueprintList';
import { useSearchParams } from 'next/navigation';
import FilterAndSortButton from './FilterAndSortButton';
import { Status } from '@zk-email/sdk';

export default function Home() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex flex-col items-start justify-between md:flex-row md:items-center">
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
  const search = searchParams.get('search');
  const filters =
    (searchParams.get('filter')?.split(',').filter(Boolean) as unknown as Status[]) || [];
  const sort = searchParams.get('sort') || 'totalProofs';

  return (
    <div className="">
      <BlueprintList search={search} filters={filters} sort={sort} />
    </div>
  );
}
