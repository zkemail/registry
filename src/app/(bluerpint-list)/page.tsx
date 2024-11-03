'use client';
import { Suspense } from 'react';
import SearchBar from '@/app/components/SearchBar';
import BlueprintList from './BlueprintList';
import { useSearchParams } from 'next/navigation';

export default function Home() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blueprints</h1>
        <div className="flex items-center gap-4">
          <SearchBar />
          <button className="hover:bg-grey-50 rounded-lg border px-4 py-2">Filters</button>
        </div>
      </div>

      <div className="">
        <Suspense>
          <BlueprintList search={search} />
        </Suspense>
      </div>
    </div>
  );
}
