import { Status } from '@zk-email/sdk';

const getStatusColorLight = (status?: Status) => {
  switch (status) {
    case Status.Done:
      return 'bg-[#34C759] text-neutral-100';
    case Status.InProgress:
      return 'bg-blue-100 text-blue-800';
    case Status.Failed:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-grey-100 text-grey-800';
  }
};

const getStatusIcon = (status?: Status) => {
  switch (status) {
    case Status.Done:
      return '/assets/CompiledIcon.svg';
    case Status.InProgress:
      return '/assets/InProgressIcon.svg';
    case Status.Failed:
      return '/assets/FailedIcon.svg';
    default:
      return '/assets/CompiledIcon.svg';
  }
};

const getStatusName = (status?: Status) => {
  switch (status) {
    case Status.Done:
      return 'Compiled';
    case Status.InProgress:
      return 'In Progress';
    case Status.Failed:
      return 'Failed';
    default:
      return 'Draft';
  }
};

const getDateToNowStr = (date?: Date) => {
  if (!date) return '';
  console.log(date);
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return `${diffSecs} seconds ago`;
  } else if (diffMins < 60) {
    return `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else {
    return `${diffDays} days ago`;
  }
};

const formatDate = (timestamp: string) => {
  return new Date(Number(timestamp)).toLocaleString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

export { getStatusColorLight, getStatusIcon, getDateToNowStr, getStatusName, formatDate };
