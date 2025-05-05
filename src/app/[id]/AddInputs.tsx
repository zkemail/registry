'use client';

import { Input } from '@/components/ui/input';
import { useProofStore } from './store';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Loader from '@/components/ui/loader';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { ZkFramework } from '@zk-email/sdk';
import { toast } from 'react-toastify';

const AddInputs = () => {
  const pathname = usePathname();
  const { replace } = useRouter();
  const searchParams = useSearchParams();
  const { blueprint, externalInputs, setExternalInputs, startProofGeneration } = useProofStore();
  const [isCreateProofLoading, setIsCreateProofLoading] = useState<'local' | 'remote' | null>(null);
  const [areProvingButtonsDisabled, setAreProvingButtonsDisabled] = useState(true);

  const handleStartProofGeneration = async (isLocal = false) => {
    setIsCreateProofLoading(isLocal ? 'local' : 'remote');
    setAreProvingButtonsDisabled(true);
    try {
      const proofId = await startProofGeneration(isLocal);
      const params = new URLSearchParams(searchParams);
      params.set('proofId', proofId);
      params.set('step', '3');
      replace(`${pathname}?${params.toString()}`);
    } catch (error) {
      console.error('Error in starting proof generation: ', error);
      if (isLocal) {
        toast.error('Error: Local proof generation failed');
      } else {
        toast.error('Error: Remote proof generation failed');
      }
    } finally {
      setIsCreateProofLoading(null);
      setAreProvingButtonsDisabled(false);
    }
  };
  useEffect(() => {
    const allInputsValid = externalInputs?.every((input) => input.value) ?? false;
    setAreProvingButtonsDisabled(!allInputsValid);
  }, [externalInputs]);

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
        <div className="flex flex-col gap-4">
          <div
            data-testid="remote-proving"
            className={`rounded-2xl border border-grey-200 p-6 ${
              areProvingButtonsDisabled || blueprint?.props.zkFramework !== ZkFramework.Circom
                ? 'cursor-not-allowed bg-neutral-100'
                : 'cursor-pointer'
            }`}
            onClick={() => {
              if (areProvingButtonsDisabled) return;
              handleStartProofGeneration(false);
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="flex flex-row items-center justify-center gap-2 text-xl">
                Remote Proving
                {isCreateProofLoading === 'remote' && (
                  <span>
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </span>
                )}
              </p>

              <div className="flex flex-row gap-2">
                <div className="rounded-lg border border-[#C2F6C7] bg-[#ECFFEE] px-2 py-1 text-sm text-[#3AA345]">
                  Quick
                </div>
                <div className="rounded-lg border border-[#FFDBDE] bg-[#FFF6F7] px-2 py-1 text-sm text-[#C71B16]">
                  Server Side
                </div>
              </div>
            </div>
            <p className="text-base text-grey-700">
              This method is comparatively faster. But the email is sent to our servers temporarily
              and then deleted right after the proof creation.
            </p>
          </div>
          <div
            data-testid="local-proving"
            className={`rounded-2xl border border-grey-200 p-6 ${
              areProvingButtonsDisabled ? 'cursor-not-allowed bg-neutral-100' : 'cursor-pointer'
            }`}
            onClick={() => {
              if (areProvingButtonsDisabled) return;
              handleStartProofGeneration(true);
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="flex flex-row items-center justify-center gap-2 text-xl">
                Local Proving{' '}
                {isCreateProofLoading === 'local' && (
                  <span>
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </span>
                )}
              </p>
              <div className="flex flex-row gap-2">
                <div className="rounded-lg border border-[#C2F6C7] bg-[#ECFFEE] px-2 py-1 text-sm text-[#3AA345]">
                  Private
                </div>
                <div className="rounded-lg border border-[#FFDBDE] bg-[#FFF6F7] px-2 py-1 text-sm text-[#C71B16]">
                  Slow
                </div>
              </div>
            </div>
            <p className="text-base text-grey-700">
              {blueprint?.props.zkFramework === ZkFramework.Circom ? (
                <>
                  This method prioritizes your privacy by generating proofs directly on your device.
                  While it may take a bit more time, your email remains securely on your system.
                </>
              ) : (
                'Local proving only works for blueprints compiled with Circom'
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddInputs;
