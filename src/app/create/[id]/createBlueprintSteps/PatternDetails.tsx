'use client';

import DragAndDropFile from '@/app/components/DragAndDropFile';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useCreateBlueprintStore } from '../store';
import Image from 'next/image';
import sdk from '@/lib/sdk';
import { useDebouncedCallback } from 'use-debounce';
import { findOrCreateDSP } from '@/app/utils';
import { toast } from 'react-toastify';
import { useState } from 'react';
import { getFileContent } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { getMaxEmailBodyLength, parseEmail, Status, ZkFramework } from '@zk-email/sdk';

const PatternDetails = ({
  id,
  isFileInvalid,
  file,
  savedEmls,
  skipEmlUpload,
  setSkipEmlUpload,
  setSavedEmls,
  setFile,
  emlContent,
  isVerifyDKIMLoading,
  isDKIMMissing,
}: {
  id: string;
  isFileInvalid: boolean;
  file: File | null;
  savedEmls: Record<string, string>;
  skipEmlUpload: boolean;
  setSkipEmlUpload: (skipEmlUpload: boolean) => void;
  setSavedEmls: (savedEmls: Record<string, string>) => void;
  setFile: (file: File | null) => void;
  emlContent: string;
  isVerifyDKIMLoading: boolean;
  isDKIMMissing: boolean;
}) => {
  const githubUserName = useAuthStore((state) => state.username);
  const store = useCreateBlueprintStore();
  const validationErrors = useCreateBlueprintStore((state) => state.validationErrors);
  const [isFileUploading, setIsFileUploading] = useState(false);

  const { setField } = store;

  const [isCheckExistingBlueprintLoading, setIsCheckExistingBlueprintLoading] = useState(false);

  const checkExistingBlueprint = useDebouncedCallback(async (circuitName: string) => {
    setIsCheckExistingBlueprintLoading(true);
    let existingBlueprint = false;
    try {
      const blueprint = await sdk.getBlueprint(`${githubUserName}/${circuitName}@v1`); // If blueprint exists, it will always have v1 suffix
      existingBlueprint = !!blueprint;
    } catch {
      console.log('Blueprint does not exist yet');
    }

    if (!existingBlueprint) {
      setField('circuitName', `${circuitName}`);
      setField('slug', `${githubUserName}/${circuitName}`);
    } else {
      // need to check the number of circuits that exists with same name
      const results = await sdk.listBlueprints({
        search: circuitName,
      });

      const incrementedCircuitName = `${circuitName}_${
        results.filter((bp) => bp.props.slug?.split('_')[0] === `${githubUserName}/${circuitName}`)
          .length
      }`;
      setField('circuitName', incrementedCircuitName);
      setField('slug', `${githubUserName}/${incrementedCircuitName}`);
    }
    setIsCheckExistingBlueprintLoading(false);
  }, 300);

  return (
    <div className="flex flex-col gap-6">
      <Input
        title="Pattern Name"
        // disabled={id !== 'new'}
        placeholder="Name of the Blueprint"
        value={store.title}
        onChange={(e) => {
          const newTitle = e.target.value;
          setField('title', newTitle);

          // Only check for blueprint name if there are no spaces
          if (!newTitle.includes(' ')) {
            checkExistingBlueprint(newTitle.replace(/\s+/g, '_'));
          }
        }}
        error={!!validationErrors.title || store.title?.includes(' ')}
        errorMessage={
          validationErrors.title ||
          (store.title?.includes(' ') ? 'Spaces are not allowed in the pattern name' : '')
        }
      />
      <Input title="Slug" disabled value={store.slug} loading={isCheckExistingBlueprintLoading} />
      <Textarea
        title="Description"
        placeholder="Prove that you own a particular GitHub account"
        value={store.description}
        rows={3}
        onChange={(e) => setField('description', e.target.value)}
        errorMessage={validationErrors.description}
      />
      {/* TODO: Add check for email body max length */}
      {emlContent && id !== 'new' ? null : (
        <DragAndDropFile
          accept=".eml"
          file={file}
          loading={isFileUploading}
          tooltipComponent={
            <div className="w-[380px] rounded-2xl border border-grey-500 bg-white p-2">
              <Image src="/assets/emlInfo.svg" alt="emlInfo" width={360} height={80} />
              <p className="mt-3 text-base font-medium text-grey-700">
                The test .eml file is a sample email used to check if all the provided patterns
                (regex) work correctly. This helps confirm everything is set up properly before
                blueprint creation. We always store this file locally and never send it to our
                server.
              </p>
            </div>
          }
          title="Upload test .eml"
          id="drag-and-drop-emails"
          data-testid="drag-and-drop-emails"
          helpText="Our AI will autofill fields based on contents inside your mail. Don't worry you can edit them later"
          setFile={async (e) => {
            if (!e) {
              setFile(null);
              return;
            }

            try {
              setIsFileUploading(true);
              const response = await findOrCreateDSP(e);
              const emlFileContent = await getFileContent(e);
              // @ts-ignore
              setSavedEmls({ ...savedEmls, [id]: emlFileContent });
              console.log(response);
            } catch (error) {
              toast.warning(
                'We were unable to locate the public key for this email. This typically happens with older emails. You can still make regexes without the DKIM signature passing.'
              );
            } finally {
              setIsFileUploading(false);
            }

            setFile(e);
          }}
          errorMessage={isFileInvalid ? 'File is invalid' : ''}
        />
      )}
      <div className="flex items-center gap-2">
        <Checkbox
          checked={skipEmlUpload}
          onCheckedChange={(checked) => setSkipEmlUpload(!!checked)}
        />
        <p className="text-sm text-grey-700">Skip EML upload and use the default .eml file</p>
      </div>
      <Input
        title="Email Query"
        disabled={store.clientStatus === Status.Done && store.serverStatus === Status.Done}
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
        errorMessage={
          validationErrors.emailHeaderMaxLength
            ? `${validationErrors.emailHeaderMaxLength} (Next multiple of 64 is ${Math.ceil((store.emailHeaderMaxLength ?? 0) / 64) * 64})`
            : ''
        }
        helpText="Must be a multiple of 64"
        value={store.emailHeaderMaxLength || ''}
        onChange={(e) => setField('emailHeaderMaxLength', parseInt(e.target.value))}
      />
    </div>
  );
};

export default PatternDetails;
