'use client';

import ProofRow from '@/app/[id]/ProofRow';
import SearchBar from '@/app/components/SearchBar';
import sdk from '@/lib/sdk';
import { useProofEmailStore } from '@/lib/stores/useProofEmailStore';
import { Blueprint } from '@zk-email/sdk';
import { useEffect, useState } from 'react';

const MyProofs = () => {
  const { data, getProofIdsForBlueprint } = useProofEmailStore();

  console.log(data);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex flex-col items-start justify-between md:flex-row md:items-center">
        <h1 className="text-2xl font-bold">Your Proofs</h1>
        <div className="flex items-center gap-4">
          <SearchBar />
        </div>
      </div>
      <p className="-mt-4 mb-8 text-base text-grey-800">All the zk-proofs created by you! </p>
      <div className="flex flex-col gap-6">
        {Object.keys(data).map((blueprintId) => (
          <BlueprintProofsCard key={blueprintId} blueprintId={blueprintId} />
        ))}
      </div>
    </div>
  );
};

const BlueprintProofsCard = ({ blueprintId }: { blueprintId: string }) => {
  const { data, getProofIdsForBlueprint } = useProofEmailStore();
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const proofs = getProofIdsForBlueprint(blueprintId);
  useEffect(() => {
    sdk.getBlueprintById(blueprintId).then((blueprint) => {
      setBlueprint(blueprint);
    });
  }, [data]);

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-grey-500 bg-white p-6 shadow-[2px_4px_2px_0px_rgba(0,0,0,0.02),_2px_3px_4.5px_0px_rgba(0,0,0,0.07)]">
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="flex w-full flex-col gap-1">
          <h4 className="text-xl font-bold text-grey-800">{blueprint?.props.title}</h4>
          <p className="text-base font-medium text-grey-700">{blueprint?.props.description}</p>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-md font-medium text-grey-800">Values extracted:</p>
            {blueprint?.props?.decomposedRegexes?.map((dr, index) => (
              <div
                key={index}
                className="h-fit rounded-md border border-neutral-300 bg-neutral-200 px-2 py-[1px] text-sm font-light leading-[18px] text-grey-900"
              >
                {dr.name} {dr.isHashed ? '(hashed)' : ''}
              </div>
            ))}
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <div
            className="mb-2 grid w-[720px] gap-4 text-center font-medium text-grey-850"
            style={{ gridTemplateColumns: '1.5fr 5fr 1fr 1fr 1.5fr' }}
          >
            <div className="text-left">Proof ID</div>
            <div className="text-left">Outputs</div>
            <div>Status</div>
            <div>Proof</div>
            <div>Verify</div>
          </div>

          <div
            className="grid w-[720px] items-center gap-4 border-t py-2 text-grey-700"
            style={{ gridTemplateColumns: '1.5fr 5fr 1fr 1fr 1.5fr' }}
          >
            {blueprint &&
              proofs.map((proofId, index) => (
                <ProofRow key={proofId} proofId={proofId} index={index} blueprint={blueprint} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProofs;
