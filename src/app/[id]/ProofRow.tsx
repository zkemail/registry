import { Blueprint, Proof, ProofStatus, startJsonFileDownload, Status } from '@zk-email/sdk';
import { ProofEmailStatusUpdate, useProofEmailStore } from '@/lib/stores/useProofEmailStore';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

interface ProofProps {
  // emailProof: ProofEmailStatusUpdate;
  index: number;
  blueprint: Blueprint;
  proofId: string;
}

export const handleGetStatusIcon = (status: ProofStatus) => {
  switch (status) {
    case ProofStatus.None:
      return <Image src="/assets/Checks.svg" alt="status" width={20} height={20} />;
    case ProofStatus.InProgress:
      return (
        <Image
          src="/assets/SpinnerGap.svg"
          className="animate-spin"
          alt="status"
          width={20}
          height={20}
        />
      );
    case ProofStatus.Done:
      return <Image src="/assets/Checks.svg" alt="status" width={20} height={20} />;
    case ProofStatus.Failed:
      console.log('got failed status======================================');
      return <Image src="/assets/RedClose.svg" alt="❌" width={20} height={20} />;
  }
};

const ProofRow = ({ proofId, index, blueprint }: ProofProps) => {
  const { getUpdatingStatus } = useProofEmailStore();
  const emailProof = useProofEmailStore((state) => state.data[blueprint.props.id!]?.[proofId]);

  const [status, setStatus] = useState<ProofStatus>(emailProof.status!);

  useEffect(() => {
    const abortController = new AbortController();
    const statusPromise = getUpdatingStatus(emailProof, abortController);
    statusPromise.then(setStatus);

    return () => abortController.abort();
  }, []);

  // TODO: Add blueprint information?
  const handleProofDownload = () => {
    const proofData = { public: emailProof.publicData, proof: emailProof.proofData };
    startJsonFileDownload(JSON.stringify(proofData), emailProof.id);
  };

  // Verify function still empty in SDK
  const handleOnVerify = async () => {
    const proof = new Proof(blueprint, emailProof);
    try {
      await proof.verifyOnChain();
    } catch (err) {
      console.error('Failed to verify proof on chain');
    }
  };

  return (
    <>
      <Link
        target="_blank"
        href={`/${emailProof.blueprintId}/proofs/${emailProof.id}`}
        className="flex max-w-fit items-center gap-2 rounded border border-grey-500 px-3 py-1 text-sm font-semibold text-grey-800"
      >
        <span>{index + 1}</span>
        <span className="text-grey-500">|</span>
        <span>View</span>
      </Link>
      <div className="flex items-center">
        <pre className="whitespace-pre-wrap text-left">
          {emailProof?.publicData
            ? Object.entries(emailProof.publicData)
                .map(([key, value]) => `{"${key}": "${value}"}`)
                .join('\n')
            : '-'}
        </pre>
      </div>
      <div className="flex items-center justify-center">{handleGetStatusIcon(status)}</div>
      <div className="flex items-center justify-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleProofDownload}
          disabled={!emailProof.publicData}
        >
          <Image src="/assets/Download.svg" alt="download" width={20} height={20} />
        </Button>
      </div>
      <div className="flex items-center justify-center">
        <Button variant="default" size="sm" disabled={false} onClick={handleOnVerify}>
          Verify
        </Button>
      </div>
    </>
  );
};

export default ProofRow;
