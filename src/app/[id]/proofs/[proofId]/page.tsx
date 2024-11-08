'use client';

import sdk from '@/lib/sdk';
import { useProofStore } from '../../store';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { toast } from 'react-toastify';

const ProofInfo = ({ params }: { params: { id: string; proofId: string } }) => {
  const { reset, blueprint, emailContent, setBlueprint } = useProofStore();

  console.log('emailContent', emailContent);

  useEffect(() => {
    reset();

    sdk
      .getBlueprint(params.id)
      .then(setBlueprint)
      .catch((err) => {
        console.error(`Failed to blueprint with id ${params.id}: `, err);
      });
  }, []);

  return (
    <div className="mx-4 my-16 flex flex-col gap-6 rounded-3xl border border-grey-500 bg-white p-6 shadow-[2px_4px_2px_0px_rgba(0,0,0,0.02),_2px_3px_4.5px_0px_rgba(0,0,0,0.07)]">
      <div>
        <h4 className="text-xl font-bold text-grey-900">Proof Details</h4>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-row justify-between">
          <div className="text-base font-medium text-grey-700">Job Id</div>
          <div className="gap-1 text-base font-medium text-grey-800">
            {params.proofId}
            <span className="ml-1">
              <Button
                variant="secondary"
                className="h-auto w-auto p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  navigator.clipboard.writeText(params.proofId);
                  toast.success('Copied to clipboard');
                }}
              >
                <Image src="/assets/CopySimple.svg" alt="Copy job id" width={16} height={16} />
              </Button>
            </span>
          </div>
        </div>
        <div className="flex flex-row justify-between">
          <div className="text-base font-medium text-grey-700">Blueprint</div>
          <div className="text-base font-medium text-grey-800">
            {blueprint?.props.title} (v{blueprint?.props.version})
          </div>
        </div>
        <div className="flex flex-row justify-between">
          <div className="text-base font-medium text-grey-700">Outputs</div>
          <div className="text-base font-medium text-grey-800">Job Id</div>
        </div>
        <div className="flex flex-row justify-between">
          <div className="text-base font-medium text-grey-700">Sent on</div>
          <div className="text-base font-medium text-grey-800">Job Id</div>
        </div>
        <div className="flex flex-row justify-between">
          <div className="text-base font-medium text-grey-700">Date created</div>
          <div className="text-base font-medium text-grey-800">Job Id</div>
        </div>
        <div className="flex flex-row justify-between">
          <div className="text-base font-medium text-grey-700">Time taken</div>
          <div className="text-base font-medium text-grey-800">Job Id</div>
        </div>
        <div className="flex flex-row justify-between">
          <div className="text-base font-medium text-grey-700">Status</div>
          <div className="text-base font-medium text-grey-800">Job Id</div>
        </div>
      </div>
      {emailContent ? (
        <div>
          <h4 className="text-xl font-bold text-grey-900">Email Render</h4>
          <div
            dangerouslySetInnerHTML={{
              __html: emailContent,
            }}
          />
        </div>
      ) : null}
    </div>
  );
};

export default ProofInfo;
