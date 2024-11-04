import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

const DragAndDropFile = ({
  accept,
  title,
  helpText,
  setFile,
}: {
  accept: string;
  title?: string;
  helpText?: string;
  setFile: (file: File) => void;
}) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      {title ? (
        <Label className="text-base text-grey-900" htmlFor={title}>
          {title}
        </Label>
      ) : null}
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
            setFile(files[0]);
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
            <p className="text-grey-700">({accept} format)</p>
          </div>
          <Input
            id="email-file"
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              // Handle file upload
              const file = e.target.files?.[0];
              if (file) {
                // Add your file handling logic here
              }
            }}
          />
        </div>
      </div>
      {helpText ? <p className="text-base text-grey-600">{helpText}</p> : null}
    </div>
  );
};

export default DragAndDropFile;
