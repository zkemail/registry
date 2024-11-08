import ProofRow from '@/app/[id]/ProofRow';
import { useProofEmailStore } from '@/lib/stores/useProofEmailStore';
import { useProofStore } from '@/app/[id]/store';

const ProofStatusTable = () => {
  const { blueprint } = useProofStore();
  const { getProofIdsForBlueprint } = useProofEmailStore();

  return (
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
        {blueprint &&
          blueprint.props.id &&
          getProofIdsForBlueprint(blueprint.props.id).map((proofId, index) => (
            <ProofRow key={proofId} proofId={proofId} index={index} blueprint={blueprint} />
          ))}
      </div>
    </div>
  );
};

export default ProofStatusTable;
