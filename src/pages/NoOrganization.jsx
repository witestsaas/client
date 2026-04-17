import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOrganization, fetchUserOrganizations, joinOrganizationByCode } from "../services/organizations";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function NoOrganizationPage() {
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function bootstrapUserOrg() {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const data = await fetchUserOrganizations();
          if (!cancelled && data.organizations?.length > 0) {
            navigate(`/dashboard/${data.organizations[0].id}`, { replace: true });
          }
          return;
        } catch {
          await sleep(250);
        }
      }
    }

    bootstrapUserOrg();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const org = await createOrganization(orgName.trim());
      navigate(`/dashboard/${org.id}`, { replace: true });
    } catch (err) {
      setError(err.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await joinOrganizationByCode(inviteCode.trim());
      navigate(`/dashboard/${data.orgId || data.orgSlug}`, { replace: true });
    } catch (err) {
      setError(err.message || "Failed to join organization");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fafafa] dark:bg-[#13112a] flex items-center justify-center p-4">
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#1c1a2e] rounded-xl border border-border dark:border-white/[0.07] p-6">
          <h2 className="text-xl font-bold mb-2 text-[#0f0f1a] dark:text-white" style={{ fontFamily: "'Aeonik', sans-serif" }}>Create Organization</h2>
          <p className="text-sm text-[#0f0f1a]/60 dark:text-white/45 mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>Start a new workspace for your team.</p>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Organization name"
              required
              className="w-full rounded-md border border-border dark:border-white/[0.08] px-3 py-2 bg-white dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/30"
            />
            <button disabled={loading} className="w-full rounded-md bg-[#F29F05] hover:bg-[#e5a22e] text-[#0f0f1a] font-semibold py-2 transition-colors duration-200">
              {loading ? "Processing..." : "Create Organization"}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-[#1c1a2e] rounded-xl border border-border dark:border-white/[0.07] p-6">
          <h2 className="text-xl font-bold mb-2 text-[#0f0f1a] dark:text-white" style={{ fontFamily: "'Aeonik', sans-serif" }}>Join with Invite Code</h2>
          <p className="text-sm text-[#0f0f1a]/60 dark:text-white/45 mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>Paste invitation token received by email.</p>
          <form onSubmit={handleJoin} className="space-y-3">
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Invite token"
              required
              className="w-full rounded-md border border-border dark:border-white/[0.08] px-3 py-2 bg-white dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/30"
            />
            <button disabled={loading} className="w-full rounded-md border border-border dark:border-white/[0.12] text-[#0f0f1a] dark:text-white font-semibold py-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors duration-200">
              {loading ? "Processing..." : "Join Organization"}
            </button>
          </form>
        </div>
      </div>
      {error ? <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-red-600 bg-white px-4 py-2 rounded-md border">{error}</div> : null}
    </main>
  );
}

