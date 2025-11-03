'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useCreateBlueprintStore } from '../store';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { getMaxEmailBodyLength, parseEmail, Status, ZkFramework } from '@zk-email/sdk';
import Image from 'next/image';
import { Select } from '@/components/ui/select';
// Client computes DKIM modulus length via server API to use Node crypto

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

  useEffect(() => {
    if (store.blueprint) {
      store.blueprint.assignPreferredZkFramework(emlContent);
    }
  }, [emlContent]);

  console.log(isNoirIncompatible, "isNoirIncompatible", store.clientZkFramework)

  return (
    <div className="flex flex-col gap-6">
      <Checkbox
        title="Skip body hash check"
        helpText="Enable to ignore the contents on the email and only extract data from the headers"
        checked={store.ignoreBodyHashCheck}
        onCheckedChange={(checked) => {
          setField('ignoreBodyHashCheck', !!checked);
          setField('removeSoftLinebreaks', !checked);
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
            console.log(isNoirIncompatible, "isNoirIncompatible")
            setIsNoirIncompatible(true);
          } else {
            setIsNoirIncompatible(false);
          }
          console.log('setting clientZkFramework to ', value);
          setField('clientZkFramework', value);
        }}
        options={
          process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === 'staging'
            ? [
                { label: 'Circom', value: ZkFramework.Circom },
                { label: 'Noir', value: ZkFramework.Noir },
              ]
            : [{ label: 'Circom', value: ZkFramework.Circom }]
        }
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
