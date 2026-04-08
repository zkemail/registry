import { DownloadUrls } from '@zk-email/sdk';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { startDownload } from './startDownload';

const CircuitDownload = ({
  downloadLinks,
  title,
}: {
  downloadLinks: DownloadUrls;
  title: string;
}) => {
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
};

export default CircuitDownload;
