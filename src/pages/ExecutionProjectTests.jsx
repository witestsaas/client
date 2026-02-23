import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FolderTree } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { fetchProject } from "../services/projects";

export default function ExecutionProjectTests() {
  const { orgSlug, projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!orgSlug || !projectId) return;
      try {
        setLoading(true);
        setError("");
        const data = await fetchProject(orgSlug, projectId);
        if (!cancelled) setProject(data);
      } catch (err) {
        if (!cancelled) {
          setProject(null);
          setError(err?.message || "Failed to load project");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [orgSlug, projectId]);

  return (
    <DashboardLayout>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-5 py-4 flex items-center justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={() => navigate(`/dashboard/${orgSlug}/execution/tests`)}
              className="inline-flex items-center gap-1 text-xs text-[#232323]/60 dark:text-white/60 hover:text-[#232323] dark:hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to projects
            </button>
            <h2 className="mt-2 text-lg font-semibold text-[#232323] dark:text-white">
              {loading ? "Loading project..." : project?.name || "Project"}
            </h2>
            <p className="text-xs text-[#232323]/60 dark:text-white/60">
              {project?.description || "Project test cases and folders"}
            </p>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <p className="text-sm text-[#232323]/60 dark:text-white/60">Loading...</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-sm text-[#232323] dark:text-white font-medium">
                  Project ID: <span className="font-mono text-xs">{project?.id}</span>
                </p>
                <p className="mt-2 text-sm text-[#232323]/70 dark:text-white/70">
                  Folders: {Array.isArray(project?.folders) ? project.folders.length : 0}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-background p-4">
                <p className="font-semibold text-[#232323] dark:text-white mb-3 inline-flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-[#FFAA00]" />
                  Folder Structure
                </p>
                {!project?.folders?.length ? (
                  <p className="text-sm text-[#232323]/60 dark:text-white/60">
                    No folders yet for this project.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {project.folders.map((folder) => (
                      <div key={folder.id} className="text-sm text-[#232323]/80 dark:text-white/80">
                        {folder.path}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
