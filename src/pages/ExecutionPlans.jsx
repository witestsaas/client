import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, Filter, Loader2, MoreVertical, Pencil, Play, Plus, Search, Trash2, X } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import QuotaRequiredPopup from "../components/QuotaRequiredPopup";
import { fetchOrgQuotaUsage } from "../services/organizations";
import { fetchProjectSettings, fetchProjectTree, fetchTestProjects } from "../services/testManagement";
import { createPlan, deletePlan, getPlan, listPlans, patchPlanTestCase, replacePlanTestCases, runPlan, updatePlan, getExecutionSlots } from "../services/executionReporting";
import { isQuotaDeniedError } from "../utils/quota";
import { useOrgSlots } from "../hooks/useSocket";
import { useLanguage } from "../utils/language-context";

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

const PLAN_BROWSER_OPTIONS = [
  { id: "desktop-chrome", label: "Chrome (Desktop)" },
  { id: "desktop-edge", label: "Edge (Desktop)" },
  { id: "desktop-firefox", label: "Firefox (Desktop)" },
  { id: "desktop-safari", label: "Safari (Desktop)" },
  { id: "mobile-samsung-s24-ultra", label: "Samsung S24 Ultra" },
  { id: "mobile-iphone-15-pro-max", label: "iPhone 15 Pro Max" },
];

function buildProjectTreeRows(treePayload) {
  const folders = Array.isArray(treePayload?.folders) ? treePayload.folders : [];
  const testCases = Array.isArray(treePayload?.testCases) ? treePayload.testCases : [];

  const folderMap = new Map();
  folders.forEach((folder) => {
    folderMap.set(String(folder.id), folder);
  });

  const grouped = new Map();
  testCases.forEach((item) => {
    const folderId = item?.folderId ? String(item.folderId) : "__root__";
    const folder = folderMap.get(folderId);
    const folderName = folder?.path || folder?.name || "Root";
    if (!grouped.has(folderId)) {
      grouped.set(folderId, {
        folderId,
        folderName,
        testCases: [],
      });
    }
    grouped.get(folderId).testCases.push({
      id: String(item.id),
      title: String(item.title || "Untitled test case"),
    });
  });

  return Array.from(grouped.values())
    .map((row) => ({
      ...row,
      testCases: row.testCases.sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .sort((a, b) => a.folderName.localeCompare(b.folderName));
}

function CreatePlanModal({ open, onClose, projects, projectId, setProjectId, projectEnvironments, form, setForm, onCreate, saving }) {
  const { t } = useLanguage();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl border border-black/10 dark:border-white/10 bg-card shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-black/10 dark:border-white/10 bg-background/30 flex items-center justify-between">
          <p className="text-lg font-semibold text-[#232323] dark:text-white">{t("tp.createPlan")}</p>
          <button type="button" onClick={onClose} className="h-8 w-8 rounded-md inline-flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#232323]/70 dark:text-white/70 ">{t("tp.project")}</label>
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              className="w-full h-10 rounded-lg border border-black/10 dark:border-white/15 bg-background/90 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/25 cursor-pointer"
            >
              {!projects.length ? <option value="">{t("tp.noProjects")}</option> : null}
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#232323]/70 dark:text-white/70">{t("common.name")}</label>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Plan name"
              className="w-full h-10 rounded-lg border border-black/10 dark:border-white/15 bg-background/90 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/25"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#232323]/70 dark:text-white/70">{t("common.description")}</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Description (optional)"
              rows={3}
              className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-background/90 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/25"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#232323]/70 dark:text-white/70">{t("tp.environment")}</label>
            <select
              value={form.environment}
              onChange={(event) => setForm((prev) => ({ ...prev, environment: event.target.value }))}
              className="w-full h-10 rounded-lg border border-black/10 dark:border-white/15 bg-background/90 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/25"
            >
              {!projectEnvironments.length ? <option value="">{t("tp.noEnvironments")}</option> : null}
              {projectEnvironments.map((env) => (
                <option key={env.id || env.value} value={env.value}>
                  {env.label}
                </option>
              ))}
            </select>
            {!projectEnvironments.length ? (
              <p className="text-[11px] text-[#232323]/60 dark:text-white/60">
                {t("tp.addEnvHint")}
              </p>
            ) : null}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-black/10 dark:border-white/10 bg-background/20 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border border-black/10 dark:border-white/15 text-xs font-semibold cursor-pointer">{t("common.cancel")}</button>
          <button
            type="button"
            onClick={onCreate}
            disabled={saving || !projectId || !form.name.trim() || !projectEnvironments.length || !form.environment}
            className="h-9 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm disabled:opacity-60 inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("tp.createPlan")}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditPlanModal({
  open,
  onClose,
  form,
  setForm,
  environmentOptions,
  rows,
  selectedTestCaseIds,
  setSelectedTestCaseIds,
  browsersByTestCase,
  setBrowsersByTestCase,
  onSave,
  saving,
  error,
}) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  if (!open) return null;

  const selectedSet = new Set((selectedTestCaseIds || []).map((item) => String(item)));
  const normalizedSearch = search.trim().toLowerCase();
  const filteredRows = (rows || [])
    .map((row) => ({
      ...row,
      testCases: row.testCases.filter((testCase) => {
        if (!normalizedSearch) return true;
        return (
          row.folderName.toLowerCase().includes(normalizedSearch) ||
          testCase.title.toLowerCase().includes(normalizedSearch)
        );
      }),
    }))
    .filter((row) => row.testCases.length > 0);

  const toggleTestCase = (testCaseId, checked) => {
    const normalizedId = String(testCaseId);
    setSelectedTestCaseIds((prev) => {
      const prevSet = new Set((prev || []).map((item) => String(item)));
      if (checked) prevSet.add(normalizedId);
      else prevSet.delete(normalizedId);
      return Array.from(prevSet);
    });

    if (checked) {
      setBrowsersByTestCase((prev) => {
        if (Array.isArray(prev?.[normalizedId]) && prev[normalizedId].length > 0) return prev;
        return {
          ...(prev || {}),
          [normalizedId]: ["desktop-chrome"],
        };
      });
    }
  };

  const toggleBrowser = (testCaseId, browserId, checked) => {
    const normalizedCaseId = String(testCaseId);
    setBrowsersByTestCase((prev) => {
      const current = Array.isArray(prev?.[normalizedCaseId]) ? prev[normalizedCaseId] : [];
      const next = checked
        ? Array.from(new Set([...current, browserId]))
        : current.filter((item) => item !== browserId);

      return {
        ...(prev || {}),
        [normalizedCaseId]: next,
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !saving && onClose()}>
      <div className="w-full max-w-6xl h-[90vh] rounded-2xl border border-black/10 dark:border-white/10 bg-card shadow-2xl overflow-hidden flex flex-col" onClick={(event) => event.stopPropagation()}>
        <div className="px-5 py-4 border-b border-black/10 dark:border-white/10 bg-background/30 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-semibold text-[#232323] dark:text-white truncate">Edit Test Plan</p>
            <p className="text-xs text-[#232323]/55 dark:text-white/55 mt-0.5">Update plan details, environment, selected test cases, and browser coverage.</p>
          </div>
          <button type="button" onClick={onClose} className="h-8 w-8 rounded-md inline-flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-0">
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-black/10 dark:border-white/10 p-4 space-y-3 overflow-auto">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#232323]/70 dark:text-white/70">Name</label>
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full h-10 rounded-lg border border-black/10 dark:border-white/15 bg-background/90 px-3 text-sm"
                placeholder="Plan name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#232323]/70 dark:text-white/70">Description</label>
              <textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                rows={4}
                className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-background/90 px-3 py-2 text-sm resize-none"
                placeholder="Description"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#232323]/70 dark:text-white/70">Environment</label>
              <select
                value={form.environment}
                onChange={(event) => setForm((prev) => ({ ...prev, environment: event.target.value }))}
                className="w-full h-10 rounded-lg border border-black/10 dark:border-white/15 bg-background/90 px-3 text-sm"
              >
                {!environmentOptions.length ? <option value="">No environments</option> : null}
                {environmentOptions.map((env) => (
                  <option key={env.id || env.value} value={env.value}>{env.label}</option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-black/10 dark:border-white/10 bg-background/60 p-3">
              <p className="text-xs text-[#232323]/65 dark:text-white/65">
                Selected test cases: <span className="font-semibold text-[#232323] dark:text-white">{selectedSet.size}</span>
              </p>
            </div>

            {error ? (
              <div className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">
                {error}
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-8 p-4 flex flex-col min-h-0">
            <div className="relative mb-3">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#232323]/40 dark:text-white/40" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search folders or test cases"
                className="w-full h-9 rounded-lg border border-black/10 dark:border-white/15 bg-background/90 pl-9 pr-3 text-sm"
              />
            </div>

            <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-black/10 dark:border-white/10 divide-y divide-black/6 dark:divide-white/6">
              {!filteredRows.length ? (
                <div className="h-full min-h-[220px] flex items-center justify-center text-sm text-[#232323]/55 dark:text-white/55">
                  No test cases found.
                </div>
              ) : (
                filteredRows.map((row) => (
                  <div key={row.folderId} className="p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#232323]/55 dark:text-white/55 mb-2">{row.folderName}</p>
                    <div className="space-y-2">
                      {row.testCases.map((testCase) => {
                        const selected = selectedSet.has(String(testCase.id));
                        const selectedBrowsers = Array.isArray(browsersByTestCase?.[String(testCase.id)])
                          ? browsersByTestCase[String(testCase.id)]
                          : [];

                        return (
                          <div key={testCase.id} className="rounded-lg border border-black/8 dark:border-white/10 bg-background/70 px-3 py-2.5">
                            <div className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(event) => toggleTestCase(testCase.id, event.target.checked)}
                                className="mt-0.5 h-4 w-4 accent-[#FFAA00]"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-[#232323] dark:text-white truncate">{testCase.title}</p>
                                {selected ? (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {PLAN_BROWSER_OPTIONS.map((browser) => {
                                      const checked = selectedBrowsers.includes(browser.id);
                                      return (
                                        <label key={`${testCase.id}-${browser.id}`} className={`h-6 px-2 rounded-md border text-[11px] inline-flex items-center gap-1 cursor-pointer ${checked ? "border-[#FFAA00]/45 bg-[#FFAA00]/12 text-[#232323] dark:text-white" : "border-black/10 dark:border-white/15 text-[#232323]/70 dark:text-white/70"}`}>
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(event) => toggleBrowser(testCase.id, browser.id, event.target.checked)}
                                            className="h-3 w-3 accent-[#FFAA00]"
                                          />
                                          {browser.label}
                                        </label>
                                      );
                                    })}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-black/10 dark:border-white/10 bg-background/20 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="h-9 px-4 rounded-lg border border-black/10 dark:border-white/15 text-sm font-semibold disabled:opacity-60 cursor-pointer">Cancel</button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !form.name.trim() || !form.environment}
            className="h-9 px-4 rounded-lg bg-[#FFAA00] hover:bg-[#F4A200] text-[#232323] text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
            Save Changes
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
  const { t } = useLanguage();
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
  const [deletePlanTarget, setDeletePlanTarget] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editEnvironmentOptions, setEditEnvironmentOptions] = useState([]);
  const [editRows, setEditRows] = useState([]);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    environment: "",
  });
  const [editSelectedTestCaseIds, setEditSelectedTestCaseIds] = useState([]);
  const [editBrowsersByTestCase, setEditBrowsersByTestCase] = useState({});
  const [runModalPlanId, setRunModalPlanId] = useState("");
  const [runModalParallel, setRunModalParallel] = useState(1);
  const [runModalRunning, setRunModalRunning] = useState(false);
  const [runModalHydrated, setRunModalHydrated] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    environment: "",
  });
  const runModalPersistKey = useMemo(() => {
    if (!orgSlug) return "execution-plans-run-modal";
    return `execution-plans-run-modal:${orgSlug}`;
  }, [orgSlug]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(runModalPersistKey);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.runModalPlanId) {
        setRunModalPlanId(String(saved.runModalPlanId));
      }
      if (typeof saved?.runModalParallel === "number" && saved.runModalParallel > 0) {
        setRunModalParallel(saved.runModalParallel);
      }
    } catch {
      // Ignore invalid persisted state.
    } finally {
      setRunModalHydrated(true);
    }
  }, [runModalPersistKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!runModalHydrated) return;
    if (!runModalPlanId) {
      window.sessionStorage.removeItem(runModalPersistKey);
      return;
    }

    const payload = {
      runModalPlanId,
      runModalParallel,
    };
    window.sessionStorage.setItem(runModalPersistKey, JSON.stringify(payload));
  }, [runModalPersistKey, runModalPlanId, runModalParallel, runModalHydrated]);

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

  const openRunModal = (planId) => {
    setRunModalPlanId(planId);
    setRunModalParallel(1);
  };

  const handleRunPlan = async (parallelSessions = 1) => {
    const planId = runModalPlanId;
    if (!planId) return;
    setRunModalRunning(true);
    setError("");
    try {
      const quotaPayload = await fetchOrgQuotaUsage(orgSlug);
      const creditBalance = Number(quotaPayload?.couponBalance?.totalRemainingUsd || 0);
      if (creditBalance <= 0) {
        setQuotaPopup({
          open: true,
          title: "No Credits",
          message: "Your organization has no remaining credits. Please add credits to run tests.",
        });
        return;
      }

      await runPlan(orgSlug, planId, { parallelSessions });
      setRunModalPlanId("");
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(runModalPersistKey);
      }
      setPlans(await listPlans(orgSlug, { projectId: projectId || undefined }));
    } catch (err) {
      // Concurrency limit = too many parallel tests running right now (429 with concurrency_limit_* error)
      const errCode = err?.payload?.error || err?.code || "";
      if (typeof errCode === "string" && errCode.startsWith("concurrency_limit")) {
        setError(err?.payload?.message || err?.message || "Your organization has reached its concurrent test limit. Wait for running tests to complete.");
        return;
      }
      if (isQuotaDeniedError(err)) {
        setQuotaPopup({
          open: true,
          title: "No Credits",
          message: "Your organization has no remaining credits. Please add credits to run tests.",
        });
        return;
      }
      setError(err?.message || "Failed to run plan");
    } finally {
      setRunModalRunning(false);
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

  const openEditModal = async (planId) => {
    if (!orgSlug || !planId) return;
    setEditSaving(true);
    setEditError("");
    setEditingPlanId(String(planId));

    try {
      const plan = await getPlan(orgSlug, planId);
      const effectiveProjectId = String(plan?.projectId || plan?.project?.id || "");

      if (!effectiveProjectId) {
        throw new Error("Plan project could not be resolved.");
      }

      const [projectConfig, treePayload] = await Promise.all([
        fetchProjectSettings(orgSlug, effectiveProjectId).catch(() => ({})),
        fetchProjectTree(orgSlug, effectiveProjectId),
      ]);

      const environments = normalizeEnvironmentOptions(projectConfig);
      const planCases = Array.isArray(plan?.testCases) ? plan.testCases : [];
      const selectedIds = planCases
        .map((item) => String(item?.testCase?.id || ""))
        .filter(Boolean);
      const browsersMap = planCases.reduce((acc, item) => {
        const testCaseId = String(item?.testCase?.id || "");
        if (!testCaseId) return acc;
        const browsers = Array.isArray(item?.browsers) && item.browsers.length > 0
          ? item.browsers
          : ["desktop-chrome"];
        acc[testCaseId] = browsers;
        return acc;
      }, {});

      setEditEnvironmentOptions(environments);
      setEditRows(buildProjectTreeRows(treePayload));
      setEditForm({
        name: String(plan?.name || ""),
        description: String(plan?.description || ""),
        environment: String(plan?.environment || environments[0]?.value || ""),
      });
      setEditSelectedTestCaseIds(selectedIds);
      setEditBrowsersByTestCase(browsersMap);
      setEditModalOpen(true);
    } catch (err) {
      setEditError(err?.message || "Failed to load plan for editing");
    } finally {
      setEditSaving(false);
    }
  };

  const handleSaveEditedPlan = async () => {
    if (!orgSlug || !editingPlanId) return;
    if (!editForm.name.trim()) {
      setEditError("Plan name is required.");
      return;
    }
    if (!editForm.environment) {
      setEditError("Environment is required.");
      return;
    }

    setEditSaving(true);
    setEditError("");

    try {
      await updatePlan(orgSlug, editingPlanId, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        environment: editForm.environment,
      });

      const selectedIds = Array.from(new Set((editSelectedTestCaseIds || []).map((item) => String(item)).filter(Boolean)));
      const replaceResult = await replacePlanTestCases(orgSlug, editingPlanId, {
        testCaseIds: selectedIds,
      });

      const updatedPlanCases = Array.isArray(replaceResult?.testCases) ? replaceResult.testCases : [];
      const patchTasks = updatedPlanCases.map((planCase) => {
        const testCaseId = String(planCase?.testCase?.id || "");
        const browsers = Array.isArray(editBrowsersByTestCase?.[testCaseId])
          ? editBrowsersByTestCase[testCaseId]
          : [];
        const normalizedBrowsers = browsers.length > 0 ? Array.from(new Set(browsers)) : ["desktop-chrome"];
        return patchPlanTestCase(orgSlug, editingPlanId, {
          testPlanCaseId: planCase.id,
          browsers: normalizedBrowsers,
        });
      });

      await Promise.all(patchTasks);
      setPlans(await listPlans(orgSlug, { projectId: projectId || undefined }));
      setEditModalOpen(false);
      setEditingPlanId("");
    } catch (err) {
      setEditError(err?.message || "Failed to save plan changes");
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 min-h-0 flex flex-col bg-transparent overflow-hidden">
        <div className="border-b border-black/10 dark:border-white/10 bg-card/95 px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-[#232323] dark:text-white">{t("tp.title")}</h2>
              <span className="text-sm text-[#232323]/50 dark:text-white/50">({plans.length})</span>
            </div>
            <p className="text-sm text-[#232323]/60 dark:text-white/60">{t("tp.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="h-8 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("tp.createPlan")}
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
              placeholder={t("tp.searchPlans")}
              className="w-full h-9 rounded-lg border border-black/10 dark:border-white/15 bg-background/90 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAA00]/25"
            />
          </div>
          {/*<button type="button" className="h-9 px-3 rounded-lg border border-black/10 dark:border-white/15 bg-background/70 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer">
            <Filter className="h-3.5 w-3.5" />
            {t("common.filter")}
          </button>*/}
        </div>

        {error ? <div className="mx-6 mt-4 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">{error}</div> : null}

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="rounded-xl border border-black/10 dark:border-white/10 bg-card p-6 text-center text-sm text-[#232323]/60 dark:text-white/60">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[#FFAA00]" />
              Loading plans...
            </div>
          ) : !filteredPlans.length ? (
            <div className="rounded-xl border border-black/10 dark:border-white/10 bg-card/80 p-8 text-center">
              <p className="text-sm text-[#232323]/60 dark:text-white/60">{t("tp.noPlans")}</p>
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
                      onClick={() => openRunModal(plan.id)}
                      disabled={saving}
                      className="h-8 px-3 rounded-lg bg-[#FFAA00] hover:bg-[#F4A200] text-[#232323] text-sm font-semibold shadow-sm inline-flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5" />
                      {t("tp.runPlan")}
                    </button>

                    <button
                      type="button"
                      onClick={() => setOpenMenuId((prev) => (prev === plan.id ? "" : plan.id))}
                      className="ui-dropdown-trigger h-8 w-8 rounded-lg border border-black/10 dark:border-white/15 bg-background/70 inline-flex items-center justify-center cursor-pointer"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {openMenuId === plan.id ? (
                      <div className="ui-dropdown-panel absolute right-0 top-9 z-20 w-40 rounded-lg border border-black/10 dark:border-white/10 bg-card shadow-lg p-1">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId("");
                            openEditModal(plan.id);
                          }}
                          className="ui-dropdown-item w-full h-8 px-2 rounded-md text-left text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId("");
                            setDeletePlanTarget({
                              id: plan.id,
                              name: plan.name || "Test Plan",
                            });
                          }}
                          className="ui-dropdown-item w-full h-8 px-2 rounded-md text-left text-xs font-semibold text-red-500 hover:bg-red-500/10 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t("common.delete")}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="text-sm text-[#232323]/65 dark:text-white/65">
                  {plan.testCasesCount || 0} {(plan.testCasesCount || 0) === 1 ? t("tp.testCase") : t("tp.testCases")}
                  {plan.lastRun ? (
                    <>
                      <span className="mx-1.5">•</span>
                      <span>{plan.lastRun.passedTests || 0}/{plan.lastRun.totalTests || 0} {t("tp.passed")}</span>
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

        <EditPlanModal
          open={editModalOpen}
          onClose={() => {
            if (!editSaving) {
              setEditModalOpen(false);
              setEditingPlanId("");
              setEditError("");
            }
          }}
          form={editForm}
          setForm={setEditForm}
          environmentOptions={editEnvironmentOptions}
          rows={editRows}
          selectedTestCaseIds={editSelectedTestCaseIds}
          setSelectedTestCaseIds={setEditSelectedTestCaseIds}
          browsersByTestCase={editBrowsersByTestCase}
          setBrowsersByTestCase={setEditBrowsersByTestCase}
          onSave={handleSaveEditedPlan}
          saving={editSaving}
          error={editError}
        />

        {deletePlanTarget ? (
          <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !saving && setDeletePlanTarget(null)}>
            <div className="w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-card p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
              <p className="text-lg font-semibold text-[#232323] dark:text-white">Delete Test Plan</p>
              <p className="text-sm text-[#232323]/65 dark:text-white/65 mt-2 leading-relaxed">
                Delete "{deletePlanTarget.name}" permanently? This action cannot be undone.
              </p>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeletePlanTarget(null)}
                  disabled={saving}
                  className="h-9 px-4 rounded-lg border border-black/10 dark:border-white/15 text-sm font-semibold disabled:opacity-60 cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await handleDeletePlan(deletePlanTarget.id);
                    setDeletePlanTarget(null);
                  }}
                  disabled={saving}
                  className="h-9 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  {t("common.delete")}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {runModalPlanId ? (
          <RunPlanQuickModal
            orgSlug={orgSlug}
            planName={(filteredPlans.find((p) => p.id === runModalPlanId)?.name) || "Plan"}
            parallelSessions={runModalParallel}
            setParallelSessions={setRunModalParallel}
            running={runModalRunning}
            onRun={() => handleRunPlan(runModalParallel)}
            onClose={() => !runModalRunning && setRunModalPlanId("")}
          />
        ) : null}

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

function RunPlanQuickModal({ orgSlug, planName, parallelSessions, setParallelSessions, running, onRun, onClose }) {
  const { t } = useLanguage();
  const realtimeSlots = useOrgSlots(orgSlug);
  const orgAvailable = realtimeSlots?.available ?? 4;
  const orgLimit = realtimeSlots?.limit ?? 4;
  const orgUsed = realtimeSlots?.used ?? 0;
  const loadingSlots = realtimeSlots === null;

  useEffect(() => {
    if (realtimeSlots === null) return;
    const defaultParallel = Math.min(Math.max(orgAvailable || 1, 1), orgLimit);
    setParallelSessions(defaultParallel);
  }, [realtimeSlots === null]);

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !running && onClose()}>
      <div className="w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-lg font-semibold text-[#232323] dark:text-white">{t("common.run")} "{planName}"</p>
        <p className="text-sm text-[#232323]/60 dark:text-white/60 mt-1">{t("tp.configureSessions")}</p>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-[#232323]/65 dark:text-white/65 mb-1">
            <span>{t("tp.slotAvailability")}</span>
            {loadingSlots ? (
              <span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />...</span>
            ) : (
              <span>
                <span className={orgAvailable > 0 ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>{orgAvailable}</span>
                <span className="text-[#232323]/45 dark:text-white/45"> / {orgLimit}</span>
                <span className="text-[#232323]/35 dark:text-white/35 ml-1">({orgUsed} in use)</span>
              </span>
            )}
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-[#232323]/65 dark:text-white/65 mb-2">
            <span>{t("tp.parallelSessions")}</span>
            <span className="font-semibold">{parallelSessions}</span>
          </div>
          <input
            type="range"
            min={1}
            max={orgLimit}
            value={parallelSessions}
            onChange={(e) => setParallelSessions(Math.min(Math.max(Number(e.target.value) || 1, 1), orgLimit))}
            className="w-full accent-[#FFAA00]"
          />
          <p className="text-xs text-[#232323]/45 dark:text-white/45 mt-1">Up to {parallelSessions} {parallelSessions !== 1 ? t("tp.browserSessions") : t("tp.browserSession")}</p>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} disabled={running} className="h-9 px-4 rounded-lg border border-black/10 dark:border-white/15 text-sm font-semibold disabled:opacity-60">{t("common.cancel")}</button>
          <button type="button" onClick={onRun} disabled={running} className="h-9 px-4 rounded-lg bg-[#FFAA00] hover:bg-[#F4A200] text-[#232323] text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run Now
          </button>
        </div>
      </div>
    </div>
  );
}

