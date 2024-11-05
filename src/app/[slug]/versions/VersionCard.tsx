import { getDateToNowStr, getStatusIcon } from '@/app/utils';

import { getStatusColorLight, getStatusName } from '@/app/utils';
import Image from 'next/image';
import { Status } from '@dimidumo/zk-email-sdk-ts';
import { Button } from '@/components/ui/button';

const VersionCard = () => {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-white p-6 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">v 1.4.4</h2>
          <span
            className={`flex flex-row gap-1 rounded-full px-2 py-1 text-xs font-semibold ${getStatusColorLight(
              Status.Done
            )}`}
          >
            <Image
              width={12}
              height={12}
              src={getStatusIcon(Status.Done)}
              alt={Status.Done.toString()}
            />
            {getStatusName(Status.Done)}
          </span>
        </div>
        <p className="text-sm font-medium text-grey-700" title={new Date().toLocaleString()}>
          Updated {getDateToNowStr(new Date())}
        </p>
      </div>
      <div>
        <p className="text-grey-700">Desctiption</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            startIcon={<Image src="/assets/Download.svg" alt="Download" width={16} height={16} />}
            size="sm"
          >
            Download
          </Button>
          <Button
            variant="secondary"
            startIcon={<Image src="/assets/Edit.svg" alt="Edit" width={16} height={16} />}
            size="sm"
          >
            Edit
          </Button>
        </div>
        <div>
          <Button
            variant="destructive"
            startIcon={<Image src="/assets/LinkBreak.svg" alt="Report" width={16} height={16} />}
            size="sm"
          >
            Report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VersionCard;
