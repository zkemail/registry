'use client';

import { Input } from '@/components/ui/input';
import { useProofStore } from './store';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const AddInputs = () => {
  const pathname = usePathname();
  const { replace } = useRouter();
  const searchParams = useSearchParams();
  const { blueprint, externalInputs, setExternalInputs, startProofGeneration } = useProofStore();
  const [isCreateProofLoading, setIsCreateProofLoading] = useState<'local' | 'remote' | null>(null);

  const handleStartProofGeneration = async (isLocal = false) => {
    setIsCreateProofLoading(isLocal ? 'local' : 'remote');
    try {
      const proofId = await startProofGeneration(isLocal);
      const params = new URLSearchParams(searchParams);
      params.set('proofId', proofId);
      params.set('step', '3');
      replace(`${pathname}?${params.toString()}`);
    } catch (error) {
      console.error('Error in starting proof generation: ', error);
    } finally {
      setIsCreateProofLoading(null);
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
              newInputs[index] = {
                name: input.name,
                value: e.target.value,
                maxLength: input.maxLength,
              };
              setExternalInputs(newInputs);
            }}
          />
        ))}

        <div className="flex justify-center">Choose the mode of proof creation</div>
        <div className="flex justify-center">
          <TooltipProvider>
            <Tooltip
              disableHoverableContent={
                !!isCreateProofLoading ||
                !externalInputs?.reduce((acc, curr) => acc && !!curr.value, true)
              }
            >
              <TooltipTrigger>
                <Button
                  onClick={() => handleStartProofGeneration(false)}
                  disabled={
                    !!isCreateProofLoading ||
                    !externalInputs?.reduce((acc, curr) => acc && !!curr.value, true)
                  }
                  loading={isCreateProofLoading === 'remote'}
                  className="mr-3"
                >
                  Remotely
                </Button>
              </TooltipTrigger>
              <TooltipContent
                className={
                  externalInputs?.reduce((acc, curr) => acc && !!curr.value, true)
                    ? 'pointer-events-none opacity-0'
                    : ''
                }
              >
                <p>You must enter all inputs to create a proof remotely</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  onClick={() => handleStartProofGeneration(true)}
                  disabled={
                    !!isCreateProofLoading ||
                    !externalInputs?.reduce((acc, curr) => acc && !!curr.value, true)
                  }
                  loading={isCreateProofLoading === 'local'}
                >
                  Locally
                </Button>
              </TooltipTrigger>
              <TooltipContent
                className={
                  externalInputs?.reduce((acc, curr) => acc && !!curr.value, true)
                    ? 'pointer-events-none opacity-0'
                    : ''
                }
              >
                <p>You must enter all inputs to create a proof locally</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default AddInputs;
