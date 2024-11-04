import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import DragAndDropFile from '../components/DragAndDropFile';
import useGoogleAuth from '../hooks/useGoogleAuth';

const ConnectEmails = ({ setStep }: { setStep: (step: number) => void }) => {
  const [file, setFile] = useState<File | null>(null);

  const {
    googleAuthToken,
    isGoogleAuthed,
    loggedInGmail,
    scopesApproved,
    googleLogIn,
    googleLogOut,
  } = useGoogleAuth();

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="flex w-full flex-col gap-1">
        <h4 className="text-xl font-bold text-grey-800">Connect emails</h4>
        <p className="text-base font-medium text-grey-700">
          Connect your Gmail or upload an .eml file
        </p>
        <p className="text-base font-medium text-grey-700">
          <span className="text-grey-900 underline">Note</span> - Your google API key is kept
          locally and never sent out to any of our servers.
        </p>
      </div>
      <Button className="flex w-max items-center gap-2" onClick={() => googleLogIn()}>
        <Image src="/assets/GoogleLogo.svg" alt="Google Logo" width={16} height={16} />
        Connect Gmail Account
      </Button>

      <div className="flex w-full items-center">
        <Separator className="flex-1" />
        <span className="mx-3 text-base font-semibold text-grey-700">OR</span>
        <Separator className="flex-1" />
      </div>

      <DragAndDropFile accept=".eml" setFile={setFile} />
    </div>
  );
};

export default ConnectEmails;
