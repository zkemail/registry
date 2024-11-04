import zkeSdk from '@dimidumo/zk-email-sdk-ts';
import auth from './auth';

const sdk = zkeSdk({ auth });

export default sdk;
