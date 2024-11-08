import { ButtonProps, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { forwardRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

type FilterAndSortButtonProps = ButtonProps & {};

const FilterAndSortButton = forwardRef<HTMLButtonElement, FilterAndSortButtonProps>(
  ({ startIcon, endIcon, variant, size, className, ...props }, ref) => {
    const [expanded, setExpanded] = useState(false);
    const searchParams = useSearchParams();
    const { replace } = useRouter();
    const pathname = usePathname();
    const [filters, setFilters] = useState<string[]>(
      searchParams.get('filter')?.split(',').filter(Boolean) || []
    );
    const [sort, setSort] = useState(searchParams.get('sort') || '');

    const handleFilter = (filterValue: string, checked: boolean) => {
      const newFilters = checked
        ? [...filters, filterValue]
        : filters.filter((f) => f !== filterValue);

      setFilters(newFilters);
      const params = new URLSearchParams(searchParams);
      if (newFilters.length > 0) {
        params.set('filter', newFilters.join(','));
      } else {
        params.delete('filter');
      }
      replace(`${pathname}?${params.toString()}`);
    };

    const handleSort = (sortValue: string, checked: boolean) => {
      const newSort = checked ? sortValue : '';
      setSort(newSort);
      const params = new URLSearchParams(searchParams);
      if (newSort) {
        params.set('sort', newSort);
      } else {
        params.delete('sort');
      }
      replace(`${pathname}?${params.toString()}`);
    };

    return (
      <div
        className={cn(
          buttonVariants({ variant: 'secondary', size: 'sm', className: 'bg-white' }),
          'flex flex-col',
          expanded ? 'relative rounded-b-none border-b-0' : ''
        )}
      >
        {expanded ? (
          <>
            <div className="flex w-max items-center gap-2" onClick={() => setExpanded(!expanded)}>
              <Image src="/assets/Faders.svg" alt="filter" width={16} height={16} />
              Filter and Sort
            </div>
            <div className="absolute right-[-1px] top-full box-content w-full rounded-b-md border border-t-0 border-grey-500 bg-white pb-2">
              <div className="flex flex-col gap-2 px-3">
                <Checkbox
                  title="Compiled"
                  checked={filters.includes('compiled')}
                  onCheckedChange={(checked: boolean) => {
                    handleFilter('compiled', checked);
                  }}
                />
                <Checkbox
                  title="In Progress"
                  checked={filters.includes('in-progress')}
                  onCheckedChange={(checked: boolean) => {
                    handleFilter('in-progress', checked);
                  }}
                />
                <Checkbox
                  title="Failed"
                  checked={filters.includes('failed')}
                  onCheckedChange={(checked: boolean) => {
                    handleFilter('failed', checked);
                  }}
                />
              </div>
              <div
                className="mx-3 my-2"
                style={{
                  height: '1px',
                  backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%23E2E2E2' stroke-width='3' stroke-dasharray='6%2c 14' stroke-dashoffset='2' stroke-linecap='square'/%3e%3c/svg%3e")`,
                }}
              />
              <div
                className="flex w-max items-center gap-2 px-3 pb-2"
                onClick={() => setExpanded(!expanded)}
              >
                <Image src="/assets/Sort.svg" alt="filter" width={16} height={16} />
                Sort
              </div>
              <div className="flex flex-col gap-2 px-3">
                <Checkbox
                  title="Most Used"
                  checked={sort === 'most-used'}
                  onCheckedChange={(checked: boolean) => {
                    handleSort('most-used', checked);
                  }}
                />
                <Checkbox
                  title="Most Recent"
                  checked={sort === 'most-recent'}
                  onCheckedChange={(checked: boolean) => {
                    handleSort('most-recent', checked);
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex w-max items-center gap-2" onClick={() => setExpanded(!expanded)}>
            <Image src="/assets/Faders.svg" alt="filter" width={16} height={16} />
            Filter and Sort
          </div>
        )}
      </div>
    );
  }
);
FilterAndSortButton.displayName = 'FilterAndSortButton';

export default FilterAndSortButton;
