'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import VersionCard from './VersionCard';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import sdk from '@/lib/sdk';
import { Blueprint, Status } from '@zk-email/sdk';
import { toast } from 'react-toastify';
import Loader from '@/components/ui/loader';

const VersionsPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const router = useRouter();
  const { id } = use(params);
  const [mainBlueprint, setMainBlueprint] = useState<Blueprint | null>(null);
  const [versions, setVersions] = useState<Blueprint[]>([]);
  const [isFetchingBlueprintLoading, setIsFetchingBlueprintLoading] = useState(false);
  const [isDeleteBlueprintLoading, setIsDeleteBlueprintLoading] = useState(false);

  useEffect(() => {
    setIsFetchingBlueprintLoading(true);
    sdk
      .getBlueprintById(id)
      .then(setMainBlueprint)
      .catch((err) => {
        console.error(`Failed to blueprint with id ${id}: `, err);
      })
      .finally(() => {
        setIsFetchingBlueprintLoading(false);
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

  const onDelete = async (blueprint: Blueprint) => {
    setIsDeleteBlueprintLoading(true);
    try {
      await blueprint.delete();
      toast.success('Deleted blueprint');
      const lastBlueprintId = versions[versions.length - 2]?.props.id;
      if (lastBlueprintId) {
        if (mainBlueprint) {
          mainBlueprint
            .listAllVersions()
            .then(setVersions)
            .catch((err) => {
              console.error(`Failed list all versions for id ${id}: `, err);
            });
        }
        router.push(`/${lastBlueprintId}/versions`);
      } else {
        router.push(`/`);
      }
    } catch (err) {
      console.error('Failed to delete blueprint: ', err);
      toast.error('Failed to delete blueprint');
    } finally {
      setIsDeleteBlueprintLoading(false);
    }
  };

  if (isFetchingBlueprintLoading) {
    return (
      <div className="mx-auto flex h-screen w-full items-center justify-center gap-10">
        <Loader />
      </div>
    );
  }

  return (
    <div className="mx-auto flex flex-col gap-10 py-16">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex w-full flex-col items-start gap-2">
            <Link href={mainBlueprint?.props.status === Status.Draft ? `/` : `/${id}`}>
              <Button
                variant="ghost"
                startIcon={
                  <Image
                    src="/assets/ArrowLeft.svg"
                    alt="back"
                    width={16}
                    height={16}
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                    }}
                  />
                }
              >
                {mainBlueprint?.props.title}
              </Button>
            </Link>
            <div className="flex w-full flex-col justify-between gap-4 md:flex-row">
              <h2 className="text-xl font-bold">Version History</h2>
              <div className="flex flex-row gap-3">
                <Button
                  variant="tag"
                  size="sm"
                  startIcon={
                    <Image
                      src="/assets/GitCommit.svg"
                      alt="versions"
                      width={16}
                      height={16}
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                      }}
                    />
                  }
                >
                  {versions.length} Version{versions.length > 1 && 's'}
                </Button>
                <Link href={`/create`}>
                  <Button
                    variant="default"
                    size="sm"
                    startIcon={
                      <Image
                        src="/assets/Plus.svg"
                        alt="add"
                        width={16}
                        height={16}
                        style={{
                          maxWidth: '100%',
                          height: 'auto',
                        }}
                      />
                    }
                  >
                    Start fresh
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4">
          {versions.map((version, i) => (
            <VersionCard
              key={version.props.id}
              blueprint={version}
              isLatest={i + 1 === versions.length}
              onDelete={() => onDelete(version)}
              isDeleteBlueprintLoading={isDeleteBlueprintLoading}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default VersionsPage;
