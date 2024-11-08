// TODO: use Auth from sdk once we export it
// import { Auth } from '@zk-email/sdk';
import { useAuthStore } from '@/lib/stores/useAuthStore';

// TODO: use Auth from sdk once we export it
// const auth: Auth = {
const auth = {
  getToken: async () => {
    const { token } = useAuthStore.getState();
    return token;
  },
  onTokenExpired: async () => {
    useAuthStore.getState().clearAuth();
  },
};

export default auth;
