'use client';
import sdk from '@/lib/sdk';
import { Blueprint, DownloadUrls, Status } from '@zk-email/sdk';
import { use, useEffect, useState } from 'react';
import Loader from '@/components/ui/loader';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useProofStore } from '../store';

const DownloadLinks = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const [downloadLinks, setDownloadLinks] = useState<DownloadUrls | null>();
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

  const startDownload = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    sdk
      .getBlueprintById(id)
      .then((bp) => {
        return bp.getZKeyDownloadLink();
      })
      .then(setDownloadLinks)
      .catch((err) => {
        console.error('Failed to get blueprint or download linnks: ', err);
      });
  }, []);

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
              <h2 className="text-xl font-bold">Download Files</h2>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {!downloadLinks ? (
            <Loader />
          ) : (
            Object.entries(downloadLinks).map(([name, url]) => (
              <div className="flex items-center justify-between">
                {name}
                <Button variant="ghost" size="icon" onClick={() => startDownload(url, name)}>
                  <Image src="/assets/Download.svg" alt="download" width={20} height={20} />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DownloadLinks;
