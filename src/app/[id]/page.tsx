'use client';
import { use, useEffect } from 'react';
import Image from 'next/image';
import { getDateToNowStr, getStatusColorLight, getStatusIcon, getStatusName } from '../utils';
import Button from '../components/Button';
import Stepper from '../components/Stepper';
import ConnectEmails from './ConnectEmails';
import SelectEmails from './SelectEmails';
import ViewProof from './ViewProof';
import { useProofStore } from './store';
import { useSearchParams } from 'next/navigation';
import sdk from '@/lib/sdk';

const Pattern = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const { reset, blueprint, setBlueprint } = useProofStore();
  const searchParams = useSearchParams();

  const step = searchParams.get('step') || '0';

  useEffect(() => {
    sdk
      .getBlueprint(id)
      .then(setBlueprint)
      .catch((err) => {
        console.error(`Failed to blueprint with id ${id}: `, err);
      });

    // Cleanup store on unmount
    return () => {
      reset();
    };
  }, []);

  return (
    <div className="mx-auto flex flex-col gap-10 py-16">
      {!blueprint ? (
        <div>Loading...</div>
      ) : (
        <>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{blueprint.props.title}</h2>
                <span
                  className={`flex flex-row gap-1 rounded-full px-2 py-1 text-xs font-semibold ${getStatusColorLight(
                    blueprint.props.status
                  )}`}
                >
                  <Image
                    width={12}
                    height={12}
                    src={getStatusIcon(blueprint.props.status)}
                    alt={getStatusName(blueprint.props.status)}
                  />
                  {getStatusName(blueprint.props.status)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-grey-600">
                <span className="flex flex-row gap-1 rounded border border-grey-400 px-2 py-1 font-medium text-grey-800">
                  <Image width={16} height={16} src="assets/Users.svg" alt="views" /> 0
                </span>
                <span className="flex flex-row gap-1 rounded border border-grey-500 bg-white px-2 py-1 font-semibold text-grey-800">
                  <Image width={16} height={16} src="assets/Star.svg" alt="stars" /> Stars | 0
                </span>
              </div>
            </div>
            <p className="text-md mb-4 font-medium text-grey-800">{blueprint.props.description}</p>
          </div>
          <div className="flex flex-row justify-between">
            <div className="flex flex-row items-center justify-between gap-3">
              <span className="text-xl font-bold leading-6 underline">
                {blueprint.props.version}
              </span>
              <span>
                <p className="text-xs text-grey-700">
                  Updated {getDateToNowStr(blueprint.props.updatedAt)}
                </p>
              </span>
              <span>
                <span
                  className={`flex flex-row gap-1 rounded-full border border-[#34C759] bg-white px-2 py-1 text-xs font-semibold text-[#34C759]`}
                >
                  Latest
                </span>
              </span>
            </div>
            <div>
              <Button onClick={() => {}} startImg="assets/GitCommit.svg">
                View all versions
              </Button>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col gap-6 rounded-3xl border border-grey-500 bg-white p-6 shadow-[2px_4px_2px_0px_rgba(0,0,0,0.02),_2px_3px_4.5px_0px_rgba(0,0,0,0.07)]">
        <h4 className="text-lg font-bold text-grey-800">Generate Proof</h4>
        <Stepper
          steps={['Connect emails', 'Select emails', 'View and verify']}
          currentStep={step}
        />
        <div
          style={{
            height: '2px',
            marginTop: '24px',
            backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%23E2E2E2FF' stroke-width='4' stroke-dasharray='6%2c 14' stroke-dashoffset='2' stroke-linecap='square'/%3e%3c/svg%3e")`,
          }}
        />
        {step === '0' && <ConnectEmails />}
        {step === '1' && <SelectEmails />}
        {step === '2' && <ViewProof />}
      </div>
    </div>
  );
};

export default Pattern;
