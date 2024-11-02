interface StepperProps {
  steps: string[];
  currentStep: number;
}

const Stepper = ({ steps, currentStep }: StepperProps) => {
  return (
    <div className="flex justify-center items-center w-full">
      <div className="relative flex justify-between items-center w-[88%] h-11">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex flex-col items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
          >
            <div className="flex items-center w-full">
              {/* Dot */}
              <div className="flex flex-col items-center relative w-fit">
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    index <= currentStep ? 'border-green-500' : 'border-gray-300'
                  } ${index <= currentStep - 1 ? 'bg-green-500' : ''} transition-colors duration-500`}
                />
                <span className=" top-6 text-sm text-grey-800 w-max absolute">{step}</span>
              </div>
              {/* Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-[2px] w-auto">
                  <div
                    className="h-full bg-gray-300 transition-all duration-500"
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
    </div>
  );
};

export default Stepper;
