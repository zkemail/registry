import { useEffect } from 'react';

const useDebounce = (func: () => void, delay: number) => {
  useEffect(() => {
    const timeout = setTimeout(func, delay);
    return () => clearTimeout(timeout);
  }, [func, delay]);
};

export default useDebounce;
