'use client';

import { Input } from '@/components/ui/input';
import { useProofStore } from './store';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const AddInputs = () => {
  const pathname = usePathname();
  const { replace } = useRouter();
  const searchParams = useSearchParams();
  const { blueprint, externalInputs, setExternalInputs, setStep, startProofGeneration } =
    useProofStore();
  const [isCreateProofLoading, setIsCreateProofLoading] = useState(false);

  const handleStartProofGeneration = async () => {
    setIsCreateProofLoading(true);
    try {
      const proofId = await startProofGeneration();
      const params = new URLSearchParams(searchParams);
      params.set('proofId', proofId);
      params.set('step', '3');
      replace(`${pathname}?${params.toString()}`);
    } catch (error) {
      console.error('Error in starting proof generation: ', error);
    } finally {
      setIsCreateProofLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="flex w-full flex-col gap-1">
        <h4 className="text-xl font-bold text-grey-800">Add Inputs</h4>
        <p className="text-base font-medium text-grey-700">Enter inputs for the proofs</p>
      </div>
      <div className="flex w-full flex-col gap-4">
        {blueprint?.props.externalInputs?.map((input, index) => (
          <Input
            placeholder={`Enter ${input.name.charAt(0).toUpperCase() + input.name.slice(1)}`}
            title={input.name.charAt(0).toUpperCase() + input.name.slice(1)}
            key={index}
            onChange={(e) => {
              const newInputs = externalInputs ? [...externalInputs] : [];
              newInputs[index] = { name: input.name, value: e.target.value };
              setExternalInputs(newInputs);
            }}
          />
        ))}

        <div className="flex justify-center">
          <Button
            onClick={handleStartProofGeneration}
            disabled={isCreateProofLoading}
            loading={isCreateProofLoading}
          >
            Create Proof Remotely
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddInputs;
