'use client';
import { ButtonProps, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { forwardRef, useState, useRef, useEffect } from 'react';
import { Status } from '@zk-email/sdk';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useBlueprintFiltersStore } from '@/lib/stores/useBlueprintFiltersStore';

type FilterAndSortButtonProps = ButtonProps & {};

const FilterAndSortButton = forwardRef<HTMLButtonElement, FilterAndSortButtonProps>(
  ({ startIcon, endIcon, variant, size, className, ...props }, ref) => {
    const { username } = useAuthStore();
    const [expanded, setExpanded] = useState(false);
    const buttonRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();
    const { replace } = useRouter();
    const pathname = usePathname();
    const { setFilters: setStoreFilters, setSort: setStoreSort } = useBlueprintFiltersStore();
    
    // Get current filters and sort from URL (this ensures immediate visual feedback)
    const currentFilters = (searchParams.get('filter')?.split(',').filter(Boolean) as string[]) || [];
    const currentSort = searchParams.get('sort') || 'totalProofs';
    
    // Sync URL params with store on mount and when URL changes
    useEffect(() => {
      setStoreFilters(currentFilters as unknown as Status[]);
      if (currentSort) {
        setStoreSort(currentSort);
      }
    }, [searchParams, setStoreFilters, setStoreSort]);

    // Handle clicks outside the component
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
          setExpanded(false);
        }
      };

      // Add event listener when the dropdown is expanded
      if (expanded) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      // Clean up the event listener
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [expanded]);

    const handleFilter = (filterValue: Status, checked: boolean) => {
      const filterString = filterValue.toString();
      const newFilters = checked
        ? [...currentFilters, filterString]
        : currentFilters.filter((f) => f !== filterString);

      setStoreFilters(newFilters as unknown as Status[]);
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
      setStoreSort(newSort);
      const params = new URLSearchParams(searchParams);
      if (newSort) {
        params.set('sort', newSort);
      } else {
        params.delete('sort');
      }
      replace(`${pathname}?${params.toString()}`);
    };

    return (
      <div ref={buttonRef} className="relative">
        <button
          className={cn(
            buttonVariants({ variant: 'secondary', size: 'sm', className: 'bg-white' }),
            'flex flex-col',
            expanded ? 'rounded-b-none border-b-0' : ''
          )}
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex w-max items-center gap-2">
            <Image
              src="/assets/Faders.svg"
              alt="filter"
              width={16}
              height={16}
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            />
            Filter and Sort
          </div>
        </button>

        {expanded && (
          <div className="absolute right-[-1px] top-full z-10 box-content w-full rounded-b-md border border-t-0 border-grey-500 bg-white pb-2">
            {username && (
              <>
                <div className="flex flex-col gap-2 px-3">
                  <Checkbox
                    title="Draft"
                    checked={currentFilters.includes(Status.Draft.toString())}
                    onCheckedChange={(checked: boolean) => {
                      handleFilter(Status.Draft, checked);
                    }}
                  />
                  <Checkbox
                    title="Compiled"
                    checked={currentFilters.includes(Status.Done.toString())}
                    onCheckedChange={(checked: boolean) => {
                      handleFilter(Status.Done, checked);
                    }}
                  />
                  <Checkbox
                    title="In Progress"
                    checked={currentFilters.includes(Status.InProgress.toString())}
                    onCheckedChange={(checked: boolean) => {
                      handleFilter(Status.InProgress, checked);
                    }}
                  />
                  <Checkbox
                    title="Failed"
                    checked={currentFilters.includes(Status.Failed.toString())}
                    onCheckedChange={(checked: boolean) => {
                      handleFilter(Status.Failed, checked);
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
                <div className="flex w-max items-center gap-2 px-3 pb-2">
                  <Image src="/assets/Sort.svg" alt="filter" width={16} height={16} />
                  Sort
                </div>
              </>
            )}
            <div className="flex flex-col gap-2 px-3">
              <Checkbox
                title="Most Stars"
                checked={currentSort === 'stars'}
                onCheckedChange={(checked: boolean) => {
                  handleSort('stars', checked);
                }}
              />
              <Checkbox
                title="Last Updated"
                checked={currentSort === 'updatedAt'}
                onCheckedChange={(checked: boolean) => {
                  handleSort('updatedAt', checked);
                }}
              />
              <Checkbox
                title="Total Proofs"
                checked={currentSort === 'totalProofs'}
                onCheckedChange={(checked: boolean) => {
                  handleSort('totalProofs', checked);
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);
FilterAndSortButton.displayName = 'FilterAndSortButton';

export default FilterAndSortButton;
