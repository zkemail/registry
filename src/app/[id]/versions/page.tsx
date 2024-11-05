'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import VersionCard from './VersionCard';
import Link from 'next/link';
import { useParams } from 'next/dist/client/components/navigation';

const VersionsPage = ({ params }: { params: { slug: string } }) => {
  //   const slug = params.slug;
  const { slug } = useParams();

  return (
    <div className="mx-auto flex flex-col gap-10 py-16">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex w-full flex-col items-start gap-2">
            <Link href={`/${slug}`}>
              <Button
                variant="ghost"
                startIcon={<Image src="/assets/ArrowLeft.svg" alt="back" width={16} height={16} />}
              >
                Proof of Devcon Rejection
              </Button>
            </Link>
            <div className="flex w-full flex-row justify-between">
              <h2 className="text-xl font-bold">Version History</h2>
              <div className="flex flex-row gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  startIcon={
                    <Image src="/assets/GitCommit.svg" alt="versions" width={16} height={16} />
                  }
                >
                  11 Versions
                </Button>
                <Link href={`/create`}>
                  <Button
                    variant="default"
                    size="sm"
                    startIcon={<Image src="/assets/Plus.svg" alt="add" width={16} height={16} />}
                  >
                    Create from scratch
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Versions Cards */}
        <div className="mt-10 flex flex-col gap-4">
          <VersionCard />
        </div>
      </div>
    </div>
  );
};

export default VersionsPage;
