'use client';

import sdk from '@/lib/sdk';
import { useProofStore } from '../../store';
import { use, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { useProofEmailStore } from '@/lib/stores/useProofEmailStore';
import PostalMime, { Email } from 'postal-mime';
import { ProofStatus } from '@zk-email/sdk';
import { handleGetStatusIcon } from '../../ProofRow';
import { formatDate } from '@/app/utils';

const ProofInfo = ({ params }: { params: Promise<{ id: string; proofId: string }> }) => {
  const { reset, blueprint, setBlueprint } = useProofStore();
  const { getUpdatingStatus, data, getProofIdsForBlueprint, getProof } = useProofEmailStore();

  const { id, proofId } = use(params);

  const emailProof = useProofEmailStore((state) => state.data[id!]?.[proofId]);
  const [parsedEmail, setParsedEmail] = useState<Email | null>(null);
  const [status, setStatus] = useState<ProofStatus>(emailProof?.status!);

  console.log('emailProof', data);

  if (!data[id!]) {
    getProofIdsForBlueprint(id);
  }

  const handleGetStatusChip = (status: ProofStatus) => {
    let statusText = '';
    switch (status) {
      case ProofStatus.InProgress:
        statusText = 'In Progress';
        break;
      case ProofStatus.Done:
        statusText = 'Completed';
        break;
      case ProofStatus.Failed:
        statusText = 'Failed';
        break;
      default:
        statusText = 'Unknown';
    }

    return (
      <div className="flex flex-row gap-2">
        {handleGetStatusIcon(status)}
        <p className="text-base font-medium text-grey-800">{statusText}</p>
      </div>
    );
  };

  useEffect(() => {
    if (!data[id!] || !data[id!]?.[proofId]) {
      return;
    }

    const statusPromise = getUpdatingStatus(data[id!]?.[proofId]);
    statusPromise.then(setStatus);

    // @ts-ignore
    // return () => statusPromise?.abort();
  }, [data[id!]?.[proofId]]);

  useEffect(() => {
    reset();

    sdk
      .getBlueprint(id)
      .then(setBlueprint)
      .catch((err) => {
        console.error(`Failed to blueprint with id ${id}: `, err);
      });

    getProof(proofId);
  }, []);

  useEffect(() => {
    const parser = new PostalMime();
    parser.parse(data[id]?.[proofId]?.email!).then((email) => {
      setParsedEmail(email);
    });
  }, [data]);

  return (
    <div className="mx-4 my-16 flex flex-col gap-6 rounded-3xl border border-grey-500 bg-white p-6 shadow-[2px_4px_2px_0px_rgba(0,0,0,0.02),_2px_3px_4.5px_0px_rgba(0,0,0,0.07)]">
      <div className="flex flex-row items-center justify-between">
        <h4 className="text-xl font-bold text-grey-900">Proof Details</h4>
        <Button
          className="flex flex-row gap-2"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link successfully copied to clipboard');
          }}
        >
          <Image src="/assets/Share.svg" alt="Share proof" width={16} height={16} />
          Share Proof
        </Button>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-row justify-between">
          <div className="text-base font-medium text-grey-700">Job Id</div>
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
                <Image src="/assets/CopySimple.svg" alt="Copy job id" width={16} height={16} />
              </Button>
            </span>
          </div>
        </div>
        <div className="flex flex-row justify-between">
          <div className="text-base font-medium text-grey-700">Blueprint</div>
          <div className="text-base font-medium text-grey-800">
            {blueprint?.props.title} (v{blueprint?.props.version})
          </div>
        </div>
        <div className="flex flex-row justify-between">
          <div className="text-base font-medium text-grey-700">Outputs</div>
          <div className="text-base font-medium text-grey-800">
            {emailProof?.public
              ? Object.entries(emailProof.public)
                  .map(([key, value]) => `{"${key}": "${value}"}`)
                  .join('\n')
              : '-'}
          </div>
        </div>
        <div className="flex flex-row justify-between">
          <div className="text-base font-medium text-grey-700">Sent on</div>
          <div className="text-base font-medium text-grey-800">{'-'}</div>
        </div>
        <div className="flex flex-row justify-between">
          <div className="text-base font-medium text-grey-700">Date created</div>
          <div className="text-base font-medium text-grey-800">
            {formatDate(emailProof?.startedAt?.toString() || '')}
          </div>
        </div>
        <div className="flex flex-row justify-between">
          <div className="text-base font-medium text-grey-700">Time taken</div>
          <div className="text-base font-medium text-grey-800">
            {emailProof?.provedAt && emailProof?.startedAt
              ? `${((new Date(emailProof.provedAt).getTime() - new Date(emailProof.startedAt).getTime()) / 1000).toString()} seconds`
              : '-'}
          </div>
        </div>
        <div className="flex flex-row justify-between">
          <div className="text-base font-medium text-grey-700">Status</div>
          <div className="text-base font-medium text-grey-800">{handleGetStatusChip(status)}</div>
        </div>
      </div>
      {parsedEmail?.html ? (
        <div>
          <h4 className="text-xl font-bold text-grey-900">Email Render</h4>
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
