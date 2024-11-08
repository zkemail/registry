import ProofRow from './ProofRow';
import { useProofStore } from './store';
import { useProofEmailStore } from '@/lib/stores/useProofEmailStore';

const ViewProof = () => {
  const { blueprint } = useProofStore();
  const { getProofIdsForBlueprint } = useProofEmailStore();
  if (blueprint && blueprint.props.id) {
    console.log('blueprint', blueprint);
    console.log('getProofIdsForBlueprint', getProofIdsForBlueprint(blueprint.props.id));
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="flex w-full flex-col gap-1">
        <h4 className="text-xl font-bold text-grey-800">View Proof</h4>
        <p className="text-base font-medium text-grey-700">
          Please standby, proof generation takes a few seconds
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
          {blueprint &&
            blueprint.props.id &&
            getProofIdsForBlueprint(blueprint.props.id).map((proofId, index) => (
              <ProofRow key={proofId} proofId={proofId} index={index} blueprint={blueprint} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default ViewProof;
