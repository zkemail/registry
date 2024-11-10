'use client';
import sdk from '@/lib/sdk';
import { DownloadUrls, Status } from '@zk-email/sdk';
import { use, useEffect, useState } from 'react';
import Loader from '@/components/ui/loader';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const DownloadLinks = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const [downloadLinks, setDownloadLinks] = useState<DownloadUrls | null>();

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
      .getBlueprint(id)
      .then((bp) => {
        return bp.getZKeyDownloadLink();
      })
      .then(setDownloadLinks)
      .catch((err) => {
        console.error('Failed to get blueprint or download linnks: ', err);
      });
  }, []);

  return (
    <div className="mt-5 flex flex-col items-center justify-center">
      {!downloadLinks ? (
        <Loader />
      ) : (
        Object.entries(downloadLinks).map(([name, url]) => (
          <Button className="mb-4" onClick={() => startDownload(url, name)}>
            {name}
          </Button>
        ))
      )}
    </div>
  );
};

export default DownloadLinks;
