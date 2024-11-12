'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import VersionCard from './VersionCard';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import sdk from '@/lib/sdk';
import { Blueprint } from '@zk-email/sdk';

const VersionsPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const [mainBlueprint, setMainBlueprint] = useState<Blueprint | null>(null);
  const [versions, setVersions] = useState<Blueprint[]>([]);

  useEffect(() => {
    sdk
      .getBlueprintById(id)
      .then(setMainBlueprint)
      .catch((err) => {
        console.error(`Failed to blueprint with id ${id}: `, err);
      });
  }, []);

  useEffect(() => {
    if (mainBlueprint) {
      mainBlueprint
        .listAllVersions()
        .then(setVersions)
        .catch((err) => {
          console.error(`Failed list all versions for id ${id}: `, err);
        });
    }
  }, [mainBlueprint]);

  return (
    <div className="mx-auto flex flex-col gap-10 py-16">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex w-full flex-col items-start gap-2">
            <Link href={`/${id}`}>
              <Button
                variant="ghost"
                startIcon={<Image src="/assets/ArrowLeft.svg" alt="back" width={16} height={16} />}
              >
                {mainBlueprint?.props.title}
              </Button>
            </Link>
            <div className="flex w-full flex-col justify-between gap-4 md:flex-row">
              <h2 className="text-xl font-bold">Version History</h2>
              <div className="flex flex-row gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  startIcon={
                    <Image src="/assets/GitCommit.svg" alt="versions" width={16} height={16} />
                  }
                >
                  {versions.length} Version{versions.length > 1 && 's'}
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

        <div className="mt-10 flex flex-col gap-4">
          {versions.map((version) => (
            <VersionCard key={version.props.id} blueprint={version} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default VersionsPage;
