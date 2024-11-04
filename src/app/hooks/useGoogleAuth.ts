import { useContext } from 'react';
import GoogleAuthContext from '../contexts/GoogleAuthContext';


const useGoogleAuth = () => {
  return { ...useContext(GoogleAuthContext) };
};

export default useGoogleAuth;
