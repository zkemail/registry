interface StepperProps {
  steps: string[];
  currentStep: number;
}

const Stepper = ({ steps, currentStep }: StepperProps) => {
  return (
    <div className="relative flex justify-between items-center w-full">
      {steps.map((step, index) => (
        <div key={index} className="flex flex-col items-center flex-1 w-full">
          <div className="flex items-center w-full">
            {/* Dot */}
            <div className="flex flex-col items-center">
              <div
                className={`w-4 h-4 rounded-full ${
                  index <= currentStep ? 'bg-green-500' : 'bg-gray-300'
                } transition-colors duration-300`}
              />
              <span className="mt-2 text-sm text-grey-800">{step}</span>
            </div>
            {/* Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-[1px] mx-2">
                <div
                  className="h-full bg-gray-300"
                  style={{
                    background: `linear-gradient(to right, ${
                      index < currentStep ? '#22C55E' : '#D1D5DB'
                    } 100%, #D1D5DB 100%)`,
                    backgroundSize: '200% 100%',
                    backgroundPosition: index < currentStep ? 'left' : 'right',
                    transition: 'background-position 0.5s ease-out',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Stepper;
