import { debounce, getDateToNowStr, getStatusIcon } from '@/app/utils';

import { getStatusColorLight, getStatusName } from '@/app/utils';
import Image from 'next/image';
import { Blueprint, Status } from '@zk-email/sdk';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import ModalGenerator from '@/components/ModalGenerator';
import { Input } from '@/components/ui/input';
import { useCreateBlueprintStore } from '@/app/create/[id]/store';
import { Textarea } from '@/components/ui/textarea';
import { getFileContent } from '@/lib/utils';
import { Step } from '../store';
import DragAndDropFile from '@/app/components/DragAndDropFile';

interface VersionCardProps {
  blueprint: Blueprint;
  isLatest: boolean;
  onDelete: () => Promise<void>;
  isDeleteBlueprintLoading: boolean;
}

enum BlueprintEditMethod {
  Basic = 'basic',
  Advanced = 'advanced',
}

const VersionCard = ({
  blueprint,
  isLatest = false,
  onDelete,
  isDeleteBlueprintLoading,
}: VersionCardProps) => {
  const router = useRouter();
  const { isAdmin } = useAuthStore();

  const store = useCreateBlueprintStore();
  const { saveDraft, setToExistingBlueprint } = store;

  const validationErrors = useCreateBlueprintStore((state) => state.validationErrors);

  const { setField } = store;

  const [file, setFile] = useState<File | null>(null);
  const [isFileInvalid, setIsFileInvalid] = useState(false);
  const [isEditBlueprintModalOpen, setIsEditBlueprintModalOpen] = useState(false);
  const [blueprintEditMethod, setBlueprintEditMethod] = useState<BlueprintEditMethod | null>(null);
  const [isDKIMMissing, setIsDKIMMissing] = useState(false);
  const [isVerifyDKIMLoading, setIsVerifyDKIMLoading] = useState(false);
  const [isSaveDraftLoading, setIsSaveDraftLoading] = useState(false);
  const [isDeleteBlueprintModalOpen, setIsDeleteBlueprintModalOpen] = useState(false);

  useEffect(() => {
    if (blueprint.props.id) {
      setToExistingBlueprint(blueprint.props.id);
    }
  }, [blueprint]);

  useEffect(() => {
    console.log('isAdmin: ', isAdmin);
  }, [isAdmin]);

  const onCancelCompilation = async () => {
    if (!blueprint) return;
    try {
      await blueprint.cancelCompilation();
      toast.success('Compilation cancelled');
    } catch (err) {
      console.error('Failed to cancel blueprint compilation: ', err);
      toast.error('Failed to cancel blueprint compilation');
    }
  };

  const handleSaveDraft = async (notify = true) => {
    setIsSaveDraftLoading(true);
    try {
      const newId = await saveDraft();
      if (notify) {
        toast.success('Successfully saved draft');
      }
    } catch (err) {
      // TODO: Handle different kind of errors, e.g. per field errors
      toast.error('Failed to submit blueprint');
      console.error('Failed to submit blueprint: ', err);
    } finally {
      setIsSaveDraftLoading(false);
    }
  };

  const onClickNext = async () => {
    try {
      await handleSaveDraft();
      setIsEditBlueprintModalOpen(false);
      window.location.reload();
    } catch (err) {
      console.error('failed to save draft and move to next step: ', err);
    }
  };

  // Create a debounced version of the DKIM verification
  const debouncedVerifyDKIM = debounce(async (domain: string) => {
    setIsVerifyDKIMLoading(true);

    const url = new URL(`https://archive.zk.email/api/key`);
    const params = new URLSearchParams({
      domain: domain,
    });

    url.search = params.toString();

    try {
      const res = await fetch(url);
      const data = await res.json();

      setIsDKIMMissing(!data.length);
    } catch (error) {
      console.error('Failed to verify DKIM:', error);
    } finally {
      setIsVerifyDKIMLoading(false);
    }
  }, 500); // 500ms delay

  useEffect(() => {
    if (!store.senderDomain) {
      return;
    }

    debouncedVerifyDKIM(store.senderDomain);

    // Cleanup function to cancel pending debounced calls
    return () => {
      debouncedVerifyDKIM.cancel();
    };
  }, [JSON.stringify(store.senderDomain)]);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-white p-6 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">v {blueprint.props.version}</h2>
          <span
            className={`flex flex-row gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${getStatusColorLight(
              blueprint.props.status
            )}`}
          >
            {getStatusName(blueprint.props.status)}
          </span>
        </div>
        <p
          className="font-regular text-sm text-grey-700"
          title={blueprint.props.updatedAt!.toLocaleString()}
        >
          Updated {getDateToNowStr(blueprint.props.updatedAt)}
        </p>
      </div>
      <div>
        <p className="text-grey-700">{blueprint.props.description}</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {blueprint.props.status === Status.Done ? (
            <Link href={`/${blueprint.props.id}`}>
              <Button size="sm">Try it</Button>
            </Link>
          ) : null}
          {/* <Link className="hidden md:block" href={`/create/${blueprint.props.id}`}> */}
          <Button
            onClick={() => setIsEditBlueprintModalOpen(true)}
            variant="secondary"
            startIcon={
              <Image
                src="/assets/Edit.svg"
                alt="Edit"
                width={16}
                height={16}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
            }
            size="sm"
          >
            Edit
          </Button>
          {/* </Link> */}
          <Button
            className="hidden md:inline-flex"
            title="Download zkey + project"
            variant="secondary"
            size="smIcon"
            disabled={blueprint.props.status !== Status.Done}
            onClick={() => router.push(`/${blueprint.props.id}/download`)}
          >
            <Image
              src="/assets/Download.svg"
              alt="Download"
              width={16}
              height={16}
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            />
          </Button>
          <Link className="hidden md:block" href={`/${blueprint.props.id}/parameters`}>
            <Button variant="secondary" size="smIcon" title="View parameters">
              <Image
                src="/assets/ParametersIcon.svg"
                alt="Download"
                width={16}
                height={16}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href={'https://t.me/zkemail'} target="_blank">
            <Button
              variant="destructive"
              startIcon={
                <Image
                  src="/assets/LinkBreak.svg"
                  alt="Report"
                  width={16}
                  height={16}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
              }
              size="sm"
            >
              Report
            </Button>
          </Link>
          {blueprint.props.status === Status.InProgress && isLatest && (
            <Button
              size="sm"
              startIcon={
                <Image
                  src="/assets/RedClose.svg"
                  alt="close"
                  width={16}
                  height={16}
                  style={{
                    color: 'red',
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
              }
              variant="destructive"
              className="mx-auto w-max"
              onClick={onCancelCompilation}
            >
              Cancel Compilation
            </Button>
          )}
          {(blueprint.props.status === Status.Draft || isAdmin) && (
            <Button
              variant="destructive"
              startIcon={
                <Image
                  src="/assets/Trash.svg"
                  alt="Delete"
                  width={16}
                  height={16}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
              }
              onClick={() => setIsDeleteBlueprintModalOpen(true)}
              size="sm"
            >
              Delete
            </Button>
          )}
        </div>
      </div>
      <ModalGenerator
        isOpen={isDeleteBlueprintModalOpen}
        onClose={() => setIsDeleteBlueprintModalOpen(false)}
        title="Delete Version"
        submitButtonText="Continue"
        showActionBar={false}
        modalContent={
          <div>
            This action cannot be undone. This will permanently delete this version and it's data
            from our servers.
            <div className="mt-4 flex flex-row gap-4 justify-end">
              <div className="mt-4">
                <Button variant="destructive" onClick={() => setIsDeleteBlueprintModalOpen(false)}>
                  Cancel
                </Button>
              </div>
              <div className="mt-4">
                <Button
                  disabled={isDeleteBlueprintLoading}
                  loading={isDeleteBlueprintLoading}
                  onClick={() => {
                    onDelete().then(() => {
                      setIsDeleteBlueprintModalOpen(false);
                    });
                  }}
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        }
      />
      <ModalGenerator
        isOpen={isEditBlueprintModalOpen}
        onClose={() => {
          setIsEditBlueprintModalOpen(false);
          setBlueprintEditMethod(null);
        }}
        title="Edit Version"
        showActionBar={false}
        modalContent={
          <div className="flex flex-col items-center justify-center gap-4">
            {blueprintEditMethod === null ? (
              <div className="flex w-[calc(100vw-6rem)] flex-col items-center justify-center gap-4 md:w-[calc(768px-3rem)]">
                <div className="w-full">
                  <p>
                    {blueprint.props.title} (v{blueprint.props.version})
                  </p>
                  <p className="text-grey-700">
                    Choose the kind of edit you would like to make to this version?
                  </p>
                </div>
                <Image
                  src="/assets/EditVersion.svg"
                  alt="Edit Version"
                  height={214}
                  width={248}
                  className="my-4"
                />
                <div
                  className="cursor-pointer rounded-2xl border border-grey-200 p-6 transition-colors hover:bg-gray-50"
                  onClick={() => {
                    setBlueprintEditMethod(BlueprintEditMethod.Basic);
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xl">Basic Changes</p>
                    <div className="rounded-lg border border-[#C2F6C7] bg-[#ECFFEE] px-2 py-1 text-sm text-[#3AA345]">
                      Instant
                    </div>
                  </div>
                  <p className="text-base text-grey-700">
                    Make changes in the blueprint description, email query and sender domain fields.
                    Doesn't require you to upload the test eml.
                  </p>
                </div>
                <div
                  className="cursor-pointer rounded-2xl border border-grey-200 p-6 transition-colors hover:bg-gray-50"
                  onClick={() => setBlueprintEditMethod(BlueprintEditMethod.Advanced)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xl">Advanced Changes</p>
                    <div className="flex flex-row items-center gap-2">
                      <div className="rounded-lg border border-[#FFDBDE] bg-[#FFF6F7] px-2 py-1 text-sm text-[#C71B16]">
                        Recompiles
                      </div>
                      <div className="rounded-lg border border-[#FFDBDE] bg-[#FFF6F7] px-2 py-1 text-sm text-[#C71B16]">
                        Requires EML
                      </div>
                    </div>
                  </div>
                  <p className="text-base text-grey-700">
                    Basic changes + edit the cutoff value and the regex part. This requires you to
                    upload the sample eml. Recompilation might take few minutes.
                  </p>
                </div>
              </div>
            ) : blueprintEditMethod === BlueprintEditMethod.Basic ? (
              <div className="flex w-[calc(100vw-6rem)] flex-col gap-4 md:w-[calc(768px-3rem)]">
                <Input
                  title="Pattern Name"
                  value={store.title}
                  // disabled
                  onChange={(e) => {
                    setField('title', e.target.value);
                    // checkExistingBlueprint(e.target.value.replace(/\s+/g, '_'));
                  }}
                  // error={!!validationErrors.title}
                  // errorMessage={validationErrors.title}
                />
                <Input title="Slug" disabled value={store.slug} />
                <Textarea
                  title="Description"
                  placeholder="Enter a description"
                  value={store.description}
                  rows={3}
                  onChange={(e) => setField('description', e.target.value)}
                  errorMessage={validationErrors.description}
                />
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
                        As if you were searching for the email in your Gmail inbox. Only emails
                        matching this query will be shown to the user to prove when they sign in
                        with Gmail
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
                  onChange={(e) => {
                    setField('senderDomain', e.target.value);
                  }}
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
                        This is the domain used for DKIM verification, which may not exactly match
                        the senders domain (you can check via the d= field in the DKIM-Signature
                        header in your sample .eml). Note to only include the part after the @
                        symbol
                      </p>
                    </div>
                  }
                />
                <Button onClick={onClickNext} loading={isSaveDraftLoading}>
                  Save
                </Button>
              </div>
            ) : (
              <div className="flex w-[calc(100vw-6rem)] flex-col items-center justify-center gap-4 md:w-[calc(768px-3rem)]">
                <div className="w-full">
                  <p>
                    {blueprint.props.title} (v{blueprint.props.version})
                  </p>
                  <p className="text-grey-700">
                    Making changes in the regex or updating the cutoff values requires you to upload
                    the test eml.
                  </p>
                </div>
                <Image src="/assets/UploadEmlSVG.svg" alt="Edit Version" height={214} width={248} />
                <DragAndDropFile
                  accept=".eml"
                  file={file}
                  tooltipComponent={
                    <div className="w-[380px] rounded-2xl border border-grey-500 bg-white p-2">
                      <Image src="/assets/emlInfo.svg" alt="emlInfo" width={360} height={80} />
                      <p className="mt-3 text-base font-medium text-grey-700">
                        The test .eml file is a sample email used to check if all the provided
                        patterns (regex) work correctly. This helps confirm everything is set up
                        properly before blueprint creation. We always store this file locally and
                        never send it to our server.
                      </p>
                    </div>
                  }
                  title="Upload test .eml"
                  setFile={async (file: File | null) => {
                    if (!file || !blueprint.props.id) return;

                    setFile(file);
                    const emlFileContent = await getFileContent(file);
                    console.log('emlFileContent: ', emlFileContent);
                    await localStorage.setItem(
                      'blueprintEmls',
                      JSON.stringify({
                        [blueprint.props.id]: emlFileContent,
                      })
                    );
                    router.push(`/create/${blueprint.props.id}`);
                  }}
                />
              </div>
            )}
          </div>
        }
      />
    </div>
  );
};

export default VersionCard;
