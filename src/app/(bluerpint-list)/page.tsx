'use client';
import { Suspense } from 'react';
import SearchBar from '@/app/components/SearchBar';
import BlueprintList from './BlueprintList';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function Home() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blueprints</h1>
        <div className="flex items-center gap-4">
          <SearchBar />
          <Button
            variant="secondary"
            size="sm"
            className="bg-white"
            startIcon={<Image src="/assets/Faders.svg" alt="filter" width={16} height={16} />}
          >
            Filter and Sort
          </Button>
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
