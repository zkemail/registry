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
    setIsLoading(true);
    try {
      if (blueprint.props.clientZkFramework === ZkFramework.Circom) {
        const chunkedLinks = await blueprint.getChunkedZkeyDownloadLinks();
        const links: DownloadUrls = {};
        chunkedLinks.forEach((link) => {
          links[`circuit.zkey${link.suffix}.gz`] = link.url;
        });
        setTitle('Downloads for Client Side Circom');
        setDownloadLinks(links);
      } else if (blueprint.props.clientZkFramework === ZkFramework.Noir) {
        const [circuitLink, graphLink] = await Promise.all([
          blueprint.getNoirCircuitDownloadLink(),
          blueprint.getNoirRegexGraphsDownloadLink(),
        ]);
        setTitle('Downloads for Noir Circuits');
        setDownloadLinks({
          ['noirCircuit.zip']: circuitLink,
          ['noirRegexGraphs.zip']: graphLink,
        });
      }
    } catch (err) {
      console.error('Failed to get circuit download links: ', err);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    getDownloadLinks();
  }, []);

  if (isLoading) {
    return (
      <div className="mt-4 flex flex-col gap-4">
        <Loader />
      </div>
    );
  } else if (downloadLinks) {
    return (
      <div className="mt-4 flex flex-col gap-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {Object.entries(downloadLinks).map(([name, url]) => (
          <div className="flex items-center justify-between" key={name}>
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
  } else {
    return <></>;
  }
};

export default ClientCircuitDownload;
