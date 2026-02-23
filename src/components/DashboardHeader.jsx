import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bell, ChevronDown, FolderKanban, PlayCircle, Search, X } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchMyInvitations } from "../services/organizations";
import { fetchProjects } from "../services/projects";

const TITLE_MAP = {
  "": "Dashboard",
  execution: "Execution",
  analysis: "Analysis",
  platform: "Platform",
  profile: "Profile",
  settings: "Settings",
};

const POLL_INTERVAL_MS = 5000;

export default function DashboardHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orgSlug } = useParams();
  const section = location.pathname.split("/")[3] || "";
  const title = TITLE_MAP[section] || "Dashboard";

  const [invitations, setInvitations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectsMenuOpen, setProjectsMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [alertText, setAlertText] = useState("");
  const previousInviteCountRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function loadInvitations() {
      try {
        const data = await fetchMyInvitations();
        if (cancelled) return;

        const items = Array.isArray(data?.invitations) ? data.invitations : [];
        const previousCount = previousInviteCountRef.current;
        const nextCount = items.length;

        if (previousCount > 0 && nextCount > previousCount) {
          const delta = nextCount - previousCount;
          setAlertText(
            delta === 1
              ? "You received 1 new organization invitation."
              : `You received ${delta} new organization invitations.`,
          );
        }

        previousInviteCountRef.current = nextCount;
        setInvitations(items);
      } catch {
        if (!cancelled) {
          setInvitations([]);
          previousInviteCountRef.current = 0;
        }
      }
    }

    loadInvitations();
    const timer = setInterval(loadInvitations, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!alertText) return undefined;
    const timer = setTimeout(() => setAlertText(""), 4000);
    return () => clearTimeout(timer);
  }, [alertText]);

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      if (!orgSlug) return;
      try {
        const data = await fetchProjects(orgSlug);
        if (!cancelled) {
          const items = Array.isArray(data?.projects) ? data.projects : [];
          setProjects(items);
          setSelectedProjectId((prev) => {
            if (prev && items.some((project) => project.id === prev)) return prev;
            return items[0]?.id || "";
          });
        }
      } catch {
        if (!cancelled) {
          setProjects([]);
          setSelectedProjectId("");
        }
      }
    }

    loadProjects();
    return () => {
      cancelled = true;
    };
  }, [orgSlug]);

  useEffect(() => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    const maybeProjectId = pathParts[4];
    if (maybeProjectId && projects.some((project) => project.id === maybeProjectId)) {
      setSelectedProjectId(maybeProjectId);
    }
  }, [location.pathname, projects]);

  const pendingInviteCount = invitations.length;
  const pendingInviteLabel = useMemo(() => {
    if (!pendingInviteCount) return "No pending invites";
    if (pendingInviteCount === 1) return "1 pending invite";
    return `${pendingInviteCount} pending invites`;
  }, [pendingInviteCount]);
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || projects[0] || null,
    [projects, selectedProjectId],
  );

  const handleProjectSwitch = (projectId) => {
    setProjectsMenuOpen(false);
    setSelectedProjectId(projectId);
    navigate(`/dashboard/${orgSlug}/execution/tests/${projectId}`);
  };

  return (
    <header className="relative h-[70px] border-b border-white/10 bg-[#232323] dark:bg-black flex items-center justify-between px-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-xs text-white/60">Workspace overview and actions</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setProjectsMenuOpen((open) => !open)}
            className="h-8 max-w-[220px] rounded-md border border-white/10 bg-white/5 text-white/90 text-xs font-medium px-3 inline-flex items-center gap-2 hover:bg-white/10 disabled:opacity-50"
            title="Switch project"
            disabled={projects.length === 0}
          >
            <FolderKanban className="h-3.5 w-3.5 text-[#FFAA00]" />
            <span className="truncate">{selectedProject?.name || "No projects"}</span>
            <ChevronDown className="h-3.5 w-3.5 text-white/70" />
          </button>
          {projectsMenuOpen ? (
            <div className="absolute right-0 mt-2 w-60 rounded-xl border border-white/10 bg-[#232323] dark:bg-black shadow-2xl p-1 z-30">
              {projects.length === 0 ? (
                <p className="px-3 py-2 text-xs text-white/60">No projects available</p>
              ) : (
                projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => handleProjectSwitch(project.id)}
                    className={`w-full text-left rounded-md px-3 py-2 text-sm ${
                      project.id === selectedProjectId
                        ? "bg-[#FFAA00] text-[#232323]"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {project.name}
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-white/5 text-white/90"
          title="Search"
        >
          <Search className="h-4 w-4" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((open) => !open)}
            className="relative inline-flex items-center justify-center h-8 w-8 rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-white/5 text-white/90"
            title={pendingInviteLabel}
          >
            <Bell className="h-4 w-4" />
            {pendingInviteCount > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FFAA00] text-[#232323] text-[10px] font-bold leading-[18px] text-center">
                {pendingInviteCount > 9 ? "9+" : pendingInviteCount}
              </span>
            ) : null}
          </button>

          {notificationsOpen ? (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-white/10 bg-[#232323] dark:bg-black shadow-2xl p-3 z-30">
              <p className="text-xs text-white/60 mb-2">{pendingInviteLabel}</p>
              {pendingInviteCount === 0 ? (
                <p className="text-sm text-white/70">You have no pending invitations.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {invitations.map((invite) => (
                    <div
                      key={invite.id}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <p className="text-sm text-white font-medium truncate">
                        {invite.organization?.name || "Organization invite"}
                      </p>
                      <p className="text-xs text-white/60">Role: {invite.role}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false);
                          navigate(`/dashboard/join/${invite.token}`);
                        }}
                        className="mt-2 text-xs font-semibold text-[#FFAA00] hover:text-[#FFAA00]/80"
                      >
                        Open invitation
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => navigate(`/dashboard/${orgSlug}/execution`)}
          className="bg-[#FFAA00] hover:bg-[#FFAA00]/90 text-[#232323] text-xs font-semibold h-8 px-4 rounded-md inline-flex items-center gap-2"
        >
          <PlayCircle className="h-4 w-4" />
          Quick Run
        </button>
      </div>

      {alertText ? (
        <div className="absolute top-[78px] right-6 flex items-center gap-2 rounded-lg border border-[#FFAA00]/40 bg-[#232323] dark:bg-black px-3 py-2 shadow-xl z-40">
          <p className="text-xs text-white">{alertText}</p>
          <button type="button" className="text-white/70 hover:text-white" onClick={() => setAlertText("")}>
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : null}
    </header>
  );
}
