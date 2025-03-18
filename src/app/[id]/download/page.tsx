'use client';
import sdk from '@/lib/sdk';
import { Blueprint, ChunkedZkeyUrl, DownloadUrls, Status } from '@zk-email/sdk';
import { use, useEffect, useState } from 'react';
import Loader from '@/components/ui/loader';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useProofStore } from '../store';

const DownloadLinks = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const [downloadLinks, setDownloadLinks] = useState<DownloadUrls | null>(null);
  const [chunkedDownloadLinks, setChunkedDownloadLinks] = useState<ChunkedZkeyUrl[]>([]);
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
        return Promise.all([bp.getZKeyDownloadLink(), bp.getChunkedZkeyDownloadLinks()]);
      })
      .then(async ([links, chunked]) => {
        setDownloadLinks(links);
        setChunkedDownloadLinks(chunked);
      })
      .catch((err) => {
        console.error('Failed to get blueprint or download linnks: ', err);
      });
  }, []);

  return (
    <div className="mx-auto flex flex-col gap-2 py-16">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex w-full flex-col items-start gap-2">
            <Link href={`/${id}`}>
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
                  <Image
                    src="/assets/Download.svg"
                    alt="download"
                    width={20}
                    height={20}
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                    }}
                  />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
      {!!chunkedDownloadLinks.length && (
        <div className="mt-6 flex w-full flex-col justify-between gap-4 md:flex-row">
          <h2 className="text-xl font-bold">Download Chunked ZKeys used client side</h2>
        </div>
      )}
      <div className="mt-2 flex flex-col gap-4">
        {!!chunkedDownloadLinks.length &&
          chunkedDownloadLinks.map(({ suffix, url }) => (
            <div className="flex items-center justify-between">
              circuit.zkey{suffix}.gz
              <Button
                variant="ghost"
                size="icon"
                onClick={() => startDownload(url, `circuit.zkey${suffix}.gz`)}
              >
                <Image
                  src="/assets/Download.svg"
                  alt="download"
                  width={20}
                  height={20}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
              </Button>
            </div>
          ))}
      </div>
    </div>
  );
};

export default DownloadLinks;
