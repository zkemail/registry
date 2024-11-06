import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useProofStore } from './store';
import { ProofStatus, Status } from '@dimidumo/zk-email-sdk-ts';

const ViewProof = () => {
  const { emailContent } = useProofStore();

  console.log('emailContent: ', emailContent);

  const handleGetStatusIcon = (status: ProofStatus) => {
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
        return <Image src="/assets/X.svg" alt="status" width={20} height={20} />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="flex w-full flex-col gap-1">
        <h4 className="text-xl font-bold text-grey-800">View Proof</h4>
        <p className="text-base font-medium text-grey-700">
          Please standby, proof generation takes few minutes
        </p>
      </div>
      <div className="w-full">
        <div
          className="mb-2 grid gap-4 text-center font-medium text-grey-850"
          style={{ gridTemplateColumns: '1.5fr 5fr 1fr 1fr 1fr' }}
        >
          <div className="text-left">Proof ID</div>
          <div className="text-left">Outputs</div>
          <div>Status</div>
          <div>Proof</div>
          <div>Verify</div>
        </div>

        <div
          className="grid items-center gap-4 border-t py-2 text-grey-700"
          style={{ gridTemplateColumns: '1.5fr 5fr 1fr 1fr 1fr' }}
        >
          <div className="flex max-w-fit items-center gap-2 rounded border border-grey-500 px-3 py-1 text-sm font-semibold text-grey-800">
            <span>1</span>
            <span className="text-grey-500">|</span>
            <span>View</span>
          </div>
          <div className="flex items-center justify-center">
            <pre className="whitespace-pre-wrap text-left">
              {`{ "username": "PrakharSingh0908!" }
{ "username": "PrakharSingh0908!" }
{ "username": "PrakharSingh0908!" }`}
            </pre>
          </div>
          <div className="flex items-center justify-center">
            {handleGetStatusIcon(ProofStatus.InProgress)}
          </div>
          <div className="flex items-center justify-center">
            <Button variant="ghost" size="icon">
              <Image src="/assets/Download.svg" alt="download" width={20} height={20} />
            </Button>
          </div>
          <div className="flex items-center justify-center">
            {/* // TODO: Add disabled logic} */}
            <Button variant="outline" size="sm" disabled={false}>
              Verify
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProof;
