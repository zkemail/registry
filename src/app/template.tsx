'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Button } from '@/components/ui/button';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <>
      <Navbar />
      {pathname === '/' && (
        <div className="relative h-[200px]">
          <div className="absolute left-1/2 top-1/2 mx-auto flex w-full flex-grow -translate-x-1/2 -translate-y-1/2 transform flex-col gap-4 px-4 md:w-[768px]">
            <p className="w-[550px] text-2xl font-medium text-neutral-100">
              List of community submitted ZK Email blueprints that can be dropped into your project
            </p>
            <div>
              <Button className="rounded-xl">Read Guide</Button>
            </div>
          </div>
          <Image
            src="/assets/HomepageBanner.png"
            alt="homepage-banner"
            className="object-cover h-[200px]"
            width={1920}
            height={200}
            priority
          />
        </div>
      )}
      <div className="mx-auto w-full flex-grow md:w-[768px]">{children}</div>
      <div className="mt-auto">
        <Footer />
      </div>
    </>
  );
}
