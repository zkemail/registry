import { parseEmail, Status } from '@zk-email/sdk';

const getStatusColorLight = (status?: Status) => {
  switch (status) {
    case Status.Done:
      return 'border border-green-200 text-success bg-green-100';
    case Status.InProgress:
      return 'border border-purple-200 text-purple-300 bg-purple-100';
    case Status.Draft:
      return 'border border-yellow-200 text-yellow-300 bg-yellow-100';
    case Status.Failed:
      return 'border border-red-200 text-red-500 bg-red-100';
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
      return '/assets/WarningCircleOutlined.svg';
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
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return `${diffSecs} second${diffSecs < 2 ? '' : 's'} ago`;
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins < 2 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours < 2 ? '' : 's'} ago`;
  } else {
    return `${diffDays} day${diffDays < 2 ? '' : 's'} ago`;
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

async function extractEMLDetails(emlContent: string) {
  const headers: Record<string, string> = {};
  const lines = emlContent.split('\n');

  let headerPart = true;
  let headerLines = [];

  // Parse headers
  for (let line of lines) {
    if (headerPart) {
      if (line.trim() === '') {
        headerPart = false; // End of headers
      } else {
        headerLines.push(line);
      }
    }
  }

  // Join multi-line headers and split into key-value pairs
  const joinedHeaders = headerLines
    .map((line) =>
      line.startsWith(' ') || line.startsWith('\t') ? line.trim() : `\n${line.trim()}`
    )
    .join('')
    .split('\n');

  joinedHeaders.forEach((line) => {
    const [key, ...value] = line.split(':');
    if (key) headers[key.trim()] = value.join(':').trim();
  });

  const senderDomain =
    headers['From']
      ?.match(/@([^\s>]+)/)?.[1] || null;

  const selector = getDKIMSelector(emlContent);
  const emailQuery = `from:${senderDomain}`;
  const parsedEmail = await parseEmail(emlContent);
  const emailBodyMaxLength = parsedEmail.cleanedBody.length;
  const headerLength = parsedEmail.canonicalizedHeader.length;

  return { parsedEmail, senderDomain, headerLength, selector, emailQuery, emailBodyMaxLength };
}

const getMaxEmailBodyLength = async (emlContent: string, shaPrecomputeSelector: string) => {
  const parsedEmail = await parseEmail(emlContent);

  const body = parsedEmail.cleanedBody;
  const index = body.indexOf(shaPrecomputeSelector);

  if (index === -1) {
    return body.length;
  }

  return body.length - index - shaPrecomputeSelector.length;
};

const getDKIMSelector = (emlContent: string): string | null => {
  const headerLines: string[] = [];
  const lines = emlContent.split('\n');
  for (const line of lines) {
    if (line.trim() === '') break;
    // If line starts with whitespace, it's a continuation of previous header
    if (line.startsWith(' ') || line.startsWith('\t')) {
      headerLines[headerLines.length - 1] += line.trim();
    } else {
      headerLines.push(line);
    }
  }

  // Then look for DKIM-Signature in the joined headers
  for (const line of headerLines) {
    if (line.includes('DKIM-Signature')) {
      const match = line.match(/s=([^;]+)/);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  }
  return null;
};

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds have elapsed
 * since the last time the debounced function was invoked.
 * 
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @returns A debounced version of the function
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      timeout = null;
      func(...args);
    }, wait);
  };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced as T & { cancel: () => void };
}

export {
  getStatusColorLight,
  getStatusIcon,
  getDateToNowStr,
  getStatusName,
  formatDate,
  formatDateAndTime,
  debounce,
};
