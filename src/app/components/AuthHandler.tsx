'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useSearchParams } from 'next/navigation';

const AuthHandler = () => {
  const { setAuth, setLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const username = searchParams.get('user');
    const isAdmin = searchParams.get('isAdmin') === 'true';

    if (token && username) {
      setAuth(username as string, token as string, isAdmin as boolean);
      setLoading(false);

      // Remove query params from url
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams, setAuth, router]);

  return null;
};

export default AuthHandler;
