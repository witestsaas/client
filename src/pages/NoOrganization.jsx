import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOrganization, fetchUserOrganizations, joinOrganizationByCode } from "../services/organizations";

export default function NoOrganizationPage() {
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUserOrganizations()
      .then((data) => {
        if (data.organizations?.length > 0) {
          navigate(`/dashboard/${data.organizations[0].slug}`, { replace: true });
        }
      })
      .catch(() => {});
  }, [navigate]);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const org = await createOrganization(orgName.trim());
      navigate(`/dashboard/${org.slug}`, { replace: true });
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
      navigate(`/dashboard/${data.orgSlug}`, { replace: true });
    } catch (err) {
      setError(err.message || "Failed to join organization");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F6F6] dark:bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#232323] rounded-xl border border-border p-6">
          <h2 className="text-xl font-bold mb-2 text-[#232323] dark:text-white">Create Organization</h2>
          <p className="text-sm text-[#232323]/60 dark:text-white/60 mb-4">Start a new workspace for your team.</p>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Organization name"
              required
              className="w-full rounded-md border border-border px-3 py-2 bg-white dark:bg-[#181818]"
            />
            <button disabled={loading} className="w-full rounded-md bg-[#FFAA00] text-[#232323] font-semibold py-2">
              {loading ? "Processing..." : "Create Organization"}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-[#232323] rounded-xl border border-border p-6">
          <h2 className="text-xl font-bold mb-2 text-[#232323] dark:text-white">Join with Invite Code</h2>
          <p className="text-sm text-[#232323]/60 dark:text-white/60 mb-4">Paste invitation token received by email.</p>
          <form onSubmit={handleJoin} className="space-y-3">
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Invite token"
              required
              className="w-full rounded-md border border-border px-3 py-2 bg-white dark:bg-[#181818]"
            />
            <button disabled={loading} className="w-full rounded-md border border-border text-[#232323] dark:text-white font-semibold py-2">
              {loading ? "Processing..." : "Join Organization"}
            </button>
          </form>
        </div>
      </div>
      {error ? <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-red-600 bg-white px-4 py-2 rounded-md border">{error}</div> : null}
    </main>
  );
}

