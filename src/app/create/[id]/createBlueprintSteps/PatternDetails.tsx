'use client';

import DragAndDropFile from '@/app/components/DragAndDropFile';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useCreateBlueprintStore } from '../store';

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

  return (
    <div className="flex flex-col gap-6">
      <Input
        title="Pattern Name"
        disabled={id !== 'new'}
        value={store.title}
        onChange={(e) => setField('title', e.target.value)}
        error={!!validationErrors.title}
        errorMessage={validationErrors.title}
      />
      <Input
        title="Circuit Name"
        disabled={id !== 'new'}
        placeholder="e.g CircuitName (without the .circom extension)"
        value={store.circuitName}
        onChange={(e) => {
          setField('circuitName', e.target.value);
          setField('slug', `${githubUserName}/${e.target.value}`);
        }}
        error={!!validationErrors.circuitName}
        errorMessage={validationErrors.circuitName}
      />
      <Input title="Slug" disabled value={`${githubUserName}/${store.circuitName}`} />
      {/* TODO: Add check for email body max length */}
      <DragAndDropFile
        accept=".eml"
        file={file}
        title="Upload test .eml"
        helpText="Our AI will autofill fields based on contents inside your mail. Don't worry you can edit them later"
        setFile={(e) => {
          console.log('setting the file');
          setFile(e);
        }}
        errorMessage={isFileInvalid ? 'File is invalid' : ''}
      />
      {/* <InputTags 
  title="Tags" 
  value={store.tags || []} 
  onChange={(e) => setField('tags', e)} 
  errorMessage={validationErrors.tags}
/> */}
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
