import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { use, useEffect, useState } from 'react';
import { fetchEmailsRaw, RawEmailResponse } from '../hooks/useGmailClient';
import { fetchEmailList } from '../hooks/useGmailClient';
import useGoogleAuth from '../hooks/useGoogleAuth';
import { formatDate } from '../utils';
import { Checkbox } from '@/components/ui/checkbox';
import { AnimatePresence, motion } from 'framer-motion'; // Add this import
import { useProofStore } from './store';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getFileContent } from '@/lib/utils';
import { useCreateBlueprintStore } from '../create/[id]/store';
import { DecomposedRegex, testDecomposedRegex } from '@zk-email/sdk';

type Email = RawEmailResponse & {
  valid: boolean;
};

const SelectEmails = ({ id }: { id: string }) => {
  const { setStep, file, setEmailContent, blueprint, startProofGeneration } = useProofStore();
  const store = useCreateBlueprintStore();
  const { getParsedDecomposedRegexes, setToExistingBlueprint, reset } = store;

  const [isFetchEmailLoading, setIsFetchEmailLoading] = useState(false);
  const [pageToken, setPageToken] = useState<string | null>('0');
  const [fetchedEmails, setFetchedEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const { googleAuthToken } = useGoogleAuth();

  useEffect(() => {
    if (id !== 'new') {
      setToExistingBlueprint(id);
    }

    return () => {
      reset();
    };
  }, []);

  const handleValidateEmail = async (content: string) => {
    try {
      const parsed = getParsedDecomposedRegexes();
      const output = await Promise.all(
        parsed.map((dcr: DecomposedRegex) => testDecomposedRegex(content, dcr, false))
      );
      // Create array of name-value pairs
      const mappedOutput = parsed
        .map((dcr: DecomposedRegex, index: number) => ({
          name: dcr.name,
          value: output[index],
        }))
        .filter((item: { value: string[] }) => item.value.length > 0); // Filter out items with no value

      console.log('mappedOutput: ', output);

      return mappedOutput.length > 0;
    } catch (err) {
      console.error('Failed to test decomposed regex on eml: ', err);
    }
  };

  useEffect(() => {
    const checkFileValidity = async (file: string | null) => {
      if (file) {
        const valid = await handleValidateEmail(file);

        const subject = file.match(/Subject: (.*)/)?.[1] || 'No Subject';

        const selectedEmail = {
          emailMessageId: 'uploadedFile',
          subject,
          internalDate: file.match(/Date: (.*)/)?.[1]
            ? new Date(file.match(/Date: (.*)/)?.[1] as string).toISOString()
            : 'Invalid Date',
          decodedContents: file,
          valid: valid ? [{ name: 'file', value: ['true'] }] : [],
        };

        setFetchedEmails([selectedEmail]);
      }
    };

    checkFileValidity(file);
  }, []);

  console.log('selectedEmail: ', fetchedEmails, selectedEmail);

  const handleFetchEmails = async () => {
    console.log('fetching emails');
    try {
      setIsFetchEmailLoading(true);
      const emailListResponse = await fetchEmailList(googleAuthToken.access_token, {
        pageToken: pageToken,
      });

      const emailResponseMessages = emailListResponse.messages;
      if (emailResponseMessages?.length > 0) {
        const emailIds = emailResponseMessages.map((message) => message.id);
        const emails = await fetchEmailsRaw(googleAuthToken.access_token, emailIds);

        const validatedEmails: Email[] = await Promise.all(
          emails.map(async (email) => {
            console.log('email', email);
            const validationResult = await handleValidateEmail(email.decodedContents);
            return {
              ...email,
              valid: validationResult ?? false,
            };
          })
        );

        console.log('fetchedEmails: ', fetchedEmails, validatedEmails);
        setFetchedEmails([...fetchedEmails, ...validatedEmails]);

        setPageToken(emailListResponse.nextPageToken || null);
      } else {
        setFetchedEmails([]);
      }
    } catch (error) {
      console.error('Error in fetching data:', error);
    } finally {
      setIsFetchEmailLoading(false);
    }
  };

  useEffect(() => {
    if (file) {
      return;
    }
    if (googleAuthToken?.access_token) {
      handleFetchEmails();
    }
  }, [googleAuthToken?.access_token]);

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="flex w-full flex-col gap-1">
        <h4 className="text-xl font-bold text-grey-800">Select Emails</h4>
        <p className="text-base font-medium text-grey-700">
          Choose the emails you want to create proofs for. You can select multiple emails.
        </p>
        <p className="text-base font-medium text-grey-700">
          <span className="text-grey-900 underline">Note</span> - If you select to create the proofs
          remotely, your emails will be sent to our secured service for proof generation. Emails
          will be deleted once the proofs are generated
        </p>
      </div>

      <div className="mt-6">
        <div className="grid w-full">
          {/* Header */}
          <div
            className="mb-2 grid gap-6 text-left font-semibold"
            style={{ gridTemplateColumns: '1fr 1fr 2fr 4fr 2fr' }}
          >
            <div className="text-left">Select</div>
            <div>Validity</div>
            <div>Sent on</div>
            <div>Subject</div>
            <div className="text-right">Generated Input</div>
          </div>

          {/* Rows */}
          <RadioGroup
            onValueChange={(value) => {
              setSelectedEmail(
                fetchedEmails.find((email) => email.decodedContents === value) || null
              );

              setEmailContent(value);
            }}
          >
            <AnimatePresence initial={false}>
              {fetchedEmails.map((email, index) => (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="grid items-center gap-6 border-t-2 border-neutral-100 py-3 text-grey-700"
                  style={{ gridTemplateColumns: '1fr 1fr 2fr 4fr 2fr' }}
                >
                  <RadioGroupItem
                    value={email.decodedContents}
                    id={email.emailMessageId}
                    disabled={!email.valid}
                  />

                  <div className="flex items-center justify-center">
                    {email.valid ? (
                      <Image src="/assets/Checks.svg" alt="status" width={20} height={20} />
                    ) : (
                      <Image src="/assets/WarningCircle.svg" alt="status" width={20} height={20} />
                    )}
                  </div>
                  <div>
                    <div>{formatDate(email.internalDate).split(',')[0]}</div>
                    <div>{formatDate(email.internalDate).split(',')[1]}</div>
                  </div>
                  <div className="overflow-hidden text-ellipsis">{email.subject}</div>
                  <div>
                    <button className="flex items-center gap-1 underline hover:underline">
                      <Image src="/assets/Eye.svg" alt="view" width={16} height={16} />
                      View Input
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </RadioGroup>
        </div>

        <div className="mt-6 flex flex-col items-center gap-4">
          <Button
            variant="ghost"
            className="gap-2 text-grey-700"
            onClick={handleFetchEmails}
            loading={isFetchEmailLoading}
          >
            <Image
              src="/assets/ArrowsClockwise.svg"
              alt="arrow down"
              width={16}
              height={16}
              className={isFetchEmailLoading ? 'animate-spin' : ''}
            />
            Load More Emails
          </Button>

          <Button
            className="flex w-max items-center gap-2"
            disabled={selectedEmail === null}
            onClick={() => {
              if (blueprint!.props.externalInputs && blueprint!.props.externalInputs.length) {
                setStep('2');
              } else {
                startProofGeneration();
                setStep('3');
              }
            }}
          >
            {blueprint?.props.externalInputs ? 'Add Inputs' : 'Create Proof Remotely'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectEmails;
