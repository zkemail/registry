import Image from 'next/image';
import { getDateToNowStr, getStatusColorLight, getStatusIcon, getStatusName } from '../utils';
import { Blueprint } from '@zk-email/sdk';
import { toast } from 'react-toastify';
import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/useAuthStore';

interface BlueprintCardProps {
  blueprint: Blueprint;
  setStarred: () => Promise<void>;
  setUnStarred: () => Promise<void>;
  starred: boolean;
}

const BlueprintCard = ({ blueprint, setStarred, setUnStarred, starred }: BlueprintCardProps) => {
  let [stars, setStars] = useState(blueprint.props.stars);
  const isLoggedIn = !!useAuthStore.getState().token;
  const onStar = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (starred) {
      await setUnStarred();
    } else {
      await setStarred();
    }
    setStars(blueprint.props.stars || 0);
  };

  return (
    <div className="rounded-2xl border bg-white p-6 transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex flex-row flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold">{blueprint.props.title}</h2>
          {isLoggedIn && (
            <span
              className={`hidden flex-row gap-1 rounded-md px-2 py-1 text-xs font-semibold md:flex ${getStatusColorLight(
                blueprint.props.status
              )}`}
            >
              {/* <Image
                width={12}
                height={12}
                src={getStatusIcon(blueprint.props.status)}
                alt={blueprint.props.status?.toString() || 'Draft'}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              /> */}
              {getStatusName(blueprint.props.status)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-grey-600">
          <button
            onClick={onStar}
            className="flex flex-row gap-1 rounded-md border border-grey-500 bg-neutral-200 px-2 py-1 text-grey-800"
          >
            <Image
              width={16}
              height={16}
              src={starred ? 'assets/StarFilled.svg' : 'assets/Star.svg'}
              alt="stars"
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            />{' '}
            {(stars || 0) < 2 ? 'Star' : 'Stars'} | {stars}
          </button>
        </div>
      </div>
      <div className="mb-2 inline-flex w-full flex-row items-center">
        <p className="text-md overflow-hidden text-ellipsis font-medium text-grey-800">
          {blueprint.props.slug}
        </p>
        {/* <div
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            navigator.clipboard.writeText(
              (blueprint?.props?.slug || '') + '@v' + (blueprint?.props?.version || '')
            );
            toast.success('Copied to clipboard');
          }}
          className="ml-2 cursor-pointer rounded-sm border border-grey-500 bg-neutral-100 p-1 py-0.5 md:flex"
        >
          <Image
            src="/assets/LinkIcon.svg"
            alt="copy"
            width={16}
            height={16}
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
          />
        </div> */}
      </div>
      <p className="text-md mb-4 font-medium text-grey-800">{blueprint.props.description}</p>
      <div className="mt-4 flex flex-col items-start justify-between md:flex-row md:items-end">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-md font-medium text-grey-800">Values extracted:</p>
          {blueprint.props.decomposedRegexes?.map((dr, index) => (
            <div
              key={index}
              className="h-fit rounded-md border border-neutral-300 bg-neutral-200 px-2 py-[1px] text-sm font-light leading-[18px] text-grey-900"
            >
              {dr.name}
            </div>
          ))}
        </div>
        <div className="mt-2 flex w-full flex-row items-center justify-between gap-2 md:mt-0 md:w-auto">
          <span
            className={`flex flex-row gap-1 rounded-lg px-2 py-1 text-xs font-semibold md:hidden ${getStatusColorLight(
              blueprint.props.status
            )}`}
          >
            {/* <Image
              width={12}
              height={12}
              src={getStatusIcon(blueprint.props.status)}
              alt={blueprint.props.status?.toString() || 'Draft'}
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            /> */}
            {getStatusName(blueprint.props.status)}
          </span>
          <p
            className="w-max text-sm text-grey-700"
            title={blueprint.props.updatedAt?.toLocaleString()}
          >
            Updated {getDateToNowStr(blueprint.props.updatedAt)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BlueprintCard;
