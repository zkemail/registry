import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useProofStore } from './store';

const SelectEmails = () => {
  const { setStep } = useProofStore();
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="flex w-full flex-col gap-1">
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
        <div className="grid w-full">
          {/* Header */}
          <div
            className="mb-2 grid gap-6 text-left font-semibold"
            style={{ gridTemplateColumns: '1fr 1fr 2fr 4fr 2fr' }}
          >
            <div className="text-left">Select</div>
            <div>Validity</div>
            <div>Sent on</div>
            <div>Subject</div>
            <div className="text-right">Generated Input</div>
          </div>

          {/* Rows */}
          <AnimatePresence initial={false}>
            {fetchedEmails.map((email, index) => (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="grid items-center gap-6 border-t-2 border-neutral-100 py-3 text-grey-700"
                style={{ gridTemplateColumns: '1fr 1fr 2fr 4fr 2fr' }}
              >
                <div className="ml-4">
                  <Checkbox />
                </div>
                <div className="flex items-center justify-center">
                  <Image src="/assets/Checks.svg" alt="status" width={20} height={20} />
                </div>
                <div>{formatDate(email.internalDate)}</div>
                <div className="overflow-hidden text-ellipsis">{email.subject}</div>
                <div>
                  <button className="flex items-center gap-1 underline hover:underline">
                    <Image src="/assets/Eye.svg" alt="view" width={16} height={16} />
                    View Input
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-6 flex flex-col items-center gap-4">
          <Button
            variant="ghost"
            className="gap-2 text-grey-700"
            onClick={handleFetchEmails}
            loading={isFetchEmailLoading}
          >
            <Image
              src="/assets/ArrowsClockwise.svg"
              alt="arrow down"
              width={16}
              height={16}
              className={isFetchEmailLoading ? 'animate-spin' : ''}
            />
            Load More Emails
          </Button>

          <Button className="flex w-max items-center gap-2" onClick={() => setStep(2)}>
            Create Proof Remotely
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectEmails;
