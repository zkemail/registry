import zkeSdk from '@zk-email/sdk';
import auth from './auth';

const sdk = zkeSdk({ auth });

export default sdk;
