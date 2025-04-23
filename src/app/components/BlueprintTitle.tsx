import Image from 'next/image';
import { Blueprint } from '@zk-email/sdk';
import { getDateToNowStr, getStatusColorLight, getStatusIcon, getStatusName } from '../utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useEffect, useState } from 'react';

interface BlueprintTitleProps {
  blueprint: Blueprint;
  isUserStarred: boolean;
  unStarBlueprint: () => void;
  starBlueprint: () => void;
}

export const BlueprintTitle = ({
  blueprint,
  isUserStarred,
  unStarBlueprint,
  starBlueprint,
}: BlueprintTitleProps) => {
  const token = useAuthStore((state) => state.token);
  const [numProofs, setNumProofs] = useState(0);

  useEffect(() => {
    if (!blueprint || !blueprint.getNumOfRemoteProofs) return;
    blueprint
      .getNumOfRemoteProofs()
      .then((remoteProofs) => {
        setNumProofs(remoteProofs + (blueprint.props.numLocalProofs || 0) || 0);
      })
      .catch((err) => {
        console.error('Failed to get remote proofs for blueprint: ', err);
      });
  }, [blueprint]);

  const handleStarClick = () => {
    if (!token) {
      toast.info('Login to star a blueprint');
      return;
    }
    if (isUserStarred) {
      unStarBlueprint();
    } else {
      starBlueprint();
    }
  };

  return (
    <div className="rounded-3xl border border-grey-200 bg-[#FFFFFF] p-6 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-grey-900">{blueprint.props.title}</h2>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex flex-row items-center gap-1 rounded-lg px-2 py-1 font-medium text-grey-800">
            <Image width={16} height={16} src="/assets/Users.svg" alt="views" />
            {numProofs}
          </span>
          <button
            onClick={handleStarClick}
            className="flex flex-row items-center gap-1 rounded-lg border border-grey-400 bg-white px-2 py-1 font-medium text-grey-800 hover:bg-grey-100 transition-colors"
          >
            <Image
              width={16}
              height={16}
              src={isUserStarred ? '/assets/StarFilled.svg' : '/assets/Star.svg'}
              alt="Star"
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            />
            {(blueprint.props.stars || 0) < 2 ? 'Star' : 'Stars'} | {blueprint.props.stars || 0}
          </button>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        <p className="text-sm font-medium text-grey-700">{blueprint.props.slug}</p>
        <p className="text-sm text-grey-800">{blueprint.props.description}</p>

        {blueprint.props.decomposedRegexes?.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {blueprint.props.decomposedRegexes?.map((dr, index) => (
              <div
                key={index}
                className="h-fit rounded-md border border-grey-400 bg-neutral-200 px-2 py-[2px] text-[12px] leading-[16px] text-grey-800"
              >
                {dr.name} {dr.isHashed ? '(hashed)' : ''}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col items-start justify-between gap-4 border-t border-grey-200 pt-4 md:flex-row">
        <div className="flex flex-row items-center gap-3">
          <span className="text-lg font-bold leading-6 text-grey-900 underline">{blueprint.props.version}</span>
          <span
            className={`flex flex-row items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${getStatusColorLight(
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
          <p className="text-xs text-grey-700">
            Updated {getDateToNowStr(blueprint.props.updatedAt)}
          </p>
          {/* <span
            className="flex flex-row items-center gap-1 rounded-lg border border-green-200 bg-green-100 px-2 py-1 text-xs font-semibold text-green-300"
          >
            Latest
          </span> */}
        </div>

        <div className="flex w-auto flex-row gap-2">
          <Link href={`/${blueprint.props.id}/versions`}>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white border border-grey-400 hover:bg-grey-100 text-grey-800"
              startIcon={
                <Image
                  src="/assets/GitCommit.svg"
                  alt="versions"
                  width={16}
                  height={16}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
              }
            >
              View all versions
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
