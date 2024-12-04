'use client';

import Loader from '@/components/ui/loader';
import ProofStatusTable from '../components/ProofStatusTable';
import { useProofEmailStore } from '@/lib/stores/useProofEmailStore';
import { ProofStatus } from '@zk-email/sdk';
import { use, useEffect } from 'react';
import { useState } from 'react';
import { useProofStore } from './store';
import { useSearchParams } from 'next/navigation';

const ViewProof = () => {
  const searchParams = useSearchParams();

  const proofId = searchParams.get('proofId');
  // TODO: handle case where proofId is not provided

  const { getUpdatingStatus } = useProofEmailStore();
  const blueprint = useProofStore((state) => state.blueprint);

  const emailProof = blueprint
    ? useProofEmailStore((state) => state.data[blueprint.props.id!]?.[proofId!])
    : undefined;

  const [status, setStatus] = useState<ProofStatus>(emailProof?.status ?? ProofStatus.None);

  useEffect(() => {
    if (!emailProof) return;

    const abortController = new AbortController();

    const statusPromise = getUpdatingStatus(emailProof, abortController);
    statusPromise.then(setStatus);

    return () => abortController.abort();
  }, [emailProof, proofId]);

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="flex w-full flex-col gap-1">
        <h4 className="text-xl font-bold text-grey-800">View Proof</h4>
        <p className="text-base font-medium text-grey-700">
          Please standby, proof generation takes a few seconds
        </p>
      </div>

      {status === ProofStatus.Done || status === ProofStatus.Failed ? (
        <ProofStatusTable proofs={[proofId!]} />
      ) : (
        <div>
          <Loader />
        </div>
      )}
    </div>
  );
};

export default ViewProof;
