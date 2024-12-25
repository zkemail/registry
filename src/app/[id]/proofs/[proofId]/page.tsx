'use client';

import sdk from '@/lib/sdk';
import { useProofStore } from '../../store';
import { use, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from "next/legacy/image";
import { toast } from 'react-toastify';
import { useProofEmailStore } from '@/lib/stores/useProofEmailStore';
import PostalMime, { Email } from 'postal-mime';
import { Proof, ProofStatus } from '@zk-email/sdk';
import { handleGetStatusIcon } from '../../ProofRow';
import { formatDate, formatDateAndTime } from '@/app/utils';
import Loader from '@/components/ui/loader';
import Link from 'next/link';
import { log } from 'console';

const ProofInfo = ({ params }: { params: Promise<{ id: string; proofId: string }> }) => {
  const { reset, blueprint, setBlueprint } = useProofStore();
  const { getUpdatingStatus, data, getProofIdsForBlueprint, getProof } = useProofEmailStore();

  const { id, proofId } = use(params);

  const emailProof = useProofEmailStore((state) => state.data[id!]?.[proofId]);
  const [parsedEmail, setParsedEmail] = useState<Email | null>(null);
  const [status, setStatus] = useState<ProofStatus>(emailProof?.status!);
  const [isFetchBlueprintLoading, setIsFetchBlueprintLoading] = useState(false);
  const [isVerifyingProofLoading, setIsVerifyingProofLoading] = useState(false);

  if (!data[id!]) {
    getProofIdsForBlueprint(id);
  }

  const handleGetStatusChip = (status: ProofStatus) => {
    let statusText = '';
    let statusColor = '';

    switch (status) {
      case ProofStatus.InProgress:
        statusText = 'In Progress';
        statusColor = '#007AFF';
        break;
      case ProofStatus.Done:
        statusText = 'Completed';
        statusColor = '#34C759';
        break;
      case ProofStatus.Failed:
        statusText = 'Failed';
        statusColor = '#C72C22';
        break;
      default:
        statusText = 'Unknown';
        statusColor = 'text-grey-800';
    }

    return (
      <div
        className={`flex w-fit flex-row items-center gap-2 rounded-full px-3 py-1.5 text-xs text-[${statusColor}] border border-[${statusColor}]`}
      >
        {handleGetStatusIcon(status)}
        <p className="font-semibold">{statusText}</p>
      </div>
    );
  };

  useEffect(() => {
    if (!data[id!]?.[proofId]) {
      return;
    }

    const abortController = new AbortController();
    const statusPromise = getUpdatingStatus(data[id!]?.[proofId], abortController);
    statusPromise.then(setStatus);

    return () => abortController.abort();
  }, [data[id!]?.[proofId]]);

  useEffect(() => {
    reset();

    setIsFetchBlueprintLoading(true);
    sdk
      .getBlueprintById(id)
      .then(setBlueprint)
      .catch((err) => {
        console.error(`Failed to blueprint with id ${id}: `, err);
      })
      .finally(() => {
        setIsFetchBlueprintLoading(false);
      });

    getProof(proofId);
  }, []);

  useEffect(() => {
    const parser = new PostalMime();
    parser.parse(data[id]?.[proofId]?.email!).then((email) => {
      setParsedEmail(email);
    });
  }, [data]);

  if (isFetchBlueprintLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  const onVerifyProof = async () => {
    setIsVerifyingProofLoading(true);
    let proof: Proof;
    try {
      proof = await getProof(proofId);
      console.log('proof: ', proof);
    } catch (err) {
      console.error(`Failed to get proof for id: ${proofId}: `, err);
      toast.error('Failed to get proof');
      setIsVerifyingProofLoading(false);
      return;
    }

    try {
      console.log('verifying proof on chain');
      await proof.verifyOnChain();
      toast.success('Proof verified successfully on chain');
    } catch (err) {
      console.error(`Failed to verify proof with id: ${proofId}: `, err);
      toast.error('Failed to verify proof');
    }
    setIsVerifyingProofLoading(false);
  };

  return (
    <div className="mx-4 my-16 flex flex-col gap-6 rounded-3xl border border-grey-500 bg-white p-6 shadow-[2px_4px_2px_0px_rgba(0,0,0,0.02),_2px_3px_4.5px_0px_rgba(0,0,0,0.07)]">
      <div className="flex flex-row items-center justify-between">
        <h4 className="text-xl font-bold text-grey-900">Proof Details</h4>
        <div className="flex flex-row gap-2">
          <Button
            loading={isVerifyingProofLoading}
            variant="secondary"
            size="sm"
            className="flex flex-row gap-2"
            onClick={onVerifyProof}
            startIcon={
              <Image src="/assets/VerifyOnChain.svg" alt="Share proof" width={16} height={16} />
            }
          >
            Verify On-chain
          </Button>
          <Button
            className="flex flex-row gap-2"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Link successfully copied to clipboard');
            }}
            startIcon={<Image src="/assets/Share.svg" alt="Share proof" width={16} height={16} />}
          >
            Share Proof
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-1 md:flex-row">
          <div className="text-base font-medium text-grey-700">Proof Id</div>
          <div className="gap-1 text-base font-medium text-grey-800">
            {proofId}
            <span className="ml-1">
              <Button
                variant="secondary"
                className="h-auto w-auto p-1"
                onClick={() => {
                  navigator.clipboard.writeText(proofId);
                  toast.success('Copied to clipboard');
                }}
              >
                <Image src="/assets/CopySimple.svg" alt="Copy proof id" width={16} height={16} />
              </Button>
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-1 md:flex-row">
          <div className="text-base font-medium text-grey-700">Blueprint</div>
          <Link href={`/${id}`} className="text-base font-medium text-grey-800 underline">
            {blueprint?.props.title} (v{blueprint?.props.version})
          </Link>
        </div>
        <div className="flex flex-col justify-between gap-1 md:flex-row">
          <div className="text-base font-medium text-grey-700">Verifier Address</div>
          <Link
            target="_blank"
            href={`https://sepolia.basescan.org/address/${blueprint?.props.verifierContract?.address}`}
            className="text-base font-medium text-grey-800 underline"
          >
            {blueprint?.props.verifierContract?.address || '-'}
          </Link>
        </div>
        <div className="flex flex-col justify-between gap-1 md:flex-row">
          <div className="text-base font-medium text-grey-700">Outputs</div>
          <div className="text-base font-medium text-grey-800">
            {emailProof?.publicData
              ? Object.entries(emailProof.publicData)
                  .map(([key, value]) => `{"${key}": "${value}"}`)
                  .join('\n')
              : '-'}
          </div>
        </div>
        {emailProof?.externalInputs && Object.keys(emailProof.externalInputs).length ? (
          <div className="flex flex-col justify-between gap-1 md:flex-row">
            <div className="text-base font-medium text-grey-700">External Inputs</div>
            <div className="text-base font-medium text-grey-800">
              {emailProof?.externalInputs
                ? Object.entries(emailProof.externalInputs)
                    .map(([key, value]) => `{"${key}": "${value}"}`)
                    .join('\n')
                : '-'}
            </div>
          </div>
        ) : null}
        <div className="flex flex-col justify-between gap-1 md:flex-row">
          <div className="text-base font-medium text-grey-700">Date created</div>
          <div className="text-base font-medium text-grey-800">
            {emailProof?.startedAt ? formatDateAndTime(emailProof.startedAt) : '-'}
          </div>
        </div>
        <div className="flex flex-col justify-between gap-1 md:flex-row">
          <div className="text-base font-medium text-grey-700">Time taken</div>
          <div className="text-base font-medium text-grey-800">
            {emailProof?.provedAt && emailProof?.startedAt
              ? `${((new Date(emailProof.provedAt).getTime() - new Date(emailProof.startedAt).getTime()) / 1000).toString()} seconds`
              : '-'}
          </div>
        </div>
        <div className="flex flex-col justify-between gap-1 md:flex-row">
          <div className="text-base font-medium text-grey-700">Status</div>
          <div className="text-base font-medium text-grey-800">{handleGetStatusChip(status)}</div>
        </div>
      </div>
      {emailProof ? (
        <div>
          <h4 className="rounded text-base font-medium text-grey-900">Generated proof</h4>
          <div className="overflow-x-auto border border-grey-500 bg-neutral-100 px-3 py-2 text-grey-600">
            <pre>{JSON.stringify(emailProof.proofData, null, 2)}</pre>
          </div>
        </div>
      ) : null}
      {parsedEmail?.html ? (
        <div>
          <h4 className="rounded text-base font-medium text-grey-900">Email Render</h4>
          <p className="text-base font-medium text-grey-700">
            This email is always stored on your local browser and never sent to our server
          </p>
          <div
            className="mt-6"
            dangerouslySetInnerHTML={{
              __html: parsedEmail.html!,
            }}
          />
        </div>
      ) : null}
    </div>
  );
};

export default ProofInfo;
