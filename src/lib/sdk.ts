import { zkSdk } from '@zk-email/sdk';
import auth from './auth';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
console.log('baseUrl: ', baseUrl);

const sdk = zkSdk({ auth, ...(baseUrl ? { baseUrl } : {}), logging: { enabled: true, level: 'debug'  } });

export default sdk;
