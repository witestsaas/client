import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { completeGoogleAuth } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    completeGoogleAuth()
      .then((profile) => {
        navigate(profile.orgSlug ? `/dashboard/${profile.orgSlug}` : '/dashboard/no-org', { replace: true });
      })
      .catch(() => {
        setError('Google authentication failed');
      });
  }, [completeGoogleAuth, navigate]);

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return <div className="p-8 text-center">Signing you in...</div>;
}
