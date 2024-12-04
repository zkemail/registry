import ProofRow from '@/app/[id]/ProofRow';
import { useProofEmailStore } from '@/lib/stores/useProofEmailStore';
import { useProofStore } from '@/app/[id]/store';

const ProofStatusTable = ({ proofs }: { proofs: string[] }) => {
  const { blueprint } = useProofStore();

  console.log(proofs);
  
  return (
    <div className="overflow-x-auto w-full">
      <div
        className="mb-2 grid gap-4 text-center font-medium text-grey-850 w-[720px]"
        style={{ gridTemplateColumns: '1.5fr 5fr 1fr 1fr 1.5fr' }}
      >
        <div className="text-left">Proof ID</div>
        <div className="text-left">Outputs</div>
        <div>Status</div>
        <div>Proof</div>
        <div>Verify</div>
      </div>

      <div
        className="grid items-center gap-4 border-t py-2 text-grey-700 w-[720px]"
        style={{ gridTemplateColumns: '1.5fr 5fr 1fr 1fr 1.5fr' }}
      >
        {blueprint &&
          proofs.map((proofId, index) => (
            <ProofRow key={proofId} proofId={proofId} index={index} blueprint={blueprint} />
          ))}
      </div>
    </div>
  );
};

export default ProofStatusTable;
