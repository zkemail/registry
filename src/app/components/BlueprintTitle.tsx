import Image from 'next/image';
import { Blueprint } from '@zk-email/sdk';
import { getStatusColorLight, getStatusIcon, getStatusName } from '../utils';
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
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{blueprint.props.title}</h2>
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
        <div className="flex items-center gap-4 text-sm text-grey-600">
          <span className="flex flex-row gap-1 rounded border border-grey-400 px-2 py-1 font-medium text-grey-800">
            <Image width={16} height={16} src="/assets/Users.svg" alt="views" /> {numProofs}
          </span>
          <button
            onClick={handleStarClick}
            className="flex flex-row gap-1 rounded border border-grey-500 bg-white px-2 py-1 font-semibold text-grey-800"
          >
            <Image
              width={16}
              height={16}
              src={isUserStarred ? '/assets/StarFilled.svg' : '/assets/Star.svg'}
              alt="⭐"
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            />{' '}
            {(blueprint.props.stars || 0) < 2 ? 'Star' : 'Stars'} | {blueprint.props.stars || 0}
          </button>
        </div>
      </div>
      <p className="text-sm mb-4 font-medium text-neutral-600">{blueprint.props.slug}</p>
      <p className="text-md mb-4 font-medium text-neutral-600">{blueprint.props.description}</p>
    </div>
  );
};
