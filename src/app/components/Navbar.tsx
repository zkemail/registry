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

  const handleCreateBlueprint = () => {
    localStorage.removeItem('create-blueprint');
    router.push('/create');
  };

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
        <div className="flex items-center gap-4">
          {token && (
            <Button
              onClick={handleCreateBlueprint}
              className="hidden rounded-xl px-4 py-2 md:inline-flex"
            >
              Create Blueprint
            </Button>
          )}
          <LoginButton />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
