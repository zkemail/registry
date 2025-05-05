'use client';

import sdk from '@/lib/sdk';
import { useProofStore } from '../../store';
import { use, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { useProofEmailStore } from '@/lib/stores/useProofEmailStore';
import PostalMime, { Email } from 'postal-mime';
import { Proof, ProofStatus } from '@zk-email/sdk';
import { handleGetStatusIcon } from '../../ProofRow';
import { formatDate, formatDateAndTime } from '@/app/utils';
import Loader from '@/components/ui/loader';
import Link from 'next/link';
import { log } from 'console';
import { useSearchParams } from 'next/navigation';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ProofInfo = ({ params }: { params: Promise<{ id: string; proofId: string }> }) => {
  const { reset, blueprint, setBlueprint } = useProofStore();
  const { width, height } = useWindowSize();

  const { getUpdatingStatus, data, getProofIdsForBlueprint, getProof } = useProofEmailStore();

  const { id, proofId } = use(params);

  const searchParams = useSearchParams();
  const localProofInfo = searchParams.get('emailProofInfo');

  const emailProof = localProofInfo
    ? JSON.parse(localProofInfo)
    : useProofEmailStore((state) => state.data[id!]?.[proofId]);
  const [parsedEmail, setParsedEmail] = useState<Email | null>(null);
  const [status, setStatus] = useState<ProofStatus>(emailProof?.status!);
  const [isFetchBlueprintLoading, setIsFetchBlueprintLoading] = useState(false);
  const [isVerifyingProofLoading, setIsVerifyingProofLoading] = useState(false);
  const [isExploding, setIsExploding] = useState(false);

  let urlProofParams = '';
  if (emailProof) {
    const { email, publicOutputs, input, ...emailProofData } = emailProof;

    urlProofParams = new URLSearchParams({
      emailProofInfo: JSON.stringify(emailProofData),
    }).toString();
    console.log(urlProofParams);
  }

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
      console.log('verifying proof');
      const verified = await blueprint?.verifyProof(proof);

      // toast.success('Proof verified successfully on chain');
      if (verified) {
        toast.success('Proof verified successfully');
      } else {
        throw new Error('Failed to verify proof');
      }

      setIsExploding(true);
      setTimeout(() => {
        setIsExploding(false);
      }, 5000);
      toast.success('Proof verified successfully');
    } catch (err) {
      console.error(`Failed to verify proof with id: ${proofId}: `, err);
      toast.error('Failed to verify proof');
    }
    setIsVerifyingProofLoading(false);
  };

  if (!blueprint || !emailProof) {
    return <Loader />;
  }

  // TODO: should not be necessary
  function cleanCharacters(inputs: string[]) {
    if (!Array.isArray(inputs)) return inputs;
    const result = [];
    for (const input of inputs) {
      // Find the first valid section (everything after '|')
      let validIndex = input.indexOf('|');

      // If '|' exists, keep everything after it
      let cleaned = validIndex !== -1 ? input.substring(validIndex + 1) : input;

      // Remove non-printable control characters (including \u0000 - \u001F and other invalid Unicode)
      cleaned = cleaned.replace(/[\x00-\x1F\u007F-\u009F\uFFFD]/g, '');

      result.push(cleaned.trim()); // Trim any trailing spaces
    }
    return result;
  }

  return (
    <div className="mx-4 my-16 flex flex-col gap-6 rounded-3xl border border-grey-500 bg-white p-6 shadow-[2px_4px_2px_0px_rgba(0,0,0,0.02),_2px_3px_4.5px_0px_rgba(0,0,0,0.07)]">
      {isExploding ? <Confetti width={width} height={height} /> : null}

      <div className="flex flex-row flex-wrap items-center justify-between gap-2">
        <h4 className="text-xl font-bold text-grey-900">Proof Details</h4>
        <div className="flex flex-row flex-wrap gap-2">
          <Button
            loading={isVerifyingProofLoading}
            variant="secondary"
            size="sm"
            className="flex flex-row gap-2"
            onClick={onVerifyProof}
            startIcon={
              <Image
                src="/assets/VerifyOnChain.svg"
                alt="Verify proof"
                width={16}
                height={16}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
            }
          >
            Verify On-chain
          </Button>
          <Button
            className="flex flex-row gap-2"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href + `?${urlProofParams}`);
              toast.success('Link successfully copied to clipboard');
            }}
            startIcon={
              <Image
                src="/assets/Share.svg"
                alt="Share proof"
                width={16}
                height={16}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
            }
          >
            Share Proof
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-1 md:flex-row">
          <div className="text-base font-medium text-grey-700">Proof Id</div>
          <div className="gap-1 text-base font-medium text-grey-800" id="job-id">
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
                <Image
                  src="/assets/CopySimple.svg"
                  alt="Copy proof id"
                  width={16}
                  height={16}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
              </Button>
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-1 md:flex-row">
          <div className="text-base font-medium text-grey-700">Blueprint</div>
          <Link
            href={`/${id}`}
            className="text-base font-medium text-grey-800 underline"
            id="blueprint-title"
          >
            {blueprint?.props.title} (v{blueprint?.props.version})
          </Link>
        </div>
        <div className="flex flex-col justify-between gap-1 md:flex-row">
          <div className="text-base font-medium text-grey-700">Verifier Address</div>
          <Link
            target="_blank"
            href={`https://sepolia.basescan.org/address/${blueprint?.props.verifierContract?.address}`}
            className="break-words text-base font-medium text-grey-800 underline"
          >
            {blueprint?.props.verifierContract?.address || '-'}
          </Link>
        </div>
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <div className="text-base font-medium text-grey-700">Outputs</div>
          <div
            className="max-w-full overflow-x-auto text-base font-medium text-grey-800"
            id="outputs"
          >
            {emailProof?.publicData
              ? Object.entries(emailProof.publicData)
                  .map(
                    ([key, value]) =>
                      `{"${key}": ${JSON.stringify(cleanCharacters(value as string[]))}}`
                  )
                  .join('\n')
              : '-'}
          </div>
        </div>
        {emailProof?.externalInputs && Object.keys(emailProof.externalInputs).length ? (
          <div className="flex flex-col justify-between gap-1 md:flex-row">
            <div className="flex justify-center gap-2 text-base font-medium text-grey-700">
              External Inputs{' '}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Image src="/assets/Info.svg" alt="info" width={16} height={16} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="w-[380px] rounded-2xl border border-grey-500 bg-white p-2">
                      <p className="m-1 text-base font-medium text-grey-700">
                        The external input is entered manually by the users and are not part of the
                        email.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

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
          <div className="text-base font-medium text-grey-800" id="date-created">
            {emailProof?.startedAt ? formatDateAndTime(emailProof.startedAt) : '-'}
          </div>
        </div>
        <div className="flex flex-col justify-between gap-1 md:flex-row">
          <div className="text-base font-medium text-grey-700">Time taken</div>
          <div className="text-base font-medium text-grey-800" id="time-taken">
            {emailProof?.provedAt && emailProof?.startedAt
              ? `${((new Date(emailProof.provedAt).getTime() - new Date(emailProof.startedAt).getTime()) / 1000).toString()} seconds`
              : '-'}
          </div>
        </div>
        <div className="flex flex-col justify-between gap-1 md:flex-row">
          <div className="text-base font-medium text-grey-700">Status</div>
          <div className="text-base font-medium text-grey-800" id="status">
            {handleGetStatusChip(status)}
          </div>
        </div>
      </div>
      {emailProof ? (
        <div>
          <h4 className="rounded text-base font-medium text-grey-900">Generated proof</h4>
          <div
            className="overflow-x-auto border border-grey-500 bg-neutral-100 px-3 py-2 text-gray-600"
            id="proof-data"
          >
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
            id="email-render"
          />
        </div>
      ) : null}
    </div>
  );
};

export default ProofInfo;
