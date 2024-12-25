'use client';

import { Button } from '@/components/ui/button';
import Image from "next/image";
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import sdk from '@/lib/sdk';
import { Blueprint, Status } from '@zk-email/sdk';
import { toast } from 'react-toastify';
import Loader from '@/components/ui/loader';

const ParametersPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const [mainBlueprint, setMainBlueprint] = useState<Blueprint | null>(null);
  const [versions, setVersions] = useState<Blueprint[]>([]);
  const [isFetchingBlueprintLoading, setIsFetchingBlueprintLoading] = useState(false);

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

  const metadata = {
    name: mainBlueprint?.props.title,
    values: mainBlueprint?.props.decomposedRegexes,
    version: mainBlueprint?.props.version,
    senderDomain: mainBlueprint?.props.senderDomain,
    externalInputs: mainBlueprint?.props.externalInputs,
    emailBodyMaxLength: mainBlueprint?.props.emailBodyMaxLength,
    ignoreBodyHashCheck: mainBlueprint?.props.ignoreBodyHashCheck,
    emailHeaderMaxLength: mainBlueprint?.props.emailHeaderMaxLength,
    shaPrecomputeSelector: mainBlueprint?.props.shaPrecomputeSelector,
  };

  const copyMetadata = () => {
    navigator.clipboard.writeText(JSON.stringify(metadata, null, 2));
    toast.success('Metadata copied to clipboard');
  };

  if (isFetchingBlueprintLoading) {
    return (
      <div className="mx-auto flex h-screen w-full items-center justify-center gap-10">
        <Loader />
      </div>
    );
  }

  return (
    (<div className="mx-auto flex flex-col gap-10 py-16">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex w-full flex-col items-start gap-2">
            <Link href={`/${id}/versions`}>
              <Button
                variant="ghost"
                startIcon={<Image
                  src="/assets/ArrowLeft.svg"
                  alt="back"
                  width={16}
                  height={16}
                  style={{
                    maxWidth: "100%",
                    height: "auto"
                  }} />}
              >
                Version History ({mainBlueprint?.props.title})
              </Button>
            </Link>
            <div className="flex w-full flex-col justify-between gap-4 md:flex-row">
              <h2 className="text-xl font-bold">v{mainBlueprint?.props.version} Parameters</h2>
              <div className="flex flex-row gap-3">
                <Button
                  variant="default"
                  size="sm"
                  startIcon={<Image
                    src="/assets/CopyLight.svg"
                    alt="add"
                    width={16}
                    height={16}
                    style={{
                      maxWidth: "100%",
                      height: "auto"
                    }} />}
                  onClick={copyMetadata}
                >
                  Copy Metadata
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4">
          <div className="flex flex-col gap-1 rounded-3xl border border-grey-500 bg-white p-6 shadow-[2px_4px_2px_0px_rgba(0,0,0,0.02),_2px_3px_4.5px_0px_rgba(0,0,0,0.07)]">
            <pre className="whitespace-pre-wrap text-sm text-grey-700">
              {JSON.stringify(
                {
                  name: mainBlueprint?.props.title,
                  values: mainBlueprint?.props.decomposedRegexes,
                  version: mainBlueprint?.props.version,
                  senderDomain: mainBlueprint?.props.senderDomain,
                  externalInputs: mainBlueprint?.props.externalInputs,
                  emailBodyMaxLength: mainBlueprint?.props.emailBodyMaxLength,
                  ignoreBodyHashCheck: mainBlueprint?.props.ignoreBodyHashCheck,
                  emailHeaderMaxLength: mainBlueprint?.props.emailHeaderMaxLength,
                  shaPrecomputeSelector: mainBlueprint?.props.shaPrecomputeSelector,
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </div>
    </div>)
  );
};

export default ParametersPage;
