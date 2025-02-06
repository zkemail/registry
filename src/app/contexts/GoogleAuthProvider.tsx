'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import {
  hasGrantedAllScopesGoogle,
  useGoogleLogin,
  googleLogout,
  UseGoogleLoginOptionsImplicitFlow,
} from '@react-oauth/google';

import GoogleAuthContext from './GoogleAuthContext';
import { fetchProfile } from '../hooks/useGmailClient';

interface ProvidersProps {
  children: ReactNode;
}

export const esl = false;

const GoogleAuthProvider = ({ children }: ProvidersProps) => {
  /*
   * Contexts
   */

  /*
   * State Keys
   */

  /*
   * State
   */

  const [googleAuthToken, setGoogleAuthToken] = useState<any | null>();

  const [isGoogleAuthed, setIsGoogleAuthed] = useState<boolean>(false);
  const [isScopesApproved, setIsScopesApproved] = useState<boolean>(false);
  const [loggedInGmail, setLoggedInGmail] = useState<string | null>(null);

  useEffect(() => {
    esl && console.log('googleAuthScopes_1');
    esl && console.log('checking googleAuthToken', googleAuthToken);

    if (googleAuthToken) {
      esl && console.log('googleAuthScopes_2');

      const allScope = hasGrantedAllScopesGoogle(
        googleAuthToken,
        'email',
        'profile',
        'https://www.googleapis.com/auth/gmail.readonly'
      );

      setIsScopesApproved(allScope);
    }
  }, [googleAuthToken]);

  useEffect(() => {
    esl && console.log('googleProfile_1');
    esl && console.log('checking googleAuthToken', googleAuthToken);

    if (googleAuthToken) {
      esl && console.log('googleProfile_2');

      const fetchData = async () => {
        try {
          const email = await fetchProfile(googleAuthToken.access_token);

          if (email) {
            setLoggedInGmail(email);

            localStorage.setItem('loggedInEmail', email);
          }
        } catch (error) {
          console.error('Error in fetching profile data:', error);
        }
      };

      fetchData();
    }
  }, [googleAuthToken]);

  /*
   * Helpers
   */

  const googleLogIn = (cb: () => void) =>
    useGoogleLogin({
      onSuccess: (tokenResponse) => {
        setGoogleAuthToken(tokenResponse);
        setIsGoogleAuthed(true);

        cb();
        // localStorage.setItem(
        //   getGoogleAuthTokenKey(),
        //   JSON.stringify(tokenResponse)
        // );
      },
      scope: 'email profile https://www.googleapis.com/auth/gmail.readonly',
      flow: 'implicit',
      ux_mode: 'redirect',
    } as UseGoogleLoginOptionsImplicitFlow);

  const googleLogOut = () => {
    setIsScopesApproved(false);

    setGoogleAuthToken(null);
    // localStorage.removeItem(getGoogleAuthTokenKey());

    setIsGoogleAuthed(false);
    localStorage.removeItem('isGoogleAuthed');

    setLoggedInGmail(null);
    localStorage.removeItem('loggedInGmail');

    googleLogout();
  };

  return (
    <GoogleAuthContext.Provider
      value={{
        googleAuthToken,
        isGoogleAuthed,
        loggedInGmail,
        scopesApproved: isScopesApproved,
        googleLogIn,
        googleLogOut,
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  );
};

export default GoogleAuthProvider;
