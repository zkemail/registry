'use client';

import Image from 'next/image';
import Link from 'next/link';
import LoginButton from './LoginButton';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { usePathname, useRouter } from 'next/navigation';

const Navbar = () => {
  const token = useAuthStore((state) => state.token);
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="flex items-center justify-between border-b bg-white px-6 py-3 dark:border-grey-800 dark:bg-black">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src={'/assets/ZKEmailLogoDark.svg'}
          alt="zkemail-logo"
          height={24}
          width={24}
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />
        <span className="text-xl font-semibold text-[#1C1C1C] dark:text-white">registry</span>
      </Link>
      <div className="flex items-center gap-4">
        {token && !pathname.includes('/create') ? (
          <Button
            onClick={() => {
              localStorage.removeItem('create-blueprint');
              router.push('/create/new');
            }}
            className="rounded-xl"
            data-testid="create-blueprint-button"
          >
            Create Blueprint
          </Button>
        ) : null}
        <div className="flex items-center gap-4">
          <LoginButton />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
