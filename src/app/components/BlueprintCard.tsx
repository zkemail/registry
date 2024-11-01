import Image from 'next/image';
import { getStatusColorLight, getStatusIcon } from '../utils';

interface BlueprintCardProps {
  title: string;
  slug: string;
  description: string;
  status: 'Compiled' | 'In Progress' | 'Failed';
  stats: {
    views: number;
    stars: number;
    id: number;
  };
  extractableValues: string[];
  updatedAt: string;
}

const BlueprintCard = ({
  title,
  slug,
  description,
  status,
  stats,
  extractableValues,
  updatedAt,
}: BlueprintCardProps) => {
  return (
    <div className="border p-6 hover:shadow-md transition-shadow bg-white rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-xl">{title}</h2>
          <span
            className={`px-2 py-1 flex flex-row gap-1 rounded-full text-xs font-semibold ${getStatusColorLight(
              status
            )}`}
          >
            <Image width={12} height={12} src={getStatusIcon(status)} alt={status} />
            {status}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-grey-600">
          <span className="flex flex-row gap-1 border border-grey-400 rounded px-2 py-1">
            <Image width={16} height={16} src="assets/Users.svg" alt="views" /> {stats.views}
          </span>
          <span className="flex flex-row gap-1 bg-grey-100 border border-grey-500 rounded px-2 py-1 text-grey-800">
            <Image width={16} height={16} src="assets/Star.svg" alt="stars" /> Stars | {stats.stars}
          </span>
        </div>
      </div>
      <p className="text-md font-medium text-grey-600 mb-2">{slug}</p>
      <p className="text-md font-medium text-grey-700 mb-4">{description}</p>

      <div className="mt-4 flex flex-row justify-between items-center">
        <div className="flex flex-wrap gap-2 items-center">
          <p className="text-md font-medium text-grey-600">Extractable values:</p>
          {extractableValues.map((value, index) => (
            <div
              key={index}
              className="px-2 py-[1px] leading-[18px] font-light h-fit border border-grey-500 rounded-md text-sm"
            >
              {value}
            </div>
          ))}
        </div>
        <p className="text-xs text-grey-500">Updated {updatedAt}</p>
      </div>
    </div>
  );
};

export default BlueprintCard;
