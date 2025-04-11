import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useProofStore } from './store';
import useGoogleAuth from '../hooks/useGoogleAuth';
import { toast } from 'react-toastify';
import { findOrCreateDSP } from '../utils';
import { useCreateBlueprintStore } from '../create/[id]/store';

const ConnectEmails = () => {
  const { setFile, setStep } = useProofStore();
  const blueprint = useProofStore((state) => state.blueprint);

  const { googleLogIn } = useGoogleAuth();

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="flex w-full flex-col gap-1">
        <h4 className="text-xl font-bold text-grey-800">Connect emails</h4>
        <p className="text-base font-medium text-grey-700">
          Connect your Gmail or upload an .eml file
        </p>
        <p className="text-base font-medium text-grey-700">
          <span className="font-bold text-grey-900">Note:</span> All email processing occurs locally
          on your device. We never receive or store your email data.
        </p>
        <p className="text-base font-medium text-grey-700">
          <span className="font-bold text-grey-900">Email Query: </span>
          <span className="inline-flex items-center gap-2">
            <code>{blueprint?.props?.emailQuery}</code>
            <Button
              variant="outline"
              size="smIcon"
              onClick={() => {
                navigator.clipboard.writeText(blueprint?.props?.emailQuery || '');
                toast.success('Copied to clipboard!');
              }}
            >
              <Image
                src="/assets/LinkIcon.svg"
                alt="Copy"
                width={16}
                height={16}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
            </Button>
          </span>
        </p>
      </div>
      <Button
        className="flex w-max items-center gap-2"
        onClick={googleLogIn(() => {
          setFile(null);
          setStep('1');
        })}
      >
        <Image
          src="/assets/GmailLogo.png"
          alt="Google Logo"
          width={16}
          height={16}
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />
        Connect Gmail Account
      </Button>
      <div className="flex w-full items-center">
        <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent to-gray-300" />
        <span className="mx-3 text-base font-semibold text-grey-700">OR</span>
        <div className="flex-1 h-[2px] bg-gradient-to-l from-transparent to-gray-300" />
      </div>
      <div
        className="w-full cursor-pointer rounded-lg p-8"
        onClick={() => document.getElementById('email-file')?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const files = e.dataTransfer.files;
          if (files?.[0]) {
            try {
              const response = await findOrCreateDSP(files[0]);
            } catch (err) {
              toast.error(
                'We were unable to locate the public key for this email. This typically happens with older emails. Please try with a more recent email.'
              );
              return;
            }

            setFile(files[0])
              .then(() => setStep('1'))
              .catch((err) => toast.error(err.message ?? err));
          }
        }}
        id="drag-and-drop-emails"
        data-testid="drag-and-drop-emails"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%23E2E2E2FF' stroke-width='4' stroke-dasharray='6%2c 14' stroke-dashoffset='2' stroke-linecap='square'/%3e%3c/svg%3e")`,
        }}
      >
        <div className="flex flex-col items-center justify-center gap-4">
          <Image
            src="/assets/FileArrowUp.svg"
            alt="Upload icon"
            width={40}
            height={40}
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
          />
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
            onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  const response = await findOrCreateDSP(file);
                } catch (err) {
                  toast.error(
                    'We were unable to locate the public key for this email. This typically happens with older emails. Please try with a more recent email.'
                  );
                  return;
                }

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
