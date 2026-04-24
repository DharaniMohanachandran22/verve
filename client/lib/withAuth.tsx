'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthGuardedComponent(props: P) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !user) {
        router.replace('/login');
      }
    }, [user, isLoading, router]);

    if (isLoading || !user) return null;

    return <Component {...props} />;
  };
}
