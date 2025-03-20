import { Blueprint, Proof, ProofStatus, startJsonFileDownload, Status } from '@zk-email/sdk';
import { ProofEmailStatusUpdate, useProofEmailStore } from '@/lib/stores/useProofEmailStore';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface ProofProps {
  // emailProof: ProofEmailStatusUpdate;
  index: number;
  blueprint: Blueprint;
  proofId: string;
}

export const handleGetStatusIcon = (status: ProofStatus | undefined) => {
  switch (status) {
    case ProofStatus.None:
      return (
        <Image
          src="/assets/Checks.svg"
          alt="status"
          width={20}
          height={20}
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />
      );
    case ProofStatus.InProgress:
      return (
        <Image
          src="/assets/SpinnerGap.svg"
          className="animate-spin"
          alt="status"
          width={20}
          height={20}
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />
      );
    case ProofStatus.Done:
      return (
        <Image
          src="/assets/Checks.svg"
          alt="status"
          width={20}
          height={20}
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />
      );
    case ProofStatus.Failed:
      console.log('got failed status======================================');
      return (
        <Image
          src="/assets/RedClose.svg"
          alt="❌"
          width={20}
          height={20}
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />
      );
    default:
      return (
        <Image
          src="/assets/Checks.svg"
          alt="status"
          width={20}
          height={20}
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />
      );
  }
};

const ProofRow = ({ proofId, index, blueprint }: ProofProps) => {
  const { getUpdatingStatus, getProof } = useProofEmailStore();
  const emailProof = useProofEmailStore((state) => state.data[blueprint.props.id!]?.[proofId]);
  const router = useRouter();
  const [status, setStatus] = useState<ProofStatus | undefined>(emailProof?.status);
  const [isVerifyingProofLoading, setIsVerifyingProofLoading] = useState(false);

  useEffect(() => {
    try {
      const abortController = new AbortController();
      const statusPromise = getUpdatingStatus(emailProof, abortController);
      statusPromise.then(setStatus);

      return () => abortController.abort();
    } catch (err) {
      console.error(`Failed to get status for proof with id: ${proofId}: `, err);
      toast.error('Failed to get status');
    }
  }, []);

  // TODO: Add blueprint information?
  const handleProofDownload = () => {
    const proofData = { public: emailProof.publicData, proof: emailProof.proofData };
    startJsonFileDownload(JSON.stringify(proofData), emailProof.id);
  };

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
      // console.log('verifying proof on chain');
      console.log('verifying proof');
      const verified = await blueprint.verifyProof(proof);
      // toast.success('Proof verified successfully on chain');
      if (verified) {
        toast.success('Proof verified successfully');
      } else {
        toast.error('Failed to verify proof');
      }
    } catch (err) {
      console.error(`Failed to verify proof with id: ${proofId}: `, err);
      toast.error('Failed to verify proof');
    }
    setIsVerifyingProofLoading(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        disabled={status !== ProofStatus.Done}
        onClick={() => {
          router.push(`/${emailProof.blueprintId}/proofs/${emailProof.id}`);
        }}
        className="flex max-w-fit items-center gap-2 rounded border border-grey-500 px-3 py-1 text-sm font-semibold text-grey-800"
      >
        <span>{index + 1}</span>
        <span className="text-grey-500">|</span>
        <span>View</span>
      </Button>
      <div className="flex items-center">
        <pre className="whitespace-pre-wrap text-left">
          {emailProof?.publicData
            ? Object.entries(emailProof.publicData)
                .map(([key, value]) => `{"${key}": ${JSON.stringify(value)}}`)
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
          disabled={!emailProof?.publicData}
        >
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
      <div className="flex items-center justify-center">
        <Button
          variant="default"
          size="sm"
          disabled={status !== ProofStatus.Done}
          loading={isVerifyingProofLoading}
          onClick={onVerifyProof}
        >
          Verify
        </Button>
      </div>
    </>
  );
};

export default ProofRow;
