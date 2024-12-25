'use client';
import { Input } from '@/components/ui/input';
import Image from "next/image";
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

export default function SearchBar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('search', term);
    } else {
      params.delete('search');
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    (<div className="relative w-full max-w-md">
      <Input
        type="text"
        size='sm'
        placeholder="Search blueprints.."
        className="w-full rounded-lg border px-4 py-2 pl-10"
        onChange={(e) => {
          handleSearch(e.target.value);
        }}
        defaultValue={searchParams.get('search')?.toString()}
        startIcon={<Image
          src="/assets/SearchIcon.svg"
          alt="search"
          width={16}
          height={16}
          style={{
            maxWidth: "100%",
            height: "auto"
          }} />}
      />
    </div>)
  );
}
