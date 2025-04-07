import zkeSdk from '@zk-email/sdk';
import auth from './auth';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
console.log('baseUrl: ', baseUrl);

const sdk = zkeSdk({ auth, ...(baseUrl ? { baseUrl } : {}) });

export default sdk;
