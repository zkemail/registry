'use client';

import BlueprintList from '@/app/(bluerpint-list)/BlueprintList';
import SearchBar from '@/app/components/SearchBar';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { Status } from '@zk-email/sdk';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const MyBlueprints = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex flex-col items-start justify-between md:flex-row md:items-center">
        <h1 className="text-2xl font-bold">Your Blueprints</h1>
        <div className="flex items-center gap-4">
          <SearchBar />
        </div>
      </div>
      <p className="-mt-4 mb-8 text-base text-grey-800">
        These are all the blueprints created by you
      </p>

      <Suspense>
        <BlueprintListWrapper />
      </Suspense>
    </div>
  );
};

function BlueprintListWrapper() {
  const searchParams = useSearchParams();
  const username = useAuthStore((state) => state.username);

  if (!username) {
    return <div>Please login to view your blueprints</div>;
  }

  const searchString = `${username}/` + (searchParams.get('search') ?? '');

  const filters =
    (searchParams.get('filter')?.split(',').filter(Boolean) as unknown as Status[]) || [];
  const sort = searchParams.get('sort') || '';

  return (
    <div className="">
      <BlueprintList search={searchString} filters={filters} sort={sort} />
    </div>
  );
}

export default MyBlueprints;
