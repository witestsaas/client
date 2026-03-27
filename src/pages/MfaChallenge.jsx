import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '../components/Input';
import { useAuth } from '../auth/AuthProvider.jsx';

export default function MfaChallengePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyMfaLogin } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);

  const challengeToken = useMemo(
    () => String(searchParams.get('challenge') || '').trim(),
    [searchParams],
  );

  useEffect(() => {
    const expiresIn = Number.parseInt(searchParams.get('expires') || '300', 10);
    const safeExpiresIn = Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 300;
    setSecondsLeft(safeExpiresIn);
  }, [searchParams]);

  useEffect(() => {
    if (!secondsLeft || secondsLeft <= 0) return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => (value > 0 ? value - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!challengeToken) {
      setError('Missing MFA challenge token. Please sign in again.');
      return;
    }

    if (!code.trim()) {
      setError('Code is required.');
      return;
    }

    setLoading(true);
    try {
      const profile = await verifyMfaLogin(challengeToken, code);
      const targetPath = profile?.orgSlug ? `/dashboard/${profile.orgSlug}` : '/dashboard/no-org';
      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(err?.message || 'Invalid MFA code');
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen min-h-dvh items-center justify-center bg-gradient-to-br from-[#F6F6F6] via-[#F6F6F6] to-[#F6F6F6] dark:from-[#232323] dark:via-[#232323] dark:to-[#232323] px-3 sm:px-4 py-6 sm:py-8">
      <div className="w-full max-w-md">
        <div className="bg-white/90 dark:bg-[#2A2A2A] border border-blue-100 dark:border-white/10 rounded-2xl shadow-2xl p-5 sm:p-8 transition-all duration-500">
          <h1 className="text-2xl font-extrabold text-center mb-2 text-blue-900 dark:text-white tracking-tight">
            Multi-factor verification
          </h1>
          <p className="text-sm text-center text-gray-600 dark:text-white/70 mb-6">
            Enter the 6-digit code from your authenticator app or a recovery code.
          </p>

          <form onSubmit={handleSubmit}>
            <Input
              label="Authenticator or recovery code"
              value={code}
              onChange={setCode}
            />
            {secondsLeft > 0 ? (
              <p className="text-xs text-gray-500 dark:text-white/60 mb-3">
                Challenge expires in {secondsLeft}s
              </p>
            ) : (
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
                Challenge expired. Please sign in again.
              </p>
            )}
            {error ? <p className="text-red-600 text-sm mb-3">{error}</p> : null}
            <button
              disabled={loading || secondsLeft <= 0}
              className="w-full bg-[#FFAA00] dark:bg-[#FFAA00] text-white dark:text-[#232323] py-2 rounded-md transition hover:bg-blue-700 dark:hover:bg-[#FFAA00]/90 disabled:opacity-70"
            >
              {loading ? 'Verifying...' : 'Verify and continue'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600 dark:text-white/70">
            <Link to="/signin" className="text-blue-600 dark:text-[#FFAA00] hover:underline font-medium">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
