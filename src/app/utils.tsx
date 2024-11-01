const getStatusColorLight = (status: string) => {
  switch (status) {
    case 'Compiled':
      return 'bg-[#34C759] text-neutral-100';
    case 'In Progress':
      return 'bg-blue-100 text-blue-800';
    case 'Failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-grey-100 text-grey-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Compiled':
      return 'assets/CompiledIcon.svg';
    case 'In Progress':
      return 'assets/InProgressIcon.svg';
    case 'Failed':
      return 'assets/FailedIcon.svg';
    default:
      return 'assets/CompiledIcon.svg';
  }
};

export { getStatusColorLight, getStatusIcon };
