'use client';

import { Input } from '@/components/ui/input';
import { useCreateBlueprintStore } from '../store';
import { useEffect, useState, memo, useMemo } from 'react';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DecomposedRegex,
  DecomposedRegexPart,
  ExternalInput,
  parseEmail,
  testDecomposedRegex,
} from '@zk-email/sdk';
import { toast } from 'react-toastify';
import { posthog } from 'posthog-js';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { REGEX_COLORS } from '@/app/constants';
import { Checkbox } from '@/components/ui/checkbox';

// Memoized Status component to prevent recreation on each render
interface StatusProps {
  emlContent: string;
  isGeneratingFields: boolean;
  skipEmlUpload: boolean;
  regexGeneratedOutputs: string[];
  regexGeneratedOutputErrors: string[];
}

// Pure utility function - doesn't need to be recreated on each render
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

const Status = memo(
  ({
    emlContent,
    isGeneratingFields,
    regexGeneratedOutputs,
    regexGeneratedOutputErrors,
    skipEmlUpload,
  }: StatusProps) => {
    if (!emlContent && !skipEmlUpload) {
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
          <span className="text-base font-medium">Please provide an email file</span>
        </div>
      );
    }
    if (isGeneratingFields) {
      return (
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          <span className="text-base font-medium">Generating fields...</span>
        </div>
      );
    }
    if (!regexGeneratedOutputs.length && !skipEmlUpload) {
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
          <span className="text-base font-medium">Please add at least one regex</span>
        </div>
      );
    }
    // Check for errors in regexGeneratedOutputErrors array
    const hasRegexErrors = regexGeneratedOutputErrors.some((error) => error && error.length > 0);

    if (
      (!regexGeneratedOutputs.length ||
        hasRegexErrors ||
        regexGeneratedOutputs.some((output) =>
          Array.isArray(output)
            ? output.join('').includes('Error')
            : output
              ? output.includes('Error')
              : true
        )) &&
      !skipEmlUpload
    ) {
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
  }
);

Status.displayName = 'Status';

const AIPromptInput = memo(
  ({
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
  }
);

AIPromptInput.displayName = 'AIPromptInput';

const ExtractFields = ({
  emlContent,
  optOut,
  setCanCompile,
  skipEmlUpload,
}: {
  emlContent: string;
  optOut: boolean;
  setCanCompile: (canCompile: boolean) => void;
  skipEmlUpload: boolean;
}) => {
  const store = useCreateBlueprintStore();

  const { setField, getParsedDecomposedRegexes } = store;

  const [isGeneratingFieldsLoading, setIsGeneratingFieldsLoading] = useState<boolean[]>(
    Array(store.decomposedRegexes?.length ?? 0).fill(false)
  );
  const [revealPrivateFields, setRevealPrivateFields] = useState(false);
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

  // Sync checkbox states with decomposedRegexes
  useEffect(() => {
    setIsExtractSubjectChecked(store.decomposedRegexes?.some((r) => r.name === 'subject') ?? false);
    setIsExtractReceiverChecked(
      store.decomposedRegexes?.some((r) => r.name === 'email_recipient') ?? false
    );
    setIsExtractSenderNameChecked(
      store.decomposedRegexes?.some((r) => r.name === 'email_sender') ?? false
    );
    setIsExtractSenderDomainChecked(
      store.decomposedRegexes?.some((r) => r.name === 'sender_domain') ?? false
    );
    setIsExtractTimestampChecked(
      store.decomposedRegexes?.some((r) => r.name === 'email_timestamp') ?? false
    );
  }, [store.decomposedRegexes]);

  // Handle canCompile state updates based on conditions
  useEffect(() => {
    const hasNoEmail = !emlContent;
    const isGenerating = isGeneratingFields;
    const noRegexes = !regexGeneratedOutputs.length;

    // Check for errors in regexGeneratedOutputErrors array
    const hasRegexErrors = regexGeneratedOutputErrors.some((error) => error && error.length > 0);

    // Check for errors in the output itself
    const hasOutputErrors = regexGeneratedOutputs.some((output) =>
      Array.isArray(output)
        ? output.join('').includes('Error')
        : output
          ? output.includes('Error')
          : true
    );

    setCanCompile(
      !hasNoEmail && !isGenerating && !noRegexes && !hasRegexErrors && !hasOutputErrors
    );
  }, [
    emlContent,
    isGeneratingFields,
    regexGeneratedOutputs,
    regexGeneratedOutputErrors,
    setCanCompile,
  ]);

  // Memoize the stringified value to avoid expensive recalculation on every render
  const decomposedRegexesKey = useMemo(
    () => JSON.stringify(store.decomposedRegexes),
    [store.decomposedRegexes]
  );

  useEffect(() => {
    let cancelled = false;

    const generateRegexOutputs = async () => {
      setIsGeneratingFields(true);

      if (!emlContent || !store.decomposedRegexes?.length) {
        // Clear outputs when there are no regexes
        setRegexGeneratedOutputs([]);
        setRegexGeneratedOutputErrors([]);
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
              : { ...regex, parts: JSON.parse(regex.parts ?? '[]') };

            if (parsedRegex.parts.length === 0) {
              return;
            }

            const regexOutputs = await testDecomposedRegex(
              body,
              header,
              parsedRegex,
              revealPrivateFields
            );

            // Only update state if component is still mounted
            if (cancelled) return;

            const outputUpdated =
              JSON.stringify(regexOutputs) !== JSON.stringify(regexGeneratedOutputs[index]);

            // Validate output lengths against maxLength for public parts
            const parts = parseRegexParts(parsedRegex.parts);
            let validationError = '';
            const errorParts: string[] = [];

            parts.forEach((part: any, partIndex: number) => {
              if (part.isPublic && part.maxLength !== undefined && regexOutputs[partIndex]) {
                const actualLength = regexOutputs[partIndex].length;
                if (actualLength > part.maxLength) {
                  errorParts.push(
                    `Part ${partIndex + 1}: length ${actualLength} exceeds max ${part.maxLength}`
                  );
                }
              }
            });

            if (errorParts.length > 0) {
              validationError = `Max length exceeded: ${errorParts.join(', ')}`;
            }

            // Check again before state updates
            if (!cancelled) {
              setRegexGeneratedOutputs((prev) => {
                const updated = [...prev];
                // @ts-ignore
                updated[index] = regexOutputs;
                return updated;
              });

              setRegexGeneratedOutputErrors((prev) => {
                const updated = [...prev];
                // @ts-ignore
                updated[index] = validationError;
                return updated;
              });

              // update the max length of the regex at that particular index
              // Only update when the output changes and there's no validation error
              if (outputUpdated && !validationError) {
                // Calculate total length only for public parts
                let publicPartsTotalLength = 0;
                const parts = parseRegexParts(parsedRegex.parts);

                // Update individual part max lengths only if not manually set
                // This preserves user-defined values
                const updatedParts = parts.map((part: any, partIndex: number) => {
                  if (part.isPublic && regexOutputs[partIndex]) {
                    const partLength = regexOutputs[partIndex].length;
                    // Only auto-update if maxLength is undefined (not manually set)
                    if (part.maxLength === undefined) {
                      publicPartsTotalLength += partLength;
                      return {
                        ...part,
                        maxLength: partLength,
                      };
                    } else {
                      // Use the manually set value in calculation
                      publicPartsTotalLength += part.maxLength;
                      return part;
                    }
                  }
                  return part;
                });

                const decomposedRegexes = [...store.decomposedRegexes];
                decomposedRegexes[index] = {
                  ...decomposedRegexes[index],
                  parts: updatedParts,
                  maxLength: publicPartsTotalLength || 64,
                };
                setField('decomposedRegexes', decomposedRegexes);
              }
            }
          } catch (error) {
            console.error('Error testing decomposed regex:', error);
            // Check if cancelled before error state update
            if (!cancelled) {
              setRegexGeneratedOutputErrors((prev) => {
                const updated = [...prev];
                // @ts-ignore
                updated[index] = 'Error: ' + error;
                return updated;
              });
            }
          }
        })
      );

      // Only update if not cancelled
      if (!cancelled) {
        setIsGeneratingFields(false);
      }
    };

    generateRegexOutputs();

    // Cleanup function to set cancelled flag
    return () => {
      cancelled = true;
    };
  }, [emlContent, decomposedRegexesKey]);

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
      // Calculate total max length for public parts (using 64 as default)
      const totalPublicMaxLength = data[0].parts.reduce((acc: number, part: any) => {
        if (part.isPublic) {
          return acc + (part.maxLength ?? 64);
        }
        return acc;
      }, 0);
      updatedRegexes[index] = {
        name: data[0].name,
        location: data[0].location === 'body' ? 'body' : 'header',
        parts: data[0].parts,
        maxLength: totalPublicMaxLength || 64,
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

  return (
    <div className="flex flex-col gap-6">
      {/* Decomposed Regexes */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center justify-between">
          <div className="mb-4 w-full overflow-hidden rounded-lg">
            <div className="flex items-center justify-between py-3">
              <div className="flex flex-col gap-1">
                <Label className="font-medium text-grey-900">Quick header extraction</Label>
                <p className="text-base font-medium text-grey-700">
                  We auto-write the regexes for all the toggled fields
                </p>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex justify-between rounded-md px-3 py-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const checked = !isExtractSubjectChecked;
                      setIsExtractSubjectChecked(checked);
                      if (checked) {
                        const subjectRegex: DecomposedRegex = {
                          name: 'subject',
                          location: 'header',
                          parts: [
                            {
                              isPublic: false,
                              regexDef: '(?:\\r\\n|^)subject:',
                            },
                            {
                              isPublic: true,
                              regexDef: '[^\\r\\n]+',
                              maxLength: 64,
                            },
                            {
                              isPublic: false,
                              regexDef: '\\r\\n',
                            },
                          ],
                          maxLength: 64,
                        };
                        setField('decomposedRegexes', [
                          ...(store.decomposedRegexes ?? []),
                          subjectRegex,
                        ]);
                      } else {
                        // Remove the subject regex when unchecked
                        const filtered =
                          store.decomposedRegexes?.filter((r) => r.name !== 'subject') ?? [];
                        setField('decomposedRegexes', filtered);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <Image
                      src={
                        isExtractSubjectChecked ? '/assets/AddField.svg' : '/assets/removeField.svg'
                      }
                      alt="toggle subject"
                      width={16}
                      height={16}
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                      }}
                    />
                  </button>
                  <span className="text-base font-medium text-grey-900">Subject</span>
                </div>
              </div>
              <div className="flex justify-between rounded-md px-3 py-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const checked = !isExtractReceiverChecked;
                      setIsExtractReceiverChecked(checked);
                      if (checked) {
                        const receiverRegex: DecomposedRegex = {
                          name: 'email_recipient',
                          parts: [
                            {
                              isPublic: false,
                              regexDef: '(?:\\r\\n|^)to:',
                            },
                            {
                              isPublic: false,
                              regexDef: '(?:[^\\r\\n]+<)?',
                            },
                            {
                              isPublic: true,
                              regexDef:
                                '[a-zA-Z0-9!#$%&\\*\\+-/=\\\\?\\\\^_`{\\\\|}~\\\\.]+@[a-zA-Z0-9_\\\\\.-]+',
                              maxLength: 64,
                            },
                            {
                              isPublic: false,
                              regexDef: '>?\\r\\n',
                            },
                          ],
                          location: 'header',
                          maxLength: 64,
                        };
                        setField('decomposedRegexes', [
                          ...(store.decomposedRegexes ?? []),
                          receiverRegex,
                        ]);
                      } else {
                        // Remove the email_recipient regex when unchecked
                        const filtered =
                          store.decomposedRegexes?.filter((r) => r.name !== 'email_recipient') ??
                          [];
                        setField('decomposedRegexes', filtered);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <Image
                      src={
                        isExtractReceiverChecked
                          ? '/assets/AddField.svg'
                          : '/assets/removeField.svg'
                      }
                      alt="toggle receiver"
                      width={16}
                      height={16}
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                      }}
                    />
                  </button>
                  <span className="text-base font-medium text-grey-900">To field</span>
                </div>
              </div>
              <div className="flex justify-between rounded-md px-3 py-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const checked = !isExtractSenderNameChecked;
                      setIsExtractSenderNameChecked(checked);
                      if (checked) {
                        const senderNameRegex: DecomposedRegex = {
                          name: 'email_sender',
                          parts: [
                            {
                              isPublic: false,
                              regexDef: '(?:\\r\\n|^)from:',
                            },
                            {
                              isPublic: false,
                              regexDef: '(?:[^\\r\\n]+<)?',
                            },
                            {
                              isPublic: true,
                              regexDef:
                                "[A-Za-z0-9!#$%&'\\*\\+\\-/=\\?\\^_`{\\|}~\\.]+@[A-Za-z0-9\\.-]+",
                              maxLength: 64,
                            },
                            {
                              isPublic: false,
                              regexDef: '>?\\r\\n',
                            },
                          ],
                          location: 'header',
                          maxLength: 64,
                        };
                        setField('decomposedRegexes', [
                          ...(store.decomposedRegexes ?? []),
                          senderNameRegex,
                        ]);
                      } else {
                        // Remove the email_sender regex when unchecked
                        const filtered =
                          store.decomposedRegexes?.filter((r) => r.name !== 'email_sender') ?? [];
                        setField('decomposedRegexes', filtered);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <Image
                      src={
                        isExtractSenderNameChecked
                          ? '/assets/AddField.svg'
                          : '/assets/removeField.svg'
                      }
                      alt="toggle sender"
                      width={16}
                      height={16}
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                      }}
                    />
                  </button>
                  <span className="text-base font-medium text-grey-900">Sender email</span>
                </div>
              </div>

              <div className="flex justify-between rounded-md px-3 py-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const checked = !isExtractSenderDomainChecked;
                      setIsExtractSenderDomainChecked(checked);
                      if (checked) {
                        const senderDomainRegex: DecomposedRegex = {
                          name: 'sender_domain',
                          parts: [
                            {
                              isPublic: false,
                              regexDef: '(?:\\r\\n|^)from:[^\\r\\n]*@',
                            },
                            {
                              isPublic: true,
                              regexDef: '[A-Za-z0-9][A-Za-z0-9\\.-]+',
                              maxLength: 64,
                            },
                            {
                              isPublic: false,
                              regexDef: '[>\\r\\n]',
                            },
                          ],
                          location: 'header',
                          maxLength: 64,
                        };
                        setField('decomposedRegexes', [
                          ...(store.decomposedRegexes ?? []),
                          senderDomainRegex,
                        ]);
                      } else {
                        // Remove the sender_domain regex when unchecked
                        const filtered =
                          store.decomposedRegexes?.filter((r) => r.name !== 'sender_domain') ?? [];
                        setField('decomposedRegexes', filtered);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <Image
                      src={
                        isExtractSenderDomainChecked
                          ? '/assets/AddField.svg'
                          : '/assets/removeField.svg'
                      }
                      alt="toggle domain"
                      width={16}
                      height={16}
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                      }}
                    />
                  </button>
                  <span className="text-base font-medium text-grey-900">Sender domain</span>
                </div>
              </div>
              <div className="flex justify-between rounded-md px-3 py-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const checked = !isExtractTimestampChecked;
                      setIsExtractTimestampChecked(checked);
                      if (checked) {
                        const timestampRegex: DecomposedRegex = {
                          name: 'email_timestamp',
                          parts: [
                            {
                              isPublic: false,
                              regexDef: '(?:\\r\\n|^)dkim-signature:',
                            },
                            {
                              isPublic: false,
                              regexDef: '(?:[a-z]+=[^;]+; )+t=',
                            },
                            {
                              isPublic: true,
                              regexDef: '[0-9]+',
                              maxLength: 64,
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
                      } else {
                        // Remove the email_timestamp regex when unchecked
                        const filtered =
                          store.decomposedRegexes?.filter((r) => r.name !== 'email_timestamp') ??
                          [];
                        setField('decomposedRegexes', filtered);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <Image
                      src={
                        isExtractTimestampChecked
                          ? '/assets/AddField.svg'
                          : '/assets/removeField.svg'
                      }
                      alt="toggle timestamp"
                      width={16}
                      height={16}
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                      }}
                    />
                  </button>
                  <span className="text-base font-medium text-grey-900">Timestamp</span>
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
                  { maxLength: 64, location: 'header' },
                ]);
              }}
            >
              Add values to extract
            </Button>
          ) : null}
        </div>

        {store.decomposedRegexes?.map((regex: DecomposedRegex, index: number) => {
          return (
            <div key={index} className="mb-2 flex flex-col gap-3 px-1">
              <div className="flex items-center justify-between py-3 pb-1">
                <div className="flex items-center gap-2">
                  <Label className="font-medium">Extracted data #{index + 1}</Label>
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
                    const updatedAiPrompts = aiPrompts.filter((_, i) => i !== index);
                    setAiPrompts(updatedAiPrompts);
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
                  title="Data Name"
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
                    { label: 'Email Header', value: 'header' },
                  ]}
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
              <div className="flex flex-col gap-3 rounded-xl border border-grey-500 p-4">
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
                        <div className="flex flex-row items-center gap-2">
                          <div className="relative inline-flex items-center rounded-xl border border-grey-500 bg-white p-1 shadow-sm">
                            {/* Animated active background */}
                            <motion.div
                              layout
                              transition={{
                                type: 'spring',
                                stiffness: 500,
                                damping: 40,
                                mass: 0.3,
                              }}
                              className={`absolute inset-y-1 ${part.isPublic ? 'w-[calc(50%-6px)]' : 'w-[calc(55%-6px)]'} rounded-lg bg-gray-900`}
                              style={{
                                left: part.isPublic ? 'calc(50%)' : '6px',
                                padding: 4,
                              }}
                            />
                            <button
                              type="button"
                              className={`relative z-[1] flex items-center gap-2 rounded-lg px-3 py-1 text-sm transition-colors ${
                                !part.isPublic ? 'text-white' : 'text-gray-700'
                              }`}
                              onClick={() => {
                                const parts = parseRegexParts(regex.parts);
                                parts[partIndex].isPublic = false;
                                // Recalculate total max length for all public parts
                                const totalPublicMaxLength = parts.reduce((acc: number, p: any) => {
                                  if (p && p.isPublic) {
                                    return acc + (p.maxLength ?? 64);
                                  }
                                  return acc;
                                }, 0);
                                const updatedRegexes = [...store.decomposedRegexes];
                                updatedRegexes[index] = {
                                  ...regex,
                                  parts,
                                  maxLength: totalPublicMaxLength || 64,
                                };
                                setField('decomposedRegexes', updatedRegexes);
                              }}
                              aria-pressed={!part.isPublic}
                            >
                              {!part.isPublic ? (
                                <Image
                                  src="/assets/EyeSlash.svg"
                                  alt="eye-slash"
                                  width={16}
                                  height={16}
                                />
                              ) : null}
                              <span>Private</span>
                            </button>
                            <button
                              type="button"
                              className={`relative z-[1] ml-1 flex items-center gap-2 rounded-lg px-3 py-1 text-sm transition-colors ${
                                part.isPublic ? 'text-white' : 'text-gray-700'
                              }`}
                              onClick={() => {
                                const parts = parseRegexParts(regex.parts);
                                parts[partIndex].isPublic = true;
                                // Recalculate total max length for all public parts
                                // Use 64 as default when maxLength is undefined
                                const totalPublicMaxLength = parts.reduce((acc: number, p: any) => {
                                  if (p && p.isPublic) {
                                    return acc + (p.maxLength ?? 64);
                                  }
                                  return acc;
                                }, 0);
                                const updatedRegexes = [...store.decomposedRegexes];
                                updatedRegexes[index] = {
                                  ...regex,
                                  parts,
                                  maxLength: totalPublicMaxLength || 64,
                                };
                                setField('decomposedRegexes', updatedRegexes);
                              }}
                              aria-pressed={part.isPublic}
                            >
                              {part.isPublic ? (
                                <Image
                                  src="/assets/EyeWhite.svg"
                                  alt="eye"
                                  width={16}
                                  height={16}
                                />
                              ) : null}
                              <span>Public</span>
                            </button>
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
                      </div>
                      <div className="flex flex-col gap-3">
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
                        <AnimatePresence initial={false}>
                          {part.isPublic ? (
                            <motion.div
                              key="max-length"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: 'easeOut' }}
                              className="overflow-hidden"
                            >
                              <div className="relative mx-3 pt-2">
                                <Label>Max Length</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={part.maxLength === undefined ? '' : part.maxLength}
                                  onChange={(e) => {
                                    const parts: DecomposedRegexPart[] = [
                                      ...parseRegexParts(regex.parts),
                                    ];
                                    const rawValue = e.target.value;
                                    // Allow empty string, but treat as undefined
                                    // Also handle invalid numbers by treating them as undefined
                                    const parsedValue = parseInt(rawValue);
                                    const newMaxLength =
                                      rawValue === '' || isNaN(parsedValue)
                                        ? undefined
                                        : parsedValue;

                                    parts[partIndex] = {
                                      ...parts[partIndex],
                                      maxLength: newMaxLength,
                                    };

                                    const updatedRegexes = [...store.decomposedRegexes];

                                    // Calculate total max length for all public parts
                                    // Use 64 as default when maxLength is undefined
                                    const totalPublicMaxLength = parts.reduce(
                                      (acc: number, p: any) => {
                                        if (p && p.isPublic) {
                                          return acc + (p.maxLength ?? 64);
                                        }
                                        return acc;
                                      },
                                      0
                                    );

                                    updatedRegexes[index] = {
                                      ...regex,
                                      parts: parts,
                                      maxLength: totalPublicMaxLength || 64,
                                    };
                                    setField('decomposedRegexes', updatedRegexes);
                                  }}
                                  placeholder="Default: 64"
                                />
                              </div>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
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
                    <p className="text-gray-700">Add another regex field?</p>
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
                    New field
                  </Button>
                </div>
                {/* Only show output if there are regex parts and valid outputs */}
                {parseRegexParts(regex.parts).length > 0 ? (
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
                        ? regexGeneratedOutputErrors[index]
                        : regexGeneratedOutputs && regexGeneratedOutputs[index]
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
            <p className="text-gray-700">Need more data to be captured?</p>
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
              Add data
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
              New data
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
            <p className="text-gray-700">Need more external data?</p>
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
              New data
            </Button>
          </div>
        ) : null}
      </div>
      <div data-testid="regex-status">
        <Status
          emlContent={emlContent}
          isGeneratingFields={isGeneratingFields}
          skipEmlUpload={skipEmlUpload}
          regexGeneratedOutputs={regexGeneratedOutputs}
          regexGeneratedOutputErrors={regexGeneratedOutputErrors}
        />
      </div>
    </div>
  );
};

export default ExtractFields;
