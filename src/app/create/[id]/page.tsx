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
import { DecomposedRegex, testBlueprint } from '@zk-email/sdk';
import { useRouter } from 'next/navigation';
import { getFileContent } from '@/lib/utils';
import { toast } from 'react-toastify';
import StepperMobile from '@/app/components/StepperMobile';
import Stepper from '@/app/components/Stepper';
import PatternDetails from './createBlueprintSteps/PatternDetails';
import ExtractFields from './createBlueprintSteps/ExtractFields';
import EmailDetails from './createBlueprintSteps/EmailDetails';
import { extractEMLDetails } from '@/app/utils';
import PostalMime from 'postal-mime';
import { Email } from 'postal-mime';

const CreateBlueprint = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const router = useRouter();
  const store = useCreateBlueprintStore();

  const { saveDraft, getParsedDecomposedRegexes, setToExistingBlueprint, reset, compile } = store;

  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [revealPrivateFields, setRevealPrivateFields] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState<string>('');
  const steps = ['Pattern Details', 'Email Details', 'Extract Fields'];
  const [step, setStep] = useState(0);
  const [showSampleEMLPreview, setShowSampleEMLPreview] = useState(false);
  const [parsedEmail, setParsedEmail] = useState<Email | null>(null);
  const [isDKIMMissing, setIsDKIMMissing] = useState(false);

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
    reset();
    if (id !== 'new') {
      setToExistingBlueprint(id);
    }
  }, [id]);

  const handleSaveDraft = async () => {
    try {
      const newId = await saveDraft();
      setErrors([]);
      console.log('successfully saved blueprint');
      if (newId !== id) {
        router.push(`/create/${newId}`);
        toast.success('Successfully saved draft');
      }
    } catch (err) {
      console.log('Failed to submit blueprint', err);
      // TODO: Handle different kind of errors, e.g. per field errors
      toast.error('Failed to submit blueprint');
      setErrors(['Unknown error while submitting blueprint']);
    }
  };

  const handleTestEmail = async () => {
    if (!file) {
      console.error('Add email first');
      return;
    }

    let content: string;
    try {
      content = await getFileContent(file);
      console.log('content', content);
      const { senderDomain, emailQuery } = extractEMLDetails(content);
      store.setField('senderDomain', senderDomain);
      // store.setField('emailHeaderMaxLength', (Math.ceil(headerLength / 64) + 2) * 64);
      store.setField('emailQuery', emailQuery);
    } catch (err) {
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
      setErrors(['Failed to test decomposed regex on eml']);
      console.error('Failed to test decomposed regex on eml: ', err);
    }
  };

  useEffect(() => {
    if (file) {
      handleTestEmail();
    }
  }, [file, revealPrivateFields]);

  useEffect(() => {
    fetch(`https://archive.prove.email/api/key?domain=${store.senderDomain}`)
      .then((res) => res.json())
      .then((data) => {
        setIsDKIMMissing(!data.length);
      });
  }, [store.senderDomain]);

  return (
    <div className="my-16 flex flex-col gap-6 rounded-3xl border border-grey-500 bg-white p-6 shadow-[2px_4px_2px_0px_rgba(0,0,0,0.02),_2px_3px_4.5px_0px_rgba(0,0,0,0.07)]">
      <h4 className="text-lg font-bold text-grey-800">Submit Blueprint</h4>
      <div className="flex flex-col items-center gap-6 md:hidden">
        <StepperMobile steps={steps} currentStep={step.toString()} />
      </div>
      {/* desktop stepper */}
      <div className="hidden flex-col items-center gap-6 md:flex">
        <Stepper steps={steps} currentStep={step.toString()} />
        <div
          style={{
            width: '100%',
            height: '2px',
            marginTop: '24px',
            backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%23E2E2E2FF' stroke-width='4' stroke-dasharray='6%2c 14' stroke-dashoffset='2' stroke-linecap='square'/%3e%3c/svg%3e")`,
          }}
        />
      </div>
      {step !== 0 && (
        <div className="flex w-auto">
          <Button
            variant="ghost"
            startIcon={<Image src="/assets/ArrowLeft.svg" alt="back" width={16} height={16} />}
            onClick={() => {
              const newStep = step - 1;
              if (steps.length === 3 && newStep === 2) {
                setStep(1);
              } else {
                setStep((newStep + steps.length) % steps.length);
              }
            }}
          >
            {steps[step - 1]}
          </Button>
        </div>
      )}
      {step === 0 && <PatternDetails id={id} file={file} setFile={setFile} />}
      {step === 1 && <EmailDetails isDKIMMissing={isDKIMMissing} />}
      {step === 2 && <ExtractFields file={file} />}
      <div
        style={{
          width: '100%',
          height: '2px',
          marginTop: '24px',
          backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%23E2E2E2FF' stroke-width='4' stroke-dasharray='6%2c 14' stroke-dashoffset='2' stroke-linecap='square'/%3e%3c/svg%3e")`,
        }}
      />
      <div>
        {showSampleEMLPreview && parsedEmail && (
          <div
            className="m-6"
            dangerouslySetInnerHTML={{
              __html: parsedEmail?.html!,
            }}
          />
        )}
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
              disabled={!store.circuitName || !store.title}
              startIcon={<Image src="/assets/Archive.svg" alt="save" width={16} height={16} />}
            >
              Save as Draft
            </Button>
            {step < 2 ? (
              <Button
                onClick={() => setStep(step + 1)}
                endIcon={
                  <Image src="/assets/ArrowRight.svg" alt="arrow right" width={16} height={16} />
                }
                disabled={!file}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={compile}
                disabled={!file || !!errors.length || generatedOutput.length === 0 || isDKIMMissing}
                startIcon={<Image src="/assets/Check.svg" alt="check" width={16} height={16} />}
              >
                Submit Blueprint
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBlueprint;
