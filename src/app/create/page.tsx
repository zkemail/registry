'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useCreateBlueprintStore } from '@/lib/stores/useCreateBlueprintStore';

import DragAndDropFile from '../components/DragAndDropFile';
import { useState } from 'react';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { DecomposedRegex, ExternalInput } from '@dimidumo/zk-email-sdk-ts';
import { Textarea } from '@/components/ui/textarea';

const CreateBlueprint = () => {
  const store = useCreateBlueprintStore();
  const { setField } = store;
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="my-16 flex flex-col mx-4 gap-6 rounded-3xl border border-grey-500 bg-white p-6 shadow-[2px_4px_2px_0px_rgba(0,0,0,0.02),_2px_3px_4.5px_0px_rgba(0,0,0,0.07)]">
      <div>
        <h4 className="text-xl font-bold text-grey-900">Submit Blueprint</h4>
        <p className="text-base font-medium text-grey-700">
          Create, compile and share blueprints easily by filling the following details
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <Input
          title="Pattern Name"
          value={store.title}
          onChange={(e) => setField('title', e.target.value)}
        />
        <Input
          title="Slug"
          disabled
          value={store.slug}
          onChange={(e) => setField('slug', e.target.value)}
        />
        <DragAndDropFile
          accept=".eml"
          title="Upload test .eml"
          helpText="Our AI will autofill fields based on contents inside your mail. Don't worry you can edit them later"
          setFile={setFile}
        />
        <Textarea
          title="Description"
          value={store.description}
          onChange={(e) => setField('description', e.target.value)}
        />
        <Input
          title="Email Query"
          value={store.emailQuery}
          onChange={(e) => setField('emailQuery', e.target.value)}
          placeholder="Password request from: contact@x.com"
          helpText="As if you were searching for the email in your Gmail inbox. Only emails matching this query will be shown to the user to prove when they sign in with Gmail"
        />
        <Input
          title="Circuit Name"
          placeholder="e.g CircuitName (without the .circom extension)"
          value={store.circuitName}
          onChange={(e) => setField('circuitName', e.target.value)}
        />
        <Checkbox
          title="Skip body hash check"
          helpText="Enable to ignore the contents on the email and only extract data from the headers"
          checked={store.ignoreBodyHashCheck}
          onCheckedChange={(checked) => setField('ignoreBodyHashCheck', checked)}
        />
        <Checkbox
          title="Enable email masking"
          helpText="Enable and send a mask to return a masked email in the public output. We recommend to disable this for most patterns"
          checked={store.enableBodyMasking}
          onCheckedChange={(checked) => setField('enableBodyMasking', checked)}
        />
        <Input
          title="Sender domain"
          placeholder="twitter.com"
          helpText="This is the domain used for DKIM verification, which may not exactly match the senders domain (you can check via the d= field in the DKIM-Signature header). Note to only include the part after the @ symbol"
          value={store.senderDomain}
          onChange={(e) => setField('senderDomain', e.target.value)}
        />
        <Input
          title="Email Body Cutoff Value (optional)"
          placeholder="1000"
          type="number"
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
          onChange={(e) => setField('emailHeaderMaxLength', e.target.value)}
        />
        <Input
          title="Max Email Body Length"
          placeholder="4032"
          type="number"
          helpText="Must be a multiple of 64. If you have a Email Body Cutoff Value, it should be the length of the body after that value"
          value={store.emailBodyMaxLength}
          onChange={(e) => setField('emailBodyMaxLength', e.target.value)}
        />
        <Checkbox title="Use new ZK Regex SDK for circuit generation (Recommended)" />

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
            <div key={index} className="flex flex-col gap-3">
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

              <Textarea
                title="Parts JSON"
                placeholder="[]"
                value={regex.parts?.map((part) => part.regexDef)?.join('\n')}
                onChange={(e) => {
                  const updatedRegexes = [...store.decomposedRegexes];
                  updatedRegexes[index] = {
                    ...regex,
                    parts: e.target.value
                      .split('\n')
                      .map((part) => ({ regexDef: part, isPublic: true })),
                  };
                  setField('decomposedRegexes', updatedRegexes);
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
            <div key={index} className="flex flex-col gap-3">
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

        <div className="flex items-center gap-2 text-green-300">
          <Image src="/assets/CheckCircle.svg" alt="check" width={20} height={20} />
          <span className="text-base font-medium">All test passed. Ready to compile</span>
        </div>

        <div className="flex justify-center">
          <Button>Submit Blueprint</Button>
        </div>
      </div>
    </div>
  );
};

export default CreateBlueprint;
