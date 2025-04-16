import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Loader from '@/components/ui/loader';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const DragAndDropFile = ({
  accept,
  title,
  helpText,
  file,
  setFile,
  id,
  errorMessage,
  loading,
  tooltipComponent,
}: {
  accept: string;
  title?: string;
  helpText?: string;
  file: File | null;
  setFile: (file: File | null) => void | Promise<void>;
  id?: string;
  errorMessage?: string;
  tooltipComponent?: React.ReactNode;
  loading?: boolean;
}) => {
  return (
    <div className="flex w-full flex-col gap-4">
      {title ? (
        <div className="flex flex-row gap-2">
          <Label className="text-base text-grey-900" htmlFor={title}>
            {title}
          </Label>

          {tooltipComponent ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Image src="/assets/Info.svg" alt="info" width={16} height={16} />
                </TooltipTrigger>
                <TooltipContent>{tooltipComponent}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
      ) : null}
      <div
        className="w-full cursor-pointer rounded-lg p-8"
        onClick={() => document.getElementById('email-file')?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        id={id}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const files = e.dataTransfer.files;
          if (files?.[0]) {
            setFile(files[0]);
          }
        }}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%23E2E2E2FF' stroke-width='4' stroke-dasharray='6%2c 14' stroke-dashoffset='2' stroke-linecap='square'/%3e%3c/svg%3e")`,
        }}
      >
        <div className="flex flex-col items-center justify-center gap-4">
          {loading ? (
            <Loader />
          ) : file ? (
            <>
              <Image
                src="/assets/CheckCircle.svg"
                alt="Upload icon"
                width={40}
                height={40}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
              <div className="flex flex-col items-center text-base font-semibold">
                <p className="text-grey-800">
                  {file.name} <span className="text-grey-700">(Uploaded)</span>
                </p>
                <Button
                  variant="link"
                  className="text-grey-700"
                  startIcon={
                    <Image
                      src="/assets/Trash.svg"
                      alt="Trash icon"
                      width={16}
                      height={16}
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                      }}
                    />
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    setFile(null);
                  }}
                >
                  Delete file
                </Button>
              </div>
            </>
          ) : (
            <>
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
                <p className="text-grey-700">({accept} format)</p>
              </div>
            </>
          )}
          <Input
            id="email-file"
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              // Handle file upload
              const file = e.target.files?.[0];
              if (file) {
                setFile(file);
              }
            }}
          />
        </div>
      </div>
      {errorMessage || helpText ? (
        <p className={cn('text-base text-grey-600', errorMessage ? 'text-red-500' : '')}>
          {errorMessage || helpText}
        </p>
      ) : null}{' '}
    </div>
  );
};

export default DragAndDropFile;
