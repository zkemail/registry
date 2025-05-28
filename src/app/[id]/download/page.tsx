'use client';
import sdk from '@/lib/sdk';
import { Blueprint, ChunkedZkeyUrl, DownloadUrls, Status, ZkFramework } from '@zk-email/sdk';
import { use, useEffect, useState } from 'react';
import Loader from '@/components/ui/loader';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useProofStore } from '../store';
import { startDownload } from './startDownload';
import CircuitDownload from './CircuitDownload';

const DownloadLinks = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const [clientDownloadLinks, setClientDownloadLinks] = useState<DownloadUrls | null>(null);
  const [serverDownloadLinks, setServerDownloadLinks] = useState<DownloadUrls | null>(null);
  const [mainBlueprint, setMainBlueprint] = useState<Blueprint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clientTitle, setClientTitle] = useState('');
  const [serverTitle, setServerTitle] = useState('');

  async function loadClientDownloadLinks(blueprint: Blueprint) {
    setIsLoading(true);
    try {
      if (blueprint.props.clientZkFramework === ZkFramework.Circom) {
        const chunkedLinks = await blueprint.getChunkedZkeyDownloadLinks();
        const links: DownloadUrls = {};
        chunkedLinks.forEach((link) => {
          links[`circuit.zkey${link.suffix}.gz`] = link.url;
        });
        setClientTitle('Downloads for Client Side Circom');
        setClientDownloadLinks(links);
      } else if (blueprint.props.clientZkFramework === ZkFramework.Noir) {
        const [circuitLink, graphLink] = await Promise.all([
          blueprint.getNoirCircuitDownloadLink(),
          blueprint.getNoirRegexGraphsDownloadLink(),
        ]);
        setClientTitle('Downloads for Noir Circuits');
        const links = {
          ['noirCircuit.zip']: circuitLink,
          ['noirRegexGraphs.zip']: graphLink,
        };
        setClientDownloadLinks(links);
      }
    } catch (err) {
      console.error('Failed to get circuit download links: ', err);
    }
    setIsLoading(false);
  }

  async function loadServerDownloadLinks(blueprint: Blueprint) {
    setIsLoading(true);
    try {
      if (blueprint.props.serverZkFramework === ZkFramework.Circom) {
        const links = await blueprint.getZKeyDownloadLink();
        setServerTitle('Downloads for Server Side Circom');
        setServerDownloadLinks(links);
      }
    } catch (err) {
      console.error('Failed to get circuit download links: ', err);
    }
    setIsLoading(false);
  }

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
      loadClientDownloadLinks(mainBlueprint);
      loadServerDownloadLinks(mainBlueprint);
    }
  }, [mainBlueprint]);

  const DownloadHeader = () => (
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
      </div>
    </div>
  );

  const DownloadSection = () => {
    if (isLoading) {
      return <Loader />;
    } else {
      return (
        <>
          {clientDownloadLinks && (
            <CircuitDownload downloadLinks={clientDownloadLinks} title={clientTitle} />
          )}
          {serverDownloadLinks && (
            <CircuitDownload downloadLinks={serverDownloadLinks} title={serverTitle} />
          )}
        </>
      );
    }
  };

  return (
    <div className="mx-auto flex flex-col gap-2 py-16">
      <div>
        <DownloadHeader />
        <div className="mt-4 flex flex-col gap-4">
          <DownloadSection />
        </div>
      </div>
    </div>
  );
};

export default DownloadLinks;
