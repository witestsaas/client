import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, ChevronDown, FolderKanban, Loader2, PlayCircle, Plus, Search, X } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSocket } from "../hooks/useSocket.tsx";
import { fetchMyInvitations, fetchOrgNotifications, markOrgNotificationsAsRead } from "../services/organizations";
import { listRuns } from "../services/executionReporting";
import { fetchProjectTree, fetchTestProjects } from "../services/testManagement";

const POLL_INTERVAL_MS = 5000;

export default function DashboardHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orgSlug } = useParams();
  const { socket } = useSocket();
  const projectsMenuRef = useRef(null);
  const isNoOrg = !orgSlug || orgSlug === "no-org";

  const [invitations, setInvitations] = useState([]);
  const [orgNotifications, setOrgNotifications] = useState([]);
  const [orgUnreadCount, setOrgUnreadCount] = useState(0);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectsMenuOpen, setProjectsMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [alertText, setAlertText] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiResults, setAiResults] = useState([]);
  const [activeRuns, setActiveRuns] = useState([]);
  const [runsPanelOpen, setRunsPanelOpen] = useState(false);
  const previousInviteCountRef = useRef(0);
  const previousRunningCountRef = useRef(-1);
  const runsPanelCloseTimerRef = useRef(null);
  const testCaseCacheRef = useRef({});
  const searchInputRef = useRef(null);

  const normalizedRunningCount = Math.min(4, activeRuns.length);

  const isActiveRunStatus = (status) => {
    const normalized = String(status || "").trim().toLowerCase();
    return normalized === "running" || normalized === "queued" || normalized === "pending" || normalized === "inprogress";
  };

  const loadActiveRuns = useCallback(async () => {
    if (!orgSlug || isNoOrg) {
      setActiveRuns([]);
      previousRunningCountRef.current = -1;
      return;
    }
    try {
      const rows = await listRuns(orgSlug);
      const runningRows = (Array.isArray(rows) ? rows : []).filter((run) => isActiveRunStatus(run?.status));

      const previousCount = previousRunningCountRef.current;
      if (previousCount >= 0 && runningRows.length > previousCount) {
        const delta = runningRows.length - previousCount;
        setAlertText(
          delta === 1
            ? "1 new test run started in your organization."
            : `${delta} new test runs started in your organization.`,
        );
      }
      previousRunningCountRef.current = runningRows.length;
      setActiveRuns(runningRows);
    } catch {
      setActiveRuns([]);
    }
  }, [isNoOrg, orgSlug]);

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

  const loadOrgNotifications = useCallback(async () => {
    if (!orgSlug || isNoOrg) {
      setOrgNotifications([]);
      setOrgUnreadCount(0);
      return;
    }

    try {
      const data = await fetchOrgNotifications(orgSlug, { limit: 10 });
      const items = Array.isArray(data?.notifications) ? data.notifications : [];
      setOrgNotifications(items);
      setOrgUnreadCount(Number(data?.unreadCount || 0));
    } catch {
      setOrgNotifications([]);
      setOrgUnreadCount(0);
    }
  }, [isNoOrg, orgSlug]);

  useEffect(() => {
    loadOrgNotifications();
    const timer = setInterval(loadOrgNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadOrgNotifications]);

  useEffect(() => {
    if (!socket) return;

    const onNotification = (event) => {
      if (event?.orgSlug && orgSlug && String(event.orgSlug) !== String(orgSlug)) {
        return;
      }
      setAlertText(event?.title || "New notification received.");
      loadOrgNotifications();
    };

    socket.on("notification:new", onNotification);
    return () => {
      socket.off("notification:new", onNotification);
    };
  }, [loadOrgNotifications, orgSlug, socket]);

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
        const data = await fetchTestProjects(orgSlug);
        if (!cancelled) {
          const items = Array.isArray(data) ? data : [];
          const savedProjectId =
            typeof window !== "undefined"
              ? window.localStorage.getItem(`selectedProject_${orgSlug}`) || ""
              : "";

          setProjects(items);
          setSelectedProjectId((prev) => {
            if (prev && items.some((project) => project.id === prev)) return prev;
            if (savedProjectId && items.some((project) => project.id === savedProjectId)) {
              return savedProjectId;
            }
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
    const timer = setInterval(loadProjects, POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadProjects();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [orgSlug]);

  useEffect(() => {
    if (!orgSlug) return;
    if (!selectedProjectId) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem(`selectedProject_${orgSlug}`, selectedProjectId);
  }, [orgSlug, selectedProjectId]);

  useEffect(() => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    const maybeProjectId = pathParts[4];
    if (maybeProjectId && projects.some((project) => project.id === maybeProjectId)) {
      setSelectedProjectId(maybeProjectId);
    }
  }, [location.pathname, projects]);

  useEffect(() => {
    if (!projectsMenuOpen) return undefined;

    const handleOutsideClick = (event) => {
      const target = event.target;
      if (projectsMenuRef.current && !projectsMenuRef.current.contains(target)) {
        setProjectsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [projectsMenuOpen]);

  const pendingInviteCount = invitations.length;
  const totalBellCount = pendingInviteCount + orgUnreadCount;
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
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`selectedProject_${orgSlug}`, projectId);
      window.dispatchEvent(
        new CustomEvent("selectedProjectChanged", {
          detail: { orgSlug, projectId },
        }),
      );
    }

    if (location.pathname.includes("/execution/tests")) {
      navigate(`/dashboard/${orgSlug}/execution/tests/${projectId}`);
    }
  };

  const handleNotificationClick = useCallback(
    async (notification) => {
      if (!notification?.id || !orgSlug) {
        if (notification?.link) {
          navigate(notification.link);
        }
        setNotificationsOpen(false);
        return;
      }

      setOrgNotifications((prev) => prev.filter((item) => String(item.id) !== String(notification.id)));
      if (!notification?.isRead) {
        setOrgUnreadCount((count) => Math.max(0, count - 1));
      }
      setNotificationsOpen(false);

      try {
        await markOrgNotificationsAsRead(orgSlug, [notification.id]);
      } catch {
        // fallback sync in case optimistic update diverges
        loadOrgNotifications();
      }

      if (notification?.link) {
        navigate(notification.link);
      }
    },
    [loadOrgNotifications, navigate, orgSlug],
  );

  const handleAddProject = () => {
    setProjectsMenuOpen(false);
    const target = `/dashboard/${orgSlug}/execution/tests`;
    if (location.pathname === target) {
      window.dispatchEvent(new CustomEvent("openCreateProjectModal"));
      return;
    }

    navigate(target);
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("openCreateProjectModal"));
    }, 120);
  };

  const getProjectTestCases = useCallback(async (projectId) => {
    const cached = testCaseCacheRef.current[projectId];
    if (cached) return cached;

    const data = await fetchProjectTree(orgSlug, projectId);
    const rows = Array.isArray(data?.testCases) ? data.testCases : [];
    testCaseCacheRef.current[projectId] = rows;
    return rows;
  }, [orgSlug]);

  const runTestCaseSearch = useCallback(async (query) => {
    if (!orgSlug) return;
    if (!selectedProject) {
      setAiError("Select a project before searching.");
      setAiResults([]);
      setAiOpen(true);
      return;
    }

    const trimmed = String(query || "").trim();
    if (!trimmed) {
      setAiResults([]);
      setAiError(null);
      setAiOpen(false);
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setAiOpen(true);

    try {
      const testCases = await getProjectTestCases(selectedProject.id);
      const terms = trimmed.toLowerCase().split(/\s+/).filter(Boolean);

      const matches = testCases
        .map((testCase) => {
          const title = String(testCase?.title || testCase?.name || "");
          const description = String(testCase?.description || "");
          const folderPath = String(testCase?.folder?.path || testCase?.folder?.name || "Root");
          const haystack = `${title} ${description} ${folderPath}`.toLowerCase();
          const isMatch = terms.every((term) => haystack.includes(term));
          if (!isMatch) return null;

          const titleMatch = terms.some((term) => title.toLowerCase().includes(term));
          const descriptionMatch = terms.some((term) => description.toLowerCase().includes(term));
          const folderMatch = terms.some((term) => folderPath.toLowerCase().includes(term));

          let matchReason = "Keyword match";
          if (titleMatch) matchReason = "Title match";
          else if (descriptionMatch) matchReason = "Description match";
          else if (folderMatch) matchReason = "Folder match";

          return {
            testCaseId: testCase.id,
            folderPath,
            testCaseName: title,
            confidenceScore: 1,
            matchReason,
          };
        })
        .filter(Boolean);

      setAiResults(matches.slice(0, 20));
    } catch (error) {
      setAiError(error?.message || "Search failed");
      setAiResults([]);
    } finally {
      setAiLoading(false);
    }
  }, [getProjectTestCases, orgSlug, selectedProject]);

  useEffect(() => {
    const trimmed = aiPrompt.trim();
    if (!trimmed) {
      setAiResults([]);
      setAiError(null);
      setAiOpen(false);
      return;
    }

    const handle = window.setTimeout(() => {
      runTestCaseSearch(trimmed);
    }, 250);

    return () => window.clearTimeout(handle);
  }, [aiPrompt, runTestCaseSearch, selectedProject?.id]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const handle = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(handle);
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen && !aiOpen) return;
    const onEscape = (event) => {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
        setAiOpen(false);
      }
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [aiOpen, isSearchOpen]);

  useEffect(() => {
    loadActiveRuns();
    const intervalId = window.setInterval(loadActiveRuns, POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadActiveRuns();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [loadActiveRuns]);

  return (
    <header className="sticky top-0 z-40 h-11 shrink-0 relative border-b border-white/10 bg-[#232323] dark:bg-[#232323] px-6 flex items-center justify-between">
      {!isNoOrg ? (
        <div className="relative" ref={projectsMenuRef}>
          <button
            type="button"
            onClick={() => setProjectsMenuOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:opacity-50"
            title="Switch project"
            disabled={projects.length === 0}
          >
            <FolderKanban className="h-4 w-4 text-[#FFAA00]" />
            <span className="max-w-[140px] truncate">
              {selectedProject?.name || "Select Project"}
            </span>
            <ChevronDown className="h-3 w-3 text-white/70" />
          </button>

          {projectsMenuOpen ? (
            <div className="absolute left-0 mt-3 w-72 rounded-2xl border border-white/10 bg-[#1F1F1F] p-3 shadow-2xl z-50">
              <div className="max-h-64 overflow-y-auto space-y-1">
                {projects.length === 0 ? (
                  <div className="text-xs text-white/60 px-2 py-3">No projects found.</div>
                ) : (
                  projects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => handleProjectSwitch(project.id)}
                      className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition ${
                        project.id === selectedProjectId
                          ? "bg-[#FFAA00]/20 text-white"
                          : "text-white/80 hover:bg-white/10"
                      }`}
                    >
                      <span className="truncate">{project.name}</span>
                      {project.id === selectedProjectId ? (
                        <span className="text-[10px] font-semibold text-[#FFAA00]">Selected</span>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
              <div className="mt-3 border-t border-white/10 pt-3">
                <button
                  type="button"
                  onClick={handleAddProject}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[#FFAA00] px-3 py-2 text-xs font-semibold text-[#232323] hover:bg-[#FFAA00]/90"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Project
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div />
      )}

      <div className="flex flex-1 justify-center items-center" />

      <div className="flex items-center gap-2">
        {!isNoOrg ? (
          <div
            className="relative"
            onMouseEnter={() => {
              if (runsPanelCloseTimerRef.current) {
                window.clearTimeout(runsPanelCloseTimerRef.current);
                runsPanelCloseTimerRef.current = null;
              }
              setRunsPanelOpen(true);
            }}
            onMouseLeave={() => {
              runsPanelCloseTimerRef.current = window.setTimeout(() => {
                setRunsPanelOpen(false);
              }, 140);
            }}
          >
            <button
              type="button"
              className="h-8 px-2.5 rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-white/5 text-white/90 inline-flex items-center gap-1.5"
              title={`Running sessions ${activeRuns.length}/4+`}
            >
              {Array.from({ length: 4 }).map((_, index) => {
                const active = index < normalizedRunningCount;
                return (
                  <span
                    key={`run-point-${index}`}
                    className={`h-2 w-2 rounded-full ${
                      active
                        ? "bg-[#FFAA00] animate-pulse shadow-[0_0_8px_rgba(255,170,0,0.8)]"
                        : "bg-white/30"
                    }`}
                  />
                );
              })}
            </button>

            {runsPanelOpen ? (
              <div className="absolute right-0 mt-2 w-[340px] rounded-2xl border border-white/10 bg-[#232323] dark:bg-[#232323] shadow-2xl p-3 z-40">
                <div className="text-xs text-white/60 mb-2">Running test runs</div>
                {!activeRuns.length ? (
                  <p className="text-sm text-white/75">No running test runs.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {activeRuns.map((run) => (
                      <div
                        key={run.id}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium truncate">
                            {run?.testPlan?.name || "Running test run"}
                          </p>
                          <p className="text-xs text-white/60 truncate">
                            Status: {run?.status || "Running"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setRunsPanelOpen(false);
                            navigate(`/dashboard/${orgSlug}/execution/runs/${run.id}`);
                          }}
                          className="h-7 px-2.5 rounded-md bg-[#FFAA00] text-[#232323] text-xs font-semibold hover:bg-[#FFAA00]/90"
                        >
                          Open
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
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
            {totalBellCount > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FFAA00] text-[#232323] text-[10px] font-bold leading-[18px] text-center">
                {totalBellCount > 9 ? "9+" : totalBellCount}
              </span>
            ) : null}
          </button>

          {notificationsOpen ? (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-white/10 bg-[#232323] dark:bg-[#232323] shadow-2xl p-3 z-30">
              <p className="text-xs text-white/60 mb-2">{orgUnreadCount} unread notifications • {pendingInviteLabel}</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {orgNotifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full text-left rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <p className="text-sm text-white font-medium truncate">{notification.title || "Notification"}</p>
                    <p className="text-xs text-white/60 line-clamp-2 mt-0.5">{notification.message || ""}</p>
                  </button>
                ))}

                {pendingInviteCount > 0 ? (
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
                ) : null}

                {pendingInviteCount === 0 && orgNotifications.length === 0 ? (
                  <p className="text-sm text-white/70">You have no notifications.</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => navigate(`/dashboard/${orgSlug}/execution/runs`)}
          className="bg-[#FFAA00] hover:bg-[#FFAA00]/90 text-[#232323] text-xs font-semibold h-8 px-4 rounded-md inline-flex items-center gap-2"
        >
          <PlayCircle className="h-4 w-4" />
          Quick Run
        </button>
      </div>

      {alertText ? (
        <div className="absolute top-[78px] right-6 flex items-center gap-2 rounded-lg border border-[#FFAA00]/40 bg-[#232323] dark:bg-[#232323] px-3 py-2 shadow-xl z-40">
          <p className="text-xs text-white">{alertText}</p>
          <button type="button" className="text-white/70 hover:text-white" onClick={() => setAlertText("")}>
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : null}

      {(isSearchOpen || aiOpen) && !isNoOrg ? (
        <div className="fixed inset-0 z-50" aria-label="Search test cases overlay">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setIsSearchOpen(false);
              setAiOpen(false);
            }}
          />
          <div className="absolute right-6 top-[70px] w-[min(720px,92vw)]">
            <div className="bg-white dark:bg-[#232323] border border-border dark:border-[#FFAA00]/20 rounded-2xl shadow-2xl p-4">
              <div className="flex items-center gap-2 bg-muted dark:bg-[#1F1F1F] rounded-full pl-4 pr-3 h-11 border border-border dark:border-white/10">
                <Search className="h-4 w-4 text-[#FFAA00]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={aiPrompt}
                  onChange={(event) => setAiPrompt(event.target.value)}
                  placeholder="Search test cases by title, description, or folder"
                  className="flex-1 bg-transparent text-foreground text-sm font-medium focus:outline-none placeholder:text-muted-foreground"
                />
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
              </div>

              <div className="mt-4">
                <div className="font-semibold text-foreground mb-2">Test Case Results</div>
                {aiLoading ? <div className="text-sm text-muted-foreground">Searching...</div> : null}
                {!aiLoading && aiError ? <div className="text-sm text-red-600 dark:text-red-400">{aiError}</div> : null}
                {!aiLoading && !aiError && aiResults.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    {aiPrompt.trim()
                      ? `No test cases match "${aiPrompt.trim()}".`
                      : "Start typing to search your test cases."}
                  </div>
                ) : null}
                {!aiLoading && !aiError && aiResults.length > 0 ? (
                  <ul className={`space-y-2 ${aiResults.length > 6 ? "max-h-[320px] overflow-y-auto pr-1" : ""}`}>
                    {aiResults.map((result) => (
                      <li
                        key={result.testCaseId}
                        className="group bg-muted dark:bg-[#1F1F1F] rounded-lg p-3 flex flex-col hover:bg-muted dark:hover:bg-[#1F1F1F] transition cursor-pointer"
                        onClick={() => {
                          const target = `/dashboard/${orgSlug}/execution/tests/${selectedProject?.id}?openTestCaseId=${encodeURIComponent(result.testCaseId)}`;
                          setIsSearchOpen(false);
                          setAiOpen(false);
                          navigate(target);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-black dark:text-slate-100 font-bold text-base group-hover:text-[#FFAA00] dark:group-hover:text-[#FFAA00]">
                            {result.testCaseName}
                          </span>
                        </div>
                        <span className="text-muted-foreground text-xs">{result.folderPath}</span>
                        <span className="text-muted-foreground text-xs">Reason: {result.matchReason}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
