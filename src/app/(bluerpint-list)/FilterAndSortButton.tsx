'use client';
import { ButtonProps, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { forwardRef, useState, useRef, useEffect } from 'react';
import { Status } from '@zk-email/sdk';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';

type FilterAndSortButtonProps = ButtonProps & {};

const FilterAndSortButton = forwardRef<HTMLButtonElement, FilterAndSortButtonProps>(
  ({ startIcon, endIcon, variant, size, className, ...props }, ref) => {
    const { username } = useAuthStore();
    const [expanded, setExpanded] = useState(false);
    const buttonRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();
    const { replace } = useRouter();
    const pathname = usePathname();
    const [filters, setFilters] = useState<Status[]>(
      (searchParams.get('filter')?.split(',').filter(Boolean) as unknown as Status[]) || []
    );
    const [sort, setSort] = useState(searchParams.get('sort') || '');

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

    // Animation variants for the dropdown
    const dropdownVariants = {
      hidden: {
        opacity: 0,
        scaleY: 0,
        transformOrigin: "top center",
        y: -10,
      },
      visible: {
        opacity: 1,
        scaleY: 1,
        transformOrigin: "top center",
        y: 0,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 30,
          staggerChildren: 0.05,
          delayChildren: 0.05,
        },
      },
      exit: {
        opacity: 0,
        scaleY: 0,
        transformOrigin: "top center",
        y: -10,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 30,
          staggerChildren: 0.02,
          staggerDirection: -1,
        },
      },
    };

    // Animation variants for individual items
    const itemVariants = {
      hidden: {
        opacity: 0,
        y: -10,
        scale: 0.95,
      },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 500,
          damping: 30,
        },
      },
      exit: {
        opacity: 0,
        y: -10,
        scale: 0.95,
        transition: {
          type: "spring",
          stiffness: 500,
          damping: 30,
        },
      },
    };

    // Filter items for authenticated users
    const filterItems = username ? [
      { title: "Draft", value: Status.Draft },
      { title: "Compiled", value: Status.Done },
      { title: "In Progress", value: Status.InProgress },
      { title: "Failed", value: Status.Failed },
    ] : [];

    // Sort items
    const sortItems = [
      { title: "Most Stars", value: "stars" },
      { title: "Last Updated", value: "updatedAt" },
    ];

    return (
      <div ref={buttonRef} className="relative">
        <motion.button
          className={cn(
            buttonVariants({ variant: 'secondary', size: 'sm', className: 'bg-white' }),
            'flex flex-col rounded-lg'
          )}
          onClick={() => setExpanded(!expanded)}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
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
        </motion.button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              className="absolute right-[-1px] top-[38px] z-10 box-content w-full rounded-lg border border-grey-500 bg-white py-1 overflow-hidden shadow-md"
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {username && (
                <>
                  <motion.div 
                    className="flex w-max items-center gap-2 px-2 pt-1 pb-2"
                    variants={itemVariants}
                  >
                    <Image src="/assets/Faders.svg" alt="filter" width={16} height={16} />
                    Filter
                  </motion.div>
                  
                  <motion.div className="flex flex-col gap-2 px-1" variants={itemVariants}>
                    {filterItems.map((item, index) => (
                      <motion.div key={item.value} variants={itemVariants}>
                        <Checkbox
                          title={item.title}
                          checked={filters.includes(item.value)}
                          onCheckedChange={(checked: boolean) => {
                            handleFilter(item.value, checked);
                          }}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                  
                  <motion.div
                    className="mx-3 my-2"
                    style={{
                      height: '1px',
                      backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%23E2E2E2' stroke-width='3' stroke-dasharray='6%2c 14' stroke-dashoffset='2' stroke-linecap='square'/%3e%3c/svg%3e")`,
                    }}
                    variants={itemVariants}
                  />
                  
                  <motion.div 
                    className="flex w-max items-center gap-2 px-2 pb-2"
                    variants={itemVariants}
                  >
                    <Image src="/assets/Sort.svg" alt="sort" width={16} height={16} />
                    Sort
                  </motion.div>
                </>
              )}
              
              <motion.div className="flex flex-col gap-2 px-1" variants={itemVariants}>
                {sortItems.map((item, index) => (
                  <motion.div key={item.value} variants={itemVariants}>
                    <Checkbox
                      title={item.title}
                      checked={sort === item.value}
                      onCheckedChange={(checked: boolean) => {
                        handleSort(item.value, checked);
                      }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
FilterAndSortButton.displayName = 'FilterAndSortButton';

export default FilterAndSortButton;
