'use client';

import 'react-toastify/dist/ReactToastify.css';
// import '../../app/globals.css';
import { ToastContainer } from 'react-toastify';
import Image from "next/image";
import { Button } from '@/components/ui/button';

interface ToastProviderProps {
  children: React.ReactNode;
}

export default function ToastProvider({ children }: ToastProviderProps) {
  const contextClass = {
    success: 'text-green-300',
    error: 'text-red-400',
    info: 'text-grey-600',
    warning: 'text-orange-400',
    default: 'text-indigo-600',
    dark: 'text-white-600 font-grey-300',
  };

  return (<>
    {children}
    <ToastContainer
      toastClassName={(context) =>
        contextClass[context?.type || 'default'] +
        ' ' +
        'my-1 relative flex py-2 pt-3 px-4 rounded-md justify-between overflow-hidden cursor-pointer text-base border border-grey-400 bg-white'
      }
      bodyClassName={() => 'text-base'}
      position="bottom-left"
      autoClose={3000}
      icon={false}
      closeButton={({ closeToast }) => (
        <Image
          src="/assets/CloseIcon.svg"
          alt="close"
          onClick={closeToast}
          width={16}
          height={16}
          style={{
            maxWidth: "100%",
            height: "auto"
          }} />
      )}
    />
  </>);
}
