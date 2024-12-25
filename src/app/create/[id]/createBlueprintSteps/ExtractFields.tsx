'use client';

import { Input } from '@/components/ui/input';
import { useCreateBlueprintStore } from '../store';
import { useEffect, useState } from 'react';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Image from "next/image";
import { DecomposedRegex, DecomposedRegexPart, ExternalInput, testBlueprint } from '@zk-email/sdk';
import { Textarea } from '@/components/ui/textarea';
import { getFileContent } from '@/lib/utils';
import { toast } from 'react-toastify';
import { Switch } from '@/components/ui/switch';

const ExtractFields = ({ file }: { file: File | null }) => {
  const store = useCreateBlueprintStore();

  const { setField, getParsedDecomposedRegexes } = store;

  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isGeneratingFieldsLoading, setIsGeneratingFieldsLoading] = useState(false);
  const [revealPrivateFields, setRevealPrivateFields] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (file && store?.decomposedRegexes?.length > 0) {
      handleTestEmail();
    }
  }, [file, store.decomposedRegexes, store.externalInputs]);

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
      setGeneratedOutput('');
      console.error('Failed to test decomposed regex on eml: ', err);
    }
  };

  const handleGenerateFields = async () => {
    setIsGeneratingFieldsLoading(true);
    if (!file || !aiPrompt) {
      toast.error('Please provide both an email file and extraction goals');
      setIsGeneratingFieldsLoading(false);
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
    } finally {
      setIsGeneratingFieldsLoading(false);
      handleTestEmail();
    }
  };

  const Status = () => {
    if (errors.length || !file) {
      return errors.map((error) => (
        <div key={error} className="flex items-center gap-2 text-red-400">
          <Image
            src="/assets/WarningCircle.svg"
            alt="fail"
            width={20}
            height={20}
            style={{
              maxWidth: "100%",
              height: "auto"
            }} />
          <span className="text-base font-medium">{error}</span>
        </div>
      ));
    }
    if (!generatedOutput) {
      return errors.map((error) => (
        <div key={error} className="flex items-center gap-2 text-red-400">
          <Image
            src="/assets/WarningCircle.svg"
            alt="fail"
            width={20}
            height={20}
            style={{
              maxWidth: "100%",
              height: "auto"
            }} />
          <span className="text-base font-medium">No generated output</span>
        </div>
      ));
    } else {
      return (
        (<div className="flex items-center gap-2 text-green-300">
          <Image
            src="/assets/CheckCircle.svg"
            alt="check"
            width={20}
            height={20}
            style={{
              maxWidth: "100%",
              height: "auto"
            }} />
          <span className="text-base font-medium">All tests passed. Ready to compile</span>
        </div>)
      );
    }
  };

  const parseRegexParts = (parts: any): any => {
    if (typeof parts === 'string') {
      try {
        return JSON.parse(parts);
      } catch {
        return [];
      }
    }
    return parts || [];
  };

  return (
    (<div className="flex flex-col gap-6">
      <Label>AI auto extraction</Label>
      <div className="rounded-lg border border-[#EDCEF8] p-3 shadow-[0px_0px_10px_0px_#EDCEF8]">
        <div className="flex items-center justify-between">
          <span className="w-full text-base font-medium">
            <Input
              className="w-full border-0 hover:border-0 focus:border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Use our AI to magically extract the fields you want"
              value={aiPrompt}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleGenerateFields();
                }
              }}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
          </span>
          <Button
            className="rounded-lg border-[#EDCEF8] bg-[#FCF3FF] text-sm text-[#9B23C5]"
            variant="secondary"
            size="sm"
            disabled={!file || aiPrompt.length === 0 || isGeneratingFieldsLoading}
            loading={isGeneratingFieldsLoading}
            startIcon={<Image
              src="/assets/Sparkle.svg"
              alt="sparkle"
              width={16}
              height={16}
              style={{
                maxWidth: "100%",
                height: "auto"
              }} />}
            onClick={handleGenerateFields}
          >
            {isGeneratingFieldsLoading ? 'Generating...' : 'Generate Fields'}
          </Button>
        </div>
      </div>
      {/* Decomposed Regexes */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label>Fields to extract</Label>
          {store?.decomposedRegexes?.length === 0 ? (
            <Button
              variant="default"
              size="sm"
              startIcon={<Image
                src="/assets/Plus.svg"
                alt="plus"
                width={16}
                height={16}
                style={{
                  maxWidth: "100%",
                  height: "auto"
                }} />}
              onClick={() => {
                setField('decomposedRegexes', [
                  ...(store.decomposedRegexes ?? []),
                  { maxLength: 64 },
                ]);
              }}
            >
              Add values to extract
            </Button>
          ) : null}
        </div>

        {store.decomposedRegexes?.map((regex: DecomposedRegex, index: number) => (
          <div key={index} className="flex flex-col gap-3 pl-2">
            <div className="flex items-center justify-between">
              <Label>Input field #{(index + 1).toString().padStart(2, '0')}</Label>
              <Button
                size="sm"
                variant="destructive"
                startIcon={<Image
                  src="/assets/Trash.svg"
                  alt="trash"
                  width={16}
                  height={16}
                  style={{
                    maxWidth: "100%",
                    height: "auto"
                  }} />}
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
            {/* <Textarea
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
                /> */}

            <div className="flex flex-col gap-3">
              {parseRegexParts(regex.parts).map((part: any, partIndex: any) => {
                console.log(part);
                return (
                  (<div key={partIndex} className="flex flex-col gap-3 rounded-lg py-3">
                    <div className="flex items-center justify-between">
                      <Label>Regex field #{(partIndex + 1).toString().padStart(2, '0')}</Label>
                      <Button
                        variant="destructive"
                        size="sm"
                        startIcon={
                          <Image
                            src="/assets/Trash.svg"
                            alt="trash"
                            width={16}
                            height={16}
                            style={{
                              maxWidth: "100%",
                              height: "auto"
                            }} />
                        }
                        onClick={() => {
                          const parts = parseRegexParts(regex.parts);
                          parts.splice(partIndex, 1);
                          const updatedRegexes = [...store.decomposedRegexes];
                          updatedRegexes[index] = {
                            ...regex,
                            // @ts-ignore
                            parts: parts,
                          };
                          setField('decomposedRegexes', updatedRegexes);
                          handleTestEmail();
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                    <div className="ml-3 flex flex-col gap-3">
                      <Label>Public / Private</Label>
                      <Select
                        value={part.isPublic ? 'public' : 'private'}
                        onChange={(value) => {
                          const parts = parseRegexParts(regex.parts);
                          parts[partIndex].isPublic = value === 'public';
                          const updatedRegexes = [...store.decomposedRegexes];
                          updatedRegexes[index] = {
                            ...regex,
                            // @ts-ignore
                            parts: parts,
                          };
                          setField('decomposedRegexes', updatedRegexes);
                          handleTestEmail();
                        }}
                        options={[
                          { label: 'Public', value: 'public' },
                          { label: 'Private', value: 'private' },
                        ]}
                      />
                    </div>
                    <div className="ml-3 flex flex-col gap-3">
                      <Label>Regex Definition</Label>
                      <Input
                        value={part.regexDef}
                        onChange={(e) => {
                          const parts = parseRegexParts(regex.parts);
                          parts[partIndex].regexDef = e.target.value;
                          const updatedRegexes = [...store.decomposedRegexes];
                          updatedRegexes[index] = {
                            ...regex,
                            // @ts-ignore
                            parts: parts,
                          };
                          setField('decomposedRegexes', updatedRegexes);
                          handleTestEmail();
                        }}
                        placeholder="Enter regex definition"
                      />
                    </div>
                  </div>)
                );
              })}
              <div className="flex items-center justify-between">
                <p className="text-gray-700">Add more regex fields?</p>
                <Button
                  variant="default"
                  size="sm"
                  startIcon={<Image
                    src="/assets/Plus.svg"
                    alt="plus"
                    width={16}
                    height={16}
                    style={{
                      maxWidth: "100%",
                      height: "auto"
                    }} />}
                  onClick={() => {
                    const parts = parseRegexParts(regex.parts);
                    parts.push({
                      isPublic: false,
                      regexDef: '',
                    });
                    const updatedRegexes = [...store.decomposedRegexes];
                    updatedRegexes[index] = {
                      ...regex,
                      // @ts-ignore
                      parts: parts,
                    };
                    setField('decomposedRegexes', updatedRegexes);
                  }}
                >
                  Add Regex Part
                </Button>
              </div>
            </div>
          </div>
        ))}
        {store?.decomposedRegexes?.length !== 0 ? (
          <div className="flex items-center justify-between pt-3">
            <p className="text-gray-700">Need more fields for manual extraction?</p>
            <Button
              variant="default"
              size="sm"
              startIcon={<Image
                src="/assets/Plus.svg"
                alt="plus"
                width={16}
                height={16}
                style={{
                  maxWidth: "100%",
                  height: "auto"
                }} />}
              onClick={() => {
                setField('decomposedRegexes', [
                  ...(store.decomposedRegexes ?? []),
                  { maxLength: 64 },
                ]);
              }}
            >
              Add values to extract
            </Button>
          </div>
        ) : null}
      </div>
      {/* External Inputs */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label>External Inputs</Label>
          {store.externalInputs?.length === 0 ? (
            <Button
              variant="default"
              size="sm"
              startIcon={<Image
                src="/assets/Plus.svg"
                alt="plus"
                width={16}
                height={16}
                style={{
                  maxWidth: "100%",
                  height: "auto"
                }} />}
              onClick={() => {
                const updatedInputs = store.externalInputs
                  ? [...store.externalInputs, { maxLength: 64 }]
                  : [{ maxLength: 64 }];
                setField('externalInputs', updatedInputs);
              }}
            >
              Add values to extract
            </Button>
          ) : null}
        </div>
        {store.externalInputs?.map((input: ExternalInput, index: number) => (
          <div key={index} className="flex flex-col gap-3 pl-2">
            <div className="flex items-center justify-between">
              <Label>Input field #{(index + 1).toString().padStart(2, '0')}</Label>
              <Button
                variant="destructive"
                size="sm"
                startIcon={<Image
                  src="/assets/Trash.svg"
                  alt="trash"
                  width={16}
                  height={16}
                  style={{
                    maxWidth: "100%",
                    height: "auto"
                  }} />}
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
        {store.externalInputs?.length !== 0 ? (
          <div className="flex items-center justify-between pt-3">
            <p className="text-gray-700">Need more external fields?</p>
            <Button
              variant="default"
              size="sm"
              startIcon={<Image
                src="/assets/Plus.svg"
                alt="plus"
                width={16}
                height={16}
                style={{
                  maxWidth: "100%",
                  height: "auto"
                }} />}
              onClick={() => {
                const updatedInputs = store.externalInputs ? [...store.externalInputs, {}] : [{}];
                setField('externalInputs', updatedInputs);
              }}
            >
              Add values to extract
            </Button>
          </div>
        ) : null}
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
    </div>)
  );
};

export default ExtractFields;
