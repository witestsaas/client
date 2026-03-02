import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, Edit, Filter, Folder, Loader2, Plus, Search, Trash2 } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import {
  createTestProject,
  deleteTestProject,
  fetchTestProjects,
  updateTestProject,
} from "../services/testManagement";

const STATUS_OPTIONS = ["Draft", "Ready", "Passed", "Failed"];

const INITIAL_FORM = {
  name: "",
  description: "",
};

export default function ExecutionTests() {
  const { orgSlug } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [localProjects, setLocalProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function loadProjects() {
    if (!orgSlug) return;
    try {
      setLoading(true);
      setError("");
      const data = await fetchTestProjects(orgSlug);
      const normalized = Array.isArray(data) ? data : [];
      setProjects(normalized);
      setLocalProjects(normalized);
    } catch (err) {
      setProjects([]);
      setLocalProjects([]);
      setError(err?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, [orgSlug]);

  useEffect(() => {
    if (!orgSlug) return;

    const intervalId = setInterval(() => {
      loadProjects();
    }, 5000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadProjects();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [orgSlug]);

  useEffect(() => {
    if (!showStatusMenu) return;

    const onDocumentClick = () => setShowStatusMenu(false);
    document.addEventListener("click", onDocumentClick);

    return () => {
      document.removeEventListener("click", onDocumentClick);
    };
  }, [showStatusMenu]);

  useEffect(() => {
    const onOpenCreate = () => {
      setEditingProjectId(null);
      setForm(INITIAL_FORM);
      setModalMode("create");
    };

    window.addEventListener("openCreateProjectModal", onOpenCreate);
    return () => window.removeEventListener("openCreateProjectModal", onOpenCreate);
  }, []);

  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  useEffect(() => {
    const openCreate = () => openCreateModal();
    window.addEventListener("openCreateProjectModal", openCreate);
    return () => window.removeEventListener("openCreateProjectModal", openCreate);
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return localProjects.filter((project) => {
      const textMatch =
        (project.name || "").toLowerCase().includes(term) ||
        (project.description || "").toLowerCase().includes(term);
      if (!textMatch) return false;
      if (selectedStatuses.length === 0) return true;
      return selectedStatuses.includes(project.status || "Draft");
    });
  }, [localProjects, searchTerm, selectedStatuses]);

  const toggleStatus = (status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((item) => item !== status) : [...prev, status],
    );
  };

  const openCreateModal = () => {
    setEditingProjectId(null);
    setForm(INITIAL_FORM);
    setModalMode("create");
  };

  const openEditModal = (project) => {
    setEditingProjectId(project.id);
    setForm({
      name: project.name || "",
      description: project.description || "",
    });
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingProjectId(null);
    setSubmitting(false);
    setForm(INITIAL_FORM);
  };

  async function handleSubmit() {
    if (!orgSlug || !form.name.trim()) return;
    try {
      setSubmitting(true);
      if (modalMode === "create") {
        await createTestProject(orgSlug, form);
      } else if (modalMode === "edit" && editingProjectId) {
        await updateTestProject(orgSlug, editingProjectId, form);
      }
      closeModal();
      await loadProjects();
    } catch (err) {
      setError(err?.message || "Project action failed");
      setSubmitting(false);
    }
  }

  async function confirmDeleteProject() {
    if (!orgSlug || !projectToDelete) return;

    const previous = localProjects;
    const optimistic = localProjects.filter((item) => item.id !== projectToDelete.id);
    setLocalProjects(optimistic);
    setDeletingId(projectToDelete.id);

    try {
      setError("");
      await deleteTestProject(orgSlug, projectToDelete.id);
      setProjects((prev) => prev.filter((item) => item.id !== projectToDelete.id));
      setProjectToDelete(null);
    } catch (err) {
      setLocalProjects(previous);
      setError(err?.message || "Failed to delete project");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading && localProjects.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh] bg-background">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#FFAA00]" />
            <p className="text-sm text-gray-700 dark:text-slate-400">Loading projects…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && localProjects.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-background space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <p className="text-base font-semibold text-red-900 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={loadProjects}
            className="h-8 px-4 rounded-md bg-[#FFAA00] hover:bg-[#F4A200] text-xs font-medium text-[#232323]"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-background dark:bg-[#1e1e1e] [&_input]:rounded-lg [&_input]:border-black/15 dark:[&_input]:border-white/15 [&_input]:bg-background/80 [&_input]:shadow-[0_1px_2px_rgba(0,0,0,0.04)] [&_input:focus]:ring-2 [&_input:focus]:ring-[#FFAA00]/35 [&_input:focus]:border-[#FFAA00]/55">
        <div className="border-b bg-card border-black/10 dark:border-white/10 shadow-[0_8px_26px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.22)]">
          <div className="w-full px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-slate-50 text-lg">Projects</span>
                <span className="text-xs text-gray-500 dark:text-slate-400">({localProjects.length})</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                All your test cases information stored in projects
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1 h-8 px-4 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Project
            </button>
          </div>

          <div className="border-t bg-card border-black/10 dark:border-white/10">
            <div className="w-full px-6 py-3 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search Projects"
                  className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-card text-card-foreground text-sm"
                />
              </div>

              <div className="relative" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setShowStatusMenu((prev) => !prev)}
                  className="h-9 px-3 rounded-lg border border-black/15 dark:border-white/15 shadow-[0_1px_2px_rgba(0,0,0,0.04)] inline-flex items-center gap-1 text-xs text-[#232323]/75 dark:text-white/75"
                >
                  <Filter className="w-3.5 h-3.5" />
                  Status
                </button>
                {showStatusMenu ? (
                  <div className="absolute right-0 mt-2 w-44 rounded-lg border border-black/15 dark:border-white/15 bg-card shadow-xl ring-1 ring-black/5 dark:ring-white/10 z-20 p-1">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => toggleStatus(status)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs hover:bg-[#232323]/5 dark:hover:bg-white/10"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStatuses.includes(status)}
                          readOnly
                          className="w-3.5 h-3.5 rounded"
                        />
                        <span>{status}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-6 py-4">
          {error ? <div className="mb-4 text-sm text-red-500">{error}</div> : null}
          {filtered.length === 0 ? (
            <div className="text-center py-16 space-y-3 border-t dark:border-slate-800">
              <Folder className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-700" />
              <h3 className="text-base font-semibold text-foreground">No test projects</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Create a project to start organizing your test cases.
              </p>
            </div>
          ) : (
            <div className="mt-2 border border-black/10 dark:border-white/10 rounded-xl bg-card dark:bg-[#1e1e1e] divide-y divide-black/10 dark:divide-white/10 shadow-sm">
              {filtered.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => navigate(`/dashboard/${orgSlug}/execution/tests/${project.id}`)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 focus:outline-none flex items-center group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline truncate">
                        {project.name}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      {project.description || "No description"}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-400 dark:text-slate-500">
                      <span className="flex items-center gap-1">
                        <Folder className="w-3 h-3" />
                        <span>{project._count?.folders ?? project.folders?.length ?? 0}</span>
                      </span>
                      <span>Status: {project.status || "Draft"}</span>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1 ml-4"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => openEditModal(project)}
                      className="h-7 w-7 p-1 rounded-lg text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === project.id}
                      onClick={() => setProjectToDelete(project)}
                      className={`h-7 w-7 p-1 rounded-lg transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 ${
                        deletingId === project.id
                          ? "text-gray-400 dark:text-slate-600 cursor-not-allowed"
                          : "text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                      }`}
                    >
                      {deletingId === project.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-r-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalMode ? (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-black/10 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.28)] w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-black/10 dark:border-white/10 bg-gradient-to-r from-card via-card to-card/95">
              <h3 className="text-sm font-semibold text-[#232323] dark:text-slate-50">
                {modalMode === "create" ? "Create project" : "Edit project"}
              </h3>
            </div>
            <div className="px-5 py-4 space-y-4 [&_input]:rounded-lg [&_input]:border-black/15 dark:[&_input]:border-white/15 [&_input]:bg-background/80 [&_input]:shadow-[0_1px_2px_rgba(0,0,0,0.04)] [&_input:focus]:ring-2 [&_input:focus]:ring-[#FFAA00]/35 [&_input:focus]:border-[#FFAA00]/55">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-slate-300">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Project name"
                  className="w-full h-9 text-sm px-3 border border-black/25 dark:border-white/25 bg-background/90"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-slate-300">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Project description"
                  className="w-full h-9 text-sm px-3 border border-black/25 dark:border-white/25 bg-background/90"
                />
              </div>
            </div>
            <div className="px-5 py-3 border-t border-black/10 dark:border-white/10 flex justify-end gap-2 bg-muted/70">
              <button
                type="button"
                onClick={closeModal}
                className="h-8 px-3 rounded-lg border border-black/15 dark:border-white/15 text-xs text-[#232323]/70 dark:text-white/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || !form.name.trim()}
                onClick={handleSubmit}
                className="h-8 px-3 rounded-md bg-[#FFAA00] hover:bg-[#F4A200] disabled:opacity-60 text-xs font-semibold text-[#232323]"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {submitting ? " Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {projectToDelete ? (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-red-200/70 dark:border-red-700/40 ring-1 ring-black/5 dark:ring-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.28)] w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-black/10 dark:border-white/10 bg-gradient-to-r from-red-50/50 to-card dark:from-red-950/20 dark:to-card">
              <h3 className="text-sm font-semibold text-red-600 dark:text-red-300 inline-flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Delete Project
              </h3>
            </div>
            <div className="px-5 py-4 space-y-2">
              <p className="text-sm text-[#232323] dark:text-slate-100">
                Are you sure you want to delete <span className="font-semibold">{projectToDelete.name || "this project"}</span>?
              </p>
              <p className="text-xs text-[#232323]/65 dark:text-white/65">
                This will permanently remove the project and all related folders and test cases.
              </p>
            </div>
            <div className="px-5 py-3 border-t border-black/10 dark:border-white/10 flex justify-end gap-2 bg-muted/70">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                disabled={deletingId === projectToDelete.id}
                className="h-8 px-3 rounded-lg border border-black/15 dark:border-white/15 text-xs text-[#232323]/70 dark:text-white/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingId === projectToDelete.id}
                onClick={confirmDeleteProject}
                className="h-8 px-3 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-60 text-xs font-semibold text-white inline-flex items-center gap-1"
              >
                {deletingId === projectToDelete.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {deletingId === projectToDelete.id ? "Deleting..." : "Delete Project"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
