import { Button } from '@/components/ui/button';
import Image from 'next/image';

const SelectEmails = ({ setStep }: { setStep: (step: number) => void }) => {
  return (
    <div className="flex flex-col justify-center items-center gap-6">
      <div className="w-full flex flex-col gap-1">
        <h4 className="text-xl font-bold text-grey-800">Select Emails</h4>
        <p className="text-base font-medium text-grey-700">
          Choose the emails you want to create proofs for. You can select multiple emails.
        </p>
        <p className="text-base font-medium text-grey-700">
          <span className="text-grey-900 underline">Note</span> - If you select to create the proofs
          remotely, your emails will be sent to our secured service for proof generation. Emails
          will be deleted once the proofs are generated
        </p>
      </div>

      <div className="mt-6">
        <div className="w-full grid">
          {/* Header */}
          <div
            className="grid text-left font-semibold mb-2 gap-6"
            style={{ gridTemplateColumns: '1fr 1fr 2fr 4fr 2fr' }}
          >
            <div className="text-left">Select</div>
            <div>Validity</div>
            <div>Sent on</div>
            <div>Subject</div>
            <div className="text-right">Generated Input</div>
          </div>

          {/* Rows */}
          <div
            className="border-t-2 border-neutral-100 grid items-center py-3 gap-6 text-grey-700"
            style={{ gridTemplateColumns: '1fr 1fr 2fr 4fr 2fr' }}
          >
            <div className="ml-4">
              <input type="checkbox" className="rounded" />
            </div>
            <div className="flex items-center justify-center">
              <Image src="/assets/Checks.svg" alt="status" width={20} height={20} />
            </div>
            <div>9/22/2024 06:45:18 PM</div>
            <div>[GitHub] A third party OAuth has been added to your workspace</div>
            <div>
              <button className="flex items-center underline hover:underline gap-1">
                <Image src="/assets/Eye.svg" alt="view" width={16} height={16} />
                View Input
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 mt-6">
          <Button variant="ghost" className="gap-2 text-grey-700">
            <Image src="/assets/ArrowsClockwise.svg" alt="arrow down" width={16} height={16} />
            Load More Emails
          </Button>

          <Button className="flex gap-2 items-center w-max" onClick={() => setStep(2)}>
            Create Proof Remotely
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectEmails;
