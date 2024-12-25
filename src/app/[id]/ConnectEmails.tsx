import Image from "next/legacy/image";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useProofStore } from './store';
import useGoogleAuth from '../hooks/useGoogleAuth';
import { toast } from 'react-toastify';

const ConnectEmails = () => {
  const { setFile, setStep } = useProofStore();

  const { googleLogIn } = useGoogleAuth();

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
      <Button
        className="flex w-max items-center gap-2"
        onClick={googleLogIn(() => {
          setFile(null);
          setStep('1');
        })}
      >
        <Image src="/assets/GoogleLogo.svg" alt="Google Logo" width={16} height={16} />
        Connect Gmail Account
      </Button>

      <div className="flex w-full items-center">
        <Separator className="flex-1" />
        <span className="mx-3 text-base font-semibold text-grey-700">OR</span>
        <Separator className="flex-1" />
      </div>

      <div
        className="w-full cursor-pointer rounded-lg p-8"
        onClick={() => document.getElementById('email-file')?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const files = e.dataTransfer.files;
          if (files?.[0]) {
            setFile(files[0])
              .then(() => setStep('1'))
              .catch((err) => toast.error(err.message ?? err));
          }
        }}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%23E2E2E2FF' stroke-width='4' stroke-dasharray='6%2c 14' stroke-dashoffset='2' stroke-linecap='square'/%3e%3c/svg%3e")`,
        }}
      >
        <div className="flex flex-col items-center justify-center gap-4">
          <Image src="/assets/FileArrowUp.svg" alt="Upload icon" width={40} height={40} />
          <div className="flex flex-col items-center text-base font-semibold">
            <p className="text-brand-400">
              Click to upload <span className="text-grey-700">or drag and drop</span>
            </p>
            <p className="text-grey-700">(.eml format)</p>
          </div>
          <Input
            id="email-file"
            type="file"
            accept=".eml"
            className="hidden"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const file = e.target.files?.[0];

              if (file) {
                setFile(file)
                  .then(() => setStep('1'))
                  .catch((err) => {
                    toast.error(err.message ?? err);
                  });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ConnectEmails;
