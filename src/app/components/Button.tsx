'use client';

import Image from 'next/image';

const Button = ({
  onClick,
  children,
  startImg,
  variant = 'primary',
}: {
  onClick: () => void;
  children: React.ReactNode;
  startImg?: string;
  variant?: 'primary' | 'secondary';
}) => {
  return (
    <button
      // Updated styling to match the softer look in the image
      className={`border border-grey-500 bg-white text-grey-800 px-2 py-1.5 font-semibold rounded flex items-center gap-2 text-sm hover:bg-grey-50 ${
        variant === 'secondary' ? 'bg-grey-50' : ''
      }`}
      onClick={onClick}
    >
      {startImg ? <Image src={startImg} alt="icon" width={16} height={16} /> : null}
      {children}
    </button>
  );
};

export default Button;
