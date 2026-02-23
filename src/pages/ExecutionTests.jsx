import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Edit3, Filter, Plus, Search, Trash2 } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import {
  createProject,
  deleteProject,
  fetchProjects,
  updateProject,
} from "../services/projects";

const STATUS_OPTIONS = ["Draft", "Ready"];

const INITIAL_FORM = {
  name: "",
  description: "",
};

export default function ExecutionTests() {
  const { orgSlug } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  async function loadProjects() {
    if (!orgSlug) return;
    try {
      setLoading(true);
      setError("");
      const data = await fetchProjects(orgSlug);
      setProjects(Array.isArray(data?.projects) ? data.projects : []);
    } catch (err) {
      setProjects([]);
      setError(err?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, [orgSlug]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return projects.filter((project) => {
      const textMatch =
        project.name.toLowerCase().includes(term) ||
        (project.description || "").toLowerCase().includes(term);
      if (!textMatch) return false;
      if (selectedStatuses.length === 0) return true;
      return selectedStatuses.includes(project.status);
    });
  }, [projects, searchTerm, selectedStatuses]);

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
        await createProject(orgSlug, form);
      } else if (modalMode === "edit" && editingProjectId) {
        await updateProject(orgSlug, editingProjectId, form);
      }
      closeModal();
      await loadProjects();
    } catch (err) {
      setError(err?.message || "Project action failed");
      setSubmitting(false);
    }
  }

  async function handleDelete(project) {
    if (!orgSlug) return;
    const ok = window.confirm(`Delete project "${project.name}"?`);
    if (!ok) return;
    try {
      setError("");
      await deleteProject(orgSlug, project.id);
      await loadProjects();
    } catch (err) {
      setError(err?.message || "Failed to delete project");
    }
  }

  return (
    <DashboardLayout>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-5 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-[#232323] dark:text-white">Projects</h2>
              <span className="text-xs text-[#232323]/60 dark:text-white/60">({projects.length})</span>
            </div>
            <p className="text-xs text-[#232323]/60 dark:text-white/60">
              All your test cases information stored in projects
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium h-8 px-3"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Project
          </button>
        </div>

        <div className="border-b border-border px-5 py-3 flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#232323]/40 dark:text-white/40" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Projects"
              className="w-full h-9 rounded-md border border-border bg-white dark:bg-[#181818] text-sm pl-9 pr-3"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs text-[#232323]/60 dark:text-white/60">
              <Filter className="h-3.5 w-3.5" />
              Status:
            </span>
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => toggleStatus(status)}
                className={`px-2.5 h-7 rounded-md border text-xs ${
                  selectedStatuses.includes(status)
                    ? "bg-[#FFAA00] text-[#232323] border-[#FFAA00]"
                    : "border-border text-[#232323]/70 dark:text-white/70"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {error ? <div className="mb-4 text-sm text-red-500">{error}</div> : null}
          {loading ? (
            <div className="text-sm text-[#232323]/60 dark:text-white/60">Loading projects...</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-[#232323]/60 dark:text-white/60">No projects found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => navigate(`/dashboard/${orgSlug}/execution/tests/${project.id}`)}
                  className="text-left rounded-lg border border-border bg-background p-4 hover:border-[#FFAA00]/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-[#232323] dark:text-white">{project.name}</p>
                    <span className="inline-flex px-2 py-1 rounded-full text-xs border border-border text-[#232323]/70 dark:text-white/70">
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#232323]/60 dark:text-white/60 mt-1 line-clamp-2">
                    {project.description || "No description"}
                  </p>
                  <p className="mt-3 text-xs text-[#232323]/60 dark:text-white/60">
                    {project.foldersCount || 0} folders • {project.testCasesCount || 0} test cases
                  </p>
                  <div
                    className="mt-4 flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => openEditModal(project)}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 h-7 text-xs text-[#232323]/70 dark:text-white/70 hover:border-[#FFAA00]/60"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(project)}
                      className="inline-flex items-center gap-1 rounded-md border border-red-300 px-2.5 h-7 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalMode ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card overflow-hidden shadow-2xl">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-sm font-semibold text-[#232323] dark:text-white">
                {modalMode === "create" ? "Create project" : "Edit project"}
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Project name"
                  className="w-full h-9 rounded-md border border-border bg-white dark:bg-[#181818] text-sm px-3"
                />
              </div>
              <div>
                <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Project description"
                  rows={3}
                  className="w-full rounded-md border border-border bg-white dark:bg-[#181818] text-sm px-3 py-2"
                />
              </div>
            </div>
            <div className="border-t border-border px-5 py-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="h-8 px-3 rounded-md border border-border text-xs text-[#232323]/70 dark:text-white/70"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || !form.name.trim()}
                onClick={handleSubmit}
                className="h-8 px-3 rounded-md bg-[#FFAA00] hover:bg-[#FFAA00]/90 disabled:opacity-60 text-xs font-semibold text-[#232323]"
              >
                {submitting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
