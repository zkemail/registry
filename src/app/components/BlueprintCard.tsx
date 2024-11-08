import Image from 'next/image';
import { getDateToNowStr, getStatusColorLight, getStatusIcon, getStatusName } from '../utils';
import { Blueprint } from '@zk-email/sdk';
import { toast } from 'react-toastify';

interface BlueprintCardProps {
  blueprint: Blueprint;
}

const BlueprintCard = ({ blueprint }: BlueprintCardProps) => {
  return (
    <div className="rounded-2xl border bg-white p-6 transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{blueprint.props.title}</h2>
          <span
            className={`flex flex-row gap-1 rounded-full px-2 py-1 text-xs font-semibold ${getStatusColorLight(
              blueprint.props.status
            )}`}
          >
            <Image
              width={12}
              height={12}
              src={getStatusIcon(blueprint.props.status)}
              alt={blueprint.props.status?.toString() || 'Draft'}
            />
            {getStatusName(blueprint.props.status)}
          </span>
        </div>
        {/* <div className="flex items-center gap-4 text-sm text-grey-600">
          <span className="flex flex-row gap-1 rounded border border-grey-400 px-2 py-1">
            <Image width={16} height={16} src="assets/Users.svg" alt="views" /> {stats.views}
          </span>
          <span className="flex flex-row gap-1 rounded border border-grey-500 bg-grey-100 px-2 py-1 text-grey-800">
            <Image width={16} height={16} src="assets/Star.svg" alt="stars" /> Stars | {stats.stars}
          </span>
        </div> */}
      </div>
      <p className="text-md mb-2 inline-flex items-center font-medium text-grey-800">
        {blueprint.props.slug}
        <span
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            navigator.clipboard.writeText(blueprint.props.slug);
            toast.success('Copied to clipboard');
          }}
          className="ml-2 cursor-pointer rounded-sm border border-grey-500 bg-neutral-100 p-1 py-0.5"
        >
          <Image src="/assets/LinkIcon.svg" alt="copy" width={16} height={16} />
        </span>
      </p>
      <p className="text-md mb-4 font-medium text-grey-800">{blueprint.props.description}</p>

      <div className="mt-4 flex flex-row items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-md font-medium text-grey-800">Extractable values:</p>
          {blueprint.props.decomposedRegexes?.map((dr, index) => (
            <div
              key={index}
              className="h-fit rounded-md border border-grey-900 px-2 py-[1px] text-sm font-light leading-[18px]"
            >
              {dr.name}
            </div>
          ))}
        </div>
        <p className="text-sm text-grey-700" title={blueprint.props.updatedAt?.toLocaleString()}>
          Updated {getDateToNowStr(blueprint.props.updatedAt)}
        </p>
      </div>
    </div>
  );
};

export default BlueprintCard;
