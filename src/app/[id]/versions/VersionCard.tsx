import { getDateToNowStr, getStatusIcon } from '@/app/utils';

import { getStatusColorLight, getStatusName } from '@/app/utils';
import Image from 'next/image';
import { Blueprint, Status } from '@zk-email/sdk';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface VersionCardProps {
  blueprint: Blueprint;
  isLatest: boolean;
  onDelete: () => {};
}

const VersionCard = ({ blueprint, isLatest = false, onDelete }: VersionCardProps) => {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-white p-6 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">v {blueprint.props.version}</h2>
          <span
            className={`flex flex-row gap-1 rounded-full px-2 py-1 text-xs font-semibold ${getStatusColorLight(
              blueprint.props.status
            )}`}
          >
            <Image
              width={12}
              height={12}
              src={getStatusIcon(blueprint.props.status)}
              alt={getStatusName(blueprint.props.status)}
            />
            {getStatusName(blueprint.props.status)}
          </span>
        </div>
        <p
          className="text-sm font-medium text-grey-700"
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
          <Button
            className="hidden md:inline-flex"
            variant="secondary"
            startIcon={<Image src="/assets/Download.svg" alt="Download" width={16} height={16} />}
            size="sm"
            disabled={blueprint.props.status !== Status.Done}
            onClick={() => router.push(`/${blueprint.props.id}/download`)}
          >
            Download
          </Button>
          <Link className="hidden md:block" href={`/create/${blueprint.props.id}`}>
            <Button
              variant="secondary"
              startIcon={<Image src="/assets/Edit.svg" alt="Edit" width={16} height={16} />}
              size="sm"
            >
              Edit
            </Button>
          </Link>
          <Link className="hidden md:block" href={`/${blueprint.props.id}/parameters`}>
            <Button
              variant="secondary"
              startIcon={<Image src="/assets/Parameters.svg" alt="Edit" width={16} height={16} />}
              size="sm"
            >
              Parameters
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href={'https://t.me/zkemail'} target="_blank">
            <Button
              variant="destructive"
              startIcon={<Image src="/assets/LinkBreak.svg" alt="Report" width={16} height={16} />}
              size="sm"
            >
              Report
            </Button>
          </Link>
          {blueprint.props.status === Status.Draft && isLatest && (
            <Button
              variant="destructive"
              startIcon={<Image src="/assets/Trash.svg" alt="Delete" width={16} height={16} />}
              size="sm"
              onClick={onDelete}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionCard;
