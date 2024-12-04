interface StepperProps {
  steps: string[];
  currentStep: string;
}

const Stepper = ({ steps, currentStep }: StepperProps) => {
  return (
    <div className="flex w-full items-center justify-center">
      <div className="relative flex h-11 w-[88%] items-center justify-between">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex flex-col items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
          >
            <div className="flex w-full items-center">
              {/* Dot */}
              <div className="relative flex w-fit flex-col items-center">
                <div
                  className={`h-4 w-4 rounded-full border-2 ${
                    index <= parseInt(currentStep) ? 'border-green-500' : 'border-grey-300'
                  } ${index <= parseInt(currentStep) - 1 ? 'bg-green-500' : ''} transition-colors duration-500`}
                />
                <span className="absolute top-6 w-max text-sm text-grey-800">{step}</span>
              </div>
              {/* Line */}
              {index < steps.length - 1 && (
                <div className="h-[2px] w-auto flex-1">
                  <div
                    className="h-full bg-grey-300 transition-all duration-500"
                    style={{
                      background: `linear-gradient(to right, ${
                        index < parseInt(currentStep) ? '#22C55E' : '#D1D5DB'
                      } 100%, #D1D5DB 100%)`,
                      backgroundSize: '200% 100%',
                      backgroundPosition: index < parseInt(currentStep) ? 'left' : 'right',
                      transition: 'background-position 0.5s ease-out',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stepper;
