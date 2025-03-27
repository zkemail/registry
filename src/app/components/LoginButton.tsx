'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getLoginWithGithubUrl } from '@zk-email/sdk';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import ModalGenerator from '@/components/ModalGenerator';
import { useState } from 'react';
import { LogOutIcon } from 'lucide-react';
export default function LoginButton() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const username = useAuthStore((state) => state.username);
  const isLoading = useAuthStore((state) => state.isLoading);
  const { clearAuth, setLoading } = useAuthStore();
  const [isLogoutConfirmationModalOpen, setIsLogoutConfirmationModalOpen] = useState(false);

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              data-testid="profile-info"
              variant="outline"
              className="h-10 w-10 rounded-full p-0"
            >
              {username?.[0]?.toUpperCase() || 'U'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="mr-4 mt-4 font-semibold">
            <DropdownMenuLabel className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-[2px] text-xs">
                {username?.[0]?.toUpperCase() || 'U'}
              </div>
              {username}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="h-0.5" />
            <DropdownMenuItem onClick={() => router.push('/user/proofs')}>
              <Image src="/assets/YourProofs.svg" alt="proof" width={16} height={16} />
              Your proofs
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/user/blueprints')}>
              <Image src="/assets/YourBlueprints.svg" alt="blueprint" width={16} height={16} />
              Your blueprints
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-300 hover:text-red-300"
              onClick={() => {
                // clearAuth();
                // window.location.reload();
                setIsLogoutConfirmationModalOpen(true);
              }}
            >
              <Image src="/assets/Logout.svg" alt="logout" width={16} height={16} />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <ModalGenerator
        isOpen={isLogoutConfirmationModalOpen}
        onClose={() => {
          setIsLogoutConfirmationModalOpen(false);
        }}
        title="Confirm Logout!"
        onSubmit={() => {
          clearAuth();
          window.location.reload();
        }}
        showActionBar={false}
        modalContent={
          <div className="flex w-[456px] flex-col justify-center gap-4">
            <p className="text-base font-semibold text-grey-700">
              Are you sure you want to logout?
            </p>
            <div className="flex w-full gap-2">
              <Button
                className="w-full"
                startIcon={
                  <Image src="/assets/GoBackIcon.svg" alt="arrow-left" width={16} height={16} />
                }
                variant="secondary"
                onClick={() => setIsLogoutConfirmationModalOpen(false)}
              >
                Go Back
              </Button>
              <Button
                className="w-full"
                startIcon={<Image src="/assets/Logout.svg" alt="logout" width={16} height={16} />}
                variant="destructive"
                onClick={() => {
                  clearAuth();
                  window.location.reload();
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        }
      />
    </>
  );
}
