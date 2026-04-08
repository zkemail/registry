import { Blueprint, DownloadUrls, ZkFramework } from '@zk-email/sdk';
import Loader from '@/components/ui/loader';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { startDownload } from './startDownload';

const ClientCircuitDownload = ({ blueprint }: { blueprint: Blueprint }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [downloadLinks, setDownloadLinks] = useState<DownloadUrls | null>(null);
  const [title, setTitle] = useState<string>('');

  async function getDownloadLinks() {
    try {
      if (blueprint.props.serverZkFramework === ZkFramework.Circom) {
        const links = await blueprint.getZKeyDownloadLink();
        setTitle('Downloads for Server Side Circom');
        setDownloadLinks(links);
      }
    } catch (err) {
      console.error('Failed to get circuit download links: ', err);
    }
  }

  useEffect(() => {
    getDownloadLinks();
  }, []);

  if (!downloadLinks) {
    return (
      <div className="mt-4 flex flex-col gap-4">
        <Loader />
      </div>
    );
  } else {
    return (
      <div className="mt-4 flex flex-col gap-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {Object.entries(downloadLinks).map(([name, url]) => (
          <div key={name} className="flex items-center justify-between">
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
        ))}
      </div>
    );
  }
};

export default ClientCircuitDownload;
