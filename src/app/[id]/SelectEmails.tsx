import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { fetchEmailsRaw, RawEmailResponse } from '../hooks/useGmailClient';
import { fetchEmailList } from '../hooks/useGmailClient';
import useGoogleAuth from '../hooks/useGoogleAuth';
import { formatDate } from '../utils';
import { AnimatePresence, motion } from 'framer-motion'; // Add this import
import { useProofStore } from './store';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCreateBlueprintStore } from '../create/[id]/store';
import { extractEMLDetails, testBlueprint, ZkFramework } from '@zk-email/sdk';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Loader from '@/components/ui/loader';
import { decodeMimeEncodedText } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useEmailCacheStore } from '@/lib/stores/useEmailCacheStore';

type Email = RawEmailResponse & {
  valid: boolean;
};

const CACHE_KEY = 'zk_email_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CacheData {
  emails: Email[];
  timestamp: number;
  query: string;
}

const SelectEmails = ({ id }: { id: string }) => {
  const { setStep, file, setEmailContent, blueprint, startProofGeneration, emlUploadMode } =
    useProofStore();
  const store = useCreateBlueprintStore();
  const { getParsedDecomposedRegexes, setToExistingBlueprint, reset } = store;
  const pathname = usePathname();
  const { replace } = useRouter();
  const searchParams = useSearchParams();
  const isFetchingRef = useRef(false);
  const emailCacheStore = useEmailCacheStore();

  const [isCreateProofLoading, setIsCreateProofLoading] = useState<'local' | 'remote' | null>(null);
  const [isFetchEmailLoading, setIsFetchEmailLoading] = useState(false);
  const [areAllEmailsFetched, setAreAllEmailsFetched] = useState(false);
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
    // TODO: Uncomment this when we have testBlueprint fixed for the new compiler
    // try {
    //   await testBlueprint(content, blueprint?.props!);

    //   return true;
    // } catch (err) {
    //   console.error('Failed to test decomposed regex on eml: ', err);
    //   return false;
    // }
    return true;
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
      if (isLocal) {
        toast.error('Error: Local proof generation failed');
      } else {
        toast.error('Error: Remote proof generation failed');
      }
    } finally {
      setIsCreateProofLoading(null);
    }
  };

  useEffect(() => {
    const checkFileValidity = async (file: string | null) => {
      if (file && emlUploadMode === 'upload') {
        const valid = await handleValidateEmail(file);

        const subject = file.match(/Subject: (.*)/)?.[1] || 'No Subject';

        const selectedEmail = {
          emailMessageId: 'uploadedFile',
          subject,
          internalDate: (() => {
            const dateMatches = file.match(/\nDate: (.*)/g); // Find all "Date:" occurrences
            if (dateMatches && dateMatches.length > 0) {
              const lastDateMatch = dateMatches[0]; // Take the first match - should get the header date
              const dateValue = lastDateMatch.split('Date: ')[1]; // Extract the actual date string
              return new Date(dateValue).toISOString(); // Convert to ISO format
            }
            return 'Invalid Date';
          })(),
          decodedContents: file,
          valid: valid ?? false,
        };

        setFetchedEmails([selectedEmail]);
        saveEmailsToCache([selectedEmail], blueprint?.props.emailQuery || '');
      }
    };

    checkFileValidity(file);
  }, []);

  console.log('selectedEmail: ', fetchedEmails, selectedEmail);

  // Function to save emails to cache
  const saveEmailsToCache = async (emails: Email[], query: string) => {
    await emailCacheStore.saveEmailsToCache(emails, query);
  };

  // Function to get emails from cache
  const getEmailsFromCache = async () => {
    return await emailCacheStore.getEmailsFromCache();
  };

  const handleFetchEmails = async (newEmails = false) => {
    if (isFetchingRef.current) {
      console.log('Already fetching, skipping');
      return;
    }

    console.log('handleFetchEmails called');
    isFetchingRef.current = true;

    try {
      setAreAllEmailsFetched(false);
      setIsFetchEmailLoading(true);

      // Check cache first
      const cachedData = await getEmailsFromCache();
      const currentQuery = blueprint?.props.emailQuery || '';

      console.log('cachedData: ', cachedData);
      console.log('currentQuery: ', currentQuery);

      if (cachedData && cachedData.query === currentQuery && !newEmails) {
        console.log('Using cached emails');
        setFetchedEmails(cachedData.emails);
        setIsFetchEmailLoading(false);
        return;
      }

      const emailListResponse = await fetchEmailList(googleAuthToken.access_token, {
        pageToken: pageToken,
        q: currentQuery,
      });

      console.log('emailQuery: ', currentQuery);

      const emailResponseMessages = emailListResponse.messages;
      if (emailResponseMessages?.length > 0) {
        const emailIds = emailResponseMessages.map((message) => message.id);
        const emails = await fetchEmailsRaw(googleAuthToken.access_token, emailIds);

        // Process emails one at a time
        const processedEmails: Email[] = [];
        const uniquePairs = new Set<string>();

        for (const email of emails) {
          // Extract EML details
          const { senderDomain, selector } = await extractEMLDetails(email.decodedContents);
          const pairKey = `${senderDomain}:${selector}`;

          // Add to unique pairs if not already present
          if (!uniquePairs.has(pairKey)) {
            uniquePairs.add(pairKey);
            // Make API call for this unique pair
            await fetch('https://archive.zk.email/api/dsp', {
              method: 'POST',
              body: JSON.stringify({ domain: senderDomain, selector }),
            });
          }

          // Validate the email
          const validationResult = await handleValidateEmail(email.decodedContents);
          const processedEmail = {
            ...email,
            valid: validationResult ?? false,
          };

          processedEmails.push(processedEmail);
          // Update the UI with the new email
          setFetchedEmails((prev) => [...prev, processedEmail]);
          setIsFetchEmailLoading(false);
        }

        if (processedEmails.length === 0 && emailListResponse.nextPageToken) {
          setPageToken(emailListResponse.nextPageToken || null);
          handleFetchEmails(true);
          return;
        }

        const newEmails = [...fetchedEmails, ...processedEmails];
        console.log('fetchedEmails: ', newEmails);
        setFetchedEmails(newEmails);

        // Save to cache
        await saveEmailsToCache(newEmails, currentQuery);

        setPageToken(emailListResponse.nextPageToken || null);
      } else {
        setFetchedEmails([]);
        // Clear cache if no emails found
        await emailCacheStore.clearCache();
        setAreAllEmailsFetched(true);
      }
    } catch (error) {
      console.error('Error in fetching data:', error);
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    console.log('useEffect triggered', {
      hasToken: !!googleAuthToken?.access_token,
      isFile: !!file,
      isFetching: isFetchingRef.current,
    });

    if (file && emlUploadMode === 'upload') {
      return;
    }
    if (googleAuthToken?.access_token && !isFetchingRef.current) {
      handleFetchEmails();
    }
  }, [googleAuthToken?.access_token, file]);

  const renderEmailsTable = () => {
    if (isFetchEmailLoading && fetchedEmails.length === 0) {
      return (
        <div className="mt-6 flex w-full justify-center">
          <Loader />
        </div>
      );
    }

    if (fetchedEmails.filter((email) => email.valid).length === 0) {
      return (
        <Image
          src="/assets/noEmailIllustration.svg"
          alt="no valid emails found"
          width={316}
          height={316}
          style={{
            margin: 'auto',
            maxWidth: '100%',
            height: 'auto',
          }}
        />
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
          {isFetchingRef.current || isFetchEmailLoading ? (
            <Button variant="ghost" className="gap-2 text-grey-700" disabled={isFetchEmailLoading}>
              <Image
                src="/assets/ArrowsClockwise.svg"
                alt="arrow down"
                width={16}
                height={16}
                className={'animate-spin'}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
              Loading...
            </Button>
          ) : null}
        </div>
        <div className="mt-6 flex w-full flex-col items-center gap-4">
          {emlUploadMode === 'connect' && !isFetchingRef.current ? (
            <Button
              variant="ghost"
              className="gap-2 text-grey-700"
              onClick={() => handleFetchEmails(true)}
              disabled={isFetchEmailLoading}
            >
              <Image
                src="/assets/ArrowsClockwise.svg"
                alt="arrow down"
                width={16}
                height={16}
                // className={areAllEmailsFetched && !isFetchEmailLoading ? 'animate-spin' : ''}
                className={isFetchEmailLoading ? 'animate-spin' : ''}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
              Load More Emails
            </Button>
          ) : null}

          {!hasExternalInputs && (
            <div className="flex justify-center">Choose the mode of proof creation</div>
          )}
          {hasExternalInputs ? (
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
              Add Inputs
            </Button>
          ) : (
            <div className="flex flex-col gap-4">
              <div
                data-testid="remote-proving"
                className={`rounded-2xl border border-grey-200 p-6 ${
                  selectedEmail === null || !!isCreateProofLoading
                    ? 'cursor-not-allowed bg-neutral-100'
                    : 'cursor-pointer'
                }`}
                onClick={() => {
                  if (selectedEmail === null || !!isCreateProofLoading) return;
                  handleStartProofGeneration(false);
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="flex flex-row items-center justify-center gap-2 text-xl">
                    Remote Proving
                    {isCreateProofLoading === 'remote' && (
                      <span>
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </span>
                    )}
                  </p>

                  <div className="flex flex-row gap-2">
                    <div className="rounded-lg border border-[#C2F6C7] bg-[#ECFFEE] px-2 py-1 text-sm text-[#3AA345]">
                      Quick
                    </div>
                    <div className="rounded-lg border border-[#FFDBDE] bg-[#FFF6F7] px-2 py-1 text-sm text-[#C71B16]">
                      Server Side
                    </div>
                  </div>
                </div>
                <p className="text-base text-grey-700">
                  This method is comparatively faster. But the email is sent to our servers
                  temporarily and then deleted right after the proof creation.
                </p>
              </div>
              <div
                data-testid="local-proving"
                className={`rounded-2xl border border-grey-200 p-6 ${
                  selectedEmail === null ||
                  !!isCreateProofLoading ||
                  !blueprint?.props.clientZkFramework ||
                  // @ts-ignore ZkFramework can be None
                  blueprint?.props.clientZkFramework === ZkFramework.None
                    ? 'cursor-not-allowed bg-neutral-100'
                    : 'cursor-pointer'
                }`}
                onClick={() => {
                  if (selectedEmail === null || !!isCreateProofLoading) return;
                  handleStartProofGeneration(true);
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="flex flex-row items-center justify-center gap-2 text-xl">
                    Local Proving{' '}
                    {isCreateProofLoading === 'local' && (
                      <span>
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </span>
                    )}
                  </p>
                  <div className="flex flex-row gap-2">
                    <div className="rounded-lg border border-[#C2F6C7] bg-[#ECFFEE] px-2 py-1 text-sm text-[#3AA345]">
                      Private
                    </div>
                    <div className="rounded-lg border border-[#FFDBDE] bg-[#FFF6F7] px-2 py-1 text-sm text-[#C71B16]">
                      Slow
                    </div>
                  </div>
                </div>
                <p className="text-base text-grey-700">
                  {blueprint?.props.serverZkFramework &&
                  // @ts-ignore ZkFramework can be None
                  blueprint?.props.serverZkFramework !== ZkFramework.None ? (
                    <>
                      This method prioritizes your privacy by generating proofs directly on your
                      device. While it may take a bit more time, your email remains securely on your
                      system.
                    </>
                  ) : (
                    'Local proving only works for blueprints compiled with Circom'
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="flex w-full flex-col gap-1">
        <h4 className="text-xl font-bold text-grey-800">Select Emails</h4>
        {fetchedEmails.filter((email) => email.valid).length === 0 && !isFetchEmailLoading ? (
          <p className="text-base font-medium text-grey-700">
            No matching emails were found in your inbox
          </p>
        ) : (
          <>
            <p className="text-base font-medium text-grey-700">
              Choose the emails you want to create proofs for.
            </p>
            <p className="text-base font-medium text-grey-700">
              <span className="font-bold text-grey-900">Note</span> - If you select to create the
              proofs remotely, your emails will be sent to our secured service for proof generation.
              Emails will be deleted once the proofs are generated
            </p>
          </>
        )}
      </div>

      {renderEmailsTable()}
    </div>
  );
};

export default SelectEmails;
