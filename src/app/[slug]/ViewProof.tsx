import { Button } from '@/components/ui/button';
import Image from 'next/image';

const ViewProof = () => {
  return (
    <div className="flex flex-col justify-center items-center gap-6">
      <div className="w-full flex flex-col gap-1">
        <h4 className="text-xl font-bold text-grey-800">View Proof</h4>
        <p className="text-base font-medium text-grey-700">
          Please standby, proof generation takes few minutes
        </p>
      </div>
      <div className="w-full">
        <div
          className="grid gap-4 font-medium text-grey-850 mb-2 text-center"
          style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}
        >
          <div className="text-left">Job ID</div>
          <div>Status</div>
          <div>Time Left</div>
          <div>View Logs</div>
          <div className="text-right">Terminate</div>
        </div>

        <div
          className="grid gap-4 items-center py-2 border-t text-grey-700"
          style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}
        >
          <div className="text-sm">cm2etv9jk0001oo56mt0edku1</div>
          <div className="flex items-center justify-center">
            <Image src="/assets/Checks.svg" alt="status" width={20} height={20} />
          </div>
          <div className="flex items-center justify-center">120 seconds</div>
          <div className="flex items-center justify-center">
            <button className="flex items-center underline hover:underline gap-1">
              <Image src="/assets/Eye.svg" alt="view" width={16} height={16} />
              View Log
            </button>
          </div>
          <div className="flex items-center justify-end mr-4">
            <Button variant="ghost" size="icon">
              <Image src="/assets/Trash.svg" alt="terminate" width={20} height={20} />
            </Button>
          </div>
        </div>
      </div>
      <div className="w-full flex flex-col gap-1">
        <h4 className="text-lg font-bold text-grey-800">Verify Proof</h4>
        <p className="text-base font-medium text-grey-700">
          Connect your wallet and verify the proof on Sepolia
        </p>
      </div>
      <div className="w-full flex flex-col items-center justify-center gap-2">
        <Image src="/assets/VerifyProofImg.svg" alt="sepolia" width={240} height={180} />
        <p className="text-grey-600 font-medium">Proofs will appear here once generated</p>
      </div>
    </div>
  );
};

export default ViewProof;
