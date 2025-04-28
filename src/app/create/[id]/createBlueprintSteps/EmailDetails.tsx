'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useCreateBlueprintStore } from '../store';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { getMaxEmailBodyLength, parseEmail, ZkFramework } from '@zk-email/sdk';
import Image from 'next/image';
import { Select } from '@/components/ui/select';

const EmailDetails = ({
  emlContent,
  isDKIMMissing,
  isVerifyDKIMLoading,
}: {
  emlContent: string;
  isDKIMMissing: boolean;
  isVerifyDKIMLoading: boolean;
}) => {
  const store = useCreateBlueprintStore();
  const validationErrors = useCreateBlueprintStore((state) => state.validationErrors);
  const { setField } = store;
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [shaPrecomputeSelectorValidationErrors, setShaPrecomputeSelectorValidationErrors] =
    useState('');

  useEffect(() => {
    const updateEmailBodyMaxLength = async () => {
      if (!emlContent) {
        return;
      }

      const parsedEmail = await parseEmail(emlContent);
      const maxEmailBodyLength = await getMaxEmailBodyLength(
        parsedEmail.cleanedBody,
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

  return (
    <div className="flex flex-col gap-6">
      <Input
        title="Email Query"
        disabled={store.status === 3}
        value={store.emailQuery}
        onChange={(e) => setField('emailQuery', e.target.value)}
        placeholder="Password request from: contact@x.com"
        error={!!validationErrors.emailQuery}
        errorMessage={validationErrors.emailQuery}
        tooltipComponent={
          <div className="w-[380px] rounded-2xl border border-grey-500 bg-white p-2">
            <Image
              src="/assets/emailQueryInfo.svg"
              className="rounded-t-xl"
              alt="emailQueryInfo"
              width={360}
              height={80}
            />
            <p className="mt-3 text-base font-medium text-grey-700">
              As if you were searching for the email in your Gmail inbox. Only emails matching this
              query will be shown to the user to prove when they sign in with Gmail
            </p>
          </div>
        }
      />
      <Input
        title="Sender domain"
        loading={isVerifyDKIMLoading}
        placeholder="twitter.com"
        helpText="This is the domain used for DKIM verification, which may not exactly match the senders domain (you can check via the d= field in the DKIM-Signature header). Note to only include the part after the @ symbol"
        value={store.senderDomain}
        onChange={(e) => setField('senderDomain', e.target.value)}
        error={(!!validationErrors.senderDomain || isDKIMMissing) && !isVerifyDKIMLoading}
        errorMessage={
          isVerifyDKIMLoading ? (
            'Finding DKIM in archive...'
          ) : isDKIMMissing ? (
            <span className="text-red-500">
              DKIM publickey is missing. Please add a DKIM record at{' '}
              <a
                href="https://archive.zk.email"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                https://archive.zk.email
              </a>
            </span>
          ) : (
            validationErrors.senderDomain
          )
        }
        tooltipComponent={
          <div className="w-[380px] rounded-2xl border border-grey-500 bg-white p-2">
            <Image
              src="/assets/senderDomainInfo.svg"
              className="rounded-t-xl"
              alt="emailQueryInfo"
              width={360}
              height={80}
            />
            <p className="mt-3 text-base font-medium text-grey-700">
              This is the domain used for DKIM verification, which may not exactly match the senders
              domain (you can check via the d= field in the DKIM-Signature header in your sample
              .eml). Note to only include the part after the @ symbol
            </p>
          </div>
        }
      />
      <Input
        title="Max Email Header Length"
        placeholder="1024"
        type="number"
        min={0}
        error={!!validationErrors.emailHeaderMaxLength}
        errorMessage={validationErrors.emailHeaderMaxLength}
        helpText="Must be a multiple of 64"
        value={store.emailHeaderMaxLength || ''}
        onChange={(e) => setField('emailHeaderMaxLength', parseInt(e.target.value))}
      />
      <Button
        variant="secondary"
        size="sm"
        className="w-fit"
        onClick={() => setShowOptionalDetails(!showOptionalDetails)}
      >
        {showOptionalDetails ? '- Hide optional details' : '+ View optional details'}
      </Button>
      {showOptionalDetails && (
        <>
          <Select
            label="Zk Framework"
            value={store.zkFramework}
            onChange={(value) => {
              setField('zkFramework', value);
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
            <div className="ml-2">
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
                      compute the regex on the email body after this value. This is to reduce the
                      number of constraints for long email bodies where only regex matches at the
                      end matter
                    </p>
                  </div>
                }
              />
              <Input
                title="Max Email Body Length"
                disabled={store.ignoreBodyHashCheck}
                placeholder="4032"
                error={!!validationErrors.emailBodyMaxLength}
                errorMessage={validationErrors.emailBodyMaxLength}
                max={9984}
                min={0}
                startIcon={<Image src="/assets/Info.svg" alt="info" width={16} height={16} />}
                type="number"
                helpText="Must be a multiple of 64. If you have a Email Body Cutoff Value, it should be the length of the body after that value"
                value={store.emailBodyMaxLength}
                onChange={(e) => setField('emailBodyMaxLength', parseInt(e.target.value))}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmailDetails;
