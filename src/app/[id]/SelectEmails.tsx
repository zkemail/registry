import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { fetchEmailsRaw, RawEmailResponse } from '../hooks/useGmailClient';
import { fetchEmailList } from '../hooks/useGmailClient';
import useGoogleAuth from '../hooks/useGoogleAuth';
import { formatDate } from '../utils';
import { AnimatePresence, motion } from 'framer-motion'; // Add this import
import { useProofStore } from './store';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCreateBlueprintStore } from '../create/[id]/store';
import { extractEMLDetails, testBlueprint } from '@zk-email/sdk';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Loader from '@/components/ui/loader';
import { decodeMimeEncodedText } from '@/lib/utils';

type Email = RawEmailResponse & {
  valid: boolean;
};

const SelectEmails = ({ id }: { id: string }) => {
  const { setStep, file, setEmailContent, blueprint, startProofGeneration } = useProofStore();
  const store = useCreateBlueprintStore();
  const { getParsedDecomposedRegexes, setToExistingBlueprint, reset } = store;
  const pathname = usePathname();
  const { replace } = useRouter();
  const searchParams = useSearchParams();

  const [isCreateProofLoading, setIsCreateProofLoading] = useState<'local' | 'remote' | null>(null);
  const [isFetchEmailLoading, setIsFetchEmailLoading] = useState(false);
  const [pageToken, setPageToken] = useState<string | null>('0');
  const [fetchedEmails, setFetchedEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [hasExternalInputs, setHasExternalInputs] = useState(false);
  const { googleAuthToken } = useGoogleAuth();

  useEffect(() => {
    if (id !== 'new') {
      setToExistingBlueprint(id);
    }

    return () => {
      reset();
    };
  }, []);

  useEffect(() => {
    setHasExternalInputs(
      !!blueprint?.props.externalInputs && !!blueprint?.props.externalInputs.length
    );
  }, [blueprint]);

  const handleValidateEmail = async (content: string) => {
    try {
      console.log('validating email: ', content);
      console.log('blueprint: ', blueprint!.props);

      const output = await testBlueprint(
        content,
        // {
        //   blueprint,
        //   decomposedRegexes: getParsedDecomposedRegexes(),
        // },
        blueprint?.props!
      );
      console.log('output: ', output);

      return true;
    } catch (err) {
      console.error('Failed to test decomposed regex on eml: ', err);
      return false;
    }
  };

  const handleStartProofGeneration = async (isLocal = false) => {
    setIsCreateProofLoading(isLocal ? 'local' : 'remote');
    try {
      const proofId = await startProofGeneration(isLocal);
      // setStep('3');
      const params = new URLSearchParams(searchParams);
      params.set('proofId', proofId);
      params.set('step', '3');
      console.log(pathname, params.toString());
      replace(`${pathname}?${params.toString()}`);
    } catch (error) {
      console.error('Error in starting proof generation: ', error);
    } finally {
      setIsCreateProofLoading(null);
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
          internalDate: (() => {
            const dateMatches = file.match(/Date: (.*)/g); // Find all "Date:" occurrences
            if (dateMatches && dateMatches.length > 0) {
              const lastDateMatch = dateMatches[dateMatches.length - 1]; // Take the last match
              const dateValue = lastDateMatch.split('Date: ')[1]; // Extract the actual date string
              return new Date(dateValue).toISOString(); // Convert to ISO format
            }
            return 'Invalid Date';
          })(),
          decodedContents: file,
          valid: valid ?? false,
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
        q: blueprint?.props.emailQuery,
      });

      console.log('emailQuery: ', blueprint?.props.emailQuery);

      const emailResponseMessages = emailListResponse.messages;
      if (emailResponseMessages?.length > 0) {
        const emailIds = emailResponseMessages.map((message) => message.id);
        const emails = await fetchEmailsRaw(googleAuthToken.access_token, emailIds);

        const validatedEmails: {
          email: RawEmailResponse;
          senderDomain: string;
          selector: string;
        }[] = await Promise.all(
          emails.map(async (email) => {
            const { senderDomain, selector } = await extractEMLDetails(email.decodedContents);
            return {
              email,
              senderDomain,
              selector,
            };
          })
        );

        // Get unique domain-selector pairs
        const uniquePairs = Array.from(
          new Set(
            validatedEmails.map(({ senderDomain, selector }) => `${senderDomain}:${selector}`)
          )
        ).map((pair) => {
          const [domain, selector] = pair.split(':');
          return { domain, selector };
        });

        // Make API calls only for unique pairs
        await Promise.all(
          uniquePairs.map((pair) =>
            fetch('https://archive.zk.email/api/dsp', {
              method: 'POST',
              body: JSON.stringify({
                domain: pair.domain,
                selector: pair.selector,
              }),
            })
          )
        );

        // Process validation for all emails
        const processedEmails: Email[] = await Promise.all(
          validatedEmails.map(async ({ email }) => {
            const validationResult = await handleValidateEmail(email.decodedContents);
            return {
              ...email,
              valid: validationResult ?? false,
            };
          })
        );

        if (validatedEmails.length === 0 && emailListResponse.nextPageToken) {
          setPageToken(emailListResponse.nextPageToken || null);
          handleFetchEmails();
          return;
        }

        console.log('fetchedEmails: ', fetchedEmails, validatedEmails);
        setFetchedEmails([...fetchedEmails, ...processedEmails]);

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

  const renderEmailsTable = () => {
    if (isFetchEmailLoading) {
      return (
        <div className="mt-6 flex w-full justify-center">
          <Loader />
        </div>
      );
    }

    if (fetchedEmails.filter((email) => email.valid).length === 0) {
      return (
        <div className="rounded-lg border border-grey-200 p-4 text-grey-700">
          No valid emails found. Please check your inbox
        </div>
      );
    }

    return (
      <div className="mt-6 w-full">
        <div className="grid w-full">
          {/* Header */}
          <div
            className="mb-2 grid gap-6 text-left font-semibold"
            style={{ gridTemplateColumns: '1fr 1fr 2fr 6fr' }}
          >
            <div className="text-left">Select</div>
            <div>Validity</div>
            <div>Sent on</div>
            <div>Subject</div>
            {/* <div className="text-right">Generated Input</div> */}
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
              {fetchedEmails
                .filter((email) => email.valid)
                .map((email, index) => (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    key={email.emailMessageId}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="grid items-center gap-6 border-t-2 border-neutral-100 py-3 text-grey-700"
                    style={{ gridTemplateColumns: '1fr 1fr 2fr 6fr' }}
                  >
                    <RadioGroupItem
                      value={email.decodedContents}
                      id={email.emailMessageId}
                      // disabled={!email.valid}
                    />

                    <div className="flex items-center justify-center">
                      {email.valid ? (
                        <Image
                          src="/assets/Checks.svg"
                          alt="status"
                          width={20}
                          height={20}
                          style={{
                            maxWidth: '100%',
                            height: 'auto',
                          }}
                        />
                      ) : (
                        <Image
                          src="/assets/WarningCircle.svg"
                          alt="status"
                          width={20}
                          height={20}
                          style={{
                            maxWidth: '100%',
                            height: 'auto',
                          }}
                        />
                      )}
                    </div>
                    <div>
                      <div>{formatDate(email.internalDate).split(',')[0]}</div>
                      <div>{formatDate(email.internalDate).split(',')[1]}</div>
                    </div>
                    <div className="overflow-hidden text-ellipsis">
                      {decodeMimeEncodedText(email.subject)}
                    </div>
                    {/* <div>
                <button className="flex items-center gap-1 underline hover:underline">
                  <Image src="/assets/Eye.svg" alt="view" width={16} height={16} />
                  View Input
                </button>
              </div> */}
                  </motion.div>
                ))}
            </AnimatePresence>
          </RadioGroup>
        </div>
        <div className="mt-6 flex w-full flex-col items-center gap-4">
          <Button
            variant="ghost"
            className="gap-2 text-grey-700"
            onClick={handleFetchEmails}
            disabled={isFetchEmailLoading}
          >
            <Image
              src="/assets/ArrowsClockwise.svg"
              alt="arrow down"
              width={16}
              height={16}
              className={isFetchEmailLoading ? 'animate-spin' : ''}
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            />
            Load More Emails
          </Button>

          {!hasExternalInputs && (
            <div className="flex justify-center">Choose the mode of proof creation</div>
          )}

          <div className="flex justify-center">
            <Button
              className="flex items-center gap-2"
              disabled={selectedEmail === null || !!isCreateProofLoading}
              loading={isCreateProofLoading === 'remote'}
              onClick={() => {
                if (blueprint!.props.externalInputs && blueprint!.props.externalInputs.length) {
                  setStep('2');
                } else {
                  handleStartProofGeneration(false);
                }
              }}
            >
              {hasExternalInputs ? 'Add Inputs' : 'Remotely'}
            </Button>
            {!hasExternalInputs && (
              <Button
                className="ml-3 flex w-max items-center gap-2"
                disabled={selectedEmail === null || !!isCreateProofLoading}
                loading={isCreateProofLoading === 'local'}
                onClick={() => {
                  if (blueprint!.props.externalInputs && blueprint!.props.externalInputs.length) {
                    setStep('2');
                  } else {
                    handleStartProofGeneration(true);
                  }
                }}
              >
                Locally
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

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

      {renderEmailsTable()}
    </div>
  );
};

export default SelectEmails;
