import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, Filter, MoreVertical, Play, Plus, Search, Trash2, X } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import QuotaRequiredPopup from "../components/QuotaRequiredPopup";
import { fetchOrgQuotaUsage } from "../services/organizations";
import { fetchProjectSettings, fetchTestProjects } from "../services/testManagement";
import { createPlan, deletePlan, listPlans, runPlan } from "../services/executionReporting";
import { getFeatureQuotaSnapshot, isQuotaDeniedError } from "../utils/quota";

function normalizeEnvironmentOptions(configPayload) {
  const rawRows = Array.isArray(configPayload?.environments)
    ? configPayload.environments
    : Array.isArray(configPayload?.settings?.environments)
      ? configPayload.settings.environments
      : [];

  const options = rawRows
    .map((item) => {
      if (!item) return null;
      if (typeof item === "string") {
        const text = item.trim();
        if (!text) return null;
        return { id: text, value: text, label: text };
      }

      const value = String(item.slug || item.name || "").trim();
      if (!value) return null;
      return {
        id: item.id || value,
        value,
        label: String(item.name || item.slug || value),
      };
    })
    .filter(Boolean);

  const seen = new Set();
  return options.filter((option) => {
    if (seen.has(option.value)) return false;
    seen.add(option.value);
    return true;
  });
}

function CreatePlanModal({ open, onClose, projects, projectId, setProjectId, projectEnvironments, form, setForm, onCreate, saving }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl border border-black/10 dark:border-white/10 bg-card shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-black/10 dark:border-white/10 bg-background/30 flex items-center justify-between">
          <p className="text-lg font-semibold text-[#232323] dark:text-white">Create Plan</p>
          <button type="button" onClick={onClose} className="h-8 w-8 rounded-md inline-flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#232323]/70 dark:text-white/70">Project</label>
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              className="w-full h-10 rounded-lg border border-black/10 dark:border-white/15 bg-background/90 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/25"
            >
              {!projects.length ? <option value="">No projects</option> : null}
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#232323]/70 dark:text-white/70">Name</label>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Plan name"
              className="w-full h-10 rounded-lg border border-black/10 dark:border-white/15 bg-background/90 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/25"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#232323]/70 dark:text-white/70">Description</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Description (optional)"
              rows={3}
              className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-background/90 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/25"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#232323]/70 dark:text-white/70">Environment</label>
            <select
              value={form.environment}
              onChange={(event) => setForm((prev) => ({ ...prev, environment: event.target.value }))}
              className="w-full h-10 rounded-lg border border-black/10 dark:border-white/15 bg-background/90 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/25"
            >
              {!projectEnvironments.length ? <option value="">No configured environments</option> : null}
              {projectEnvironments.map((env) => (
                <option key={env.id || env.value} value={env.value}>
                  {env.label}
                </option>
              ))}
            </select>
            {!projectEnvironments.length ? (
              <p className="text-[11px] text-[#232323]/60 dark:text-white/60">
                Add environments in project configuration from Test Cases page.
              </p>
            ) : null}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-black/10 dark:border-white/10 bg-background/20 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border border-black/10 dark:border-white/15 text-xs font-semibold">Cancel</button>
          <button
            type="button"
            onClick={onCreate}
            disabled={saving || !projectId || !form.name.trim() || !projectEnvironments.length || !form.environment}
            className="h-9 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm disabled:opacity-60 inline-flex items-center gap-2"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Plan
          </button>
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(dateString) {
  if (!dateString) return "just now";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function ExecutionPlans() {
  const { orgSlug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [quotaPopup, setQuotaPopup] = useState({ open: false, title: "", message: "" });
  const [plans, setPlans] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [projectEnvironments, setProjectEnvironments] = useState([]);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    environment: "",
  });

  const loadData = async (initial = false) => {
    if (!orgSlug) return;
    if (initial) setLoading(true);
    setError("");
    try {
      const projectRows = await fetchTestProjects(orgSlug);
      setProjects(projectRows);
      const savedProjectId =
        typeof window !== "undefined"
          ? window.localStorage.getItem(`selectedProject_${orgSlug}`) || ""
          : "";
      const effectiveProjectId = projectId || projectRows[0]?.id || "";
      const syncedProjectId =
        savedProjectId && projectRows.some((project) => project.id === savedProjectId)
          ? savedProjectId
          : effectiveProjectId;
      if (!projectId && syncedProjectId) {
        setProjectId(syncedProjectId);
      }
      const rows = await listPlans(orgSlug, { projectId: syncedProjectId || undefined });
      setPlans(rows);
    } catch (err) {
      setError(err?.message || "Failed to load test plans");
    } finally {
      if (initial) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, [orgSlug]);

  useEffect(() => {
    if (!orgSlug || !projectId) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`selectedProject_${orgSlug}`, projectId);
    }
    listPlans(orgSlug, { projectId })
      .then((rows) => setPlans(rows))
      .catch((err) => setError(err?.message || "Failed to load test plans"));
  }, [orgSlug, projectId]);

  useEffect(() => {
    if (!orgSlug || !projectId) {
      setProjectEnvironments([]);
      setForm((prev) => ({ ...prev, environment: "" }));
      return;
    }

    fetchProjectSettings(orgSlug, projectId)
      .then((conf) => {
        const envs = normalizeEnvironmentOptions(conf);
        setProjectEnvironments(envs);
        setForm((prev) => {
          const hasCurrent = envs.some((env) => env.value === prev.environment);
          return {
            ...prev,
            environment: hasCurrent ? prev.environment : envs[0]?.value || "",
          };
        });
      })
      .catch(() => {
        setProjectEnvironments([]);
        setForm((prev) => ({ ...prev, environment: "" }));
      });
  }, [orgSlug, projectId]);

  useEffect(() => {
    const onProjectChange = (event) => {
      const nextOrgSlug = event?.detail?.orgSlug;
      const nextProjectId = event?.detail?.projectId;
      if (nextOrgSlug === orgSlug && nextProjectId) {
        setProjectId(nextProjectId);
      }
    };
    window.addEventListener("selectedProjectChanged", onProjectChange);
    return () => window.removeEventListener("selectedProjectChanged", onProjectChange);
  }, [orgSlug]);

  const filteredPlans = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return plans;
    return plans.filter((plan) => {
      const name = String(plan?.name || "").toLowerCase();
      const description = String(plan?.description || "").toLowerCase();
      const projectName = String(plan?.project?.name || "").toLowerCase();
      return name.includes(term) || description.includes(term) || projectName.includes(term);
    });
  }, [plans, search]);

  const handleCreatePlan = async () => {
    if (!projectId || !form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await createPlan(orgSlug, {
        projectId,
        name: form.name.trim(),
        description: form.description.trim(),
        environment: form.environment || projectEnvironments[0]?.value || "",
      });
      setForm((prev) => ({ ...prev, name: "", description: "" }));
      setShowCreateModal(false);
      setPlans(await listPlans(orgSlug, { projectId }));
    } catch (err) {
      setError(err?.message || "Failed to create plan");
    } finally {
      setSaving(false);
    }
  };

  const handleRunPlan = async (planId) => {
    setSaving(true);
    setError("");
    try {
      const quotaPayload = await fetchOrgQuotaUsage(orgSlug);
      const webQuota = getFeatureQuotaSnapshot(quotaPayload, "WebTestRun");
      if (!webQuota.isUnknown && !webQuota.isUnlimited && webQuota.remaining <= 0 && !webQuota.hasCouponCredits) {
        setQuotaPopup({
          open: true,
          title: "Quota Required",
          message: "Your organization has no remaining web run quota to execute this test plan. Contact your organization admin to increase quota.",
        });
        return;
      }

      await runPlan(orgSlug, planId, {});
      setPlans(await listPlans(orgSlug, { projectId: projectId || undefined }));
    } catch (err) {
      if (isQuotaDeniedError(err)) {
        setQuotaPopup({
          open: true,
          title: "Quota Required",
          message: "Your organization has no remaining web run quota to execute this test plan. Contact your organization admin to increase quota.",
        });
        return;
      }
      setError(err?.message || "Failed to run plan");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    setSaving(true);
    setError("");
    try {
      await deletePlan(orgSlug, planId);
      setPlans(await listPlans(orgSlug, { projectId: projectId || undefined }));
    } catch (err) {
      setError(err?.message || "Failed to delete plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 min-h-0 flex flex-col bg-transparent overflow-hidden">
        <div className="border-b border-black/10 dark:border-white/10 bg-card/95 px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-[#232323] dark:text-white">Test Plans</h2>
              <span className="text-sm text-[#232323]/50 dark:text-white/50">({plans.length})</span>
            </div>
            <p className="text-sm text-[#232323]/60 dark:text-white/60">Group test cases and run them together</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="h-8 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Plan
          </button>
        </div>

        <div className="border-b border-black/10 dark:border-white/10 bg-card/90 px-6 py-3 flex items-center gap-3 shrink-0">
          {/*<select
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            className="h-9 rounded-lg border border-black/10 dark:border-white/15 bg-background/90 px-3 text-sm min-w-[160px] focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/25"
          >
            {!projects.length ? <option value="">No projects</option> : null}
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>*/}
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#232323]/40 dark:text-white/40" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search plans..."
              className="w-full h-9 rounded-lg border border-black/10 dark:border-white/15 bg-background/90 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/25"
            />
          </div>
          <button type="button" className="h-9 px-3 rounded-lg border border-black/10 dark:border-white/15 bg-background/70 text-xs font-semibold inline-flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </button>
        </div>

        {error ? <div className="mx-6 mt-4 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">{error}</div> : null}

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <p className="p-4 text-sm text-[#232323]/60 dark:text-white/60">Loading plans...</p>
          ) : !filteredPlans.length ? (
            <div className="rounded-xl border border-black/10 dark:border-white/10 bg-card/80 p-8 text-center">
              <p className="text-sm text-[#232323]/60 dark:text-white/60">No plans found.</p>
            </div>
          ) : (
            filteredPlans.map((plan) => (
              <div key={plan.id} className="rounded-2xl border border-black/10 dark:border-white/10 bg-card/95 shadow-sm hover:shadow-md hover:border-black/20 dark:hover:border-white/20 transition-all p-4 cursor-pointer" onClick={() => navigate(`/dashboard/${orgSlug}/execution/plans/${plan.id}`)}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-[#232323] dark:text-white truncate">{plan.name}</p>
                    {plan.description ? <p className="text-sm text-[#232323]/60 dark:text-white/60 truncate mt-0.5">{plan.description}</p> : null}
                  </div>

                  <div className="relative inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleRunPlan(plan.id)}
                      disabled={saving}
                      className="h-8 px-3 rounded-lg bg-[#FFAA00] hover:bg-[#F4A200] text-[#232323] text-sm font-semibold shadow-sm inline-flex items-center gap-1.5 disabled:opacity-60"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Run
                    </button>

                    <button
                      type="button"
                      onClick={() => setOpenMenuId((prev) => (prev === plan.id ? "" : plan.id))}
                      className="h-8 w-8 rounded-lg border border-black/10 dark:border-white/15 bg-background/70 inline-flex items-center justify-center"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {openMenuId === plan.id ? (
                      <div className="absolute right-0 top-9 z-20 w-32 rounded-lg border border-black/10 dark:border-white/10 bg-card shadow-lg p-1">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId("");
                            handleDeletePlan(plan.id);
                          }}
                          className="w-full h-8 px-2 rounded-md text-left text-xs font-semibold text-red-500 hover:bg-red-500/10 inline-flex items-center gap-1.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="text-sm text-[#232323]/65 dark:text-white/65">
                  {plan.testCasesCount || 0} test case{(plan.testCasesCount || 0) === 1 ? "" : "s"}
                  {plan.lastRun ? (
                    <>
                      <span className="mx-1.5">•</span>
                      <span>{plan.lastRun.passedTests || 0}/{plan.lastRun.totalTests || 0} passed</span>
                      <span className="mx-1.5">•</span>
                      <span>{formatRelativeTime(plan.lastRun.completedAt || plan.lastRun.createdAt || plan.createdAt)}</span>
                    </>
                  ) : null}
                </div>

                <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-[#232323]/55 dark:text-white/55">
                  <span className="h-6 px-2 rounded-md border border-black/10 dark:border-white/15 bg-background/70 inline-flex items-center">{plan.environment || "staging"}</span>
                  {plan.createdBy?.name ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#FFAA00]/20 text-[#232323] dark:text-white text-[10px] font-semibold inline-flex items-center justify-center">
                        {String(plan.createdBy.name).charAt(0).toUpperCase()}
                      </span>
                      {plan.createdBy.name}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{formatRelativeTime(plan.createdAt)}</span>
                  <span className="ml-auto">{plan.project?.name || "Project"}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <CreatePlanModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          projects={projects}
          projectId={projectId}
          setProjectId={setProjectId}
          projectEnvironments={projectEnvironments}
          form={form}
          setForm={setForm}
          onCreate={handleCreatePlan}
          saving={saving}
        />

        <QuotaRequiredPopup
          open={quotaPopup.open}
          onClose={() => setQuotaPopup({ open: false, title: "", message: "" })}
          title={quotaPopup.title || "Quota Required"}
          message={quotaPopup.message || "This operation requires available quota for your organization."}
        />
      </div>
    </DashboardLayout>
  );
}

