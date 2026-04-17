import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, LogOut, Mail, Settings, ShieldAlert, Trash2, UserPlus, Users, X } from "lucide-react";
import { apiFetch } from "../services/http";
import { fetchUserOrganizations } from "../services/organizations";

function roleBadgeClass(role) {
  const map = {
    Owner: "bg-[#F4B400] text-[#232323] border-[#E5A400]",
    Admin: "bg-blue-500 text-white border-blue-400",
    Tester: "bg-emerald-500 text-white border-emerald-400",
    Viewer: "bg-slate-500 text-white border-slate-400",
  };
  return map[role] || map.Viewer;
}

function availabilityBadgeClass(status) {
  if (status === "Active") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/40";
  }
  if (status === "Idle") {
    return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/40";
  }
  return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-700/40";
}

function normalizePresenceStatus(status) {
  const value = String(status || "").trim().toLowerCase();
  if (value === "online") return "online";
  if (value === "idle") return "idle";
  return "offline";
}

function presenceLabel(status) {
  if (status === "online") return "Active";
  if (status === "idle") return "Idle";
  return "Offline";
}

function presenceDotClass(status) {
  if (status === "online") return "bg-emerald-500 ring-emerald-500/30";
  if (status === "idle") return "bg-red-500 ring-red-500/30";
  return "bg-slate-400 ring-slate-400/30";
}

function getMemberInitials(member) {
  const first = String(member?.user?.firstName || "").trim();
  const last = String(member?.user?.lastName || "").trim();
  const firstChar = first ? first.charAt(0).toUpperCase() : "?";
  const lastChar = last ? last.charAt(0).toUpperCase() : "";
  return `${firstChar}${lastChar}`;
}

export default function Platform() {
  const { orgSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Viewer");
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [presenceByUserId, setPresenceByUserId] = useState({});
  const [deleteOrgOpen, setDeleteOrgOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingOrg, setDeletingOrg] = useState(false);
  const [deleteOrgError, setDeleteOrgError] = useState("");
  const [leavingOrg, setLeavingOrg] = useState(false);
  const [leaveError, setLeaveError] = useState("");

  const isOwner = org?.currentUserRole === "Owner";
  const canManage = isOwner;

  const orgId = org?.id || "";

  const fetchPresenceStatuses = async () => {
    if (!orgId) return;
    try {
      const response = await apiFetch(`/presence/status?organizationId=${encodeURIComponent(orgId)}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch presence statuses");
      }

      const rows = Array.isArray(data?.presenceStatuses) ? data.presenceStatuses : [];
      const map = {};
      rows.forEach((item) => {
        map[String(item?.userId || "")] = normalizePresenceStatus(item?.status);
      });
      setPresenceByUserId(map);
    } catch {
      // Presence should fail silently and not block page usage
    }
  };

  async function fetchOrg(options = {}) {
    const { silent = false } = options;
    if (!silent) {
      setLoading(true);
    }
    setError("");
    try {
      const safeResponse = await apiFetch(`/organizations/${orgSlug}?_t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await safeResponse.json();
      if (!safeResponse.ok) {
        throw new Error(data?.message || "Failed to load organization");
      }
      setOrg(data);
    } catch (e) {
      const message = e.message || "Failed to load organization";

      if (/Organization not found|Forbidden|Unauthorized/i.test(message)) {
        try {
          const orgs = await fetchUserOrganizations();
          const firstOrgId = orgs?.organizations?.[0]?.id;
          if (firstOrgId && firstOrgId !== orgSlug) {
            navigate(`/dashboard/${firstOrgId}/platform/organizations`, { replace: true });
            return;
          }
        } catch {
          // no-op
        }
      }

      setError(message);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    fetchOrg();
  }, [orgSlug]);

  useEffect(() => {
    if (!orgSlug) return;

    const intervalId = setInterval(() => {
      fetchOrg({ silent: true });
    }, 5000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchOrg({ silent: true });
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [orgSlug]);

  useEffect(() => {
    if (!orgId) return;

    fetchPresenceStatuses();
    const intervalId = window.setInterval(() => {
      fetchPresenceStatuses();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [orgId]);

  // Heartbeat is now handled globally by usePresenceHeartbeat in DashboardLayout

  async function inviteMember(e) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteError("");
    setSubmittingInvite(true);
    try {
      const safeResponse = await apiFetch(`/organizations/${orgSlug}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await safeResponse.json();
      if (!safeResponse.ok) {
        throw new Error(data?.message || "Failed to send invitation");
      }
      setInviteEmail("");
      setInviteRole("Viewer");
      setInviteOpen(false);
      await fetchOrg();
    } catch (e) {
      setInviteError(e.message || "Invite failed");
    } finally {
      setSubmittingInvite(false);
    }
  }

  async function deleteMember(memberId) {
    if (!confirm("Remove this member from the organization?")) return;
    const response = await apiFetch(`/organizations/${orgSlug}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    if (response.ok) {
      await fetchOrg();
    }
  }

  async function updateMemberRole(memberId, newRole) {
    try {
      const response = await apiFetch(`/organizations/${orgSlug}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role: newRole }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to update role");
      }
      await fetchOrg();
    } catch (e) {
      setError(e?.message || "Failed to update member role");
    }
  }

  async function confirmDeleteOrganization() {
    if (!orgSlug || deletingOrg) return;
    setDeletingOrg(true);
    setDeleteOrgError("");

    try {
      const response = await apiFetch(`/organizations/${orgSlug}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to delete organization");
      }

      setDeleteOrgOpen(false);
      setDeleteConfirmText("");
      navigate("/dashboard/no-org", { replace: true });
    } catch (e) {
      setDeleteOrgError(e?.message || "Failed to delete organization");
    } finally {
      setDeletingOrg(false);
    }
  }

  async function handleLeaveOrganization() {
    if (!orgSlug || leavingOrg) return;
    if (!confirm("Are you sure you want to leave this organization? You will lose access to all its projects and data.")) return;

    setLeavingOrg(true);
    setLeaveError("");

    try {
      const response = await apiFetch(`/organizations/${orgSlug}/leave`, { method: "POST" });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to leave organization");
      }

      // Navigate to another org or the no-org page
      try {
        const orgs = await fetchUserOrganizations();
        const firstOrgId = orgs?.organizations?.[0]?.id;
        if (firstOrgId) {
          navigate(`/dashboard/${firstOrgId}/platform/organizations`, { replace: true });
        } else {
          navigate("/dashboard/no-org", { replace: true });
        }
      } catch {
        navigate("/dashboard/no-org", { replace: true });
      }
    } catch (e) {
      setLeaveError(e?.message || "Failed to leave organization");
    } finally {
      setLeavingOrg(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-[#232323]/60 dark:text-white/60">Loading organization...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Header */}
        <div className="shrink-0 px-4 md:px-6 py-3 md:py-4 border-b border-black/10 dark:border-white/10 bg-card/95">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[#232323] dark:text-white">{org?.name || "Organization"}</h2>
              <p className="text-[#232323]/60 dark:text-white/60 text-sm mt-0.5">Manage your organization members and settings</p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setInviteError("");
                  setInviteOpen(true);
                }}
                className="h-9 px-4 rounded-lg border border-black/10 dark:border-white/10 bg-card/90 text-[#232323] dark:text-white text-sm font-semibold inline-flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-[#232323]/5 dark:hover:bg-white/5"
              >
                <UserPlus className="h-4 w-4" />
                Invite Member
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-4 md:px-6 py-4 space-y-5">

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-4 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card/95 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#232323]/60 dark:text-white/60">Total Members</p>
                <p className="text-[2rem] font-bold leading-tight text-[#232323] dark:text-white mt-2">{org?.members?.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-[#232323]/45 dark:text-white/45" />
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card/95 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#232323]/60 dark:text-white/60">Your Role</p>
                <span className={`inline-flex mt-3 px-3 py-1 text-xs font-semibold border rounded-full ${roleBadgeClass(org?.currentUserRole)}`}>
                  {org?.currentUserRole || "Viewer"}
                </span>
              </div>
              <Settings className="h-8 w-8 text-[#232323]/45 dark:text-white/45" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card/95 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="px-5 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
            <h3 className="font-semibold text-[#232323] dark:text-white inline-flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Members
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-full border border-black/10 dark:border-white/10 text-[#232323]/60 dark:text-white/60">
              {org?.members?.length || 0} members
            </span>
          </div>

          <div className="divide-y divide-black/10 dark:divide-white/10">
            {(org?.members || []).map((member) => {
              const isSelf = member.user.id === org.currentUserId;
              const canDelete = canManage && member.role !== "Owner" && !isSelf;
              const userPresenceStatus = normalizePresenceStatus(presenceByUserId[String(member?.user?.id || "")]);
              const availability = presenceLabel(userPresenceStatus);
              const avatar = member?.user?.avatar || null;

              return (
                <div key={member.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="relative h-11 w-11 flex-shrink-0">
                      <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#0f766e] to-[#115e59] text-white inline-flex items-center justify-center overflow-hidden">
                        {avatar ? (
                          <img src={avatar} alt={`${member.user.firstName} ${member.user.lastName}`} className="h-11 w-11 object-cover" />
                        ) : (
                          <span className="text-lg font-semibold">{getMemberInitials(member)}</span>
                        )}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-[#18181b] bg-background/95 inline-flex items-center justify-center z-10">
                        <span className={`h-2.5 w-2.5 rounded-full ring-2 ${presenceDotClass(userPresenceStatus)} ${userPresenceStatus === "online" ? "animate-pulse" : ""}`} />
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-[#232323] dark:text-white truncate inline-flex items-center gap-2">
                        {member.user.firstName} {member.user.lastName}
                        {isSelf ? <span className="text-xs text-[#232323]/55 dark:text-white/55">You</span> : null}
                      </p>
                      <p className="text-sm text-[#232323]/60 dark:text-white/60 truncate">{member.user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canManage && !isSelf ? (
                      <select
                        value={member.role}
                        onChange={(e) => updateMemberRole(member.id, e.target.value)}
                        className={`px-2 py-1 text-xs font-semibold border rounded-full appearance-none cursor-pointer ${roleBadgeClass(member.role)}`}
                      >
                        <option value="Owner">Owner</option>
                        <option value="Admin">Admin</option>
                        <option value="Tester">Tester</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold border rounded-full ${roleBadgeClass(member.role)}`}>{member.role}</span>
                    )}
                    <span className={`inline-flex px-3 py-1 text-xs font-medium border rounded-full ${availabilityBadgeClass(availability)}`}>{availability}</span>
                    {canDelete && (
                      <button
                        onClick={() => deleteMember(member.id)}
                        type="button"
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-red-500 hover:bg-red-500/10"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {isOwner ? (
          <div className="rounded-2xl border border-red-300/70 dark:border-red-700/40 bg-red-50/20 dark:bg-red-950/15 p-5">
            <p className="font-semibold text-red-600 dark:text-red-300 inline-flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Danger Zone
            </p>
            <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-medium text-[#232323] dark:text-white">Delete Organization</p>
                <p className="text-sm text-[#232323]/60 dark:text-white/60">Permanently delete this organization and all its data</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeleteOrgError("");
                  setDeleteConfirmText("");
                  setDeleteOrgOpen(true);
                }}
                className="h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold inline-flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Organization
              </button>
            </div>
          </div>
        ) : null}

        {!isOwner ? (
          <div className="rounded-2xl border border-amber-300/70 dark:border-amber-700/40 bg-amber-50/20 dark:bg-amber-950/15 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-medium text-[#232323] dark:text-white">Leave Organization</p>
                <p className="text-sm text-[#232323]/60 dark:text-white/60">You will lose access to all projects and data in this organization</p>
              </div>
              <button
                type="button"
                onClick={handleLeaveOrganization}
                disabled={leavingOrg}
                className="h-10 px-4 rounded-xl border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {leavingOrg ? "Leaving..." : "Leave Organization"}
              </button>
            </div>
            {leaveError ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{leaveError}</p> : null}
          </div>
        ) : null}
          </div>
        </div>
      </div>

      {deleteOrgOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-black/10 dark:border-white/10 bg-card shadow-2xl">
            <button
              type="button"
              onClick={() => {
                if (deletingOrg) return;
                setDeleteOrgOpen(false);
              }}
              className="absolute top-4 right-4 h-8 w-8 rounded-full inline-flex items-center justify-center text-[#232323]/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6">
              <div className="h-11 w-11 rounded-full border border-red-300/70 dark:border-red-700/50 bg-red-100/70 dark:bg-red-900/30 inline-flex items-center justify-center mb-4">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-300" />
              </div>

              <h3 className="text-lg font-semibold text-[#232323] dark:text-white">Delete organization permanently?</h3>
              <p className="mt-2 text-sm text-[#232323]/70 dark:text-white/70">
                This action cannot be undone. All projects, runs, members, and organization data will be permanently removed.
              </p>

              <div className="mt-4 rounded-xl border border-black/10 dark:border-white/10 bg-background/60 p-3">
                <p className="text-xs uppercase tracking-wide text-[#232323]/55 dark:text-white/55">Organization</p>
                <p className="mt-1 text-sm font-semibold text-[#232323] dark:text-white break-all">{org?.name || orgSlug}</p>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-[#232323] dark:text-white">
                  Type <span className="font-semibold">{org?.name || orgSlug}</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={org?.name || orgSlug}
                  className="mt-2 w-full h-10 rounded-lg border border-black/15 dark:border-white/15 px-3 bg-background/80"
                  autoFocus
                />
              </div>

              {deleteOrgError ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{deleteOrgError}</p> : null}

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteOrgOpen(false)}
                  disabled={deletingOrg}
                  className="h-10 px-4 rounded-xl border border-black/10 dark:border-white/10 text-sm font-medium text-[#232323] dark:text-white disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteOrganization}
                  disabled={deletingOrg || deleteConfirmText.trim() !== String(org?.name || orgSlug || "")}
                  className="h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingOrg ? "Deleting..." : "Delete Organization"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {inviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-card p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#232323] dark:text-white inline-flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#FFAA00]" />
              Invite Team Member
            </h3>
            <p className="text-sm text-[#232323]/60 dark:text-white/60 mt-1 mb-4">
              Send an invitation by email. Only existing users can be invited.
            </p>
            <form onSubmit={inviteMember} className="space-y-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                required
                className="w-full h-10 rounded-lg border border-black/15 dark:border-white/15 px-3 bg-background/80"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full h-10 rounded-lg border border-black/15 dark:border-white/15 px-3 bg-background/80"
              >
                <option value="Admin">Admin</option>
                <option value="Tester">Tester</option>
                <option value="Viewer">Viewer</option>
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setInviteError("");
                    setInviteOpen(false);
                  }}
                  className="h-9 px-3 rounded-lg border border-black/10 dark:border-white/10"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submittingInvite}
                  className="h-9 px-3 rounded-lg bg-[#FFAA00] text-[#232323] font-semibold disabled:opacity-60"
                >
                  {submittingInvite ? "Sending..." : "Send Invite"}
                </button>
              </div>
              {inviteError ? (
                <p className="text-sm text-red-600">
                  {inviteError === "User not found. They must sign up first."
                    ? "User not found. They must sign up first. Please invite an existing user."
                    : inviteError}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
