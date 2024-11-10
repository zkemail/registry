import { Status } from '@zk-email/sdk';

const getStatusColorLight = (status?: Status) => {
  switch (status) {
    case Status.Done:
      return 'border border-success text-success';
    case Status.InProgress:
      return 'border border-info text-info';
    case Status.Draft:
      return 'border border-warning text-warning';
    case Status.Failed:
      return 'border border-red-400 text-red-400';
    default:
      return 'border border-grey-100 text-grey-800';
  }
};

const getStatusIcon = (status?: Status) => {
  switch (status) {
    case Status.Done:
      return '/assets/Checks.svg';
    case Status.InProgress:
      return '/assets/Hourglass.svg';
    case Status.Draft:
      return '/assets/FileDashed.svg';
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
  console.log(timestamp, 'timestamp');
  return new Date(Number(new Date(timestamp).getTime())).toLocaleString('en-US', {
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
