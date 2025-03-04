import zkeSdk from '@zk-email/sdk';
import auth from './auth';

const sdk = zkeSdk({ auth, baseUrl: 'http://localhost:8080' });

export default sdk;
