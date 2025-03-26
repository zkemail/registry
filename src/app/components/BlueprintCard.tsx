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
    <div className="flex flex-col rounded-[20px] border bg-white overflow-hidden transition-shadow hover:shadow-[0px_4px_8px_rgba(0,0,0,0.1)]">
      {/* Top div with title and slug */}
      <div className="p-6 pb-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex flex-row flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold">{blueprint.props.title}</h2>
          </div>
          {/* Status and Star button grouped together */}
          <div className="flex items-center gap-3 text-sm text-grey-600">
            {isLoggedIn && (
              <span
                className={`flex flex-row gap-1 rounded-md px-2 py-[6px] text-[14px] leading-[18px] font-medium ${getStatusColorLight(
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
            <button
              onClick={onStar}
              className="flex flex-row gap-1 rounded-md border border-grey-500 bg-neutral-200 px-2 py-1 text-grey-800"
            >
              <Image
                width={16}
                height={16}
                src={starred ? '/assets/StarFilled.svg' : '/assets/Star.svg'}
                alt="stars"
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />{' '}
              {(stars || 0) < 2 ? 'Star' : 'Stars'} | {stars ?? 0}
            </button>
          </div>
        </div>
        <div className="mt-1 flex items-center">
          <div 
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              navigator.clipboard.writeText(
                (blueprint?.props?.slug || '') + '@v' + (blueprint?.props?.version || '')
              );
              toast.success('Copied to clipboard');
            }}
            className="flex items-center rounded-md border border-neutral-300 bg-neutral-200 px-3 py-1 text-sm font-medium text-grey-800 cursor-pointer hover:bg-neutral-100 hover:border-grey-400 transition-all"
          >
            <p className="overflow-hidden text-ellipsis">
              {blueprint.props.slug}
            </p>
            <div
              className="ml-2 flex items-center justify-center p-0.5"
              aria-label="Copy blueprint reference"
            >
              <Image
                src="/assets/LinkIcon.svg"
                alt="copy"
                width={14}
                height={14}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom div with the rest of the content - updated with Satoshi font and grey-700 color */}
      <div className="p-6 pt-4 font-['Satoshi'] text-[14px] leading-[20px] tracking-[0.035em] font-normal text-grey-700">
        <p className="mb-3">{blueprint.props.description}</p>
        <div className="mt-2 flex flex-col items-start justify-between md:flex-row md:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <p>Values extracted:</p>
            {blueprint.props.decomposedRegexes?.map((dr, index) => (
              <div
                key={index}
                className="h-fit rounded-md border border-[#D4D4D4] bg-neutral-200 px-2 py-[1px] text-[12px] leading-[16px]"
              >
                {dr.name} {dr.isHashed ? '(hashed)' : ''}
              </div>
            ))}
          </div>
          <div className="mt-2 flex w-full flex-row items-center justify-between gap-2 md:mt-0 md:w-auto">
            <span
              className={`flex flex-row gap-1 rounded-lg px-2 py-[6px] text-[14px] leading-[18px] font-semibold md:hidden ${getStatusColorLight(
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
              className="w-max text-grey-700"
              title={blueprint.props.updatedAt?.toLocaleString()}
            >
              Updated {getDateToNowStr(blueprint.props.updatedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlueprintCard;
