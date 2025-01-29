'use client';

import DragAndDropFile from '@/app/components/DragAndDropFile';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useCreateBlueprintStore } from '../store';
import Image from 'next/image';
import sdk from '@/lib/sdk';
import { useDebouncedCallback } from 'use-debounce';

const PatternDetails = ({
  id,
  isFileInvalid,
  file,
  setFile,
}: {
  id: string;
  isFileInvalid: boolean;
  file: File | null;
  setFile: (file: File | null) => void;
}) => {
  const githubUserName = useAuthStore((state) => state.username);
  const store = useCreateBlueprintStore();
  const validationErrors = useCreateBlueprintStore((state) => state.validationErrors);

  const { setField } = store;

  const checkExistingBlueprint = useDebouncedCallback(async (circuitName: string) => {
    let existingBlueprint = false;
    try {
      const blueprint = await sdk.getBlueprint(`${githubUserName}/${circuitName}@v1`); // If blueprint exists, it will always have v1 suffix
      existingBlueprint = !!blueprint;
    } catch {
      console.log('Blueprint does not exist yet');
    }

    if (!existingBlueprint) {
      setField('circuitName', `${circuitName}`);
      setField('slug', `${githubUserName}/${circuitName}`);
    } else {
      // need to check the number of circuits that exists with same name
      const results = await sdk.listBlueprints({
        search: circuitName,
      });

      const incrementedCircuitName = `${circuitName}_${
        results.filter((bp) => bp.props.slug?.split('_')[0] === `${githubUserName}/${circuitName}`)
          .length
      }`;
      setField('circuitName', incrementedCircuitName);
      setField('slug', `${githubUserName}/${incrementedCircuitName}`);
    }
  }, 300);

  return (
    <div className="flex flex-col gap-6">
      <Input
        title="Pattern Name"
        disabled={id !== 'new'}
        value={store.title}
        onChange={(e) => {
          setField('title', e.target.value);
          checkExistingBlueprint(e.target.value.replace(/\s+/g, '-'));
        }}
        error={!!validationErrors.title}
        errorMessage={validationErrors.title}
      />
      <Input title="Slug" disabled value={`${githubUserName}/${store.circuitName}`} />
      {/* TODO: Add check for email body max length */}
      <DragAndDropFile
        accept=".eml"
        file={file}
        tooltipComponent={
          <div className="w-[380px] rounded-2xl border border-grey-500 bg-white p-2">
            <Image src="/assets/emlInfo.svg" alt="emlInfo" width={360} height={80} />
            <p className="mt-3 text-base font-medium text-grey-700">
              The test .eml file is a sample email used to check if all the provided patterns
              (regex) work correctly. This helps confirm everything is set up properly before
              blueprint creation. We always store this file locally and never send it to our server.
            </p>
          </div>
        }
        title="Upload test .eml"
        helpText="Our AI will autofill fields based on contents inside your mail. Don't worry you can edit them later"
        setFile={(e) => {
          console.log('setting the file');
          setFile(e);
        }}
        errorMessage={isFileInvalid ? 'File is invalid' : ''}
      />
      <Textarea
        title="Description"
        placeholder="Enter a description"
        value={store.description}
        rows={3}
        onChange={(e) => setField('description', e.target.value)}
        errorMessage={validationErrors.description}
      />
    </div>
  );
};

export default PatternDetails;
