import Image from 'next/image';
import {
  getCombinedBlueprintStatus,
  getDateToNowStr,
  getStatusColorLight,
  getStatusIcon,
  getStatusName,
} from '../utils';
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
    <div className="flex flex-col overflow-hidden rounded-[20px] border bg-white transition-shadow hover:shadow-[0px_4px_8px_rgba(0,0,0,0.1)]">
      {/* Top div with title and slug */}
      <div className="border-b p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-row flex-wrap items-center gap-2 flex-grow min-w-0">
            <h2 
              className="text-xl font-bold text-ellipsis overflow-hidden" 
              title={blueprint.props.title}
            >
              {blueprint.props.title && blueprint.props.title.length > 20 
                ? blueprint.props.title.substring(0, 20) + '...' 
                : blueprint.props.title
              }
            </h2>
          </div>
          {/* Status and Star button grouped together */}
          <div className="flex items-center gap-3 text-sm text-grey-600 w-max">
            {isLoggedIn && (
              <span
                className={`hidden flex-row gap-1 rounded-md px-2 py-[6px] text-[14px] font-medium leading-[18px] md:flex ${getStatusColorLight(
                  getCombinedBlueprintStatus(blueprint)
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
                {getStatusName(getCombinedBlueprintStatus(blueprint))}
              </span>
            )}
            <span className="flex flex-row items-center gap-1 rounded-lg px-2 py-1 font-medium text-grey-800">
            <Image width={16} height={16} src="/assets/Users.svg" alt="views" />
            {blueprint.props.totalProofs}
          </span>
            <button
              onClick={onStar}
              className="flex flex-row gap-1 rounded-md border border-grey-500 bg-neutral-200 px-2 py-1 text-grey-800 w-max"
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
              />
              <span className="hidden md:inline">
                {(stars || 0) < 2 ? 'Star' : 'Stars'} |{' '}
              </span>
              {stars ?? 0}
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
            className="flex max-w-full cursor-pointer items-center rounded-md border border-neutral-300 bg-neutral-200 px-3 py-1 text-sm font-medium text-grey-800 transition-all hover:border-grey-400 hover:bg-neutral-100"
          >
            <p className="flex-grow min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{blueprint.props.slug}</p>
            <div
              className="ml-2 flex-shrink-0 flex items-center justify-center p-0.5"
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
      <div className="p-6 pt-4 font-satoshi text-[14px] font-normal leading-[20px] tracking-[0.035em] text-grey-700">
        <p className="mb-3 overflow-hidden text-ellipsis whitespace-nowrap">{blueprint.props.description}</p>
        <div className="mt-2 flex flex-col items-start justify-between md:flex-row md:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <p>Values extracted:</p>
            {blueprint.props.decomposedRegexes?.map((dr, index) => {
              const displayName = dr.name && dr.name.length > 15 
                ? `${dr.name.substring(0, 15)}...` 
                : dr.name;
              const displayNameLarge = dr.name && dr.name.length > 72 
                ? `${dr.name.substring(0, 72)}...` 
                : dr.name;
              
              return (
                <div
                  key={index}
                  className="h-fit rounded-md border border-[#D4D4D4] bg-neutral-200 px-2 py-[1px] text-[12px] leading-[16px]"
                  title={dr.name}
                >
                  <span className="md:hidden">
                    {displayName} {dr.isHashed ? '(hashed)' : ''}
                  </span>
                  <span className="hidden md:inline">
                    {displayNameLarge} {dr.isHashed ? '(hashed)' : ''}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex w-full flex-row items-center justify-between gap-2 md:mt-0 md:w-auto">
            <span
              className={`flex flex-row gap-1 rounded-lg px-2 py-[6px] text-[14px] font-semibold leading-[18px] md:hidden ${getStatusColorLight(
                getCombinedBlueprintStatus(blueprint)
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
              {getStatusName(getCombinedBlueprintStatus(blueprint))}
            </span>
            <p className="w-max text-grey-700" title={blueprint.props.updatedAt?.toLocaleString()}>
              Updated {getDateToNowStr(blueprint.props.updatedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlueprintCard;
