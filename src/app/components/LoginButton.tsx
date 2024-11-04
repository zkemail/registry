'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getLoginWithGithubUrl } from '@dimidumo/zk-email-sdk-ts';
import { useAuthStore } from '@/lib/stores/useAuthStore';

export default function LoginButton() {
  const router = useRouter();
  const token = useAuthStore((state) => state.username);
  const isLoading = useAuthStore((state) => state.isLoading);
  const { clearAuth, setLoading } = useAuthStore();

  const handleLogin = () => {
    setLoading(true);
    // Exclude query params, since the callback url appends them with ? and we would have 2 ?
    const redirectUrl = window.location.href.split('?')[0];
    const loginWithGithubUrl = getLoginWithGithubUrl(redirectUrl);
    router.replace(loginWithGithubUrl);
  };

  return (
    <>
      {isLoading ? (
        <Button className="rounded-xl">Loading...</Button>
      ) : !token ? (
        <Button className="rounded-xl" onClick={handleLogin}>
          Login
        </Button>
      ) : (
        <Button className="rounded-xl" onClick={clearAuth}>
          Logout
        </Button>
      )}
    </>
  );
}
