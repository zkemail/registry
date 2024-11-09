'use client';

import Loader from '@/components/ui/loader';
import ProofStatusTable from '../components/ProofStatusTable';
import { useProofEmailStore } from '@/lib/stores/useProofEmailStore';
import { ProofStatus } from '@zk-email/sdk';
import { useEffect } from 'react';
import { useState } from 'react';
import { useProofStore } from './store';

const ViewProof = ({ params }: { params: { proofId: string } }) => {
  const proofId = params?.proofId;
  const { getUpdatingStatus, data } = useProofEmailStore();
  const blueprint = useProofStore((state) => state.blueprint);

  const emailProof = useProofEmailStore((state) => state.data[blueprint.props.id!]?.[proofId]);

  const [status, setStatus] = useState<ProofStatus>(emailProof?.status ?? ProofStatus.None);

  console.log(emailProof, data, proofId);

  useEffect(() => {
    if (!emailProof) return;

    const statusPromise = getUpdatingStatus(emailProof);
    statusPromise.then(setStatus);

    // return () => statusPromise.abort();
  }, [emailProof]);

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="flex w-full flex-col gap-1">
        <h4 className="text-xl font-bold text-grey-800">View Proof</h4>
        <p className="text-base font-medium text-grey-700">
          Please standby, proof generation takes a few seconds
        </p>
      </div>

      {status === ProofStatus.Done ? (
        <ProofStatusTable proofs={[proofId]} />
      ) : (
        <div>
          <Loader />
        </div>
      )}
    </div>
  );
};

export default ViewProof;
