import { getDateToNowStr, getStatusIcon } from '@/app/utils';

import { getStatusColorLight, getStatusName } from '@/app/utils';
import Image from 'next/image';
import { Blueprint, Status } from '@zk-email/sdk';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useEffect } from 'react';
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

interface VersionCardProps {
  blueprint: Blueprint;
  isLatest: boolean;
  onDelete: () => {};
}

const VersionCard = ({ blueprint, isLatest = false, onDelete }: VersionCardProps) => {
  const router = useRouter();
  const { isAdmin } = useAuthStore();

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
            {/* <Image
              width={12}
              height={12}
              src={getStatusIcon(blueprint.props.status)}
              alt={getStatusName(blueprint.props.status)}
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            /> */}
            {getStatusName(blueprint.props.status)}
          </span>
        </div>
        <p
          className="text-sm font-regular text-grey-700"
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
          <Link href={`/${blueprint.props.id}`}>
            <Button size="sm">Try it</Button>
          </Link>
          <Link className="hidden md:block" href={`/create/${blueprint.props.id}`}>
            <Button
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
          </Link>
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="flex flex-row gap-0.5 rounded-md border border-red-300 bg-red-100 px-2 py-1 text-red-500"
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
                  size="sm"
                >
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this version and it's
                    data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionCard;
