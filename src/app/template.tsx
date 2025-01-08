'use client';

import Image from "next/image";
import { usePathname } from 'next/navigation';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Button } from '@/components/ui/button';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if localStorage is available
  if (typeof window !== 'undefined') {
    localStorage.setItem('theme', 'light');
  }

  return (<>
    <Navbar />
    {pathname === '/' && (
      <div className="relative h-[200px]">
        <div className="absolute left-1/2 top-1/2 mx-auto flex w-full flex-grow -translate-x-1/2 -translate-y-1/2 transform flex-col gap-4 px-4 md:w-[768px]">
          <p className="w-full text-2xl hidden md:block font-medium text-neutral-100 md:w-[550px]">
            List of community submitted ZK Email blueprints that can be dropped into your project
          </p>
          <p className="w-full block md:hidden text-2xl font-medium text-neutral-100 md:w-[550px]">
          List of community submitted ZK Email blueprints
          </p>
          <div>
            <Button className="rounded-xl">Read Guide</Button>
          </div>
        </div>
        <Image
          src="/assets/HomepageBanner.webp"
          alt="homepage-banner"
          className="h-[200px] object-cover w-full"
          width={4000}
          height={200}
          priority
        />
      </div>
    )}
    <div className="mx-auto w-full flex-grow md:w-[768px] px-4 md:px-0">{children}</div>
    <div className="mt-auto">
      <Footer />
    </div>
  </>);
}
