'use client';

import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [widthClass, setWidthClass] = useState('md:w-[768px]');

  useEffect(() => {
    const step = searchParams.get('step');
    if (pathname.includes('create') && step === '2') {
      setWidthClass('md:w-[768px] xl:w-[1164px]');
    } else {
      setWidthClass('md:w-[768px]');
    }
  }, [pathname, searchParams]);

  // Check if localStorage is available
  if (typeof window !== 'undefined') {
    localStorage.setItem('theme', 'light');
  }

  console.log(pathname);

  return (
    <>
      <Navbar />
      {pathname === '/' && (
        <div className="relative h-[200px]">
          <div className="absolute left-1/2 top-1/2 mx-auto flex w-full flex-grow -translate-x-1/2 -translate-y-1/2 transform flex-col gap-4 px-4 md:w-[768px]">
            <p className="hidden w-full text-2xl font-medium text-neutral-100 md:block md:w-[550px]">
              List of community submitted ZK Email blueprints that can be dropped into your project
            </p>
            <p className="block w-full text-2xl font-medium text-neutral-100 md:hidden md:w-[550px]">
              List of community submitted ZK Email blueprints
            </p>
            <div>
              <Button
                onClick={() => window.open('https://docs.zk.email/zk-email-sdk/registry', '_blank')}
                className="rounded-xl"
              >
                Read Guide
              </Button>
            </div>
          </div>
          <Image
            src="/assets/HomepageBanner.webp"
            alt="homepage-banner"
            className="h-[200px] w-full object-cover"
            width={4000}
            height={200}
            priority
          />
        </div>
      )}
      <div
        className={`mx-auto w-full flex-grow transition-all duration-300 ${widthClass} px-4 md:px-0`}
      >
        {children}
      </div>
      <div className="mt-auto">
        <Footer />
      </div>
    </>
  );
}
