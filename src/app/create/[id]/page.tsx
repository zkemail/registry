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
import { extractEMLDetails, DecomposedRegex, testBlueprint, getDKIMSelector } from '@zk-email/sdk';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getFileContent } from '@/lib/utils';
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

type Step = '0' | '1' | '2';

const CreateBlueprint = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const router = useRouter();
  const store = useCreateBlueprintStore();
  const posthog = usePostHog();
  const pathname = usePathname();
  const token = useAuthStore((state) => state.token);

  const {
    saveDraft,
    getParsedDecomposedRegexes,
    setToExistingBlueprint,
    reset,
    compile,
    file,
    setFile,
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
  const [optOut, setOptOut] = useState(false);
  const [canonicalizedHeader, setCanonicalizedHeader] = useState<string>('');
  const [canonicalizedBody, setCanonicalizedBody] = useState<string>('');
  const [headerRegexList, setHeaderRegexList] = useState<any[]>([]);
  const [bodyRegexList, setBodyRegexList] = useState<any[]>([]);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [isBodyExpanded, setIsBodyExpanded] = useState(false);

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
    if (file) {
      const parser = new PostalMime();
      parser.parse(file!).then((email) => {
        setParsedEmail(email);
      });
    }
  }, [file]);

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
      setErrors([]);
      if (notify) {
        toast.success('Successfully saved draft');
      }
      if (newId !== id) {
        return newId;
      }
    } catch (err) {
      // TODO: Handle different kind of errors, e.g. per field errors
      toast.error('Failed to submit blueprint');
      setErrors(['Unknown error while submitting blueprint']);
    } finally {
      setIsSaveDraftLoading(false);
    }
  };

  const handleCompile = async () => {
    setIsCompileLoading(true);
    try {
      await handleSaveDraft(false);
      await compile();
    } catch (error) {
      console.error('Failed to compile:', error);
      toast.error('Failed to compile blueprint');
    } finally {
      setIsCompileLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!file) {
      console.error('Add eml file first');
      return;
    }

    if (!optOut) {
      posthog.capture('$test_email');
    }

    let content: string;
    try {
      content = await getFileContent(file);
      const { parsedEmail, senderDomain, selector, emailQuery, headerLength, emailBodyMaxLength } =
        await extractEMLDetails(content);
      setCanonicalizedHeader(parsedEmail.canonicalizedHeader);
      setCanonicalizedBody(parsedEmail.canonicalizedBody);
      setDkimSelector(selector);
      store.setField('senderDomain', senderDomain);
      store.setField('emailQuery', emailQuery);
      store.setField('emailHeaderMaxLength', (Math.ceil(headerLength / 64) + 5) * 64);
      store.setField('emailBodyMaxLength', (Math.ceil(emailBodyMaxLength / 64) + 5) * 64);
      if (emailBodyMaxLength > 9984 && !store.shaPrecomputeSelector) {
        toast.warning(
          'Email body is too long, max is 10000 bytes. Please add Email body cut off value else skip body hash check'
        );
        store.setField('ignoreBodyHashCheck', true);
        store.setField('removeSoftLinebreaks', false);
      }
    } catch (err) {
      if (!optOut) {
        posthog.capture('$test_email_error:failed_to_get_content', { error: err });
      }
      console.error('Failed to get content from email');
      return;
    }

    try {
      const parsed = getParsedDecomposedRegexes();

      const output = await testBlueprint(
        content,
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
          content,
        });
      }
      setErrors(['Failed to test decomposed regex on eml']);
      console.error('Failed to test decomposed regex on eml: ', err);
    }
  };

  useEffect(() => {
    if (file) {
      handleTestEmail();
    }
    if (!file) {
      setIsFileInvalid(false);
    }
  }, [file, revealPrivateFields]);

  useEffect(() => {
    if (step !== '1' || !store.senderDomain) {
      return;
    }

    fetch(`https://archive.zk.email/api/key?domain=${store.senderDomain}&selector=${dkimSelector}`)
      .then((res) => res.json())
      .then((data) => {
        if (file) {
          getFileContent(file).then((content) => {
            setIsDKIMMissing(!data.length);
          });
        }
      });
  }, [store.senderDomain, dkimSelector, step]);

  const isNextButtonDisabled = () => {
    if (!file || isFileInvalid) {
      return true;
    }

    if (step === '0') {
      return !store.circuitName || !store.title || !store.description;
    }

    if (step === '1') {
      return (
        !store.emailQuery ||
        !store.emailBodyMaxLength ||
        (store.emailBodyMaxLength > 10000 && !store.ignoreBodyHashCheck) ||
        store.ignoreBodyHashCheck === undefined
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
    console.log('parsedEmail: ', parsedEmail);
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
  }, [store.decomposedRegexes, file]);

  const genrateHighlightRegexContent = async () => {
    if (!file) {
      return;
    }

    let content: string;
    try {
      content = await getFileContent(file);
    } catch (err) {
      console.error('Failed to get content from email');
      return;
    }

    const parsed = getParsedDecomposedRegexes();

    const output = await testBlueprint(
      content,
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
    <div className="flex flex-row justify-center gap-2">
      <div className="my-16 flex flex-col gap-6 rounded-3xl border border-grey-500 bg-white p-6 shadow-[2px_4px_2px_0px_rgba(0,0,0,0.02),_2px_3px_4.5px_0px_rgba(0,0,0,0.07)]">
        <div className="border-grey-200 mb-4 rounded-md border bg-neutral-100 p-2">
          <div className="flex items-center">
            <Switch
              title="Private output"
              className="mr-2"
              checked={optOut}
              onCheckedChange={(checked) => setOptOut(checked)}
            />
            <span className="text-base">
              You can help improve the registry by sharing the process data with the team for future
              improvements. Feel free to opt out of sharing.
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
          <PatternDetails isFileInvalid={isFileInvalid} id={id} file={file} setFile={setFile} />
        )}
        {step === '1' && <EmailDetails file={file} isDKIMMissing={isDKIMMissing} />}
        {step === '2' && <ExtractFields file={file} optOut={optOut} />}
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
          <div className={`flex w-full flex-row ${file ? 'justify-between' : 'justify-center'}`}>
            {file && (
              <div>
                <Button
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
                  disabled={!file || !!errors.length || isDKIMMissing}
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
        <div className="my-16 flex w-96 min-w-96 flex-col gap-2 transition-all duration-300">
          <div className="rounded-3xl border border-grey-500 bg-white p-5 shadow-[2px_4px_2px_0px_rgba(0,0,0,0.02),_2px_3px_4.5px_0px_rgba(0,0,0,0.07)] transition-all duration-300">
            <div>
              <div className={`flex flex-row items-center justify-between border-b border-grey-500  ${isHeaderExpanded ? 'pb-3 mb-3' : 'border-b-0'}`}>
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
              <div className={`flex flex-row items-center justify-between border-b border-grey-500  ${isBodyExpanded ? 'pb-3 mb-3' : 'border-b-0'}`}>
                <h4 className="text-base font-bold text-grey-800">Body</h4>
                <Button
                  size={'smIcon'}
                  variant={'secondary'}
                  onClick={() => setIsBodyExpanded(!isBodyExpanded)}
                >
                  <Image src="/assets/Add.svg" alt="expand" width={16} height={16} />
                </Button>
              </div>
              <div className="max-h-[75vh] overflow-y-auto no-scrollbar">
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
    </div>
  );
};

export default CreateBlueprint;
