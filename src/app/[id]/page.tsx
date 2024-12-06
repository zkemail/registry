'use client';
import { use, useEffect } from 'react';
import Image from 'next/image';
import { getDateToNowStr, getStatusColorLight, getStatusIcon, getStatusName } from '../utils';
import { Button } from '@/components/ui/button';
import Stepper from '../components/Stepper';
import ConnectEmails from './ConnectEmails';
import SelectEmails from './SelectEmails';
import ViewProof from './ViewProof';
import { Step, useProofStore } from './store';
import { useRouter, useSearchParams } from 'next/navigation';
import sdk from '@/lib/sdk';
import Link from 'next/link';
import AddInputs from './AddInputs';
import Loader from '@/components/ui/loader';
import StepperMobile from '../components/StepperMobile';
import { BlueprintTitle } from '../components/BlueprintTitle';
import { Blueprint, Status } from '@zk-email/sdk';
import { toast } from 'react-toastify';

const Pattern = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const {
    reset,
    setBlueprint,
    setStep,
    step: storeStep,
    isUserStarred,
    starBlueprint,
    unStarBlueprint,
    setIsUserStarred,
  } = useProofStore();
  const blueprint = useProofStore((state) => state.blueprint);
  const searchParams = useSearchParams();
  const router = useRouter();

  let steps = blueprint?.props.externalInputs
    ? ['Connect emails', 'Select emails', 'Add inputs', 'View and verify']
    : ['Connect emails', 'Select emails', 'View and verify'];

  let step = searchParams.get('step') || '0';

  useEffect(() => {
    reset();

    sdk
      .getBlueprintById(id)
      .then(async (bp) => {
        await bp.getStars();
        setBlueprint(bp);
        await setIsUserStarred();
      })
      .catch((err) => {
        console.error(`Failed to get blueprint with id ${id}: `, err);
      });
  }, []);

  const onCancelCompilation = async () => {
    if (!blueprint) return;
    try {
      await blueprint.cancelCompilation();
      router.push(`/create/${id}`);
    } catch (err) {
      console.error('Failed to cancel blueprint compilation: ', err);
      toast.error('Failed to cancel blueprint compilation');
    }
  };

  if (!blueprint) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (blueprint?.props.status === Status.Draft) {
    router.push(`/${id}/versions`);
  }

  const renderBlueprintComponent = () => {
    if (blueprint.props.status === Status.InProgress) {
      return (
        <div className="flex flex-col gap-1 rounded-3xl border border-grey-500 bg-white p-6 shadow-[2px_4px_2px_0px_rgba(0,0,0,0.02),_2px_3px_4.5px_0px_rgba(0,0,0,0.07)]">
          <h4 className="text-lg font-bold text-grey-800">Compilation in progress</h4>
          <p className="text-base font-medium text-grey-700">
            The blueprint compilation is in progress and will take few hours to complete{' '}
          </p>
          <Image
            src="/assets/CompilationInProgress.png"
            alt="compilation failed"
            style={{ margin: 'auto' }}
            width={560}
            height={340}
          />
          <Button
            startIcon={
              <Image
                src="/assets/RedClose.svg"
                style={{ color: 'red' }}
                alt="close"
                width={16}
                height={16}
              />
            }
            variant="destructive"
            className="mx-auto w-max"
            onClick={onCancelCompilation}
          >
            Cancel Compilation
          </Button>
        </div>
      );
    }

    if (blueprint.props.status === Status.Failed) {
      return (
        <div className="flex flex-col gap-1 rounded-3xl border border-grey-500 bg-white p-6 shadow-[2px_4px_2px_0px_rgba(0,0,0,0.02),_2px_3px_4.5px_0px_rgba(0,0,0,0.07)]">
          <h4 className="text-lg font-bold text-grey-800">Compilation Failed :(</h4>
          <p className="text-base font-medium text-grey-700">
            The blueprint failed due to some technical reasons. Please recompile again.
          </p>
          <Image
            src="/assets/CompilationFailed.png"
            alt="compilation failed"
            style={{ margin: 'auto' }}
            width={560}
            height={340}
          />
        </div>
      );
    }

    if (blueprint.props.status === Status.Done) {
      return (
        <div className="flex flex-col gap-6 rounded-3xl border border-grey-500 bg-white p-6 shadow-[2px_4px_2px_0px_rgba(0,0,0,0.02),_2px_3px_4.5px_0px_rgba(0,0,0,0.07)]">
          <h4 className="text-lg font-bold text-grey-800">Generate Proof</h4>
          <div className="flex flex-col items-center gap-6 md:hidden">
            <StepperMobile steps={steps} currentStep={step} />
          </div>
          {/* desktop stepper */}
          <div className="hidden flex-col items-center gap-6 md:flex">
            <Stepper steps={steps} currentStep={step} />
            <div
              style={{
                width: '100%',
                height: '2px',
                marginTop: '24px',
                backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%23E2E2E2FF' stroke-width='4' stroke-dasharray='6%2c 14' stroke-dashoffset='2' stroke-linecap='square'/%3e%3c/svg%3e")`,
              }}
            />
          </div>
          {step !== '0' && (
            <div className="flex w-auto">
              <Button
                variant="ghost"
                startIcon={<Image src="/assets/ArrowLeft.svg" alt="back" width={16} height={16} />}
                onClick={() => {
                  const newStep = parseInt(step) - 1;
                  if (steps.length === 3 && newStep === 2) {
                    setStep('1' as Step);
                  } else {
                    setStep(((newStep + steps.length) % steps.length) as unknown as Step);
                  }
                }}
              >
                {steps[parseInt(step) - 1]}
              </Button>
            </div>
          )}
          {step === '0' && <ConnectEmails />}
          {step === '1' && <SelectEmails id={id} />}
          {step === '2' && <AddInputs />}
          {step === '3' && <ViewProof />}
        </div>
      );
    }
  };

  return (
    <div className="mx-auto flex flex-col gap-10 py-16">
      {/* <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg bg-warning px-4 py-2 text-white shadow-lg">
        <p className="text-sm font-medium">
          🚧 This feature is currently in beta. Some functionality may be limited or subject to
          change.
        </p>
      </div> */}

      <>
        <BlueprintTitle
          blueprint={blueprint}
          isUserStarred={isUserStarred}
          unStarBlueprint={unStarBlueprint}
          starBlueprint={starBlueprint}
        />
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
          <div className="flex flex-row items-center justify-between gap-3">
            <span className="text-xl font-bold leading-6 underline">{blueprint.props.version}</span>
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
          <div className="flex w-auto flex-row gap-2">
            <Link href={`/${id}/versions`}>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white"
                onClick={() => {}}
                startIcon={
                  <Image src="/assets/GitCommit.svg" alt="commit" width={16} height={16} />
                }
              >
                View all versions
              </Button>
            </Link>
            <Link href={`/${id}/proofs`}>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white"
                onClick={() => {}}
                startIcon={<Image src="/assets/Files.svg" alt="commit" width={16} height={16} />}
              >
                Past proofs
              </Button>
            </Link>
          </div>
        </div>
      </>

      {renderBlueprintComponent()}
    </div>
  );
};

export default Pattern;
