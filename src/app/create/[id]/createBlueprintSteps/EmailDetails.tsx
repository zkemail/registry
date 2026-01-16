'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useCreateBlueprintStore } from '../store';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  getMaxEmailBodyLength,
  parseEmail,
  Status,
  ZkFramework,
  DecomposedRegex,
} from '@zk-email/sdk';
import Image from 'next/image';
import { Select } from '@/components/ui/select';
import { InfoIcon } from 'lucide-react';
// Client computes DKIM modulus length via server API to use Node crypto

// Helper function to detect body patterns
const hasBodyPatterns = (decomposedRegexes?: DecomposedRegex[]): boolean => {
  return decomposedRegexes?.some((regex) => regex.location === 'body') || false;
};

const EmailDetails = ({
  emlContent,
  publicDkimKey,
}: {
  emlContent: string;
  publicDkimKey: string | null;
}) => {
  const store = useCreateBlueprintStore();
  const validationErrors = useCreateBlueprintStore((state) => state.validationErrors);
  const { setField } = store;
  const [shaPrecomputeSelectorValidationErrors, setShaPrecomputeSelectorValidationErrors] =
    useState('');
  const [isNoirIncompatible, setIsNoirIncompatible] = useState(false);

  useEffect(() => {
    const updateEmailBodyMaxLength = async () => {
      if (!emlContent) {
        return;
      }

      const maxEmailBodyLength = await getMaxEmailBodyLength(
        emlContent,
        store.shaPrecomputeSelector || ''
      );

      setField('emailBodyMaxLength', (Math.ceil(maxEmailBodyLength / 512) + 1) * 512);
    };

    updateEmailBodyMaxLength();
  }, [JSON.stringify(store.shaPrecomputeSelector), JSON.stringify(store.ignoreBodyHashCheck)]);

  // Auto-select skip body hash if no body patterns exist
  useEffect(() => {
    // Only auto-select if:
    // 1. Currently false (not manually set)
    // 2. There are no body patterns
    // 3. Not already auto-selected (to avoid re-triggering)
    if (
      !store.ignoreBodyHashCheck &&
      !hasBodyPatterns(store.decomposedRegexes) &&
      !store.ignoreBodyHashCheckAutoSelected
    ) {
      setField('ignoreBodyHashCheck', true);
      setField('removeSoftLinebreaks', false);
      setField('ignoreBodyHashCheckAutoSelected', true);

      // Auto-save to backend to persist this optimization
      // Use a small delay to batch the state updates
      setTimeout(async () => {
        try {
          await store.saveDraft();
        } catch (err) {
          // Non-critical error, don't show to user
        }
      }, 100);
    }
    // Only run on mount - no refetch means no override
  }, []);

  // Auto-uncheck if body patterns exist (user added them in previous step)
  useEffect(() => {
    if (store.ignoreBodyHashCheck && hasBodyPatterns(store.decomposedRegexes)) {
      setField('ignoreBodyHashCheck', false);
      setField('removeSoftLinebreaks', true);
    }
  }, [store.decomposedRegexes, store.ignoreBodyHashCheck, setField]);

  return (
    <div className="flex flex-col gap-6">
      {/* Performance optimization notification */}
      {store.ignoreBodyHashCheck && !hasBodyPatterns(store.decomposedRegexes) && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-start gap-2">
            <InfoIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
            <div className="text-sm text-blue-800">
              <p className="mb-1 font-semibold">Performance Optimization Applied</p>
              <p>
                Since your blueprint doesn't extract any data from the email body, the "Skip body
                hash check" option has been automatically enabled. This significantly improves:
              </p>
              <ul className="ml-5 mt-1 list-disc space-y-0.5">
                <li>Circuit compilation time</li>
                <li>Proof generation time</li>
                <li>Overall circuit constraint count</li>
              </ul>
              <p className="mt-2">
                You can disable this option if you need body hash verification for security
                purposes, though it will increase processing time significantly.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Warning when manually disabled without body patterns */}
      {!store.ignoreBodyHashCheck &&
        !hasBodyPatterns(store.decomposedRegexes) &&
        store.ignoreBodyHashCheckAutoSelected === false && (
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <div className="flex items-start gap-2">
              <InfoIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
              <div className="text-sm text-yellow-800">
                <p className="mb-1 font-semibold">Performance Impact Warning</p>
                <p>
                  Body hash verification is enabled even though your blueprint doesn't extract data
                  from the email body. This will increase compilation and proof generation time
                  significantly without providing additional functionality.
                </p>
              </div>
            </div>
          </div>
        )}
      <Checkbox
        title="Skip body hash check"
        checked={store.ignoreBodyHashCheck}
        disabled={hasBodyPatterns(store.decomposedRegexes)}
        onCheckedChange={(checked) => {
          // Warn if disabling optimization without body patterns
          if (!checked && !hasBodyPatterns(store.decomposedRegexes)) {
            console.warn(
              'Disabling skip body hash without body patterns will increase processing time'
            );
          }

          setField('ignoreBodyHashCheck', !!checked);
          setField('removeSoftLinebreaks', !checked);
          // Clear auto-selected flag when user manually changes
          setField('ignoreBodyHashCheckAutoSelected', false);
        }}
      />
      {!store.ignoreBodyHashCheck && (
        <div className="">
          <Input
            title="Max Email Body Length"
            disabled={store.ignoreBodyHashCheck}
            placeholder="4032"
            error={!!validationErrors.emailBodyMaxLength}
            errorMessage={
              validationErrors.emailBodyMaxLength
                ? `${validationErrors.emailBodyMaxLength} (Next multiple of 64 is ${Math.ceil((store.emailBodyMaxLength ?? 0) / 64) * 64})`
                : ''
            }
            max={9984}
            min={0}
            startIcon={<Image src="/assets/Info.svg" alt="info" width={16} height={16} />}
            type="number"
            helpText="Must be a multiple of 64. If you have a Email Body Cutoff Value, it should be the length of the body after that value"
            value={store.emailBodyMaxLength}
            onChange={(e) => setField('emailBodyMaxLength', parseInt(e.target.value))}
          />
          <Input
            title="Email Body Cutoff Value (optional)"
            placeholder=">Not my Account<"
            type="text"
            disabled={store.ignoreBodyHashCheck}
            helpText="We will cut-off the part of the email body before this value, so that we only compute the regex on the email body after this value. This is to reduce the number of constraints in the circuit for long email bodies where only regex matches at the end matter"
            value={store.shaPrecomputeSelector}
            error={!!shaPrecomputeSelectorValidationErrors}
            errorMessage={shaPrecomputeSelectorValidationErrors}
            onChange={async (e) => {
              setField('shaPrecomputeSelector', e.target.value);

              if (!emlContent) {
                return;
              }

              const parsedEmail = await parseEmail(emlContent);
              const value = e.target.value;

              if (!value) {
                setShaPrecomputeSelectorValidationErrors('');
                return;
              }

              const matches = parsedEmail.cleanedBody.split(value).length - 1;
              if (matches === 0) {
                setShaPrecomputeSelectorValidationErrors('Value not found in email body');
              } else if (matches > 1) {
                setShaPrecomputeSelectorValidationErrors(
                  'Value appears multiple times in email body. Please use unique value else it will be cut off at the first occurrence'
                );
              } else {
                setShaPrecomputeSelectorValidationErrors('');
              }
            }}
            tooltipComponent={
              <div className="w-[380px] rounded-2xl border border-grey-500 bg-white p-2">
                <Image
                  src="/assets/emailBodyCutOffValue.svg"
                  className="rounded-t-xl"
                  alt="emailQueryInfo"
                  width={360}
                  height={80}
                />
                <p className="mt-3 text-base font-medium text-grey-700">
                  We will cut-off the part of the email body before this value, so that we only
                  compute the regex on the email body after this value. This is to reduce the number
                  of constraints for long email bodies where only regex matches at the end matter
                </p>
              </div>
            }
          />
        </div>
      )}
      <Select
        label="Client Zk Framework"
        value={store.clientZkFramework}
        onChange={async (value) => {
          console.log('dkimPublicKey: ', publicDkimKey);
          let dkimKeyBitLength: number | undefined = undefined;
          try {
            const res = await fetch('/api/dkimKeyBitLength', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ p: publicDkimKey ?? '' }),
            });
            if (res.ok) {
              const data = await res.json();
              dkimKeyBitLength = data?.bits;
            }
          } catch (e) {
            // ignore; will treat as unknown length
          }
          console.log('dkimKeyBitLength: ', dkimKeyBitLength);

          if (value === ZkFramework.Noir && dkimKeyBitLength && dkimKeyBitLength !== 2048) {
            console.log(isNoirIncompatible, 'isNoirIncompatible');
            setIsNoirIncompatible(true);
          } else {
            setIsNoirIncompatible(false);
          }
          console.log('setting clientZkFramework to ', value);
          setField('clientZkFramework', value);
        }}
        options={[
          // TODO: Re-enable Circom option once client-side Circom proving is fixed
          // { label: 'Circom', value: ZkFramework.Circom },
          { label: 'Noir', value: ZkFramework.Noir },
        ]}
      />
      {isNoirIncompatible ? (
        <div className="flex w-full flex-row gap-7 rounded-2xl border border-[#FFF085] bg-[#FEFCE8] px-4 py-6">
          <Image src="/assets/ClientFrameworkWarning.svg" alt="warning" width={160} height={120} />
          <div>
            <p className="text-lg font-medium text-grey-900">Temporary compatibility issue!</p>
            <p className="text-base font-medium text-grey-700">
              The uploaded eml uses an older security key(1024-bit RSA).
            </p>
            <p className="flex flex-row items-start gap-2 text-base font-medium text-grey-700">
              <Image src="/assets/YellowWarningCircle.svg" alt="info" width={16} height={16} />
              We're running into some issues with Noir proofs for 1024-bit RSA emails. But don't
              worry, we're on it and working to get past this!
            </p>
          </div>
        </div>
      ) : null}

      <Select
        label="Server Zk Framework"
        value={store.serverZkFramework}
        onChange={(value) => {
          console.log('setting serverzkframework to ', value);
          setField('serverZkFramework', value);
        }}
        options={
          process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === 'staging'
            ? [
                { label: 'SP1', value: ZkFramework.Sp1 },
                { label: 'Circom', value: ZkFramework.Circom },
              ]
            : [{ label: 'Circom', value: ZkFramework.Circom }]
        }
      />
    </div>
  );
};

export default EmailDetails;
