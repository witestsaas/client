import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../services/http";

export default function JoinOrganization() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isAuthenticated = true;

  async function handleAcceptInvite() {
    setError("");
    setLoading(true);
    try {
      const response = await apiFetch(`/organizations/join/${token}`, {
        method: "POST",
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "Failed to accept invitation");
      }

      navigate(`/dashboard/${data.orgId || data.orgSlug}`, { replace: true });
    } catch (err) {
      setError(err.message || "Unable to join organization");
    } finally {
      setLoading(false);
    }
  }

  function handleDeclineInvite() {
    navigate("/dashboard/no-org", { replace: true });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F6F6F6] dark:bg-[#232323] p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-white dark:bg-[#232323] shadow-2xl p-7">
        <h1 className="text-2xl font-bold text-[#232323] dark:text-white">Organization Invitation</h1>
        <p className="mt-3 text-sm text-[#232323]/70 dark:text-white/70">
          You received an invitation to join an organization. Please confirm if you want to join now.
        </p>

        {error ? (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleDeclineInvite}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-[#232323] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={handleAcceptInvite}
            disabled={loading}
            className="rounded-md bg-[#FFAA00] px-4 py-2 text-sm font-semibold text-[#232323] hover:bg-[#FFAA00]/90 disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Joining..." : "Accept & Join"}
          </button>
        </div>
      </div>
    </main>
  );
}
