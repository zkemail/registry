'use client';
import { Suspense } from 'react';
import SearchBar from '@/app/components/SearchBar';
import BlueprintList from './BlueprintList';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import FilterAndSortButton from './FilterAndSortButton';

export default function Home() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search');
  const filters = searchParams.get('filter')?.split(',').filter(Boolean) || [];
  const sort = searchParams.get('sort') || '';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blueprints</h1>
        <div className="flex items-center gap-4">
          <SearchBar />
          <FilterAndSortButton />
        </div>
      </div>

      <div className="">
        <Suspense>
          <BlueprintList search={search} filters={filters} sort={sort} />
        </Suspense>
      </div>
    </div>
  );
}
