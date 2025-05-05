'use client';

// Test decomposedRegex
/*
[
          {
            "isPublic": true,
            "regexDef": "Hi!"
          }
        ]

*/

import { useCreateBlueprintStore } from './store';

import { use, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { extractEMLDetails, DecomposedRegex, testBlueprint, parseEmail } from '@zk-email/sdk';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import StepperMobile from '@/app/components/StepperMobile';
import Stepper from '@/app/components/Stepper';
import PatternDetails from './createBlueprintSteps/PatternDetails';
import ExtractFields from './createBlueprintSteps/ExtractFields';
import EmailDetails from './createBlueprintSteps/EmailDetails';
import PostalMime from 'postal-mime';
import { Email } from 'postal-mime';
import LoginButton from '@/app/components/LoginButton';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { usePostHog } from 'posthog-js/react';
import { Switch } from '@/components/ui/switch';
import HighlightText from '@/app/components/HighlightRegex';
import { REGEX_COLORS } from '@/app/constants';
import { debounce } from '@/app/utils';
import ModalGenerator from '@/components/ModalGenerator';

type Step = '0' | '1' | '2';

const CreateBlueprint = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const router = useRouter();
  const store = useCreateBlueprintStore();
  const posthog = usePostHog();
  const pathname = usePathname();
  const token = useAuthStore((state) => state.token);
  const [savedEmls, setSavedEmls] = useState<Record<string, string>>(
    JSON.parse(localStorage.getItem('blueprintEmls') || '{}')
  );

  
  const {
    saveDraft,
    getParsedDecomposedRegexes,
    setToExistingBlueprint,
    reset,
    compile,
    file,
    setFile,
    blueprint,
  } = store;
  
  const [errors, setErrors] = useState<string[]>([]);
  const [revealPrivateFields, setRevealPrivateFields] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState<string>('');
  const steps = ['Pattern Details', 'Email Details', 'Extract Fields'];
  const [showSampleEMLPreview, setShowSampleEMLPreview] = useState(false);
  const [parsedEmail, setParsedEmail] = useState<Email | null>(null);
  const [isDKIMMissing, setIsDKIMMissing] = useState(false);
  const [isFileInvalid, setIsFileInvalid] = useState(false);
  const [isSaveDraftLoading, setIsSaveDraftLoading] = useState(false);
  const [isCompileLoading, setIsCompileLoading] = useState(false);
  const [dkimSelector, setDkimSelector] = useState<string | null>(null);
  const [optOut, setOptOut] = useState(localStorage.getItem('optOut') === 'true' ? true : false);
  const [canonicalizedHeader, setCanonicalizedHeader] = useState<string>('');
  const [canonicalizedBody, setCanonicalizedBody] = useState<string>('');
  const [headerRegexList, setHeaderRegexList] = useState<any[]>([]);
  const [bodyRegexList, setBodyRegexList] = useState<any[]>([]);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [isBodyExpanded, setIsBodyExpanded] = useState(false);
  const [isVerifyDKIMLoading, setIsVerifyDKIMLoading] = useState(false);
  const [canCompile, setCanCompile] = useState(false);
  const [isConfirmInputsUpdateModalOpen, setIsConfirmInputsUpdateModalOpen] = useState(false);
  const [isUpdateInputsLoading, setIsUpdateInputsLoading] = useState(false);

  const searchParams = useSearchParams();
  let step = searchParams.get('step') || '0';

  const setStep = (step: Step, id?: string) => {
    if (id) {
      router.replace(`/create/${id}?step=${step}`, { scroll: false });
    } else {
      router.replace(`?step=${step}`, { scroll: false });
    }
  };

  useEffect(() => {
    if (!optOut) {
      posthog.startSessionRecording();
    } else {
      posthog.stopSessionRecording();
    }

    return () => {
      posthog.reset();
    };
  }, [optOut]);

  useEffect(() => {
    if (savedEmls[id]) {
      const parser = new PostalMime();

      parser.parse(savedEmls[id]).then((email) => {
        setParsedEmail(email);
      });
    }
  }, [savedEmls[id]]);

  // Load data if an id is provided
  useEffect(() => {
    if (id === 'new' || (step === '0' && id !== 'new')) {
      reset();
    }
    if (id !== 'new') {
      setToExistingBlueprint(id);
    }
  }, [id, step]);

  const handleSaveDraft = async (notify = true) => {
    setIsSaveDraftLoading(true);
    try {
      const newId = await saveDraft();
      if (step === '0') {
        localStorage.setItem(
          'blueprintEmls',
          JSON.stringify({
            ...savedEmls,
            [newId]: savedEmls[id],
          })
        );
      }
      if (notify) {
        toast.success('Successfully saved draft');
      }
      if (newId !== id) {
        return newId;
      }
    } catch (err) {
      // TODO: Handle different kind of errors, e.g. per field errors
      toast.error('Failed to submit blueprint');
      console.error('Failed to submit blueprint: ', err);
      setErrors(['Unknown error while submitting blueprint']);
    } finally {
      setIsSaveDraftLoading(false);
    }
  };

  const handleCompile = async () => {
    setIsCompileLoading(true);
    try {
      await handleSaveDraft(false);
      const blueprintId = await compile();
      router.push(`/${blueprintId}`);
    } catch (error) {
      console.error('Failed to compile:', error);
      toast.error(`Failed to compile blueprint: ${error?.toString()?.replace('Error: ', '')}`);
    } finally {
      setIsCompileLoading(false);
    }
  };

  const handleTestEmail = async (updateFields = false) => {
    console.log(savedEmls, id);
    if (!savedEmls[id]) {
      console.error('Add eml file first');
      return;
    }

    if (!optOut) {
      posthog.capture('$test_email');
    }

    let content: string;
    try {
      const parsedEmail = await parseEmail(savedEmls[id]);
      const { senderDomain, selector, emailQuery, headerLength, emailBodyMaxLength } =
        await extractEMLDetails(savedEmls[id]);
      setCanonicalizedHeader(parsedEmail.canonicalizedHeader);
      setCanonicalizedBody(parsedEmail.canonicalizedBody);
      setDkimSelector(selector);

      if (
        (store.senderDomain !== senderDomain ||
          store.emailQuery !== emailQuery ||
          store.emailHeaderMaxLength !== (Math.ceil(headerLength / 64) + 7) * 64 ||
          store.emailBodyMaxLength !== (Math.ceil(emailBodyMaxLength / 64) + 7) * 64) &&
        !updateFields && id !== 'new'
      ) {
        setIsConfirmInputsUpdateModalOpen(true);
        return;
      }

      store.setField('senderDomain', senderDomain);
      store.setField('emailQuery', emailQuery);
      store.setField('emailHeaderMaxLength', (Math.ceil(headerLength / 64) + 7) * 64);
      store.setField('emailBodyMaxLength', (Math.ceil(emailBodyMaxLength / 64) + 7) * 64);
    } catch (err) {
      if (!optOut) {
        posthog.capture('$test_email_error:failed_to_get_content', { error: err });
      }
      console.error('Failed to get content from email', err);
      if (savedEmls[id]) {
        if (typeof err === 'string') {
          toast.error(err);
        } else {
          toast.error('Invalid email');
        }
      }
      return;
    }

    // Bleurpint was not defined yet, skip testing email against blueprint
    if (id === 'new') return;

    try {
      const parsed = getParsedDecomposedRegexes();

      const output = await testBlueprint(
        savedEmls[id],
        {
          ...store,
          decomposedRegexes: getParsedDecomposedRegexes(),
        },
        revealPrivateFields
      );

      const mappedOutput = parsed
        .map((dcr: DecomposedRegex, index: number) => ({
          name: dcr.name,
          value: output[index],
        }))
        .filter((item: { value: string[] }) => item.value?.length > 0);
      const formattedOutput = mappedOutput
        .map((item: { name: string; value: string[] }) => `${item.name}: ${item.value}`)
        .join('\n');
      setGeneratedOutput(formattedOutput);

      setErrors([]);
    } catch (err) {
      if (!optOut) {
        posthog.capture('$test_email_error:failed_to_test_decomposed_regex', {
          error: err,
          savedEmls: savedEmls[id],
        });
      }
      setErrors(['Failed to test decomposed regex on eml']);
      console.error('Failed to test decomposed regex on eml: ', err);
    }
  };

  useEffect(() => {
    if (savedEmls[id]) {
      handleTestEmail();
    }
    if (!savedEmls[id]) {
      setIsFileInvalid(false);
    }
  }, [JSON.stringify(store.decomposedRegexes), savedEmls[id], revealPrivateFields]);

  // Create a debounced version of the DKIM verification
  const debouncedVerifyDKIM = debounce(async (domain: string, selector: string | null) => {
    setIsVerifyDKIMLoading(true);

    const url = new URL(`https://archive.zk.email/api/key`);
    const params = new URLSearchParams({
      domain: domain,
      selector: selector || '',
    });

    url.search = params.toString();

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (savedEmls[id]) {
        setIsDKIMMissing(!data.length);
      }
    } catch (error) {
      console.error('Failed to verify DKIM:', error);
    } finally {
      setIsVerifyDKIMLoading(false);
    }
  }, 500); // 500ms delay

  useEffect(() => {
    if (step !== '1' || !store.senderDomain) {
      return;
    }

    debouncedVerifyDKIM(store.senderDomain, dkimSelector);

    // Cleanup function to cancel pending debounced calls
    return () => {
      debouncedVerifyDKIM.cancel();
    };
  }, [JSON.stringify(store.senderDomain), dkimSelector, step]);

  const isNextButtonDisabled = () => {
    if (!savedEmls[id] || isFileInvalid) {
      return true;
    }

    if (step === '0') {
      return !store.circuitName || !store.title || !store.description || store.title?.includes(' ');
    }

    if (step === '1') {
      return (
        !store.emailQuery || !store.emailBodyMaxLength || store.ignoreBodyHashCheck === undefined
      );
    }

    if (step === '2') {
      return !store.decomposedRegexes.length;
    }

    return !!errors.length || isDKIMMissing;
  };

  const onClickNext = async () => {
    try {
      const newId = await handleSaveDraft();
      setStep((parseInt(step) + 1).toString() as Step, newId);
    } catch (err) {
      console.error('failed to save draft and move to next step: ', err);
    }
  };

  const SampleEMLPreview = () => {
    if (!showSampleEMLPreview) return <></>;
    if (parsedEmail?.html) {
      return (
        <div
          className="m-6"
          dangerouslySetInnerHTML={{
            __html: parsedEmail?.html!,
          }}
        />
      );
    }

    if (parsedEmail?.text) {
      return <div className="m-6">{parsedEmail.text}</div>;
    }

    return <></>;
  };

  if (!token) {
    return (
      <div className="my-16 flex flex-col gap-6 rounded-3xl border border-grey-500 bg-white p-6 shadow-[2px_4px_2px_0px_rgba(0,0,0,0.02),_2px_3px_4.5px_0px_rgba(0,0,0,0.07)]">
        <div>Please login first to create a new blueprint.</div>
        <div>
          <LoginButton />
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (step === '2') {
      genrateHighlightRegexContent();
    }
  }, [JSON.stringify(store.decomposedRegexes), savedEmls[id]]);

  const genrateHighlightRegexContent = async () => {
    if (!savedEmls[id]) {
      return;
    }

    const parsed = getParsedDecomposedRegexes();

    const output = await testBlueprint(
      savedEmls[id],
      {
        ...store,
        decomposedRegexes: getParsedDecomposedRegexes(),
      },
      true
    );

    const mappedOutput = parsed
      .map((dcr: DecomposedRegex, index: number) => ({
        name: dcr.name,
        value: output[index],
      }))
      .filter((item: { value: string[] }) => item.value?.length > 0);

    const bodyRegexList: { regex: string; color: string }[] = [];
    const headerRegexList: { regex: string; color: string }[] = [];

    mappedOutput.forEach((item: { name: string; value: string[] }, index: number) => {
      item.value.forEach((value: string, itemIndex: number) => {
        if (parsed[index].location === 'body') {
          bodyRegexList.push({
            regex: value,
            color:
              REGEX_COLORS[index % REGEX_COLORS.length][
                parsed[index].parts[itemIndex]?.isPublic ? 'public' : 'private'
              ],
          });
        } else {
          headerRegexList.push({
            regex: value,
            color:
              REGEX_COLORS[index % REGEX_COLORS.length][
                parsed[index].parts[itemIndex]?.isPublic ? 'public' : 'private'
              ],
          });
        }
      });
    });

    setHeaderRegexList(headerRegexList);
    setBodyRegexList(bodyRegexList);
  };

  return (
    <div className="flex flex-col justify-center gap-2 px-4 xl:flex-row">
      <div className="mt-16 flex flex-col gap-6 rounded-3xl border border-grey-500 bg-white p-6 shadow-[2px_4px_2px_0px_rgba(0,0,0,0.02),_2px_3px_4.5px_0px_rgba(0,0,0,0.07)] xl:my-16">
        <div className="mb-4 rounded-md border border-grey-200 bg-neutral-100 p-2">
          <div className="flex items-center">
            <Switch
              title="Private output"
              className="mr-2"
              checked={optOut}
              onCheckedChange={(checked) => {
                setOptOut(checked);
                localStorage.setItem('optOut', checked.toString());
              }}
            />
            <span className="text-base">
              We collect anonymous usage data to improve the registry. Toggle this switch to opt
              out.
            </span>
          </div>
        </div>
        <h4 className="text-lg font-bold text-grey-800">Submit Blueprint</h4>
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
                  setStep('1');
                } else {
                  setStep(((newStep + steps.length) % steps.length).toString() as Step);
                }
              }}
            >
              {steps[parseInt(step) - 1]}
            </Button>
          </div>
        )}
        {step === '0' && (
          <PatternDetails
            isFileInvalid={isFileInvalid}
            id={id}
            file={file}
            setFile={setFile}
            emlContent={savedEmls[id]}
            savedEmls={savedEmls}
            setSavedEmls={setSavedEmls}
          />
        )}
        {step === '1' && (
          <EmailDetails
            emlContent={savedEmls[id]}
            isDKIMMissing={isDKIMMissing}
            isVerifyDKIMLoading={isVerifyDKIMLoading}
          />
        )}
        {step === '2' && (
          <ExtractFields emlContent={savedEmls[id]} optOut={optOut} setCanCompile={setCanCompile} />
        )}
        <div
          style={{
            width: '100%',
            height: '2px',
            marginTop: '24px',
            backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%23E2E2E2FF' stroke-width='4' stroke-dasharray='6%2c 14' stroke-dashoffset='2' stroke-linecap='square'/%3e%3c/svg%3e")`,
          }}
        />
        <div>
          <SampleEMLPreview />
          <div
            className={`flex w-full flex-col gap-4 sm:flex-row ${savedEmls[id] ? 'justify-between' : 'justify-center'}`}
          >
            {savedEmls[id] && (
              <div className="w-full">
                <Button
                  id="sample-eml-preview-button"
                  data-testid="sample-eml-preview-button"
                  className='w-full sm:w-auto'
                  variant="secondary"
                  onClick={() => setShowSampleEMLPreview(!showSampleEMLPreview)}
                >
                  {showSampleEMLPreview ? '- Hide sample .eml' : '+ View sample .eml'}
                </Button>
              </div>
            )}
            <div className="flex justify-center gap-4">
              <Button
                variant="secondary"
                onClick={handleSaveDraft}
                loading={isSaveDraftLoading}
                disabled={!store.circuitName || !store.title}
                startIcon={
                  <Image
                    src="/assets/Archive.svg"
                    alt="save"
                    width={16}
                    height={16}
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                    }}
                  />
                }
              >
                Save as Draft
              </Button>
              {parseInt(step) < 2 ? (
                <Button
                  onClick={onClickNext}
                  endIcon={
                    <Image
                      src="/assets/ArrowRight.svg"
                      alt="arrow right"
                      width={16}
                      height={16}
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                      }}
                    />
                  }
                  disabled={isNextButtonDisabled()}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleCompile}
                  loading={isCompileLoading}
                  disabled={!savedEmls[id] || !canCompile}
                  startIcon={
                    <Image
                      src="/assets/Check.svg"
                      alt="check"
                      width={16}
                      height={16}
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                      }}
                    />
                  }
                >
                  Submit Blueprint
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      {pathname.includes('create') && step === '2' ? (
        <div className="my-4 flex w-full min-w-96 flex-col gap-4 transition-all duration-300 xl:my-16 xl:w-96 xl:gap-2">
          <div className="rounded-3xl border border-grey-500 bg-white p-5 shadow-[2px_4px_2px_0px_rgba(0,0,0,0.02),_2px_3px_4.5px_0px_rgba(0,0,0,0.07)] transition-all duration-300">
            <div>
              <div
                className={`flex flex-row items-center justify-between border-b border-grey-500 ${isHeaderExpanded ? 'mb-3 pb-3' : 'border-b-0'}`}
              >
                <h4 className="text-base font-bold text-grey-800">Header</h4>
                <Button
                  size={'smIcon'}
                  variant={'secondary'}
                  onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                >
                  <Image
                    src={isHeaderExpanded ? '/assets/Subtract.svg' : '/assets/Add.svg'}
                    alt={isHeaderExpanded ? 'collapse' : 'expand'}
                    width={16}
                    height={16}
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                    }}
                  />
                </Button>
              </div>
              {isHeaderExpanded && (
                <p className="break-words">
                  <HighlightText text={canonicalizedHeader} regexList={headerRegexList} />
                </p>
              )}
            </div>
          </div>
          <div className="rounded-3xl border border-grey-500 bg-white p-5 shadow-[2px_4px_2px_0px_rgba(0,0,0,0.02),_2px_3px_4.5px_0px_rgba(0,0,0,0.07)]">
            <div>
              <div
                className={`flex flex-row items-center justify-between border-b border-grey-500 ${isBodyExpanded ? 'mb-3 pb-3' : 'border-b-0'}`}
              >
                <h4 className="text-base font-bold text-grey-800">Body</h4>
                <Button
                  size={'smIcon'}
                  variant={'secondary'}
                  onClick={() => setIsBodyExpanded(!isBodyExpanded)}
                >
                  <Image
                    src={isBodyExpanded ? '/assets/Subtract.svg' : '/assets/Add.svg'}
                    alt={isBodyExpanded ? 'collapse' : 'expand'}
                    width={16}
                    height={16}
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                    }}
                  />
                </Button>
              </div>
              <div className="no-scrollbar max-h-[75vh] overflow-y-auto">
                {isBodyExpanded && (
                  <p className="break-words">
                    <HighlightText text={canonicalizedBody} regexList={bodyRegexList} />
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <ModalGenerator
        isOpen={isConfirmInputsUpdateModalOpen}
        onClose={() => {
          setIsConfirmInputsUpdateModalOpen(false);
        }}
        title="Confirm Inputs Update!"
        disableSubmitButton={isUpdateInputsLoading}
        showActionBar={false}
        modalContent={
          <div className="flex w-[456px] flex-col justify-center gap-4">
            <p className="text-base font-semibold text-grey-700">
              Are you sure you want to update the inputs?
            </p>
            <div className="flex w-full gap-2">
              <Button
                className="w-full"
                startIcon={
                  <Image src="/assets/GoBackIcon.svg" alt="arrow-left" width={16} height={16} />
                }
                variant="secondary"
                onClick={() => setIsConfirmInputsUpdateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="w-full"
                startIcon={<Image src="/assets/Check.svg" alt="check" width={16} height={16} />}
                variant="destructive"
                onClick={async () => {
                  setIsUpdateInputsLoading(true);
                  await handleTestEmail(true);
                  setIsUpdateInputsLoading(false);
                  setIsConfirmInputsUpdateModalOpen(false);
                }}
                loading={isUpdateInputsLoading}
              >
                Update
              </Button>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default CreateBlueprint;
