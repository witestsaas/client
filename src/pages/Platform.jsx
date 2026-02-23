import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useParams } from "react-router-dom";
import { Mail, Trash2, Users } from "lucide-react";
import { apiFetch } from "../services/http";

function roleBadgeClass(role) {
  const map = {
    Owner: "bg-yellow-500 text-black border-yellow-400",
    Admin: "bg-blue-500 text-white border-blue-400",
    Tester: "bg-green-500 text-white border-green-400",
    Viewer: "bg-gray-500 text-white border-gray-400",
  };
  return map[role] || map.Viewer;
}

export default function Platform() {
  const { orgSlug } = useParams();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Viewer");
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const isOwner = org?.currentUserRole === "Owner";
  const canManage = ["Owner", "Admin"].includes(org?.currentUserRole || "");

  async function fetchOrg() {
    setLoading(true);
    setError("");
    try {
      const safeResponse = await apiFetch(`/organizations/${orgSlug}`);
      const data = await safeResponse.json();
      if (!safeResponse.ok) {
        throw new Error(data?.message || "Failed to load organization");
      }
      setOrg(data);
    } catch (e) {
      setError(e.message || "Failed to load organization");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrg();
  }, [orgSlug]);

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

  async function updateRole(memberId, role) {
    const response = await apiFetch(`/organizations/${orgSlug}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, role }),
    });
    if (response.ok) {
      await fetchOrg();
    }
  }

  async function cancelInvite(inviteId) {
    const response = await apiFetch(`/organizations/${orgSlug}/invitations/${inviteId}`, {
      method: "DELETE",
    });
    if (response.ok) {
      await fetchOrg();
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-[#232323] dark:text-white">{org?.name || "Organization"}</h2>
            <p className="text-[#232323]/70 dark:text-white/70">Manage members, roles, and invitations.</p>
          </div>
          {canManage && (
          <button
              type="button"
              onClick={() => {
                setInviteError("");
                setInviteOpen(true);
              }}
              className="bg-white dark:bg-[#232323] border border-[#E5E7EB] dark:border-[#232323] text-[#232323] dark:text-white font-semibold rounded-lg px-4 py-2 shadow-sm hover:bg-[#F3F4F6] dark:hover:bg-[#232323]/80 transition inline-flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Invite Member
            </button>
          )}
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-4 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-[#232323]/60 dark:text-white/60">Total Members</p>
            <p className="text-3xl font-bold text-[#232323] dark:text-white mt-1">{org?.members?.length || 0}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-[#232323]/60 dark:text-white/60">Your Role</p>
            <span className={`inline-flex mt-2 px-3 py-1 text-xs font-semibold border rounded-full ${roleBadgeClass(org?.currentUserRole)}`}>
              {org?.currentUserRole || "Viewer"}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-[#232323] dark:text-white">Team Members</h3>
            <span className="text-xs text-[#232323]/60 dark:text-white/60">{org?.members?.length || 0} members</span>
          </div>
          <div className="divide-y divide-border">
            {(org?.members || []).map((member) => {
              const isSelf = member.user.id === org.currentUserId;
              const canDelete = canManage && member.role !== "Owner" && !isSelf;
              const canEditRole = isOwner && !isSelf;
              return (
                <div key={member.id} className="px-5 py-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#232323] dark:text-white">
                      {member.user.firstName} {member.user.lastName} {isSelf ? "(You)" : ""}
                    </p>
                    <p className="text-sm text-[#232323]/60 dark:text-white/60">{member.user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEditRole ? (
                      <select
                        value={member.role}
                        onChange={(e) => updateRole(member.id, e.target.value)}
                        className="rounded-md border border-border bg-white dark:bg-[#232323] text-sm px-2 py-1"
                      >
                        <option value="Owner">Owner</option>
                        <option value="Admin">Admin</option>
                        <option value="Tester">Tester</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold border rounded-full ${roleBadgeClass(member.role)}`}>
                        {member.role}
                      </span>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => deleteMember(member.id)}
                        type="button"
                        className="h-9 px-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
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

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#FFAA00]" />
            <h3 className="font-semibold text-[#232323] dark:text-white">Pending Invitations</h3>
          </div>
          <div className="divide-y divide-border">
            {(org?.invitations || []).length === 0 ? (
              <p className="px-5 py-4 text-sm text-[#232323]/60 dark:text-white/60">No pending invitations.</p>
            ) : (
              (org?.invitations || []).map((invitation) => (
                <div key={invitation.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#232323] dark:text-white">{invitation.email}</p>
                    <p className="text-sm text-[#232323]/60 dark:text-white/60">
                      Role: {invitation.role} • Expires: {new Date(invitation.expiresAt).toLocaleString()}
                    </p>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => cancelInvite(invitation.id)}
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md px-3 py-1 text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {inviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-white dark:bg-[#232323] p-5">
            <h3 className="text-lg font-semibold text-[#232323] dark:text-white">Invite Team Member</h3>
            <p className="text-sm text-[#232323]/60 dark:text-white/60 mb-4">
              Send an invitation by email. Only existing users can be invited.
            </p>
            <form onSubmit={inviteMember} className="space-y-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                required
                className="w-full rounded-md border border-border px-3 py-2 bg-white dark:bg-[#181818]"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 bg-white dark:bg-[#181818]"
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
                  className="px-3 py-2 rounded-md border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInvite}
                  className="px-3 py-2 rounded-md bg-[#FFAA00] text-[#232323] font-semibold"
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
