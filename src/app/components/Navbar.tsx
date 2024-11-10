'use client';

import Image from 'next/image';
import Link from 'next/link';
import LoginButton from './LoginButton';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const token = useAuthStore((state) => state.token);
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between border-b bg-white px-6 py-3 dark:border-grey-800 dark:bg-black">
      <Link href="/" className="flex items-center gap-2">
        <Image src={'/assets/ZKEmailLogoDark.svg'} alt="zkemail-logo" height={24} width={24} />
        <span className="text-xl font-semibold dark:text-white">registry</span>
      </Link>
      <div className="flex items-center gap-4">
        {token && !pathname.includes('/create') ? (
          <Link className="hidden md:block" href="/create/new">
            <Button className="rounded-xl">Create Blueprint</Button>
          </Link>
        ) : null}
        <div className="flex items-center gap-4">
          <LoginButton />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
