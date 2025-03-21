'use client';

import { Input } from '@/components/ui/input';
import { useCreateBlueprintStore } from '../store';
import { useEffect, useState } from 'react';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { DecomposedRegex, ExternalInput, parseEmail, testDecomposedRegex } from '@zk-email/sdk';
import { toast } from 'react-toastify';
import { posthog } from 'posthog-js';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { REGEX_COLORS } from '@/app/constants';
import { Checkbox } from '@/components/ui/checkbox';

const AIPromptInput = ({
  aiPrompt,
  setAiPrompt,
  handleGenerateFields,
  emlContent,
  isGeneratingFieldsLoading,
}: {
  aiPrompt: string;
  setAiPrompt: (aiPrompt: string) => void;
  handleGenerateFields: () => void;
  emlContent: string;
  isGeneratingFieldsLoading: boolean;
}) => {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const placeholders = [
    'Regex to extract email subject',
    'Regex to extract GitHub username',
    'Regex to extract Venmo ID',
    'Regex to extract time sent',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prevIndex) => (prevIndex + 1) % placeholders.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-lg border border-[#EDCEF8] p-3 pl-0 shadow-[0px_0px_10px_0px_#EDCEF8]">
        <div className="flex items-center justify-between">
          <span className="w-full text-base font-medium">
            <Input
              className="w-full border-0 hover:border-0 focus:border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder={placeholders[placeholderIndex]}
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
            disabled={!emlContent || isGeneratingFieldsLoading}
            loading={isGeneratingFieldsLoading}
            startIcon={
              <Image
                src="/assets/Sparkle.svg"
                alt="sparkle"
                width={16}
                height={16}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
            }
            onClick={handleGenerateFields}
          >
            {isGeneratingFieldsLoading ? 'Generating...' : 'Generate'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const ExtractFields = ({
  emlContent,
  optOut,
  setCanCompile,
}: {
  emlContent: string;
  optOut: boolean;
  setCanCompile: (canCompile: boolean) => void;
}) => {
  const store = useCreateBlueprintStore();

  const { setField, getParsedDecomposedRegexes } = store;

  const [isGeneratingFieldsLoading, setIsGeneratingFieldsLoading] = useState<boolean[]>(
    Array(store.decomposedRegexes?.length ?? 0).fill(false)
  );
  const [revealPrivateFields, setRevealPrivateFields] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [aiPrompts, setAiPrompts] = useState<string[]>(
    Array(store.decomposedRegexes?.length ?? 0).fill('')
  );
  const [regexGeneratedOutputs, setRegexGeneratedOutputs] = useState<string[]>(
    Array(store.decomposedRegexes?.length ?? 0).fill('')
  );
  const [regexGeneratedOutputErrors, setRegexGeneratedOutputErrors] = useState<string[]>(
    Array(store.decomposedRegexes?.length ?? 0).fill('')
  );

  const [isExtractSubjectChecked, setIsExtractSubjectChecked] = useState(false);
  const [isExtractReceiverChecked, setIsExtractReceiverChecked] = useState(false);
  const [isExtractSenderNameChecked, setIsExtractSenderNameChecked] = useState(false);
  const [isExtractSenderDomainChecked, setIsExtractSenderDomainChecked] = useState(false);
  const [isExtractTimestampChecked, setIsExtractTimestampChecked] = useState(false);

  const [isGeneratingFields, setIsGeneratingFields] = useState(false);

  useEffect(() => {
    const generateRegexOutputs = async () => {
      setIsGeneratingFields(true);
      if (!emlContent || !store.decomposedRegexes?.length) {
        setIsGeneratingFields(false);
        return;
      }

      const parsedEmail = await parseEmail(emlContent);
      const body = parsedEmail.cleanedBody;
      const header = parsedEmail.canonicalizedHeader;

      await Promise.all(
        store.decomposedRegexes?.map(async (regex: DecomposedRegex, index: number) => {
          try {
            const parsedRegex = Array.isArray(regex.parts)
              ? regex
              : { ...regex, parts: JSON.parse(regex.parts) };

            const regexOutputs = await testDecomposedRegex(
              body,
              header,
              parsedRegex,
              revealPrivateFields
            );

            const outputUpdated =
              JSON.stringify(regexOutputs) !== JSON.stringify(regexGeneratedOutputs[index]);

            setRegexGeneratedOutputs((prev) => {
              const updated = [...prev];
              // @ts-ignore
              updated[index] = regexOutputs;
              return updated;
            });

            setRegexGeneratedOutputErrors((prev) => {
              const updated = [...prev];
              // @ts-ignore
              updated[index] = '';
              return updated;
            });

            // update the max length of the regex at that particular index
            // Only update when the output changes, so we can still set maxLength
            if (outputUpdated) {
              const totalLength = regexOutputs.reduce((acc, cur) => (acc += cur.length), 0);
              const decomposedRegexes = [...store.decomposedRegexes];
              decomposedRegexes[index].maxLength = totalLength ?? 64;
              setField('decomposedRegexes', decomposedRegexes);
            }
          } catch (error) {
            console.error('Error testing decomposed regex:', error);
            setRegexGeneratedOutputErrors((prev) => {
              const updated = [...prev];
              // @ts-ignore
              updated[index] = 'Error: ' + error;
              return updated;
            });
          }
        })
      );

      setIsGeneratingFields(false);
    };

    generateRegexOutputs().finally(() => {
      setIsGeneratingFields(false);
    });
  }, [emlContent, JSON.stringify(store.decomposedRegexes)]);

  const handleGenerateFields = async (index: number) => {
    const updatedIsGeneratingFieldsLoading = [...isGeneratingFieldsLoading];
    updatedIsGeneratingFieldsLoading[index] = true;
    setIsGeneratingFieldsLoading(updatedIsGeneratingFieldsLoading);
    if (!emlContent || !aiPrompts[index]) {
      toast.error('Please provide both an email file and extraction goals');
      updatedIsGeneratingFieldsLoading[index] = false;
      setIsGeneratingFieldsLoading(updatedIsGeneratingFieldsLoading);
      return;
    }

    if (!optOut) {
      posthog.capture('$generate_fields_using_ai', { aiPrompt: aiPrompts[index] });
    }
    try {
      const formData = new FormData();
      formData.append('emlFile', emlContent);
      formData.append('extractionGoals', aiPrompts[index]);

      const response = await fetch('/api/generateBlueprintFields', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate fields');
      }

      const data = await response.json();

      const updatedRegexes = [...store.decomposedRegexes];
      updatedRegexes[index] = {
        name: data[0].name,
        location: data[0].location === 'body' ? 'body' : 'header',
        parts: data[0].parts,
        maxLength: 64,
      };

      setField('decomposedRegexes', updatedRegexes);
      if (!optOut) {
        posthog.capture('$generate_fields_using_ai_success', {
          aiPrompt: aiPrompts[index],
          convertedRegexes: data,
        });
      }
      toast.success('Successfully generated fields');
    } catch (error) {
      console.error('Error generating fields:', error);
      if (!optOut) {
        posthog.capture('$generate_fields_using_ai_error', { aiPrompt: aiPrompts[index] });
      }
      toast.error('Failed to generate fields');
    } finally {
      updatedIsGeneratingFieldsLoading[index] = false;
      setIsGeneratingFieldsLoading(updatedIsGeneratingFieldsLoading);
      // handleTestEmail();
    }
  };

  const Status = () => {
    if (errors.length || !emlContent) {
      setCanCompile(false);
      return errors.map((error) => (
        <div key={error} className="flex items-center gap-2 text-red-400">
          <Image
            src="/assets/WarningCircle.svg"
            alt="fail"
            width={20}
            height={20}
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
          />
          <span className="text-base font-medium">{error}</span>
        </div>
      ));
    }
    if (isGeneratingFields) {
      setCanCompile(false);
      return (
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          <span className="text-base font-medium">Generating fields...</span>
        </div>
      );
    }
    if (!regexGeneratedOutputs.length) {
      setCanCompile(false);
      return (
        <div className="flex items-center gap-2 text-red-400">
          <Image
            src="/assets/WarningCircle.svg"
            alt="fail"
            width={20}
            height={20}
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
          />
          <span className="text-base font-medium">Please add atleast one regex</span>
        </div>
      );
    }
    if (
      !regexGeneratedOutputs.length ||
      regexGeneratedOutputs.some((output) =>
        Array.isArray(output) ? output.join('').includes('Error') : output.includes('Error')
      )
    ) {
      setCanCompile(false);
      return (
        <div className="flex items-center gap-2 text-red-400">
          <Image
            src="/assets/WarningCircle.svg"
            alt="fail"
            width={20}
            height={20}
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
          />
          <span className="text-base font-medium">Some regexes failed to generate output</span>
        </div>
      );
    } else {
      console.log('canCompile', regexGeneratedOutputs);
      setCanCompile(true);
      return (
        <div className="flex items-center gap-2 text-green-300">
          <Image
            src="/assets/CheckCircle.svg"
            alt="check"
            width={20}
            height={20}
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
          />
          <span className="text-base font-medium">All tests passed. Ready to compile</span>
        </div>
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
    <div className="flex flex-col gap-6">
      {/* Decomposed Regexes */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center justify-between">
          <div className="mb-4 w-full overflow-hidden rounded-lg border border-gray-200">
            <div className="flex items-center justify-between bg-gray-100 px-4 py-3">
              <div className="flex flex-col gap-1">
                <Label className="font-medium">Quick header extraction</Label>
                <p className="text-sm text-gray-500">
                  We auto-write the regexes for all the checked fields
                </p>
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="flex">
                {/* Left column with 3 options */}
                <div className="flex w-1/2 flex-col gap-2 pr-4">
                  <Checkbox
                    title="Subject"
                    checked={isExtractSubjectChecked}
                    onCheckedChange={(checked: boolean) => {
                      setIsExtractSubjectChecked(checked);
                      if (checked) {
                        const subjectRegex: DecomposedRegex = {
                          name: 'subject',
                          location: 'header',
                          parts: [
                            {
                              isPublic: false,
                              regexDef: '(\r\n|^)subject:',
                            },
                            {
                              isPublic: true,
                              regexDef: '[^\r\n]+',
                            },
                            {
                              isPublic: false,
                              regexDef: '\r\n',
                            },
                          ],
                          maxLength: 64,
                        };
                        setField('decomposedRegexes', [
                          ...(store.decomposedRegexes ?? []),
                          subjectRegex,
                        ]);
                      }
                    }}
                  />
                  <Checkbox
                    title="Receiver"
                    checked={isExtractReceiverChecked}
                    onCheckedChange={(checked: boolean) => {
                      setIsExtractReceiverChecked(checked);
                      if (checked) {
                        const receiverRegex: DecomposedRegex = {
                          name: 'email_recipient',
                          parts: [
                            {
                              isPublic: false,
                              regexDef: '(\r\n|^)to:',
                            },
                            {
                              isPublic: false,
                              regexDef: '([^\r\n]+<)?',
                            },
                            {
                              isPublic: true,
                              regexDef:
                                '[a-zA-Z0-9!#$%&\\*\\+-/=\\\?\\^_`{\\|}~\\.]+@[a-zA-Z0-9_\\\.-]+',
                            },
                            {
                              isPublic: false,
                              regexDef: '>?\r\n',
                            },
                          ],
                          location: 'header',
                          maxLength: 64,
                        };
                        setField('decomposedRegexes', [
                          ...(store.decomposedRegexes ?? []),
                          receiverRegex,
                        ]);
                      }
                    }}
                  />
                  <Checkbox
                    title="Sender name"
                    checked={isExtractSenderNameChecked}
                    onCheckedChange={(checked: boolean) => {
                      setIsExtractSenderNameChecked(checked);
                      if (checked) {
                        const senderNameRegex: DecomposedRegex = {
                          name: 'email_sender',
                          parts: [
                            {
                              isPublic: false,
                              regexDef: '(\r\n|^)from:',
                            },
                            {
                              isPublic: false,
                              regexDef: '([^\r\n]+<)?',
                            },
                            {
                              isPublic: true,
                              regexDef:
                                "[A-Za-z0-9!#$%&'\\*\\+-/=\\?\\^_`{\\|}~\\.]+@[A-Za-z0-9\\.-]+",
                            },
                            {
                              isPublic: false,
                              regexDef: '>?\r\n',
                            },
                          ],
                          location: 'header',
                          maxLength: 64,
                        };
                        setField('decomposedRegexes', [
                          ...(store.decomposedRegexes ?? []),
                          senderNameRegex,
                        ]);
                      }
                    }}
                  />
                </div>

                {/* Right column with 2 options */}
                <div className="flex w-1/2 flex-col gap-2">
                  <Checkbox
                    title="Sender domain"
                    checked={isExtractSenderDomainChecked}
                    onCheckedChange={(checked: boolean) => {
                      setIsExtractSenderDomainChecked(checked);
                      if (checked) {
                        const senderDomainRegex: DecomposedRegex = {
                          name: 'sender_domain',
                          parts: [
                            {
                              isPublic: false,
                              regexDef: '(\r\n|^)from:[^\r\n]*@',
                            },
                            {
                              isPublic: true,
                              regexDef: '[A-Za-z0-9][A-Za-z0-9\\.-]+\\.[A-Za-z]{2,}',
                            },
                            {
                              isPublic: false,
                              regexDef: '[>\r\n]',
                            },
                          ],
                          location: 'header',
                          maxLength: 64,
                        };
                        setField('decomposedRegexes', [
                          ...(store.decomposedRegexes ?? []),
                          senderDomainRegex,
                        ]);
                      }
                    }}
                  />
                  <Checkbox
                    title="Timestamp"
                    checked={isExtractTimestampChecked}
                    onCheckedChange={(checked: boolean) => {
                      setIsExtractTimestampChecked(checked);
                      if (checked) {
                        const timestampRegex: DecomposedRegex = {
                          name: 'email_timestamp',
                          parts: [
                            {
                              isPublic: false,
                              regexDef: '(\r\n|^)dkim-signature:',
                            },
                            {
                              isPublic: false,
                              regexDef: '([a-z]+=[^;]+; )+t=',
                            },
                            {
                              isPublic: true,
                              regexDef: '[0-9]+',
                            },
                            {
                              isPublic: false,
                              regexDef: ';',
                            },
                          ],
                          location: 'header',
                          maxLength: 64,
                        };
                        setField('decomposedRegexes', [
                          ...(store.decomposedRegexes ?? []),
                          timestampRegex,
                        ]);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          {store?.decomposedRegexes?.length === 0 ? (
            <Button
              variant="default"
              size="sm"
              className="ml-auto"
              startIcon={
                <Image
                  src="/assets/Plus.svg"
                  alt="plus"
                  width={16}
                  height={16}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
              }
              onClick={() => {
                if (!optOut) {
                  posthog.capture('$add_values_to_extract_decomposed_regex');
                }
                setField('decomposedRegexes', [
                  ...(store.decomposedRegexes ?? []),
                  { maxLength: 64, location: 'body' },
                ]);
              }}
            >
              Add values to extract
            </Button>
          ) : null}
        </div>

        {store.decomposedRegexes?.map((regex: DecomposedRegex, index: number) => {
          return (
            <div
              key={index}
              className="mb-2 flex flex-col gap-3 overflow-hidden rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between bg-gray-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium">
                    {index + 1}
                  </span>
                  <Label className="font-medium">Extracted data</Label>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  startIcon={
                    <Image
                      src="/assets/Trash.svg"
                      alt="trash"
                      width={16}
                      height={16}
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                      }}
                    />
                  }
                  onClick={() => {
                    const updatedRegexes = [...store.decomposedRegexes];
                    updatedRegexes.splice(index, 1);
                    aiPrompts.splice(index, 1);
                    setField('decomposedRegexes', updatedRegexes);

                    setRegexGeneratedOutputs(regexGeneratedOutputs.filter((_, i) => i !== index));
                    setRegexGeneratedOutputErrors(
                      regexGeneratedOutputErrors.filter((_, i) => i !== index)
                    );
                  }}
                >
                  Delete
                </Button>
              </div>
              <div className="flex flex-col gap-3 px-4 py-3">
                <Input
                  title="Name"
                  placeholder="receiverName"
                  value={regex.name}
                  onChange={(e) => {
                    const updatedRegexes = [...store.decomposedRegexes];
                    updatedRegexes[index] = { ...regex, name: e.target.value };
                    setField('decomposedRegexes', updatedRegexes);
                  }}
                />
                <Select
                  label="Location"
                  value={regex.location}
                  onChange={(value: string) => {
                    const updatedRegexes = [...store.decomposedRegexes];
                    updatedRegexes[index] = { ...regex, location: value as 'body' | 'header' };
                    setField('decomposedRegexes', updatedRegexes);
                  }}
                  options={[
                    { label: 'Email Body', value: 'body' },
                    { label: 'Email Header', value: 'header' },
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
                <Checkbox
                  title="Hash Public Output"
                  checked={regex.isHashed}
                  onCheckedChange={(checked: boolean) => {
                    const updatedRegexes = [...store.decomposedRegexes];
                    updatedRegexes[index] = { ...regex, isHashed: checked };
                    setField('decomposedRegexes', updatedRegexes);
                  }}
                />
              </div>
              <div className="flex flex-col gap-3 rounded-xl border-t border-grey-500 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-base font-medium text-gray-900">Regex Definition</p>
                  <Link
                    href="https://docs.zk.email/zk-email-sdk/regex"
                    className="cursor-pointer text-base text-brand-400 underline"
                    target="_blank"
                  >
                    Our guide to regexes
                  </Link>
                </div>
                <Separator />
                <AIPromptInput
                  aiPrompt={aiPrompts[index]}
                  setAiPrompt={(value) => {
                    const updatedAiPrompts = [...aiPrompts];
                    updatedAiPrompts[index] = value;
                    setAiPrompts(updatedAiPrompts);
                  }}
                  handleGenerateFields={() => {
                    handleGenerateFields(index);
                  }}
                  emlContent={emlContent}
                  isGeneratingFieldsLoading={isGeneratingFieldsLoading[index]}
                />
                {regex?.parts?.map((part: any, partIndex: any) => {
                  return (
                    <div key={partIndex} className="flex flex-col gap-3 rounded-lg py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-row items-center gap-2">
                          <span
                            className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium text-white"
                            style={{
                              backgroundColor: part.isPublic
                                ? REGEX_COLORS[index % REGEX_COLORS.length].public
                                : REGEX_COLORS[index % REGEX_COLORS.length].private,
                            }}
                          >
                            {partIndex + 1}
                          </span>
                          <Label>Field</Label>
                        </div>
                        <Button
                          variant="destructive"
                          size="smIcon"
                          onClick={() => {
                            const parts = parseRegexParts(regex.parts);
                            parts.splice(partIndex, 1);
                            const updatedRegexes = [...store.decomposedRegexes];
                            updatedRegexes[index] = {
                              ...regex,
                              parts: parts,
                            };
                            setField('decomposedRegexes', updatedRegexes);
                          }}
                        >
                          <Image
                            src="/assets/Trash.svg"
                            alt="trash"
                            width={16}
                            height={16}
                            style={{
                              maxWidth: '100%',
                              height: 'auto',
                            }}
                          />
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
                              parts: parts,
                            };
                            setField('decomposedRegexes', updatedRegexes);
                          }}
                          options={[
                            { label: 'Public', value: 'public' },
                            { label: 'Private', value: 'private' },
                          ]}
                        />
                      </div>
                      <div className="ml-3 flex flex-col gap-3">
                        <Label>Define Regex</Label>
                        <div className="relative">
                          <Input
                            value={part.regexDef?.replace(/\r/g, '\\r').replace(/\n/g, '\\n')}
                            onChange={(e) => {
                              const parts = [...parseRegexParts(regex.parts)];
                              // Convert displayed \r and \n back to actual escape sequences
                              const rawValue = e.target.value
                                .replace(/\\r/g, '\r')
                                .replace(/\\n/g, '\n');
                              console.log(rawValue, 'rawValue');
                              parts[partIndex] = {
                                ...parts[partIndex],
                                isPublic: part.isPublic,
                                regexDef: rawValue,
                              };
                              const updatedRegexes = [...store.decomposedRegexes];
                              console.log('parts: 717', parts);
                              updatedRegexes[index] = {
                                ...regex,
                                parts: parts,
                              };
                              setField('decomposedRegexes', updatedRegexes);
                            }}
                            placeholder="Enter regex definition"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div
                  className={`flex items-center ${
                    parseRegexParts(regex.parts).length !== 0 ? 'justify-between' : 'justify-center'
                  }`}
                >
                  {parseRegexParts(regex.parts).length !== 0 ? (
                    <p className="text-gray-700">More regex fields?</p>
                  ) : null}
                  <Button
                    variant="default"
                    size="sm"
                    startIcon={
                      <Image
                        src="/assets/Plus.svg"
                        alt="plus"
                        width={16}
                        height={16}
                        style={{
                          maxWidth: '100%',
                          height: 'auto',
                        }}
                      />
                    }
                    onClick={() => {
                      const parts = parseRegexParts(regex.parts);
                      parts.push({
                        isPublic: false,
                        regexDef: '',
                      });
                      const updatedRegexes = [...store.decomposedRegexes];
                      updatedRegexes[index] = {
                        ...regex,
                        parts: parts,
                      };
                      setField('decomposedRegexes', updatedRegexes);
                    }}
                  >
                    Add regex manually
                  </Button>
                </div>
                {/* Only show output if there are regex parts and valid outputs */}
                {parseRegexParts(regex.parts).length > 0 &&
                regexGeneratedOutputs[index] !== undefined &&
                regexGeneratedOutputs[index] !== null &&
                regexGeneratedOutputs[index].length > 0 ? (
                  <>
                    <Label>Output</Label>
                    <div
                      className={`rounded-lg border p-2 text-sm ${
                        regexGeneratedOutputErrors[index]
                          ? 'border-red-500 bg-red-100'
                          : 'border-grey-500 bg-neutral-100'
                      }`}
                    >
                      {regexGeneratedOutputErrors[index]
                        ? JSON.stringify(regexGeneratedOutputErrors[index])
                        : regexGeneratedOutputs
                          ? `${regex.name}: ${JSON.stringify(regexGeneratedOutputs[index])}`
                          : ''}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
        {store?.decomposedRegexes?.length !== 0 ? (
          <div className="flex items-center justify-between pt-3">
            <p className="text-gray-700">Need more data to extract?</p>
            <Button
              variant="default"
              size="sm"
              startIcon={
                <Image
                  src="/assets/Plus.svg"
                  alt="plus"
                  width={16}
                  height={16}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
              }
              onClick={() => {
                if (!optOut) {
                  posthog.capture('$add_values_to_extract_decomposed_regex');
                }
                setField('decomposedRegexes', [
                  ...(store.decomposedRegexes ?? []),
                  { maxLength: 64, location: 'body' },
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
              startIcon={
                <Image
                  src="/assets/Plus.svg"
                  alt="plus"
                  width={16}
                  height={16}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
              }
              onClick={() => {
                if (!optOut) {
                  posthog.capture('$add_values_to_extract_external_inputs');
                }
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
                startIcon={
                  <Image
                    src="/assets/Trash.svg"
                    alt="trash"
                    width={16}
                    height={16}
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                    }}
                  />
                }
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
              startIcon={
                <Image
                  src="/assets/Plus.svg"
                  alt="plus"
                  width={16}
                  height={16}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
              }
              onClick={() => {
                if (!optOut) {
                  posthog.capture('$add_values_to_extract_external_inputs');
                }
                const updatedInputs = store.externalInputs ? [...store.externalInputs, {}] : [{}];
                setField('externalInputs', updatedInputs);
              }}
            >
              Add values to extract
            </Button>
          </div>
        ) : null}
      </div>
      <div data-testid="regex-status">
        <Status />
      </div>
    </div>
  );
};

export default ExtractFields;
