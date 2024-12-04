'use client';

import DragAndDropFile from '@/app/components/DragAndDropFile';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { useCreateBlueprintStore } from '../store';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

const EmailDetails = ({ isDKIMMissing }: { isDKIMMissing: boolean }) => {
  const store = useCreateBlueprintStore();
  const validationErrors = useCreateBlueprintStore((state) => state.validationErrors);
  const { setField } = store;
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <Input
        title="Email Query"
        value={store.emailQuery}
        onChange={(e) => setField('emailQuery', e.target.value)}
        placeholder="Password request from: contact@x.com"
        helpText="As if you were searching for the email in your Gmail inbox. Only emails matching this query will be shown to the user to prove when they sign in with Gmail"
        error={!!validationErrors.emailQuery}
        errorMessage={validationErrors.emailQuery}
      />
      <Input
        title="Sender domain"
        placeholder="twitter.com"
        helpText="This is the domain used for DKIM verification, which may not exactly match the senders domain (you can check via the d= field in the DKIM-Signature header). Note to only include the part after the @ symbol"
        value={store.senderDomain}
        onChange={(e) => setField('senderDomain', e.target.value)}
        error={!!validationErrors.senderDomain || isDKIMMissing}
        errorMessage={
          isDKIMMissing
            ? 'DKIM is missing. Please add a DKIM record at https://archive.prove.email'
            : validationErrors.senderDomain
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
          <Checkbox
            title="Skip body hash check"
            helpText="Enable to ignore the contents on the email and only extract data from the headers"
            checked={store.ignoreBodyHashCheck}
            onCheckedChange={(checked) => {
              setField('ignoreBodyHashCheck', checked);
              setField('removeSoftLinebreaks', !checked);
            }}
          />
          {!store.ignoreBodyHashCheck && (
            <div className="ml-2">
              <Input
                title="Max Email Body Length"
                disabled={store.ignoreBodyHashCheck}
                placeholder="4032"
                error={!!validationErrors.emailBodyMaxLength}
                errorMessage={validationErrors.emailBodyMaxLength}
                max={8192}
                min={0}
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
                onChange={(e) => setField('shaPrecomputeSelector', e.target.value)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmailDetails;
