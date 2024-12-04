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
  try {
    let date: Date;
    console.log('Input timestamp:', timestamp, typeof timestamp);
    
    // Try parsing as milliseconds first
    const msTimestamp = parseInt(timestamp);
    console.log('Parsed msTimestamp:', msTimestamp);
    
    if (!isNaN(msTimestamp) && msTimestamp.toString().length > 4) {
      date = new Date(msTimestamp);
    } else {
      date = new Date(timestamp);
    }
    
    console.log('Resulting date object:', date);
    
    if (date.toString() === 'Invalid Date') {
      throw new Error('Invalid date format');
    }

    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

const formatDateAndTime = (date: Date) => {
  console.log(date, 'date');
  return new Date(Number(new Date(date).getTime())).toLocaleString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

function extractEMLDetails(emlContent: string) {
  const headers: Record<string, string> = {};
  const lines = emlContent.split("\n");

  let headerPart = true;
  let headerLines = [];

  // Parse headers
  for (let line of lines) {
      if (headerPart) {
          if (line.trim() === "") {
              headerPart = false; // End of headers
          } else {
              headerLines.push(line);
          }
      }
  }

  // Join multi-line headers and split into key-value pairs
  const joinedHeaders = headerLines
      .map(line => line.startsWith(" ") || line.startsWith("\t") ? line.trim() : `\n${line.trim()}`)
      .join("")
      .split("\n");

  joinedHeaders.forEach(line => {
      const [key, ...value] = line.split(":");
      if (key) headers[key.trim()] = value.join(":").trim();
  });

  // Extract details
  const senderDomain = headers["Return-Path"]?.match(/@([^\s>]+)/)?.[1]
    ?.split('.')
    .slice(-2)
    .join('.') || null;
  const headerLength = headerLines.join("\n").length;
  const emailQuery = `from:${senderDomain}`;
  const emailBodyMaxLength = lines.slice(headerLines.length).join("\n").length;

  return { senderDomain, headerLength, emailQuery, emailBodyMaxLength };
}

export { getStatusColorLight, getStatusIcon, getDateToNowStr, getStatusName, formatDate, formatDateAndTime, extractEMLDetails };
