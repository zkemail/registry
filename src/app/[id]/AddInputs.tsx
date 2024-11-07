import { Input } from '@/components/ui/input';
import { useProofStore } from './store';
import { Button } from '@/components/ui/button';

const AddInputs = () => {
  const { blueprint, externalInputs, setExternalInputs, setStep } = useProofStore();

  console.log(blueprint);

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="flex w-full flex-col gap-1">
        <h4 className="text-xl font-bold text-grey-800">Add Inputs</h4>
        <p className="text-base font-medium text-grey-700">Enter inputs for the proofs</p>
      </div>
      <div className="flex w-full flex-col gap-4">
        {blueprint?.props.externalInputs?.map((input, index) => (
          <Input
            placeholder={`Enter ${input.name.charAt(0).toUpperCase() + input.name.slice(1)}`}
            title={input.name.charAt(0).toUpperCase() + input.name.slice(1)}
            key={index}
            onChange={(e) => {
              const newInputs = externalInputs ? [...externalInputs] : [];
              newInputs[index] = { name: input.name, value: e.target.value };
              setExternalInputs(newInputs);
            }}
          />
        ))}

        <div className="flex justify-center">
          <Button onClick={() => setStep('3')}>Create Proof Remotely</Button>
        </div>
      </div>
    </div>
  );
};

export default AddInputs;
