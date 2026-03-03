import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';
import { fetchUserOrganizations } from '../services/organizations.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolvePrimaryOrgWithRetry(retries = 3) {
  let lastError;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const orgs = await fetchUserOrganizations();
      return orgs?.organizations?.[0]?.slug;
    } catch (error) {
      lastError = error;
      await sleep(250);
    }
  }
  if (lastError) {
    throw lastError;
  }
  return undefined;
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { completeGoogleAuth } = useAuth();
  const [error, setError] = useState('');
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const authError = params.get('error');
    const authErrorDescription = params.get('error_description');
    const challengeToken = String(params.get('challenge') || '').trim();

    if (challengeToken) {
      navigate(`/auth/mfa?challenge=${encodeURIComponent(challengeToken)}`, { replace: true });
      return;
    }

    if (authError) {
      setError(authErrorDescription || authError);
      return;
    }

    completeGoogleAuth()
      .then(async (profile) => {
        let targetOrgSlug = profile?.orgSlug;

        if (!targetOrgSlug) {
          try {
            targetOrgSlug = await resolvePrimaryOrgWithRetry();
          } catch {
            targetOrgSlug = undefined;
          }
        }

        navigate(targetOrgSlug ? `/dashboard/${targetOrgSlug}` : '/dashboard/no-org', {
          replace: true,
        });
      })
      .catch((err) => {
        setError(
          err?.message ||
            'Authentication failed. Check middleware Google callback URL and session cookie settings.',
        );
      });
  }, [completeGoogleAuth, navigate]);

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return <div className="p-8 text-center">Signing you in...</div>;
}
