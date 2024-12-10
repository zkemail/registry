'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getLoginWithGithubUrl } from '@zk-email/sdk';
import { useAuthStore } from '@/lib/stores/useAuthStore';

export default function LoginButton() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const isLoading = useAuthStore((state) => state.isLoading);
  const { clearAuth, setLoading } = useAuthStore();

  const handleLogin = () => {
    setLoading(true);
    // Exclude query params, since the callback url appends them with ? and we would have 2 ?
    const redirectUrl = window.location.href.split('?')[0];
    const githubClientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    let loginWithGithubUrl: string;
    if (githubClientId) {
      loginWithGithubUrl = getLoginWithGithubUrl(redirectUrl, githubClientId);
    } else {
      // If no githubClientId is given, the sdk will automatically use the prod key
      loginWithGithubUrl = getLoginWithGithubUrl(redirectUrl);
    }
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
        <Button
          variant="secondary"
          className="rounded-xl"
          onClick={() => {
            clearAuth();
            window.location.reload();
          }}
        >
          Logout
        </Button>
      )}
    </>
  );
}
