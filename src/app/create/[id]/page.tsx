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

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useCreateBlueprintStore } from './store';

import DragAndDropFile from '@/app/components/DragAndDropFile';
import { use, useEffect, useState } from 'react';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  DecomposedRegex,
  DecomposedRegexPart,
  ExternalInput,
  testDecomposedRegex,
} from '@zk-email/sdk';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useRouter } from 'next/navigation';
import { getFileContent } from '@/lib/utils';
import { toast } from 'react-toastify';
import { Switch } from '@/components/ui/switch';

const CreateBlueprint = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const router = useRouter();
  const githubUserName = useAuthStore((state) => state.username);
  const store = useCreateBlueprintStore();
  const {
    setField,
    saveDraft,
    getParsedDecomposedRegexes,
    setToExistingBlueprint,
    decomposedRegexes,
    reset,
  } = store;
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  // TODO: Add a checkbox in UI. This will reveal the isPublic: false fields if set to true
  const [revealPrivateFields, setRevealPrivateFields] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState<string>('');
  const [aiPrompt, setAiPrompt] = useState<string>('');

  // Load data if an id is provided
  useEffect(() => {
    if (id !== 'new') {
      setToExistingBlueprint(id);
    }

    return () => {
      reset();
    };
  }, [id]);

  const handleSaveDraft = async () => {
    try {
      const newId = await saveDraft();
      setErrors([]);
      console.log('successfully saved blueprint');
      if (newId !== id) {
        router.push(`/create/${id}`);
      }
    } catch (err) {
      console.log('Failed to submit blueprint');
      // TODO: Handle different kind of errors, e.g. per field errors
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
    } catch (err) {
      console.error('Failed to get content from email');
      return;
    }

    try {
      const parsed = getParsedDecomposedRegexes();
      console.log('parsed: ', parsed);
      const output = await Promise.all(
        parsed.map((dcr: DecomposedRegex) => testDecomposedRegex(content, dcr, revealPrivateFields))
      );
      // Create array of name-value pairs
      const mappedOutput = parsed
        .map((dcr: DecomposedRegex, index: number) => ({
          name: dcr.name,
          value: output[index],
        }))
        .filter((item: { value: string }) => item.value.length > 0); // Filter out items with no value
      // Format output as "name: value" pairs
      const formattedOutput = mappedOutput
        .map((item: { name: string; value: string }) => `${item.name}: ${item.value}`)
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

  // TODO: Handle local decomposed regex checks
  const Status = () => {
    if (errors.length) {
      return errors.map((error) => (
        <div key={error} className="flex items-center gap-2 text-red-400">
          <Image src="/assets/WarningCircle.svg" alt="fail" width={20} height={20} />
          <span className="text-base font-medium">{error}</span>
        </div>
      ));
    } else {
      return (
        <div className="flex items-center gap-2 text-green-300">
          <Image src="/assets/CheckCircle.svg" alt="check" width={20} height={20} />
          <span className="text-base font-medium">All test passed. Ready to compile</span>
        </div>
      );
    }
  };

  const handleGenerateFields = async () => {
    if (!file || !aiPrompt) {
      toast.error('Please provide both an email file and extraction goals');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('emlFile', file);
      formData.append('extractionGoals', aiPrompt);

      const response = await fetch('/api/generateBlueprintFields', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate fields');
      }

      const data = await response.json();

      // Convert the API response format to match your store's format
      const convertedRegexes = data.map((item: any) => ({
        name: item.name,
        location: item.location === 'body' ? 'body' : 'header',
        parts: JSON.stringify(item.parts, null, 2),
      }));

      setField('decomposedRegexes', convertedRegexes);
      toast.success('Successfully generated fields');
    } catch (error) {
      console.error('Error generating fields:', error);
      toast.error('Failed to generate fields');
    }
  };

  return (
    <div className="mx-4 my-16 flex flex-col gap-6 rounded-3xl border border-grey-500 bg-white p-6 shadow-[2px_4px_2px_0px_rgba(0,0,0,0.02),_2px_3px_4.5px_0px_rgba(0,0,0,0.07)]">
      <div>
        <h4 className="text-xl font-bold text-grey-900">Submit Blueprint</h4>
        <p className="text-base font-medium text-grey-700">
          Create, compile and share blueprints easily by filling the following details
        </p>
      </div>
      {!githubUserName ? (
        <div>Please login first to create a new blueprint.</div>
      ) : (
        <div className="flex flex-col gap-6">
          <Input
            title="Pattern Name"
            disabled={id !== 'new'}
            value={store.title}
            onChange={(e) => setField('title', e.target.value)}
          />
          <Input
            title="Circuit Name"
            disabled={id !== 'new'}
            placeholder="e.g CircuitName (without the .circom extension)"
            value={store.circuitName}
            onChange={(e) => setField('circuitName', e.target.value)}
          />
          <Input title="Slug" disabled value={`${githubUserName}/${store.circuitName}`} />
          <DragAndDropFile
            accept=".eml"
            title="Upload test .eml"
            helpText="Our AI will autofill fields based on contents inside your mail. Don't worry you can edit them later"
            setFile={(e) => {
              console.log('setting the file');
              setFile(e);
            }}
          />
          <Textarea
            title="Description"
            value={store.description}
            rows={3}
            onChange={(e) => setField('description', e.target.value)}
          />
          <Input
            title="Email Query"
            value={store.emailQuery}
            onChange={(e) => setField('emailQuery', e.target.value)}
            placeholder="Password request from: contact@x.com"
            helpText="As if you were searching for the email in your Gmail inbox. Only emails matching this query will be shown to the user to prove when they sign in with Gmail"
          />
          <Checkbox
            title="Skip body hash check"
            helpText="Enable to ignore the contents on the email and only extract data from the headers"
            checked={store.ignoreBodyHashCheck}
            onCheckedChange={(checked) => setField('ignoreBodyHashCheck', checked)}
          />
          {/* <Checkbox
            title="Enable email masking"
            helpText="Enable and send a mask to return a masked email in the public output. We recommend to disable this for most patterns"
            checked={store.enableBodyMasking}
            onCheckedChange={(checked) => setField('enableBodyMasking', checked)}
          /> */}
          <Input
            title="Sender domain"
            placeholder="twitter.com"
            helpText="This is the domain used for DKIM verification, which may not exactly match the senders domain (you can check via the d= field in the DKIM-Signature header). Note to only include the part after the @ symbol"
            value={store.senderDomain}
            onChange={(e) => setField('senderDomain', e.target.value)}
          />
          <Input
            title="Email Body Cutoff Value (optional)"
            placeholder=">Not my Account<"
            type="text"
            disabled={store.ignoreBodyHashCheck}
            helpText="We will cut-off the part of the email body before this value, so that we only compute the regex on the email body after this value. This is to reduce the number of constraints in the circuit for long email bodies where only regex matches at the end matter"
            value={store.shaPrecomputeSelector}
            onChange={(e) => setField('shaPrecomputeSelector', e.target.value)}
          />
          <Input
            title="Max Email Header Length"
            placeholder="1024"
            type="number"
            helpText="Must be a multiple of 64"
            value={store.emailHeaderMaxLength}
            onChange={(e) => setField('emailHeaderMaxLength', parseInt(e.target.value))}
          />
          <Input
            title="Max Email Body Length"
            disabled={store.ignoreBodyHashCheck}
            placeholder="4032"
            type="number"
            helpText="Must be a multiple of 64. If you have a Email Body Cutoff Value, it should be the length of the body after that value"
            value={store.emailBodyMaxLength}
            onChange={(e) => setField('emailBodyMaxLength', parseInt(e.target.value))}
          />

          <Label>AI auto extraction</Label>
          <div className="rounded-lg border border-[#EDCEF8] p-3 shadow-[0px_0px_10px_0px_#EDCEF8]">
            <div className="flex items-center justify-between">
              <span className="w-full text-base font-medium">
                <Input
                  className="w-full border-0 hover:border-0 focus:border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Use our AI to magically extract the fields you want"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
              </span>
              <Button
                className="rounded-lg border-[#EDCEF8] bg-[#FCF3FF] text-sm text-[#9B23C5]"
                variant="secondary"
                size="sm"
                startIcon={<Image src="/assets/Sparkle.svg" alt="sparkle" width={16} height={16} />}
                onClick={handleGenerateFields}
              >
                Generate Fields
              </Button>
            </div>
          </div>

          {/* Decomposed Regexes */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>Fields to extract</Label>
              <Button
                variant="default"
                startIcon={<Image src="/assets/Plus.svg" alt="plus" width={16} height={16} />}
                onClick={() => {
                  setField('decomposedRegexes', [...store.decomposedRegexes, {}]);
                }}
              >
                Add values to extract
              </Button>
            </div>

            {store.decomposedRegexes.map((regex: DecomposedRegex, index: number) => (
              <div key={index} className="flex flex-col gap-3 pl-2">
                <div className="flex items-center justify-between">
                  <Label>Field #{(index + 1).toString().padStart(2, '0')}</Label>
                  <Button
                    variant="secondary"
                    startIcon={<Image src="/assets/Trash.svg" alt="trash" width={16} height={16} />}
                    onClick={() => {
                      const updatedRegexes = [...store.decomposedRegexes];
                      updatedRegexes.splice(index, 1);
                      setField('decomposedRegexes', updatedRegexes);
                    }}
                  >
                    Delete
                  </Button>
                </div>
                <Input
                  title="Field Name"
                  placeholder="receiverName"
                  value={regex.name}
                  onChange={(e) => {
                    const updatedRegexes = [...store.decomposedRegexes];
                    updatedRegexes[index] = { ...regex, name: e.target.value };
                    setField('decomposedRegexes', updatedRegexes);
                  }}
                />
                <Select
                  label="Data Location"
                  value={regex.location}
                  onChange={(value: string) => {
                    const updatedRegexes = [...store.decomposedRegexes];
                    updatedRegexes[index] = { ...regex, location: value as 'body' | 'header' };
                    setField('decomposedRegexes', updatedRegexes);
                  }}
                  options={[
                    { label: 'Email Body', value: 'body' },
                    { label: 'Email Headers', value: 'header' },
                  ]}
                />
                <Input
                  title="Max Length"
                  placeholder="64"
                  type="number"
                  value={regex.maxLength}
                  onChange={(e) => {
                    const updatedRegexes = [...store.decomposedRegexes];
                    updatedRegexes[index] = { ...regex, maxLength: parseInt(e.target.value) };
                    setField('decomposedRegexes', updatedRegexes);
                  }}
                />

                <Textarea
                  title="Parts JSON"
                  rows={3}
                  placeholder="[]"
                  value={regex.parts as unknown as string}
                  onChange={(e) => {
                    const updatedRegexes = [...store.decomposedRegexes];
                    updatedRegexes[index] = {
                      ...regex,
                      parts: e.target.value as unknown as DecomposedRegexPart[],
                    };
                    setField('decomposedRegexes', updatedRegexes);

                    handleTestEmail();
                  }}
                />
              </div>
            ))}
          </div>

          {/* External Inputs */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>External Inputs</Label>
              <Button
                variant="default"
                startIcon={<Image src="/assets/Plus.svg" alt="plus" width={16} height={16} />}
                onClick={() => {
                  const updatedInputs = store.externalInputs ? [...store.externalInputs, {}] : [{}];
                  setField('externalInputs', updatedInputs);
                }}
              >
                Add values to extract
              </Button>
            </div>
            {store.externalInputs?.map((input: ExternalInput, index: number) => (
              <div key={index} className="flex flex-col gap-3 pl-2">
                <div className="flex items-center justify-between">
                  <Label>Field #{(index + 1).toString().padStart(2, '0')}</Label>
                  <Button
                    variant="secondary"
                    startIcon={<Image src="/assets/Trash.svg" alt="trash" width={16} height={16} />}
                    onClick={() => {
                      const updatedInputs = store.externalInputs ? [...store.externalInputs] : [];
                      updatedInputs.splice(index, 1);
                      setField('externalInputs', updatedInputs);
                    }}
                  >
                    Delete
                  </Button>
                </div>
                <Input
                  title="Field Name"
                  placeholder="receiverName"
                  value={input.name}
                  onChange={(e) => {
                    const updatedInputs = store.externalInputs ? [...store.externalInputs] : [];
                    updatedInputs[index] = { ...input, name: e.target.value };
                    setField('externalInputs', updatedInputs);
                  }}
                />
                <Input
                  title="Max Length of Input"
                  type="number"
                  placeholder="64"
                  value={input.maxLength}
                  onChange={(e) => {
                    const updatedInputs = store.externalInputs ? [...store.externalInputs] : [];
                    updatedInputs[index] = { ...input, maxLength: parseInt(e.target.value) };
                    setField('externalInputs', updatedInputs);
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Generated output</Label>
              <div className="flex items-center gap-2">
                <Switch
                  title="Private output"
                  checked={revealPrivateFields}
                  onCheckedChange={(checked) => setRevealPrivateFields(checked)}
                />
                <Label>Private output</Label>
              </div>
            </div>
            <Textarea
              disabled
              rows={3}
              className="border-grey-500 bg-neutral-100"
              value={generatedOutput}
            />
          </div>

          <Status />

          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              startIcon={<Image src="/assets/Archive.svg" alt="save" width={16} height={16} />}
            >
              Save as Draft
            </Button>
            <Button
              onClick={handleSaveDraft}
              disabled={!file || !!errors.length || generatedOutput.length === 0}
              startIcon={<Image src="/assets/Check.svg" alt="check" width={16} height={16} />}
            >
              Submit Blueprint
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateBlueprint;
