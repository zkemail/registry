'use client';

import Image from 'next/image';
import Link from 'next/link';
import LoginButton from './LoginButton';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useBlueprintFiltersStore } from '@/lib/stores/useBlueprintFiltersStore';

const Navbar = () => {
  const token = useAuthStore((state) => state.token);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { search, filters, sort } = useBlueprintFiltersStore();

  const handleCreateBlueprint = () => {
    localStorage.removeItem('create-blueprint');
    router.push('/create');
  };

  // Handle logo click to preserve filters and sort when on home page
  const handleLogoClick = () => {
    if (pathname === '/') {
      // If we're already on home page, preserve existing parameters
      const params = searchParams.toString();
      if (params) {
        // Navigate to home with current parameters
        router.push(`/?${params}`);
      } else {
        // If no parameters, just go to home
        router.push('/');
      }
    } else {
      // If we're on a different page, restore filters and sort from store (but not search)
      const params = new URLSearchParams();
      if (filters.length > 0) params.set('filter', filters.join(','));
      if (sort && sort !== 'totalProofs') params.set('sort', sort);
      
      const queryString = params.toString();
      const url = queryString ? `/?${queryString}` : '/';
      router.push(url);
    }
  };

  return (
    <nav className="flex items-center justify-between border-b bg-white px-6 py-3 dark:border-grey-800 dark:bg-black">
      <button
        onClick={handleLogoClick}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
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
      </button>
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
