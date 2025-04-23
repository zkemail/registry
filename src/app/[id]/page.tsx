'use client';
import { use, useEffect } from 'react';
import Image from 'next/image';
import { getStatusColorLight, getStatusIcon, getStatusName } from '../utils';
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
import { useAuthStore } from '@/lib/stores/useAuthStore';

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
  const { clearAuth } = useAuthStore();

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
        if (err.toString().includes('401')) {
          clearAuth();
          return
        }
        console.error(`Failed to get blueprint with id ${id}: `, err);
        toast.error('This blueprint could not be found');
        router.push('/');
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
            src="/assets/CompilationInProgress.svg"
            alt="compilation failed"
            width={280}
            height={280}
            style={{
              margin: 'auto',
              maxWidth: '100%',
              height: 'auto',
            }}
          />
          <Button
            startIcon={
              <Image
                src="/assets/RedClose.svg"
                alt="close"
                width={16}
                height={16}
                style={{
                  color: 'red',
                  maxWidth: '100%',
                  height: 'auto',
                }}
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
            src="/assets/CompilationFailed.svg"
            alt="compilation failed"
            width={316}
            height={316}
            style={{
              margin: 'auto',
              maxWidth: '100%',
              height: 'auto',
            }}
          />
          <div className="flex w-full justify-center">
            <Button
              onClick={() => router.push(`/create/${blueprint.props.id}`)}
              variant="secondary"
              startIcon={
                <Image
                  src="/assets/Edit.svg"
                  alt="Edit"
                  width={16}
                  height={16}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
              }
              size="sm"
            >
              Edit blueprint
            </Button>
          </div>
        </div>
      );
    }

    if (blueprint.props.status === Status.Done) {
      return (
        <div className="flex flex-col gap-6 rounded-3xl border border-grey-400 bg-white p-6">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-bold text-grey-800">Generate Proof</h4>
            <Link href={`/${id}/proofs`}>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white border border-grey-400 hover:bg-grey-100 text-grey-800"
                startIcon={
                  <Image
                    src="/assets/Files.svg"
                    alt="proofs"
                    width={16}
                    height={16}
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                    }}
                  />
                }
              >
                Past proofs
              </Button>
            </Link>
          </div>
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
                startIcon={
                  <Image
                    src="/assets/ArrowLeft.svg"
                    alt="back"
                    width={16}
                    height={16}
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                    }}
                  />
                }
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
      </>
      {renderBlueprintComponent()}
    </div>
  );
};

export default Pattern;
