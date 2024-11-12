interface StepperProps {
  steps: string[];
  currentStep: string;
}

const StepperMobile = ({ steps, currentStep }: StepperProps) => {
  return (
    <div className="flex w-full items-center justify-center">
      <div className="relative flex w-full items-center justify-between gap-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`h-1.5 w-full rounded-full border ${
              index <= parseInt(currentStep) ? 'border-green-500' : 'border-none bg-neutral-100'
            } ${index <= parseInt(currentStep) - 1 ? 'bg-green-500' : ''} transition-colors duration-500`}
          />
        ))}
      </div>
    </div>
  );
};

export default StepperMobile;
