import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider.jsx';
import { useEffect, useState } from 'react';

export function RequireAuth({ children }) {
  const { isAuthenticated, isLoading, refreshProfile } = useAuth();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionRecovered, setSessionRecovered] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function restoreFromCookieSession() {
      if (isLoading) {
        return;
      }

      if (isAuthenticated) {
        if (!cancelled) {
          setSessionRecovered(true);
          setSessionChecked(true);
        }
        return;
      }

      try {
        const profile = await refreshProfile();
        if (!cancelled) {
          setSessionRecovered(Boolean(profile?.userId));
        }
      } catch {
        if (!cancelled) {
          setSessionRecovered(false);
        }
      } finally {
        if (!cancelled) {
          setSessionChecked(true);
        }
      }
    }

    setSessionChecked(false);
    setSessionRecovered(false);
    restoreFromCookieSession();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, refreshProfile]);

  if (isLoading || !sessionChecked) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated && !sessionRecovered) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}

