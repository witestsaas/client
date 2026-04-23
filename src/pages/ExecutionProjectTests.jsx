import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BookOpenText,
  Brain,
  Sparkles,
  CheckCircle,
  CheckSquare,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  Filter,
  Folder,
  FolderPlus,
  FileText,
  GripVertical,
  Loader2,
  ListChecks,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Upload,
  Square,
  Trash2,
  X,
  XCircle,
  Send,
  MessageSquare,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import QuotaRequiredPopup from "../components/QuotaRequiredPopup";
import AiThinkingTree from "../components/AiThinkingTree";
import { useRequestLiveReplay, useTestRunSocket } from "../hooks/useSocket";
import { useAuth } from "../auth/AuthProvider.jsx";
import { fetchOrgQuotaUsage } from "../services/organizations";
import {
  createFolder,
  createProjectEnvironment,
  updateProjectEnvironment,
  createProjectSharedStep,
  createProjectVariable,
  createTestCase,
  cancelFunctionalGeneration,
  cloneTestCase,
  deleteFolder,
  deleteFoldersBulk,
  deleteProjectEnvironment,
  deleteProjectSharedStep,
  deleteProjectVariable,
  deleteTestCase,
  fetchProjectDocumentation,
  fetchProjectSettings,
  fetchProjectSharedSteps,
  fetchProjectTree,
  fetchProjectVariables,
  generateFunctionalTests,
  importTestsFromFile,
  cloneProject,
  moveProjectItem,
  renameFolder,
  updateTestCase,
  updateProjectDocumentation,
  updateProjectSettings,
} from "../services/testManagement";
import { isQuotaDeniedError } from "../utils/quota";
import { useLanguage } from "../utils/language-context";
import { toDisplayErrorMessage } from "../utils/api-error";

const TABS = [
  { key: "repository", labelKey: "tc.tabs.repository" },
  { key: "shared-steps", labelKey: "tc.tabs.sharedSteps" },
  { key: "variables", labelKey: "tc.tabs.variables" },
  { key: "documentation", labelKey: "tc.tabs.documentation" },
  { key: "configuration", labelKey: "tc.tabs.configuration" },
];

const INITIAL_FOLDER_FORM = { id: "", name: "", parentId: "" };
const INITIAL_VARIABLE_FORM = { name: "", value: "", description: "" };
const INITIAL_SHARED_STEP_FORM = { name: "", action: "", expectedResult: "", description: "" };
const INITIAL_ENV_FORM = { name: "", baseUrl: "" };
const INITIAL_SETTINGS_FORM = { name: "", description: "" };
const createDraftStep = () => ({
  id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  action: "",
  expectedResult: "",
  isSharedStep: false,
  sharedStepName: "",
});
const INITIAL_TEST_CASE_FORM = {
  title: "",
  description: "",
  priority: "Medium",
  testCaseType: "Functional",
  automationStatus: "Not Automated",
  tagsKeywords: [],
  tagsInput: "",
  steps: [createDraftStep()],
};

const PRIORITY_TO_INT = {
  Low: 0,
  Medium: 1,
  High: 2,
  Critical: 3,
};

const STATUS_OPTIONS = ["all", "Active", "Draft", "InReview", "Outdated", "Rejected"];
const PRIORITY_LABELS = { 0: "Low", 1: "Medium", 2: "High", 3: "Critical" };
const DOC_FORM_MARKER_START = "<!-- QALION_DOC_FORM_STATE";
const DOC_FORM_MARKER_END = "QALION_DOC_FORM_STATE -->";
const AI_QUOTA_UPGRADE_MESSAGE = "No AI generation credits are available for this organization. Upgrade your plan or contact your admin to increase quota.";
const DOCUMENTATION_TEMPLATE = `# Project Documentation Template

## 1. Project Overview
- Project Name:
- Product Owner:
- QA Owner:
- Primary Domain / Module:
## 2. Business Scope
- Core business goals:
- In-scope features:
- Out-of-scope features:


### Component: [Name]
- Location (Page / Route / Module):
- Entry Point / Navigation Path:
- Dependencies:
- User Roles Allowed:
- Validation Rules:
- Success Criteria:
- Error Cases:
`;
const SUPPORTED_DOC_UPLOAD_EXTENSIONS = ["txt", "md", "markdown", "json", "csv", "yaml", "yml", "xml", "html", "htm", "log"];

function createInitialDocumentationForm() {
  return {
    projectName: "",
    productOwner: "",
    qaOwner: "",
    primaryDomain: "",
    coreBusinessGoals: "",
    inScopeFeatures: "",
    outOfScopeFeatures: "",
    frontendStack: "",
    backendStack: "",
    database: "",
    externalApis: "",
    componentsMap: "",
    uploadedFilesData: "",
  };
}

function normalizeDocumentationForm(value) {
  const base = createInitialDocumentationForm();
  const input = value && typeof value === "object" ? value : {};
  return Object.keys(base).reduce((acc, key) => {
    acc[key] = String(input[key] || "").trim();
    return acc;
  }, {});
}

function parseDocumentationFormFromPayload(rawDocumentation) {
  const raw = String(rawDocumentation || "");
  const startIndex = raw.indexOf(DOC_FORM_MARKER_START);
  const endIndex = raw.indexOf(DOC_FORM_MARKER_END);

  if (startIndex >= 0 && endIndex > startIndex) {
    const jsonPart = raw
      .slice(startIndex + DOC_FORM_MARKER_START.length, endIndex)
      .trim();
    try {
      const parsed = JSON.parse(jsonPart);
      return normalizeDocumentationForm(parsed);
    } catch {
    }
  }

  return createInitialDocumentationForm();
}

function buildDocumentationPayloadFromForm(formValue) {
  const form = normalizeDocumentationForm(formValue);
  const line = (value) => (value ? value : "Not provided");
  const markdown = `# Project Documentation

## 1. Project Overview
- Project Name: ${line(form.projectName)}
- Product Owner: ${line(form.productOwner)}
- QA Owner: ${line(form.qaOwner)}
- Primary Domain / Module: ${line(form.primaryDomain)}

## 2. Business Scope
- Core business goals: ${line(form.coreBusinessGoals)}
- In-scope features: ${line(form.inScopeFeatures)}
- Out-of-scope features: ${line(form.outOfScopeFeatures)}

## Reference Files Data
${line(form.uploadedFilesData)}
`;

  const encodedState = `${DOC_FORM_MARKER_START}\n${JSON.stringify(form)}\n${DOC_FORM_MARKER_END}`;
  return `${markdown.trim()}\n\n${encodedState}`;
}

function extractUploadedFileNames(uploadedFilesData) {
  const source = String(uploadedFilesData || "");
  const matches = [...source.matchAll(/###\s+File:\s+(.+)/gim)];
  const names = matches
    .map((entry) => String(entry?.[1] || "").trim())
    .filter(Boolean);
  return Array.from(new Set(names));
}

function formatAiTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

function getVariableTrigger(value, caretPosition) {
  const safeValue = String(value || "");
  const safeCaret = Number.isFinite(caretPosition) ? caretPosition : safeValue.length;
  const before = safeValue.slice(0, safeCaret);
  const match = before.match(/(^|[\s([{,;:=])\$([a-zA-Z0-9_]*)$/);
  if (!match) return null;
  const query = match[2] || "";
  const start = safeCaret - query.length - 1;
  return {
    query,
    start,
    end: safeCaret,
  };
}

function VariableValuePreview({ value }) {
  const text = String(value || "");
  if (!text.includes("$")) return null;
  const parts = text.split(/(\$[a-zA-Z_][a-zA-Z0-9_]*)/g);
  return (
    <div className="mt-1 text-[11px] leading-relaxed rounded-md border border-blue-500/20 bg-blue-500/5 px-2 py-1">
      {parts.map((part, index) =>
        /^\$[a-zA-Z_][a-zA-Z0-9_]*$/.test(part) ? (
          <span key={`var-${index}`} className="text-blue-600 dark:text-blue-300 font-semibold">
            {part}
          </span>
        ) : (
          <span key={`txt-${index}`} className="text-[#232323]/65 dark:text-white/65">
            {part}
          </span>
        ),
      )}
    </div>
  );
}

function normalizeFolders(rawFolders) {
  if (!Array.isArray(rawFolders)) return [];

  const normalized = [];

  const walk = (nodes, parentId = null) => {
    if (!Array.isArray(nodes)) return;
    nodes.forEach((node) => {
      if (!node?.id) return;
      const currentId = String(node.id);
      const explicitParent = node.parentId ?? node.parentFolderId ?? null;
      const resolvedParent = explicitParent != null ? String(explicitParent) : parentId;

      normalized.push({
        ...node,
        id: currentId,
        parentId: resolvedParent,
      });

      if (Array.isArray(node.children) && node.children.length > 0) {
        walk(node.children, currentId);
      }
    });
  };

  walk(rawFolders, null);
  return normalized;
}

function buildFolderTree(rawFolders) {
  if (!Array.isArray(rawFolders)) return [];

  const map = new Map();
  rawFolders.forEach((folder) => {
    if (!folder?.id) return;
    map.set(String(folder.id), {
      ...folder,
      id: String(folder.id),
      parentId:
        folder.parentId !== null && folder.parentId !== undefined
          ? String(folder.parentId)
          : folder.parentFolderId
            ? String(folder.parentFolderId)
            : null,
      children: [],
    });
  });

  const roots = [];
  map.forEach((folder) => {
    if (folder.parentId && map.has(folder.parentId)) {
      map.get(folder.parentId).children.push(folder);
    } else {
      roots.push(folder);
    }
  });

  const sort = (nodes) => {
    nodes.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    nodes.forEach((node) => sort(node.children));
    return nodes;
  };

  return sort(roots);
}

function collectFolderMap(nodes, out = new Map()) {
  nodes.forEach((node) => {
    out.set(String(node.id), node);
    collectFolderMap(node.children || [], out);
  });
  return out;
}

function FolderNode({
  node,
  level,
  selectedFolderId,
  highlightedFolderIds,
  onSelect,
  onCreateChild,
  onEdit,
  onDelete,
  onDropMoveFolder,
  onDropMoveTestCase,
  onDragStart,
  multiSelectMode,
  selectedFolderIds,
  onToggleSelect,
}) {
  const [expanded, setExpanded] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const isActive = selectedFolderId === node.id;
  const isHighlighted = Array.isArray(highlightedFolderIds) && highlightedFolderIds.includes(node.id);
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const isChecked = Array.isArray(selectedFolderIds) && selectedFolderIds.includes(node.id);

  return (
    <div
      onDragEnter={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDropTarget(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isDropTarget) {
          setIsDropTarget(true);
        }
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDropTarget(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDropTarget(false);
        const sourceId = event.dataTransfer.getData("text/folder-id");
        const testCaseId = event.dataTransfer.getData("text/test-case-id");
        if (sourceId) {
          onDropMoveFolder(sourceId, node.id);
        }
        if (testCaseId) {
          onDropMoveTestCase(testCaseId, node.id);
        }
      }}
    >
      <button
        type="button"
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData("text/folder-id", node.id);
          onDragStart(node.id);
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => {
          if (multiSelectMode) {
            onToggleSelect(node.id);
          } else {
            onSelect(node.id);
          }
        }}
        className={`w-full flex items-center rounded px-2 py-1.5 text-left text-sm transition-all duration-150 cursor-pointer ${
          isHighlighted
            ? "animate-[folderHighlight_1s_ease-in-out_5] ring-2 ring-emerald-400/60 bg-emerald-400/15 dark:bg-emerald-400/10"
            : ""
        } ${
          isDropTarget
            ? "ring-1 ring-[#FFAA00] bg-[#FFAA00]/10 dark:bg-[#FFAA00]/15 translate-x-0.5"
            : ""
        } ${
          isChecked
            ? "bg-[#FFAA00]/20 ring-1 ring-[#FFAA00]/40 text-[#232323] dark:text-white font-medium"
            : isActive
            ? "bg-[#FFAA00]/20 text-[#232323] dark:text-white font-medium"
            : "hover:bg-[#232323]/5 dark:hover:bg-white/10 text-[#232323]/75 dark:text-white/75"
        }`}
        style={{ paddingLeft: `${8 + level * 16}px` }}
      >
        {hasChildren ? (
          <span
            className="mr-1 inline-flex items-center"
            onClick={(event) => {
              event.stopPropagation();
              setExpanded((prev) => !prev);
            }}
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </span>
        ) : (
          <span className="mr-1 w-3.5" />
        )}
        <GripVertical className="h-3.5 w-3.5 mr-1.5 text-[#232323]/35 dark:text-white/35" />
        {multiSelectMode ? (
          <span
            className="mr-1.5 inline-flex items-center"
            onClick={(event) => {
              event.stopPropagation();
              onToggleSelect(node.id);
            }}
          >
            {isChecked ? (
              <CheckSquare className="h-3.5 w-3.5 text-[#FFAA00]" />
            ) : (
              <Square className="h-3.5 w-3.5 text-[#232323]/40 dark:text-white/40" />
            )}
          </span>
        ) : null}
        <Folder className="h-3.5 w-3.5 mr-2 text-[#FFAA00] shrink-0" />
        <span className="truncate flex-1">{node.name || node.path || "Folder"}</span>
        {!multiSelectMode ? (
        <span className={`ml-2 inline-flex items-center gap-1 transition-opacity ${hovered ? "opacity-100" : "opacity-0"}`}>
          <span
            className="h-5 w-5 rounded inline-flex items-center justify-center hover:bg-[#232323]/10 dark:hover:bg-white/10"
            onClick={(event) => {
              event.stopPropagation();
              onCreateChild(node);
            }}
          >
            <Plus className="h-3 w-3" />
          </span>
          <span
            className="h-5 w-5 rounded inline-flex items-center justify-center hover:bg-[#232323]/10 dark:hover:bg-white/10"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(node);
            }}
          >
            <Pencil className="h-3 w-3" />
          </span>
          <span
            className="h-5 w-5 rounded inline-flex items-center justify-center text-red-500 hover:bg-red-500/10"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(node);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </span>
        </span>
        ) : null}
      </button>

      {expanded
        ? (node.children || []).map((child) => (
            <FolderNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              highlightedFolderIds={highlightedFolderIds}
              onSelect={onSelect}
              onCreateChild={onCreateChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onDropMoveFolder={onDropMoveFolder}
              onDropMoveTestCase={onDropMoveTestCase}
              onDragStart={onDragStart}
              multiSelectMode={multiSelectMode}
              selectedFolderIds={selectedFolderIds}
              onToggleSelect={onToggleSelect}
            />
          ))
        : null}
    </div>
  );
}

function Popup({
  open,
  title,
  onClose,
  children,
  headerLeading = null,
  headerActions = null,
  zIndex = "z-50",
}) {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndex} bg-black/60 backdrop-blur-sm animate-in fade-in duration-150`}
    >
      <div className="w-screen h-dvh overflow-hidden bg-card">
        <div className="sticky top-0 z-10 border-b border-black/8 dark:border-white/8 px-5 sm:px-6 py-3.5 bg-card flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2.5 min-w-0">
            {headerLeading}
            <p className="text-base font-semibold text-[#232323] dark:text-white truncate tracking-tight">
              {title}
            </p>
          </div>

          <div className="inline-flex items-center gap-2">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[#232323]/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/8 hover:text-[#232323] dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="h-[calc(100dvh-65px)] overflow-y-auto p-4 sm:p-5 lg:p-6 [&_label]:text-[13px] [&_label]:font-medium [&_label]:text-[#232323]/70 dark:[&_label]:text-white/60 [&_input]:rounded-lg [&_input]:border-black/12 dark:[&_input]:border-white/12 [&_input]:bg-background/80 [&_input]:shadow-sm [&_input]:transition-all [&_input]:duration-150 [&_input:focus]:ring-2 [&_input:focus]:ring-[#FFAA00]/30 [&_input:focus]:border-[#FFAA00]/50 [&_select]:rounded-lg [&_select]:border-black/12 dark:[&_select]:border-white/12 [&_select]:bg-background/80 [&_select]:shadow-sm [&_select]:transition-all [&_select:focus]:ring-2 [&_select:focus]:ring-[#FFAA00]/30 [&_select:focus]:border-[#FFAA00]/50 [&_textarea]:rounded-lg [&_textarea]:border-black/12 dark:[&_textarea]:border-white/12 [&_textarea]:bg-background/80 [&_textarea]:shadow-sm [&_textarea]:transition-all [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-[#FFAA00]/30 [&_textarea:focus]:border-[#FFAA00]/50">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ExecutionProjectTests() {
  const { orgSlug, projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [project, setProject] = useState(null);
  const [folders, setFolders] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [folderSearch, setFolderSearch] = useState("");
  const [activeTab, setActiveTab] = useState("repository");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [envModalError, setEnvModalError] = useState("");
  const [folderModalError, setFolderModalError] = useState("");

  const [documentation, setDocumentation] = useState("");
  const [documentationForm, setDocumentationForm] = useState(() => createInitialDocumentationForm());
  const [documentationDirty, setDocumentationDirty] = useState(false);
  const [docUploadBusy, setDocUploadBusy] = useState(false);
  const [variables, setVariables] = useState([]);
  const [sharedSteps, setSharedSteps] = useState([]);
  const [settings, setSettings] = useState(null);

  const [folderForm, setFolderForm] = useState(INITIAL_FOLDER_FORM);
  const [folderModalMode, setFolderModalMode] = useState("create");
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedFolderIds, setSelectedFolderIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkFolderDeleteConfirm, setBulkFolderDeleteConfirm] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState(null);

  const [variableForm, setVariableForm] = useState(INITIAL_VARIABLE_FORM);
  const [sharedStepForm, setSharedStepForm] = useState(INITIAL_SHARED_STEP_FORM);
  const [envForm, setEnvForm] = useState(INITIAL_ENV_FORM);
  const [settingsForm, setSettingsForm] = useState(INITIAL_SETTINGS_FORM);

  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [isSharedStepModalOpen, setIsSharedStepModalOpen] = useState(false);
  const [isEnvironmentModalOpen, setIsEnvironmentModalOpen] = useState(false);
  const [environmentModalMode, setEnvironmentModalMode] = useState("create");
  const [editingEnvironmentId, setEditingEnvironmentId] = useState("");
  const [isCreateTestCaseModalOpen, setIsCreateTestCaseModalOpen] = useState(false);
  const [testCaseForm, setTestCaseForm] = useState(INITIAL_TEST_CASE_FORM);
  const [createMode, setCreateMode] = useState("advanced");
  const [isCreateSharedStepsPickerOpen, setIsCreateSharedStepsPickerOpen] = useState(false);
  const [createSharedStepsSearch, setCreateSharedStepsSearch] = useState("");
  const [sharedStepPickerMode, setSharedStepPickerMode] = useState("create");
  const [isVariablePickerOpen, setIsVariablePickerOpen] = useState(false);
  const [variableSearch, setVariableSearch] = useState("");
  const [activeVariableTarget, setActiveVariableTarget] = useState({ mode: "create", stepKey: "", field: "action" });
  const [newlyInsertedStepId, setNewlyInsertedStepId] = useState("");
  const [testCaseSearch, setTestCaseSearch] = useState("");
  const [testCaseStatusFilter, setTestCaseStatusFilter] = useState("all");
  const [selectedTestCaseIds, setSelectedTestCaseIds] = useState([]);
  const [editingTestCase, setEditingTestCase] = useState(null);
  const [deletingTestCase, setDeletingTestCase] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [testCaseSort, setTestCaseSort] = useState("updated");
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [aiQuota, setAiQuota] = useState(null);
  const [aiDraftPrompt, setAiDraftPrompt] = useState("");
  const [aiGenerationId, setAiGenerationId] = useState("");
  const [aiError, setAiError] = useState("");
  const [quotaPopup, setQuotaPopup] = useState({ open: false, title: "", message: "" });
  const [aiConversations, setAiConversations] = useState([]);
  const [selectedAiConversationId, setSelectedAiConversationId] = useState("");
  const [activeAiConversationId, setActiveAiConversationId] = useState("");
  const activeAiConversationIdRef = useRef("");
  const [highlightedFolderIds, setHighlightedFolderIds] = useState([]);
  const aiStorageKey = useMemo(
    () => `qalion-ai-conversations:${user?.userId || "anonymous"}:${orgSlug || "org"}:${projectId || "project"}`,
    [user?.userId, orgSlug, projectId],
  );
  const [variableAutocomplete, setVariableAutocomplete] = useState({
    open: false,
    mode: "create",
    stepKey: "",
    field: "action",
    query: "",
    start: 0,
    end: 0,
  });
  const [isRootDropActive, setIsRootDropActive] = useState(false);
  const [hierarchyWidth, setHierarchyWidth] = useState(340);
  const [isHierarchyResizing, setIsHierarchyResizing] = useState(false);
  const hierarchyResizeStateRef = useRef({ startX: 0, startWidth: 340 });
  const [moveDialog, setMoveDialog] = useState({
    isOpen: false,
    itemType: "",
    itemId: "",
    targetFolderId: null,
    itemName: "",
    targetName: "",
  });
  const uploadedFileNames = useMemo(
    () => extractUploadedFileNames(documentationForm.uploadedFilesData),
    [documentationForm.uploadedFilesData],
  );
  const modalPersistKey = useMemo(
    () => `execution-project-tests:modals:${user?.userId || "anonymous"}:${orgSlug || "org"}:${projectId || "project"}`,
    [user?.userId, orgSlug, projectId],
  );
  const selectedFolderPersistKey = useMemo(
    () => `execution-project-tests:selected-folder:${user?.userId || "anonymous"}:${orgSlug || "org"}:${projectId || "project"}`,
    [user?.userId, orgSlug, projectId],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.sessionStorage.getItem(selectedFolderPersistKey);
    if (saved) {
      setSelectedFolderId(saved);
    }
  }, [selectedFolderPersistKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!selectedFolderId) {
      window.sessionStorage.removeItem(selectedFolderPersistKey);
      return;
    }
    window.sessionStorage.setItem(selectedFolderPersistKey, String(selectedFolderId));
  }, [selectedFolderPersistKey, selectedFolderId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(modalPersistKey);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.isFolderModalOpen) setIsFolderModalOpen(true);
      if (saved?.isVariableModalOpen) setIsVariableModalOpen(true);
      if (saved?.isSharedStepModalOpen) setIsSharedStepModalOpen(true);
      if (saved?.isEnvironmentModalOpen) setIsEnvironmentModalOpen(true);
      if (saved?.isCreateTestCaseModalOpen) setIsCreateTestCaseModalOpen(true);
      if (saved?.editingTestCase && typeof saved.editingTestCase === "object") {
        setEditingTestCase(saved.editingTestCase);
      }
      if (saved?.isGenerateModalOpen) setIsGenerateModalOpen(true);
      if (saved?.isImportModalOpen) setIsImportModalOpen(true);
      if (saved?.environmentModalMode === "edit" || saved?.environmentModalMode === "create") {
        setEnvironmentModalMode(saved.environmentModalMode);
      }
      if (saved?.editingEnvironmentId) {
        setEditingEnvironmentId(String(saved.editingEnvironmentId));
      }
      if (saved?.envForm && typeof saved.envForm === "object") {
        setEnvForm((prev) => ({ ...prev, ...saved.envForm }));
      }
      if (saved?.folderForm && typeof saved.folderForm === "object") {
        setFolderForm((prev) => ({ ...prev, ...saved.folderForm }));
      }
      if (saved?.variableForm && typeof saved.variableForm === "object") {
        setVariableForm((prev) => ({ ...prev, ...saved.variableForm }));
      }
      if (saved?.sharedStepForm && typeof saved.sharedStepForm === "object") {
        setSharedStepForm((prev) => ({ ...prev, ...saved.sharedStepForm }));
      }
      if (saved?.testCaseForm && typeof saved.testCaseForm === "object") {
        setTestCaseForm((prev) => ({ ...prev, ...saved.testCaseForm }));
      }
    } catch {
      // Ignore invalid persisted modal state
    }
  }, [modalPersistKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasOpenModal =
      isFolderModalOpen ||
      isVariableModalOpen ||
      isSharedStepModalOpen ||
      isEnvironmentModalOpen ||
      isCreateTestCaseModalOpen ||
      Boolean(editingTestCase) ||
      isGenerateModalOpen ||
      isImportModalOpen;

    if (!hasOpenModal) {
      window.sessionStorage.removeItem(modalPersistKey);
      return;
    }

    window.sessionStorage.setItem(
      modalPersistKey,
      JSON.stringify({
        isFolderModalOpen,
        isVariableModalOpen,
        isSharedStepModalOpen,
        isEnvironmentModalOpen,
        isCreateTestCaseModalOpen,
        editingTestCase,
        isGenerateModalOpen,
        isImportModalOpen,
        environmentModalMode,
        editingEnvironmentId,
        envForm,
        folderForm,
        variableForm,
        sharedStepForm,
        testCaseForm,
      }),
    );
  }, [
    modalPersistKey,
    isFolderModalOpen,
    isVariableModalOpen,
    isSharedStepModalOpen,
    isEnvironmentModalOpen,
    isCreateTestCaseModalOpen,
    editingTestCase,
    isGenerateModalOpen,
    isImportModalOpen,
    environmentModalMode,
    editingEnvironmentId,
    envForm,
    folderForm,
    variableForm,
    sharedStepForm,
    testCaseForm,
  ]);

  const loadRepositoryData = useCallback(
    async (initial = false) => {
      if (!orgSlug || !projectId) return;
      if (initial) setLoading(true);

      try {
        if (initial) setError("");
        const data = await fetchProjectTree(orgSlug, projectId);
        setProject(data.project || null);
        setFolders(normalizeFolders(data.folders));
        setTestCases(
          (Array.isArray(data.testCases) ? data.testCases : []).map((item) => ({
            ...item,
            folderId: item.folderId || item.folder?.id || null,
            title: item.title || item.name || "",
          })),
        );
      } catch (err) {
        const msg = err?.message || "Failed to load repository";
        if (/not found/i.test(msg)) {
          window.localStorage.removeItem(`selectedProject_${orgSlug}`);
          navigate(`/dashboard/${orgSlug}/execution/tests`, { replace: true });
          return;
        }
        setError(msg);
      } finally {
        if (initial) setLoading(false);
      }
    },
    [orgSlug, projectId],
  );

  const loadAiQuota = useCallback(async () => {
    if (!orgSlug) {
      setAiQuota(null);
      return;
    }

    try {
      const payload = await fetchOrgQuotaUsage(orgSlug);
      const usageRows = Array.isArray(payload?.usage) ? payload.usage : [];
      const functionalQuota = usageRows.find((row) => row?.feature === "FunctionalGeneration") || null;
      if (!functionalQuota) {
        setAiQuota(null);
        return;
      }

      const used = Number(functionalQuota?.used || 0);
      const limit = Number(functionalQuota?.limit ?? 0);
      const remaining = Number(functionalQuota?.remaining ?? (limit >= 0 ? Math.max(0, limit - used) : -1));
      const couponRemainingUsd = Number(payload?.couponBalance?.totalRemainingUsd || 0);

      setAiQuota({
        used,
        limit,
        remaining,
        isUnlimited: limit < 0,
        hasCouponCredits: couponRemainingUsd > 0,
        couponRemainingUsd,
      });
    } catch {
      setAiQuota(null);
    }
  }, [orgSlug]);

  useEffect(() => {
    loadAiQuota();
    const intervalId = window.setInterval(loadAiQuota, 10000);
    return () => window.clearInterval(intervalId);
  }, [loadAiQuota]);

  const loadTabData = useCallback(async () => {
    if (!orgSlug || !projectId) return;

    try {
      if (activeTab === "documentation") {
        const doc = await fetchProjectDocumentation(orgSlug, projectId);
        const rawDocumentation = doc?.documentation || "";
        setDocumentation(rawDocumentation);
        setDocumentationForm(parseDocumentationFormFromPayload(rawDocumentation));
        setDocumentationDirty(false);
      }

      if (activeTab === "variables") {
        const rows = await fetchProjectVariables(orgSlug, projectId);
        setVariables(rows);
      }

      if (activeTab === "shared-steps") {
        const rows = await fetchProjectSharedSteps(orgSlug, projectId);
        setSharedSteps(rows);
      }

      if (activeTab === "configuration") {
        const conf = await fetchProjectSettings(orgSlug, projectId);
        setSettings(conf || null);
        setSettingsForm({
          name: conf?.name || "",
          description: conf?.description || "",
          baseUrl: conf?.baseUrl || "",
        });
      }
    } catch (err) {
      setError(err?.message || "Failed to load tab data");
    }
  }, [activeTab, orgSlug, projectId]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      await loadRepositoryData(true);
    };

    run();

    const interval = window.setInterval(() => {
      if (!cancelled && document.visibilityState === "visible") {
        loadRepositoryData(false);
      }
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [loadRepositoryData]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  useEffect(() => {
    if (!isHierarchyResizing) return;

    const handleMouseMove = (event) => {
      const deltaX = event.clientX - hierarchyResizeStateRef.current.startX;
      const maxWidth = Math.min(720, Math.round(window.innerWidth * 0.6));
      const nextWidth = Math.max(240, Math.min(maxWidth, hierarchyResizeStateRef.current.startWidth + deltaX));
      setHierarchyWidth(nextWidth);
    };

    const handleMouseUp = () => {
      setIsHierarchyResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isHierarchyResizing]);

  const startHierarchyResize = (event) => {
    event.preventDefault();
    hierarchyResizeStateRef.current = {
      startX: event.clientX,
      startWidth: hierarchyWidth,
    };
    setIsHierarchyResizing(true);
  };

  useEffect(() => {
    if (!isCreateTestCaseModalOpen || !orgSlug || !projectId) return;

    setCreateMode("advanced");

    const loadCreateModalData = async () => {
      try {
        const [variablesRows, sharedRows] = await Promise.all([
          fetchProjectVariables(orgSlug, projectId),
          fetchProjectSharedSteps(orgSlug, projectId),
        ]);
        setVariables(Array.isArray(variablesRows) ? variablesRows : []);
        setSharedSteps(Array.isArray(sharedRows) ? sharedRows : []);
      } catch (err) {
        setError(err?.message || "Failed to load modal data");
      }
    };

    loadCreateModalData();
  }, [isCreateTestCaseModalOpen, orgSlug, projectId]);

  const fullFolderTree = useMemo(() => buildFolderTree(folders), [folders]);

  const folderTree = useMemo(() => {
    const tree = fullFolderTree;
    const term = folderSearch.trim().toLowerCase();
    if (!term) return tree;

    const filterNode = (node) => {
      const selfMatch = (node.name || node.path || "").toLowerCase().includes(term);
      const children = (node.children || []).map(filterNode).filter(Boolean);
      if (selfMatch || children.length) return { ...node, children };
      return null;
    };

    return tree.map(filterNode).filter(Boolean);
  }, [fullFolderTree, folderSearch]);

  const folderMap = useMemo(() => collectFolderMap(fullFolderTree), [fullFolderTree]);

  const selectedFolder = useMemo(
    () => folders.find((folder) => String(folder.id) === String(selectedFolderId)) || null,
    [folders, selectedFolderId],
  );

  const selectedFolderCases = useMemo(
    () =>
      (Array.isArray(testCases) ? testCases : []).filter(
        (testCase) => selectedFolderId && String(testCase.folderId || "") === String(selectedFolderId),
      ),
    [selectedFolderId, testCases],
  );

  const filteredFolderCases = useMemo(() => {
    const term = testCaseSearch.trim().toLowerCase();
    const filtered = selectedFolderCases.filter((item) => {
      const status = item?.status || "";
      const matchesStatus = testCaseStatusFilter === "all" || status === testCaseStatusFilter;
      if (!matchesStatus) return false;
      if (!term) return true;
      return (
        (item?.title || item?.name || "").toLowerCase().includes(term) ||
        (item?.description || "").toLowerCase().includes(term)
      );
    });

    const sorted = [...filtered];
    if (testCaseSort === "title") {
      sorted.sort((a, b) => (a.title || a.name || "").localeCompare(b.title || b.name || ""));
    } else if (testCaseSort === "priority") {
      sorted.sort((a, b) => Number(b.priority ?? 0) - Number(a.priority ?? 0));
    } else {
      sorted.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
    }

    return sorted;
  }, [selectedFolderCases, testCaseSearch, testCaseStatusFilter, testCaseSort]);

  const allSelected = useMemo(
    () => filteredFolderCases.length > 0 && filteredFolderCases.every((row) => selectedTestCaseIds.includes(String(row.id))),
    [filteredFolderCases, selectedTestCaseIds],
  );

  const findFolderNameById = useCallback(
    (folderId) => {
      if (!folderId) return "Root Level";
      const folder = folderMap.get(String(folderId));
      return folder?.name || folder?.path || "Folder";
    },
    [folderMap],
  );

  const openMoveDialog = useCallback(
    ({ itemType, itemId, targetFolderId, itemName }) => {
      const targetName = findFolderNameById(targetFolderId);
      setMoveDialog({
        isOpen: true,
        itemType,
        itemId,
        targetFolderId,
        itemName: itemName || "Item",
        targetName,
      });
    },
    [findFolderNameById],
  );

  const openCreateFolderModal = (parentId = "") => {
    setFolderModalMode("create");
    setFolderModalError("");
    setFolderForm({ ...INITIAL_FOLDER_FORM, parentId });
    setIsFolderModalOpen(true);
  };

  const openEditFolderModal = (folder) => {
    setFolderModalMode("edit");
    setFolderModalError("");
    setFolderForm({ id: folder.id, name: folder.name || "", parentId: folder.parentId || "" });
    setIsFolderModalOpen(true);
  };

  const submitFolderModal = async () => {
    if (!folderForm.name.trim()) {
      setFolderModalError("Folder name is required");
      return;
    }

    setSaving(true);
    setFolderModalError("");
    try {
      if (folderModalMode === "create") {
        await createFolder(orgSlug, projectId, {
          name: folderForm.name.trim(),
          parentId: folderForm.parentId || null,
        });
      } else {
        await renameFolder(orgSlug, projectId, folderForm.id, {
          name: folderForm.name.trim(),
          parentId: folderForm.parentId || null,
        });
      }
      setIsFolderModalOpen(false);
      setFolderModalError("");
      setFolderForm(INITIAL_FOLDER_FORM);
      await loadRepositoryData(false);
    } catch (err) {
      setFolderModalError(err?.message || "Failed to save folder");
    } finally {
      setSaving(false);
    }
  };

  const parseTagsFromInput = (input) =>
    String(input || "")
      .split(/[,\s]+/)
      .map((tag) => tag.trim())
      .filter(Boolean);

  const normalizeTagKeywords = (list) => {
    const output = [];
    const seen = new Set();
    for (const raw of Array.isArray(list) ? list : []) {
      const tag = String(raw || "").trim();
      if (!tag) continue;
      const key = tag.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      output.push(tag);
    }
    return output;
  };

  const addCreateTagFromInput = () => {
    setTestCaseForm((prev) => {
      const typed = parseTagsFromInput(prev.tagsInput);
      if (!typed.length) return prev;
      return {
        ...prev,
        tagsKeywords: normalizeTagKeywords([...(prev.tagsKeywords || []), ...typed]),
        tagsInput: "",
      };
    });
  };

  const removeCreateTag = (tagToRemove) => {
    setTestCaseForm((prev) => ({
      ...prev,
      tagsKeywords: (prev.tagsKeywords || []).filter((tag) => tag !== tagToRemove),
    }));
  };

  const addEditTagFromInput = () => {
    setEditingTestCase((prev) => {
      if (!prev) return prev;
      const typed = parseTagsFromInput(prev.tagsInput);
      if (!typed.length) return prev;
      return {
        ...prev,
        tagsKeywords: normalizeTagKeywords([...(prev.tagsKeywords || []), ...typed]),
        tagsInput: "",
      };
    });
  };

  const removeEditTag = (tagToRemove) => {
    setEditingTestCase((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tagsKeywords: (prev.tagsKeywords || []).filter((tag) => tag !== tagToRemove),
      };
    });
  };

  const confirmDeleteFolder = async () => {
    if (!folderToDelete) return;
    setSaving(true);
    setError("");
    try {
      await deleteFolder(orgSlug, projectId, folderToDelete.id);
      if (String(selectedFolderId) === String(folderToDelete.id)) {
        setSelectedFolderId(null);
      }
      setFolderToDelete(null);
      await loadRepositoryData(false);
    } catch (err) {
      setError(err?.message || "Failed to delete folder");
    } finally {
      setSaving(false);
    }
  };

  const toggleFolderSelect = (folderId) => {
    setSelectedFolderIds((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]
    );
  };

  const confirmBulkDeleteFolders = async () => {
    if (selectedFolderIds.length === 0) return;
    setBulkDeleting(true);
    setError("");
    try {
      await deleteFoldersBulk(orgSlug, projectId, selectedFolderIds);
      if (selectedFolderIds.includes(String(selectedFolderId))) {
        setSelectedFolderId(null);
      }
      setSelectedFolderIds([]);
      setMultiSelectMode(false);
      await loadRepositoryData(false);
    } catch (err) {
      setError(err?.message || "Failed to delete folders");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleImportTests = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportMessage(null);
    try {
      const result = await importTestsFromFile(orgSlug, projectId, importFile, selectedFolderId || null);
      setImportMessage({ type: "success", text: result?.message || "Import completed" });
      setImportFile(null);
      await loadRepositoryData(false);
    } catch (err) {
      setImportMessage({ type: "error", text: err?.message || "Import failed" });
    } finally {
      setImporting(false);
    }
  };

  const handleMoveFolder = (sourceFolderId, targetFolderId) => {
    if (!sourceFolderId) return;
    if (String(sourceFolderId) === String(targetFolderId || "")) return;
    const folder = folderMap.get(String(sourceFolderId));
    openMoveDialog({
      itemType: "folder",
      itemId: sourceFolderId,
      targetFolderId: targetFolderId || null,
      itemName: folder?.name || folder?.path || "Folder",
    });
  };

  const handleMoveTestCase = (testCaseId, targetFolderId) => {
    if (!testCaseId) return;
    const testCase = (testCases || []).find((row) => String(row.id) === String(testCaseId));
    openMoveDialog({
      itemType: "testCase",
      itemId: testCaseId,
      targetFolderId: targetFolderId || null,
      itemName: testCase?.title || testCase?.name || "Test Case",
    });
  };

  const confirmMoveItem = async () => {
    if (!moveDialog.itemId || !moveDialog.itemType) return;

    setSaving(true);
    setError("");
    try {
      await moveProjectItem(orgSlug, {
        itemType: moveDialog.itemType,
        itemId: moveDialog.itemId,
        targetFolderId: moveDialog.targetFolderId,
        projectId,
      });
      setMoveDialog({
        isOpen: false,
        itemType: "",
        itemId: "",
        targetFolderId: null,
        itemName: "",
        targetName: "",
      });
      await loadRepositoryData(false);
    } catch (err) {
      setError(err?.message || "Failed to move item");
    } finally {
      setSaving(false);
    }
  };

  const updateStep = (index, field, value) => {
    setTestCaseForm((prev) => {
      const next = [...prev.steps];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, steps: next };
    });
  };

  const addStep = () => {
    setTestCaseForm((prev) => ({
      ...prev,
      steps: [...prev.steps, createDraftStep()],
    }));
  };

  const insertStepAfter = (index) => {
    const created = createDraftStep();
    setTestCaseForm((prev) => {
      const next = [...prev.steps];
      next.splice(index + 1, 0, created);
      return { ...prev, steps: next };
    });
    setNewlyInsertedStepId(created.id);
    window.setTimeout(() => setNewlyInsertedStepId(""), 700);
  };

  const removeStep = (index) => {
    setTestCaseForm((prev) => {
      if (prev.steps.length === 1) return prev;
      return { ...prev, steps: prev.steps.filter((_, itemIndex) => itemIndex !== index) };
    });
  };

  const moveStep = (index, direction) => {
    setTestCaseForm((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.steps.length) return prev;
      const next = [...prev.steps];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, steps: next };
    });
  };

  const addSharedStepToCreateForm = (sharedStep) => {
    const created = {
      id: `shared-${sharedStep.id}-${Date.now()}`,
      action: sharedStep.action || "",
      expectedResult: sharedStep.expectedResult || "",
      isSharedStep: true,
      sharedStepName: sharedStep.name || "Shared Step",
    };

    setTestCaseForm((prev) => ({
      ...prev,
      steps: [...prev.steps, created],
    }));
    setNewlyInsertedStepId(created.id);
    setIsCreateSharedStepsPickerOpen(false);
    window.setTimeout(() => setNewlyInsertedStepId(""), 700);
  };

  const addSharedStepToEditForm = (sharedStep) => {
    const created = {
      id: `shared-${sharedStep.id}-${Date.now()}`,
      action: sharedStep.action || "",
      expectedResult: sharedStep.expectedResult || "",
      isSharedStep: true,
      sharedStepName: sharedStep.name || "Shared Step",
    };

    setEditingTestCase((prev) => ({
      ...(prev || {}),
      steps: [...(prev?.steps || []), created],
    }));
    setNewlyInsertedStepId(created.id);
    setIsCreateSharedStepsPickerOpen(false);
    window.setTimeout(() => setNewlyInsertedStepId(""), 700);
  };

  const openVariablePicker = (mode, stepKey, field) => {
    setActiveVariableTarget({ mode, stepKey: String(stepKey), field });
    setVariableSearch("");
    setIsVariablePickerOpen(true);
  };

  const insertVariableIntoStep = (variableName) => {
    const token = `$${variableName}`;
    if (activeVariableTarget.mode === "edit") {
      setEditingTestCase((prev) => {
        if (!prev) return prev;
        const stepIndex = Number(activeVariableTarget.stepKey);
        const source = prev.steps || [];
        if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= source.length) return prev;
        const current = String(source[stepIndex]?.[activeVariableTarget.field] || "");
        const nextValue = `${current}${current ? " " : ""}${token}`;
        const nextSteps = source.map((item, index) =>
          index === stepIndex ? { ...item, [activeVariableTarget.field]: nextValue } : item,
        );
        return { ...prev, steps: nextSteps };
      });
    } else {
      setTestCaseForm((prev) => ({
        ...prev,
        steps: prev.steps.map((step) => {
          if (String(step.id) !== String(activeVariableTarget.stepKey)) return step;
          const current = String(step[activeVariableTarget.field] || "");
          return {
            ...step,
            [activeVariableTarget.field]: `${current}${current ? " " : ""}${token}`,
          };
        }),
      }));
    }
    setIsVariablePickerOpen(false);
  };

  const closeVariableAutocomplete = () => {
    setVariableAutocomplete((prev) => ({ ...prev, open: false }));
  };

  const filteredVariableSuggestions = useMemo(() => {
    const term = variableAutocomplete.query.trim().toLowerCase();
    return (variables || []).filter((item) => {
      const name = String(item?.name || "").toLowerCase();
      if (!term) return true;
      return name.includes(term);
    });
  }, [variables, variableAutocomplete.query]);

  const handleVariableAutocompleteInput = (mode, stepKey, field, value, caretPosition) => {
    const trigger = getVariableTrigger(value, caretPosition);
    if (!trigger) {
      closeVariableAutocomplete();
      return;
    }
    setVariableAutocomplete({
      open: true,
      mode,
      stepKey: String(stepKey),
      field,
      query: trigger.query,
      start: trigger.start,
      end: trigger.end,
    });
  };

  const applyVariableAutocomplete = (variableName) => {
    const token = `$${variableName}`;
    const { mode, stepKey, field, start, end } = variableAutocomplete;
    const targetSelector = `textarea[data-var-target="${mode}-${stepKey}-${field}"]`;

    if (mode === "create") {
      setTestCaseForm((prev) => {
        const stepIndex = prev.steps.findIndex((step) => String(step.id) === String(stepKey));
        if (stepIndex === -1) return prev;
        const step = prev.steps[stepIndex];
        const current = String(step[field] || "");
        const nextValue = `${current.slice(0, start)}${token}${current.slice(end)}`;
        const nextSteps = [...prev.steps];
        nextSteps[stepIndex] = { ...step, [field]: nextValue };
        return { ...prev, steps: nextSteps };
      });
    } else {
      setEditingTestCase((prev) => {
        if (!prev) return prev;
        const stepIndex = Number(stepKey);
        const source = prev.steps || [];
        if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= source.length) return prev;
        const current = String(source[stepIndex]?.[field] || "");
        const nextValue = `${current.slice(0, start)}${token}${current.slice(end)}`;
        const nextSteps = source.map((item, index) => (index === stepIndex ? { ...item, [field]: nextValue } : item));
        return { ...prev, steps: nextSteps };
      });
    }

    closeVariableAutocomplete();
    window.setTimeout(() => {
      const textarea = document.querySelector(targetSelector);
      if (textarea && typeof textarea.setSelectionRange === "function") {
        const cursor = start + token.length;
        textarea.focus();
        textarea.setSelectionRange(cursor, cursor);
      }
    }, 0);
  };

  const openCreateTestCaseModal = () => {
    if (!selectedFolderId) {
      setError("Select a folder first");
      return;
    }
    setTestCaseForm({ ...INITIAL_TEST_CASE_FORM, steps: [createDraftStep()] });
    closeVariableAutocomplete();
    setIsCreateTestCaseModalOpen(true);
  };

  const submitCreateTestCase = async () => {
    if (!testCaseForm.title.trim()) {
      setError("Test case title is required");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const tags = normalizeTagKeywords([...(testCaseForm.tagsKeywords || []), ...parseTagsFromInput(testCaseForm.tagsInput)]);
      await createTestCase(orgSlug, projectId, {
        title: testCaseForm.title.trim(),
        description: testCaseForm.description,
        folderId: selectedFolderId,
        priority: PRIORITY_TO_INT[testCaseForm.priority] ?? 1,
        testCaseType: testCaseForm.testCaseType,
        automationStatus: testCaseForm.automationStatus,
        tags,
        steps: testCaseForm.steps
          .map((step) => ({
            action: step.action.trim(),
            expectedResult: step.expectedResult.trim(),
          }))
          .filter((step) => step.action || step.expectedResult),
      });
      setIsCreateTestCaseModalOpen(false);
      closeVariableAutocomplete();
      setTestCaseForm({ ...INITIAL_TEST_CASE_FORM, steps: [createDraftStep()] });
      await loadRepositoryData(false);
    } catch (err) {
      setError(err?.message || "Failed to create test case");
    } finally {
      setSaving(false);
    }
  };

  const toggleSelectAllTestCases = () => {
    if (allSelected) {
      setSelectedTestCaseIds([]);
      return;
    }
    setSelectedTestCaseIds(filteredFolderCases.map((item) => String(item.id)));
  };

  const toggleSelectOneTestCase = (id) => {
    setSelectedTestCaseIds((prev) => {
      const key = String(id);
      if (prev.includes(key)) {
        return prev.filter((item) => item !== key);
      }
      return [...prev, key];
    });
  };

  const openEditTestCase = (item) => {
    setEditingTestCase({
      id: item.id,
      title: item.title || item.name || "",
      description: item.description || "",
      status: item.status || "Active",
      priority: Number(item.priority ?? 1),
      testCaseType: item.testCaseType || "Functional",
      automationStatus: item.automationStatus || "Not Automated",
      tagsKeywords: normalizeTagKeywords(Array.isArray(item.tags) ? item.tags : []),
      tagsInput: "",
      steps:
        Array.isArray(item.steps) && item.steps.length
          ? item.steps.map((step) => ({
              action: step.action || "",
              expectedResult: step.expectedResult || "",
            }))
          : [{ action: "", expectedResult: "" }],
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const openTestCaseId = params.get("openTestCaseId");
    if (!openTestCaseId) return;

    const found = (testCases || []).find((item) => String(item?.id) === String(openTestCaseId));
    if (!found) return;

    openEditTestCase(found);

    params.delete("openTestCaseId");
    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );
  }, [location.pathname, location.search, navigate, testCases]);

  const activeEditingIndex = useMemo(() => {
    if (!editingTestCase?.id) return -1;
    return filteredFolderCases.findIndex((item) => String(item.id) === String(editingTestCase.id));
  }, [editingTestCase?.id, filteredFolderCases]);

  const navigateEditingTestCase = (direction) => {
    if (!editingTestCase?.id) return;
    if (activeEditingIndex < 0) return;
    const targetIndex = activeEditingIndex + direction;
    if (targetIndex < 0 || targetIndex >= filteredFolderCases.length) return;
    const target = filteredFolderCases[targetIndex];
    if (!target) return;
    openEditTestCase(target);
  };

  const submitEditTestCase = async () => {
    if (!editingTestCase?.id || !editingTestCase?.title?.trim()) {
      setError("Test case title is required");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const tags = normalizeTagKeywords([
        ...((editingTestCase && editingTestCase.tagsKeywords) || []),
        ...parseTagsFromInput(editingTestCase?.tagsInput),
      ]);
      await updateTestCase(orgSlug, projectId, editingTestCase.id, {
        title: editingTestCase.title.trim(),
        description: editingTestCase.description,
        status: editingTestCase.status,
        priority: Number(editingTestCase.priority ?? 1),
        testCaseType: editingTestCase.testCaseType,
        automationStatus: editingTestCase.automationStatus,
        tags,
        steps: (editingTestCase.steps || [])
          .map((step) => ({
            action: String(step.action || "").trim(),
            expectedResult: String(step.expectedResult || "").trim(),
          }))
          .filter((step) => step.action || step.expectedResult),
      });
      closeVariableAutocomplete();
      await loadRepositoryData(false);
    } catch (err) {
      setError(err?.message || "Failed to update test case");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteTestCase = async () => {
    if (!deletingTestCase?.id) return;
    setSaving(true);
    setError("");
    try {
      await deleteTestCase(orgSlug, projectId, deletingTestCase.id);
      setDeletingTestCase(null);
      setSelectedTestCaseIds((prev) => prev.filter((id) => id !== String(deletingTestCase.id)));
      await loadRepositoryData(false);
    } catch (err) {
      setError(err?.message || "Failed to delete test case");
    } finally {
      setSaving(false);
    }
  };

  const confirmBulkDelete = async () => {
    if (!selectedTestCaseIds.length) return;
    setSaving(true);
    setError("");
    try {
      await Promise.all(selectedTestCaseIds.map((id) => deleteTestCase(orgSlug, projectId, id)));
      setBulkDeleteOpen(false);
      setSelectedTestCaseIds([]);
      await loadRepositoryData(false);
    } catch (err) {
      setError(err?.message || "Failed to delete selected test cases");
    } finally {
      setSaving(false);
    }
  };

  const handleCloneTestCase = async (item) => {
    setSaving(true);
    setError("");
    try {
      await cloneTestCase(orgSlug, projectId, item.id, {
        folderId: selectedFolderId,
      });
      await loadRepositoryData(false);
    } catch (err) {
      setError(err?.message || "Failed to clone test case");
    } finally {
      setSaving(false);
    }
  };

  const selectedAiConversation = useMemo(
    () => aiConversations.find((item) => item.id === selectedAiConversationId) || null,
    [aiConversations, selectedAiConversationId],
  );

  const isAiGenerating = selectedAiConversation?.phase === "generating";

  // Keep ref in sync so socket callbacks always have the latest value
  useEffect(() => {
    activeAiConversationIdRef.current = activeAiConversationId;
  }, [activeAiConversationId]);

  const updateAiConversation = useCallback((conversationId, updater) => {
    setAiConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              ...updater(conversation),
              updatedAt: new Date().toISOString(),
            }
          : conversation,
      ),
    );
  }, []);

  const createConversationTitle = useCallback((prompt) => {
    const clean = String(prompt || "").trim();
    if (!clean) return "New Generation";
    return clean.length > 54 ? `${clean.slice(0, 54)}...` : clean;
  }, []);

  const upsertConversationStep = useCallback((conversationId, id, type, label, status, detail) => {
    updateAiConversation(conversationId, (conversation) => {
      const steps = Array.isArray(conversation.steps) ? conversation.steps : [];
      const existingIndex = steps.findIndex((item) => item.id === id);
      if (existingIndex === -1) {
        return {
          steps: [
            ...steps,
            {
              id,
              type,
              label,
              status,
              detail,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      }
      return {
        steps: steps.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                status: status || item.status,
                detail: detail || item.detail,
              }
            : item,
        ),
      };
    });
  }, [updateAiConversation]);

  const getLiveEntityStepId = useCallback((prefix, data) => {
    const raw = String(
      data?.testCaseId ||
      data?.folderId ||
      data?.title ||
      data?.folderName ||
      "",
    )
      .trim()
      .toLowerCase();

    if (!raw) return `${prefix}-unknown`;

    const safe = raw
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-_.]/g, "")
      .slice(0, 80);

    return `${prefix}-${safe || "unknown"}`;
  }, []);

  useEffect(() => {
    if (!aiStorageKey) return;
    try {
      const raw = window.localStorage.getItem(aiStorageKey);
      if (!raw) {
        setAiConversations([]);
        setSelectedAiConversationId("");
        return;
      }
      const parsed = JSON.parse(raw);
      const rows = Array.isArray(parsed?.conversations) ? parsed.conversations : [];
      setAiConversations(rows);
      const lastSelected = String(parsed?.lastSelectedId || "");
      if (lastSelected && rows.some((item) => item.id === lastSelected)) {
        setSelectedAiConversationId(lastSelected);
      } else {
        setSelectedAiConversationId(rows[0]?.id || "");
      }
    } catch {
      setAiConversations([]);
      setSelectedAiConversationId("");
    }
  }, [aiStorageKey]);

  useEffect(() => {
    if (!aiStorageKey) return;
    try {
      window.localStorage.setItem(
        aiStorageKey,
        JSON.stringify({
          conversations: aiConversations,
          lastSelectedId: selectedAiConversationId,
        }),
      );
    } catch {
    }
  }, [aiConversations, selectedAiConversationId, aiStorageKey]);

  const requestLiveReplay = useRequestLiveReplay();

  const handleAiLiveEvent = useCallback(
    (event) => {
      const convId = activeAiConversationIdRef.current || selectedAiConversationId;
      if (!convId) return;
      const { type, data } = event || {};
      if (!type) return;

      const shouldCloseStartStep =
        type !== "generation:started" &&
        type !== "generation:error" &&
        type !== "generation:cancelled";

      if (shouldCloseStartStep) {
        upsertConversationStep(
          convId,
          "gen-start",
          type,
          "Starting generation...",
          "done",
          "Generation started",
        );
      }

      if (type === "generation:started") {
        updateAiConversation(convId, (conversation) => {
          const isTerminal = ["completed", "error", "cancelled"].includes(conversation?.phase);
          return isTerminal ? {} : { phase: "generating" };
        });
        upsertConversationStep(convId, "gen-start", type, "Starting generation...", "active", data?.message);
      }

      if (type === "phase:reading-docs") {
        upsertConversationStep(convId, "docs", type, "Reading project documentation...", "active", data?.message);
      }
      if (type === "phase:docs-loaded") {
        upsertConversationStep(convId, "docs", type, "Reading project documentation...", "done", data?.message || "Documentation loaded");
      }
      if (type === "phase:no-docs") {
        upsertConversationStep(convId, "docs", type, "Reading project documentation...", "done", data?.message || "No documentation available");
      }

      if (type === "phase:analyzing") {
        upsertConversationStep(convId, "analyze", type, "Analyzing project context...", "active", data?.message);
      }
      if (type === "phase:analyzed") {
        upsertConversationStep(convId, "analyze", type, "Analyzing project context...", "done", data?.message || "Context analyzed");
      }

      if (type === "phase:checking") {
        upsertConversationStep(convId, "check", type, "Checking existing test cases...", "active", data?.message);
      }
      if (type === "phase:checked") {
        upsertConversationStep(convId, "check", type, "Checking existing test cases...", "done", data?.message || "Existing tests checked");
      }

      if (type === "browser:analyzing") {
        upsertConversationStep(convId, "plan", type, "Planning test cases from prompt...", "active", data?.message);
      }
      if (type === "browser:progress") {
        upsertConversationStep(
          convId,
          "plan",
          type,
          "Planning test cases from prompt...",
          "active",
          data?.message || data?.detail || "Analyzing website and extracting test scenarios",
        );
      }
      if (type === "browser:analyzed") {
        upsertConversationStep(convId, "plan", type, "Planning test cases from prompt...", "done", data?.message || "Planning complete");
      }

      // ── Thinking events (AI reasoning process visibility) ──
      if (type === "thinking:prompt-analysis") {
        upsertConversationStep(convId, "thinking-prompt", type, "Analyzing your prompt...", "done", data?.message || "Understanding requirements");
      }
      if (type === "thinking:deduplication") {
        upsertConversationStep(convId, "thinking-dedup", type, "Deduplication check", "done", data?.message || "Checking for duplicate tests");
      }
      if (type === "thinking:url-extraction") {
        upsertConversationStep(convId, "thinking-url", type, "Extracted reference URL", "done", data?.message || data?.referenceUrl || "URL extracted from docs");
      }
      if (type === "thinking:scenario-planning") {
        upsertConversationStep(convId, "thinking-scenarios", type, "Identifying test scenarios...", "active", data?.message || "AI is planning test scenarios");
      }
      if (type === "thinking:agent-reasoning") {
        upsertConversationStep(convId, `thinking-reason-${data?.stepIndex || "x"}`, type, "AI model reasoning...", "done", data?.message || "Processing next step");
      }
      if (type === "thinking:tool-call") {
        const toolName = data?.toolName || "tool";
        upsertConversationStep(
          convId,
          `thinking-tool-${data?.toolCallIndex || toolName}`,
          type,
          `Calling tool: ${toolName}`,
          "active",
          data?.message,
        );
      }
      if (type === "thinking:tool-result") {
        const toolName = data?.toolName || "tool";
        upsertConversationStep(
          convId,
          `thinking-tool-${data?.toolCallIndex || toolName}`,
          type,
          `Tool completed: ${toolName}`,
          "done",
          data?.message,
        );
      }
      if (type === "thinking:plan-ready") {
        upsertConversationStep(
          convId,
          "thinking-plan-ready",
          type,
          `Test plan ready (${data?.plannedCount || "?"} tests)`,
          "done",
          data?.testTitles ? data.testTitles.join(", ") : data?.message,
        );
      }
      if (type === "thinking:structuring") {
        upsertConversationStep(convId, "thinking-structure", type, "Structuring AI output...", "done", data?.message || "Formatting results");
      }
      if (type === "thinking:executing") {
        upsertConversationStep(convId, "thinking-executing", type, "Creating test cases...", "active", data?.message || "Saving tests to project");
      }

      if (type === "docs:updated") {
        upsertConversationStep(
          convId,
          "docs-update",
          type,
          "Updating project documentation...",
          "done",
          data?.message || "Documentation updated",
        );
      }

      if (type === "folder:found" || type === "folder:created") {
        const folderName = data?.folderName || data?.path || "Folder";
        upsertConversationStep(
          convId,
          `folder-${data?.folderId || folderName}`,
          type,
          `${type === "folder:created" ? "Created" : "Using"} folder: ${folderName}`,
          "done",
        );
      }

      if (type === "test:creating") {
        const stepId = getLiveEntityStepId("test", data);
        upsertConversationStep(
          convId,
          stepId,
          type,
          `Creating test: ${data?.title || "Test case"}`,
          "active",
        );
      }
      if (type === "test:created") {
        const stepId = getLiveEntityStepId("test", data);
        upsertConversationStep(
          convId,
          stepId,
          type,
          `Created test: ${data?.title || "Test case"}`,
          "done",
          `${data?.stepsCount || "?"} steps`,
        );
      }

      if (type === "test:updating") {
        const stepId = getLiveEntityStepId("update", data);
        upsertConversationStep(
          convId,
          stepId,
          type,
          `Updating test: ${data?.title || "Test case"}`,
          "active",
        );
      }
      if (type === "test:updated") {
        const stepId = getLiveEntityStepId("update", data);
        upsertConversationStep(
          convId,
          stepId,
          type,
          `Updated test: ${data?.title || "Test case"}`,
          "done",
          `${data?.stepsCount || "?"} steps`,
        );
      }

      if (type === "test:error") {
        const stepId = getLiveEntityStepId("test", data);
        upsertConversationStep(
          convId,
          stepId,
          type,
          `Failed: ${data?.title || "Test case"}`,
          "error",
          data?.error || data?.message,
        );
      }

      if (type === "generation:retry") {
        upsertConversationStep(
          convId,
          "gen-retry",
          type,
          `Retrying generation${data?.attempt ? ` (attempt ${data.attempt + 1})` : ""}...`,
          "active",
          data?.message || "Temporary AI response error, retrying",
        );
      }

      if (type === "generation:completed") {
        updateAiConversation(convId, (conversation) => {
          const steps = Array.isArray(conversation?.steps) ? conversation.steps : [];
          return {
            phase: "completed",
            reasoning: data?.reasoning || conversation.reasoning || "",
            suggestions: Array.isArray(data?.suggestions) ? data.suggestions : conversation.suggestions || [],
            steps: steps.map((step) =>
              step.status === "active"
                ? {
                    ...step,
                    status: "done",
                    detail: step.detail || "Completed",
                  }
                : step,
            ),
          };
        });
        upsertConversationStep(
          convId,
          "gen-done",
          type,
          `Generation completed (${data?.testCasesCount ?? data?.testCount ?? 0} tests)` ,
          "done",
        );
      }

      if (type === "generation:error") {
        const rawErr = data?.error || data?.message || "Generation failed";
        const message = typeof rawErr === "string" ? rawErr : (rawErr?.message || JSON.stringify(rawErr));
        updateAiConversation(convId, (conversation) => {
          const steps = Array.isArray(conversation?.steps) ? conversation.steps : [];
          return {
            phase: "error",
            error: message,
            steps: steps.map((step) =>
              step.status === "active"
                ? {
                    ...step,
                    status: "error",
                    detail: step.detail || "Interrupted by generation error",
                  }
                : step,
            ),
          };
        });
        upsertConversationStep(convId, "gen-error", type, "Generation failed", "error", message);
      }

      if (type === "generation:cancelled") {
        updateAiConversation(convId, (conversation) => {
          const steps = Array.isArray(conversation?.steps) ? conversation.steps : [];
          return {
            phase: "cancelled",
            steps: steps.map((step) =>
              step.status === "active"
                ? {
                    ...step,
                    status: "error",
                    detail: step.detail || "Cancelled",
                  }
                : step,
            ),
          };
        });
        upsertConversationStep(convId, "gen-cancel", type, "Generation cancelled", "error", data?.message);
      }
    },
    [getLiveEntityStepId, upsertConversationStep, updateAiConversation, selectedAiConversationId],
  );

  useTestRunSocket(aiGenerationId || null, {
    onLiveEvent: handleAiLiveEvent,
  });

  useEffect(() => {
    if (aiGenerationId && isAiGenerating) {
      const timeout = window.setTimeout(() => requestLiveReplay(aiGenerationId), 350);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [aiGenerationId, isAiGenerating, requestLiveReplay]);

  const openGenerateModal = () => {
    setAiError("");
    setAiDraftPrompt("");
    setIsGenerateModalOpen(true);
  };

  useEffect(() => {
    const handler = () => openGenerateModal();
    window.addEventListener("openQalionAgent", handler);
    return () => window.removeEventListener("openQalionAgent", handler);
  }, []);

  const createNewGenerationDraft = () => {
    setAiError("");
    setAiDraftPrompt("");
    setSelectedAiConversationId("");
  };

  const closeGenerateModal = async () => {
    if (isAiGenerating && aiGenerationId) {
      try {
        await cancelFunctionalGeneration(orgSlug, {
          generationId: aiGenerationId,
          reason: "Modal closed",
        });
      } catch {
      }
      const convId = activeAiConversationId || selectedAiConversationId;
      if (convId) {
        updateAiConversation(convId, () => ({ phase: "cancelled" }));
        upsertConversationStep(
          convId,
          "gen-start",
          "generation:cancelled",
          "Starting generation...",
          "error",
          "Generation cancelled",
        );
        upsertConversationStep(
          convId,
          "gen-cancel",
          "generation:cancelled",
          "Generation cancelled",
          "error",
          "Modal closed",
        );
      }
    }
    setIsGenerateModalOpen(false);
    setAiGenerationId("");
    setActiveAiConversationId("");
    activeAiConversationIdRef.current = "";
    // Auto-clear folder highlights after 5 seconds
    if (highlightedFolderIds.length > 0) {
      window.setTimeout(() => setHighlightedFolderIds([]), 5000);
    }
  };

  const submitGenerateTests = async () => {
    if (aiQuota && !aiQuota.hasCouponCredits) {
      setQuotaPopup({
        open: true,
        title: "No Credits",
        message: "Your organization has no remaining credits. Please add credits to generate tests.",
      });
      return;
    }

    const trimmed = aiDraftPrompt.trim();
    if (!trimmed) {
      setAiError("Please enter what you want AI to generate");
      return;
    }

    if (documentationDirty) {
      try {
        const payloadDocumentation = buildDocumentationPayloadFromForm(documentationForm);
        const updated = await updateProjectDocumentation(orgSlug, projectId, payloadDocumentation);
        const storedDocumentation = updated?.documentation || payloadDocumentation;
        setDocumentation(storedDocumentation);
        setDocumentationForm(parseDocumentationFormFromPayload(storedDocumentation));
        setDocumentationDirty(false);
      } catch (err) {
        setAiError(err?.message || "Failed to save documentation before generation");
        return;
      }
    }

    const existingConversation = selectedAiConversationId
      ? aiConversations.find((item) => item.id === selectedAiConversationId) || null
      : null;

    const conversationId = existingConversation?.id || `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const generationId = `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setAiGenerationId(generationId);
    setActiveAiConversationId(conversationId);
    activeAiConversationIdRef.current = conversationId;
    setSelectedAiConversationId(conversationId);
    setAiError("");
    setAiDraftPrompt("");

    setAiConversations((prev) => {
      const alreadyExists = prev.some((item) => item.id === conversationId);
      if (!alreadyExists) {
        return [
          {
            id: conversationId,
            title: createConversationTitle(trimmed),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            phase: "generating",
            error: "",
            generationId,
            messages: [{ id: messageId, role: "user", content: trimmed, timestamp: new Date().toISOString() }],
            steps: [],
            generatedTests: [],
            reasoning: "",
            suggestions: [],
          },
          ...prev,
        ];
      }

      return prev.map((item) =>
        item.id === conversationId
          ? {
              ...item,
              title: item.title || createConversationTitle(trimmed),
              phase: "generating",
              error: "",
              generationId,
              messages: [
                ...(Array.isArray(item.messages) ? item.messages : []),
                { id: messageId, role: "user", content: trimmed, timestamp: new Date().toISOString() },
              ],
              steps: [],
              generatedTests: [],
              reasoning: "",
              suggestions: [],
              updatedAt: new Date().toISOString(),
            }
          : item,
      );
    });

    upsertConversationStep(conversationId, "gen-start", "generation:started", "Starting generation...", "active");

    try {
      const response = await generateFunctionalTests(orgSlug, {
        projectId,
        userPrompt: trimmed,
        generationId,
      });

      const result = response?.result || response;
      const testCases = Array.isArray(result?.testCases) ? result.testCases : [];

      // Collect generated folder IDs for highlighting after modal close
      const generatedFolderIdSet = new Set();
      for (const tc of testCases) {
        if (tc?.folderId) generatedFolderIdSet.add(String(tc.folderId));
      }
      if (generatedFolderIdSet.size > 0) {
        setHighlightedFolderIds(Array.from(generatedFolderIdSet));
      }

      updateAiConversation(conversationId, (conversation) => ({
        phase: "completed",
        generatedTests: testCases,
        reasoning: result?.reasoning || "",
        suggestions: Array.isArray(result?.suggestions) ? result.suggestions : [],
        messages: Array.isArray(conversation.messages) ? conversation.messages : [],
      }));
      upsertConversationStep(
        conversationId,
        "gen-start",
        "generation:started",
        "Starting generation...",
        "done",
        `Generated ${testCases.length} test case${testCases.length !== 1 ? "s" : ""}`,
      );
      // Request one final replay to ensure all socket events are captured
      if (generationId) {
        try { requestLiveReplay(generationId); } catch {}
      }
      await loadRepositoryData(false);
    } catch (err) {
      const rawErrMsg = err?.message || "Failed to generate test cases";
      const rawMessage = typeof rawErrMsg === "string" ? rawErrMsg : (rawErrMsg?.message || JSON.stringify(rawErrMsg));
      const isQuotaDenied =
        isQuotaDeniedError(err) ||
        Boolean(aiQuota && !aiQuota.hasCouponCredits);
      const message = isQuotaDenied
        ? AI_QUOTA_UPGRADE_MESSAGE
        : rawMessage;
      upsertConversationStep(
        conversationId,
        "gen-start",
        "generation:error",
        "Starting generation...",
        "error",
        message,
      );
      upsertConversationStep(
        conversationId,
        "gen-error",
        "generation:error",
        "Generation failed",
        "error",
        message,
      );
      setAiError(message);
      if (isQuotaDenied) {
        setQuotaPopup({
          open: true,
          title: "AI Quota Required",
          message,
        });
      }
      updateAiConversation(conversationId, (conversation) => ({
        phase: "error",
        error: message,
        messages: [
          ...(Array.isArray(conversation.messages) ? conversation.messages : []),
          {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            role: "assistant",
            content: message,
            timestamp: new Date().toISOString(),
          },
        ],
      }));
    } finally {
      // Delay clearing so socket replay events can still be processed
      window.setTimeout(() => {
        setAiGenerationId("");
        setActiveAiConversationId("");
        activeAiConversationIdRef.current = "";
      }, 3000);
      loadAiQuota();
    }
  };

  const cancelGenerateTests = async () => {
    const convId = activeAiConversationId || selectedAiConversationId;
    try {
      if (aiGenerationId) {
        await cancelFunctionalGeneration(orgSlug, {
          generationId: aiGenerationId,
          reason: "User cancelled",
        });
      }
    } catch {
    } finally {
      if (convId) {
        updateAiConversation(convId, () => ({ phase: "cancelled" }));
        upsertConversationStep(
          convId,
          "gen-start",
          "generation:cancelled",
          "Starting generation...",
          "error",
          "Generation cancelled",
        );
        upsertConversationStep(
          convId,
          "gen-cancel",
          "generation:cancelled",
          "Generation cancelled",
          "error",
          "User cancelled",
        );
      }
      setAiGenerationId("");
      setActiveAiConversationId("");
      activeAiConversationIdRef.current = "";
    }
  };

  const exportSelectedTestCases = () => {
    const rows = filteredFolderCases.filter((item) => selectedTestCaseIds.includes(String(item.id)));
    if (!rows.length) return;
    const csv = [
      ["ID", "Title", "Status", "Priority", "Type", "Automation", "Tags", "Description"],
      ...rows.map((item) => [
        item.id,
        `"${String(item.title || item.name || "").replace(/"/g, '""')}"`,
        item.status || "",
        PRIORITY_LABELS[Number(item.priority ?? 1)] || "Medium",
        item.testCaseType || "",
        item.automationStatus || "",
        Array.isArray(item.tags) ? item.tags.join(";") : "",
        `"${String(item.description || "").replace(/"/g, '""')}"`,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `test-cases-${selectedFolder?.name || "folder"}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleCreateVariable = async () => {
    if (!variableForm.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await createProjectVariable(orgSlug, projectId, variableForm);
      setVariableForm(INITIAL_VARIABLE_FORM);
      setIsVariableModalOpen(false);
      setVariables(await fetchProjectVariables(orgSlug, projectId));
    } catch (err) {
      setError(err?.message || "Failed to create variable");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVariable = async (id) => {
    setSaving(true);
    setError("");
    try {
      await deleteProjectVariable(orgSlug, projectId, id);
      setVariables(await fetchProjectVariables(orgSlug, projectId));
    } catch (err) {
      setError(err?.message || "Failed to delete variable");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSharedStep = async () => {
    if (!sharedStepForm.name.trim() || !sharedStepForm.action.trim() || !sharedStepForm.expectedResult.trim()) {
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createProjectSharedStep(orgSlug, projectId, sharedStepForm);
      setSharedStepForm(INITIAL_SHARED_STEP_FORM);
      setIsSharedStepModalOpen(false);
      setSharedSteps(await fetchProjectSharedSteps(orgSlug, projectId));
    } catch (err) {
      setError(err?.message || "Failed to create shared step");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSharedStep = async (id) => {
    setSaving(true);
    setError("");
    try {
      await deleteProjectSharedStep(orgSlug, projectId, id);
      setSharedSteps(await fetchProjectSharedSteps(orgSlug, projectId));
    } catch (err) {
      setError(err?.message || "Failed to delete shared step");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDocumentation = async () => {
    setSaving(true);
    setError("");
    try {
      const payloadDocumentation = buildDocumentationPayloadFromForm(documentationForm);
      const updated = await updateProjectDocumentation(orgSlug, projectId, payloadDocumentation);
      const storedDocumentation = updated?.documentation || payloadDocumentation;
      setDocumentation(storedDocumentation);
      setDocumentationForm(parseDocumentationFormFromPayload(storedDocumentation));
      setDocumentationDirty(false);
    } catch (err) {
      setError(err?.message || "Failed to save documentation");
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentationFieldChange = (field, value) => {
    setDocumentationForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setDocumentationDirty(true);
  };

  const applyDocumentationTemplate = (mode = "replace") => {
    if (mode === "append") {
      setDocumentationForm((prev) => ({
        ...prev,
        additionalNotes: prev.additionalNotes
          ? `${prev.additionalNotes}\n\n${DOCUMENTATION_TEMPLATE}`
          : DOCUMENTATION_TEMPLATE,
      }));
    } else {
      setDocumentationForm(createInitialDocumentationForm());
    }
    setDocumentationDirty(true);
  };

  const appendUploadedFilesToDocumentation = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    setDocUploadBusy(true);
    setError("");
    try {
      const unsupported = [];
      const importedBlocks = [];

      for (const file of files) {
        const extension = String(file?.name || "").split(".").pop()?.toLowerCase() || "";
        if (!SUPPORTED_DOC_UPLOAD_EXTENSIONS.includes(extension)) {
          unsupported.push(file.name);
          continue;
        }

        const text = await file.text();
        const normalized = String(text || "").trim();
        if (!normalized) continue;

        const clipped = normalized.slice(0, 20000);
        importedBlocks.push(
          [
            `### File: ${file.name}`,
            "```",
            clipped,
            "```",
          ].join("\n"),
        );
      }

      if (!importedBlocks.length) {
        if (unsupported.length) {
          setError(`Unsupported file type: ${unsupported.join(", ")}`);
        }
        return;
      }

      const merged = importedBlocks.join("\n\n");
      setDocumentationForm((prev) => ({
        ...prev,
        uploadedFilesData: prev.uploadedFilesData
          ? `${prev.uploadedFilesData}\n\n${merged}`
          : merged,
      }));
      setDocumentationDirty(true);

      if (unsupported.length) {
        setError(`Some files were skipped (unsupported type): ${unsupported.join(", ")}`);
      }
    } catch (err) {
      setError(err?.message || "Failed to read uploaded files");
    } finally {
      setDocUploadBusy(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await updateProjectSettings(orgSlug, projectId, settingsForm);
      setSettings((prev) => ({ ...(prev || {}), ...updated }));
    } catch (err) {
      setError(err?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const openCreateEnvironmentModal = () => {
    setEnvironmentModalMode("create");
    setEditingEnvironmentId("");
    setEnvForm(INITIAL_ENV_FORM);
    setEnvModalError("");
    setIsEnvironmentModalOpen(true);
  };

  const openEditEnvironmentModal = (environment) => {
    setEnvironmentModalMode("edit");
    setEditingEnvironmentId(String(environment?.id || ""));
    setEnvForm({
      name: String(environment?.name || ""),
      baseUrl: String(environment?.baseUrl || ""),
    });
    setEnvModalError("");
    setIsEnvironmentModalOpen(true);
  };

  const closeEnvironmentModal = () => {
    setEnvModalError("");
    setIsEnvironmentModalOpen(false);
    setEnvironmentModalMode("create");
    setEditingEnvironmentId("");
    setEnvForm(INITIAL_ENV_FORM);
  };

  const handleSaveEnvironment = async () => {
    if (!envForm.name.trim() || !envForm.baseUrl.trim()) {
      setEnvModalError("Environment name and Base URL are required.");
      return;
    }
    setSaving(true);
    setEnvModalError("");
    try {
      const slug = envForm.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (environmentModalMode === "edit") {
        await updateProjectEnvironment(orgSlug, projectId, {
          id: editingEnvironmentId,
          name: envForm.name.trim(),
          baseUrl: envForm.baseUrl.trim(),
          slug,
        });
      } else {
        await createProjectEnvironment(orgSlug, projectId, {
          ...envForm,
          slug,
          isDefault: false,
        });
      }
      closeEnvironmentModal();
      setSettings(await fetchProjectSettings(orgSlug, projectId));
    } catch (err) {
      const fallback = environmentModalMode === "edit" ? "Failed to update environment" : "Failed to create environment";
      setEnvModalError(toDisplayErrorMessage(err?.message, fallback));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEnvironment = async (id) => {
    setSaving(true);
    setError("");
    try {
      await deleteProjectEnvironment(orgSlug, projectId, id);
      setSettings(await fetchProjectSettings(orgSlug, projectId));
    } catch (err) {
      setError(err?.message || "Failed to delete environment");
    } finally {
      setSaving(false);
    }
  };

  const renderRepository = () => (
    <div className="flex h-full bg-[#F6F6F6] dark:bg-[#0f0f0f] overflow-hidden">
      <div
        className="min-w-[240px] max-w-[60vw] bg-card/95 backdrop-blur-sm flex flex-col"
        style={{ width: `${hierarchyWidth}px` }}
      >
        <div className="px-3 py-3 border-b border-black/10 dark:border-white/10">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm text-[#232323] dark:text-white inline-flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-[#FFAA00] text-[#232323] inline-flex items-center justify-center">
                  <Folder className="h-3.5 w-3.5" />
                </span>
                Test Folders
              </p>
              <p className="text-xs text-[#232323]/45 dark:text-white/45 mt-0.5">{folders.length} folders</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setMultiSelectMode((prev) => !prev);
                  if (multiSelectMode) {
                    setSelectedFolderIds([]);
                    setBulkFolderDeleteConfirm(false);
                  }
                }}
                className={`h-7 w-7 rounded-md border inline-flex items-center justify-center cursor-pointer ${
                  multiSelectMode
                    ? "border-[#FFAA00] bg-[#FFAA00]/15 text-[#FFAA00]"
                    : "border-border text-[#232323]/60 dark:text-white/60 hover:bg-[#232323]/5 dark:hover:bg-white/10"
                }`}
                title={multiSelectMode ? "Exit multi-select" : "Multi-select folders"}
              >
                <CheckSquare className="h-3.5 w-3.5" />
              </button>
              {/*<button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="h-7 w-7 rounded-md border border-border inline-flex items-center justify-center text-[#232323]/60 dark:text-white/60 hover:bg-[#232323]/5 dark:hover:bg-white/10 cursor-pointer"
                title="Import tests from file"
              >
                <Upload className="h-3.5 w-3.5" />
              </button>*/}
              <button
                type="button"
                onClick={() => openCreateFolderModal(selectedFolderId || "")}
                disabled={saving}
                className="h-7 w-7 rounded-md border border-border inline-flex items-center justify-center text-[#232323]/60 dark:text-white/60 hover:bg-[#232323]/5 dark:hover:bg-white/10 disabled:opacity-60 cursor-pointer"
                title="Create folder"
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </button>
              {/*<button
                type="button"
                onClick={() => loadRepositoryData(false)}
                disabled={saving}
                className="h-7 w-7 rounded-md border border-border inline-flex items-center justify-center text-[#232323]/60 dark:text-white/60 hover:bg-[#232323]/5 dark:hover:bg-white/10 disabled:opacity-60"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${saving ? "animate-spin" : ""}`} />
              </button>*/}
            </div>
          </div>

          <div className="mt-2 relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#232323]/35 dark:text-white/35" />
            <input
              value={folderSearch}
              onChange={(event) => setFolderSearch(event.target.value)}
              placeholder={t("tc.searchFolders")}
              className="w-full h-8 rounded-md border border-border bg-background pl-8 pr-2 text-xs"
            />
          </div>
        </div>

        <div
          className="px-2 py-2 flex-1 min-h-0 overflow-auto"
        >
          <div
            className={`mb-2 rounded-md border border-dashed px-2 py-1.5 text-[11px] transition-all duration-150 ${
              isRootDropActive
                ? "border-[#FFAA00] bg-[#FFAA00]/15 text-[#232323] dark:text-white scale-[1.01]"
                : "border-border bg-background/70 text-[#232323]/55 dark:text-white/55"
            }`}
            onDragEnter={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsRootDropActive(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (!isRootDropActive) {
                setIsRootDropActive(true);
              }
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsRootDropActive(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsRootDropActive(false);
              const sourceId = event.dataTransfer.getData("text/folder-id");
              const testCaseId = event.dataTransfer.getData("text/test-case-id");
              if (sourceId) {
                handleMoveFolder(sourceId, null);
              }
              if (testCaseId) {
                handleMoveTestCase(testCaseId, null);
              }
            }}
          >
            Drop here to move to root level
          </div>
          {loading ? (
            <p className="text-xs px-2 py-2 text-[#232323]/50 dark:text-white/50">Loading folders...</p>
          ) : !folderTree.length ? (
            <div className="h-[320px] flex flex-col items-center justify-center text-center px-4">
              <Folder className="h-10 w-10 text-[#232323]/20 dark:text-white/20" />
              <p className="mt-3 text-xl font-semibold text-[#232323]/35 dark:text-white/35">{t("tc.noFolders")}</p>
              <p className="mt-2 text-xs text-[#232323]/50 dark:text-white/50">
                Click the + button to create your first root folder.
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {folderTree.map((node) => (
                <FolderNode
                  key={node.id}
                  node={node}
                  level={0}
                  selectedFolderId={selectedFolderId}
                  highlightedFolderIds={highlightedFolderIds}
                  onSelect={setSelectedFolderId}
                  onCreateChild={(folder) => openCreateFolderModal(folder.id)}
                  onEdit={openEditFolderModal}
                  onDelete={setFolderToDelete}
                  onDropMoveFolder={handleMoveFolder}
                  onDropMoveTestCase={handleMoveTestCase}
                  onDragStart={() => {}}
                  multiSelectMode={multiSelectMode}
                  selectedFolderIds={selectedFolderIds}
                  onToggleSelect={toggleFolderSelect}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bulk action bar */}
        {multiSelectMode ? (
          <div className="px-3 py-2 border-t border-black/10 dark:border-white/10 bg-[#FFAA00]/5 dark:bg-[#FFAA00]/10">
            {selectedFolderIds.length > 0 ? (
              bulkFolderDeleteConfirm ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-red-700 dark:text-red-300">
                    Delete {selectedFolderIds.length} folder{selectedFolderIds.length !== 1 ? "s" : ""} and all their contents? This cannot be undone.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        confirmBulkDeleteFolders();
                        setBulkFolderDeleteConfirm(false);
                      }}
                      disabled={bulkDeleting}
                      className="h-7 px-3 rounded-md bg-red-500 hover:bg-red-600 text-white text-xs font-semibold disabled:opacity-60 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                      {bulkDeleting ? "Deleting..." : "Confirm Delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkFolderDeleteConfirm(false)}
                      className="h-7 px-3 rounded-md border border-black/15 dark:border-white/15 text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-[#232323]/70 dark:text-white/70">
                    {selectedFolderIds.length} folder{selectedFolderIds.length !== 1 ? "s" : ""} selected
                  </p>
                  <button
                    type="button"
                    onClick={() => setBulkFolderDeleteConfirm(true)}
                    className="h-7 px-3 rounded-md bg-red-500 hover:bg-red-600 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete Selected
                  </button>
                </div>
              )
            ) : (
              <p className="text-xs text-[#232323]/50 dark:text-white/50">
                Click folders to select them for bulk deletion
              </p>
            )}
          </div>
        ) : null}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        onMouseDown={startHierarchyResize}
        className={`relative w-2 cursor-col-resize group ${isHierarchyResizing ? "bg-[#FFAA00]/20" : "bg-transparent hover:bg-[#FFAA00]/10"}`}
      >
        <div
          className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-px transition-colors ${
            isHierarchyResizing
              ? "bg-[#FFAA00]"
              : "bg-black/10 dark:bg-white/15 group-hover:bg-[#FFAA00]/70"
          }`}
        />
      </div>

      <div className="flex-1 min-w-0 relative bg-card overflow-hidden">
        {!selectedFolder ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <div className="h-14 w-14 rounded-xl bg-[#232323]/5 dark:bg-white/5 inline-flex items-center justify-center">
              <Folder className="h-8 w-8 text-[#232323]/25 dark:text-white/25" />
            </div>
            <p className="mt-6 text-3xl font-semibold text-[#232323] dark:text-white">{t("tc.selectFolder")}</p>
            <p className="mt-2 text-sm text-[#232323]/45 dark:text-white/45 max-w-xl">
              {t("tc.selectFolderDesc")}
            </p>
            <br></br>
            <button
              type="button"
              onClick={openGenerateModal}
              className="group relative bg-gradient-to-r from-[#FFAA00] to-[#ff8c00] hover:from-[#FFB833] hover:to-[#FFAA00] text-[#232323] text-xs font-bold h-8 px-4 rounded-lg inline-flex items-center gap-2 shadow-[0_2px_8px_rgba(255,170,0,0.3)] hover:shadow-[0_4px_16px_rgba(255,170,0,0.4)] transition-all cursor-pointer"
            >
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Functional Test Generator
              </span>
            </button>
            {/*<p className="mt-2 text-xs text-[#232323]/55 dark:text-white/55">
              {aiQuota?.isUnlimited
                ? "AI Remaining: Unlimited"
                : aiQuota
                  ? aiQuota.remaining <= 0 && aiQuota.hasCouponCredits
                    ? `Credits: ${aiQuota.couponRemainingUsd.toFixed(2)}`
                    : `AI Remaining: ${Math.max(0, Number(aiQuota.remaining || 0))}`
                    : "AI Remaining: --"}
            </p>*/}
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="border-b border-border px-5 py-4 bg-card">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-base font-semibold text-[#232323] dark:text-white">
                    {selectedFolder.name || selectedFolder.path || "Folder"}
                  </p>
                  <p className="text-xs text-[#232323]/50 dark:text-white/50">
                    {selectedFolderCases.length} test case{selectedFolderCases.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/*<div className="h-8 px-2.5 rounded-md border border-border text-xs font-semibold inline-flex items-center text-[#232323]/70 dark:text-white/70">
                    {aiQuota
                      ? aiQuota.hasCouponCredits
                        ? `Credits: $${aiQuota.couponRemainingUsd.toFixed(2)}`
                        : "No Credits"
                      : "Credits: --"}
                  </div>*/}
                  {selectedTestCaseIds.length > 0 ? (
                    <>
                      <button
                        type="button"
                        onClick={exportSelectedTestCases}
                        className="h-8 px-3 rounded-md border border-border text-xs font-semibold cursor-pointer"
                      >
                        Export ({selectedTestCaseIds.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkDeleteOpen(true)}
                        className="h-8 px-3 rounded-md bg-red-500/90 text-white text-xs font-semibold cursor-pointer"
                      >
                        Delete Selected
                      </button>
                    </>
                  ) : null}
                  {/*<button
                    type="button"
                    onClick={openGenerateModal}
                    className="h-8 px-3 rounded-md border border-[#FFAA00]/40 bg-[#FFAA00]/10 hover:bg-[#FFAA00]/15 text-[#232323] dark:text-white text-xs font-semibold"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      Functional Agent
                    </span>
                  </button>*/}
                  <button
                    type="button"
                    onClick={openCreateTestCaseModal}
                    disabled={saving}
                    className="h-8 px-4 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold disabled:opacity-60 cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Plus className="h-3.5 w-3.5" />
                      Create Test Case
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-64">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#232323]/35 dark:text-white/35" />
                  <input
                    value={testCaseSearch}
                    onChange={(event) => setTestCaseSearch(event.target.value)}
                    placeholder={t("tc.searchTestCases")}
                    className="w-full h-8 rounded-md border border-border bg-background pl-8 pr-2 text-xs"
                  />
                </div>

                <div className="inline-flex items-center gap-1 rounded-md border border-border bg-background p-1">
                  <Filter className="h-3.5 w-3.5 text-[#232323]/45 dark:text-white/45 mx-1" />
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setTestCaseStatusFilter(option)}
                      className={`h-6 px-2 rounded text-[11px] font-medium ${
                        testCaseStatusFilter === option
                          ? "bg-[#FFAA00]/20 text-[#232323] dark:text-white"
                          : "text-[#232323]/60 dark:text-white/60 hover:bg-[#232323]/5 dark:hover:bg-white/10 cursor-pointer"
                      }`}
                    >
                      {option === "all" ? "All" : option.replace("InReview", "In Review")}
                    </button>
                  ))}
                </div>

                <select
                  value={testCaseSort}
                  onChange={(event) => setTestCaseSort(event.target.value)}
                  className="ui-select h-8 rounded-md border border-border bg-background px-2 text-xs cursor-pointer"
                >
                  <option value="updated">{t("tc.sortLastUpdated")}</option>
                  <option value="title">{t("tc.sortTitle")}</option>
                  <option value="priority">{t("tc.sortPriority")}</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-card">
              {!filteredFolderCases.length ? (
                <div className="h-full flex items-center justify-center text-sm text-[#232323]/55 dark:text-white/55">
                  {t("tc.noTestCasesMatch")}
                </div>
              ) : (
                <table className="w-full table-fixed text-sm">
                  <thead className="bg-card sticky top-0 z-10">
                    <tr className="border-b border-border">
                      <th className="w-10 px-2 py-2 text-left">
                        <button
                          type="button"
                          onClick={toggleSelectAllTestCases}
                          className="inline-flex items-center justify-center cursor-pointer"
                        >
                          {allSelected ? (
                            <CheckSquare className="h-4 w-4 text-[#FFAA00]" />
                          ) : (
                            <Square className="h-4 w-4 text-[#232323]/40 dark:text-white/40" />
                          )}
                        </button>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#232323]/60 dark:text-white/60">{t("common.title")}</th>
                      <th className="w-[80px] px-3 py-2 text-left text-xs font-semibold text-[#232323]/60 dark:text-white/60">{t("tc.priority")}</th>
                      <th className="w-[90px] px-3 py-2 text-left text-xs font-semibold text-[#232323]/60 dark:text-white/60">{t("tc.type")}</th>
                      <th className="w-[110px] px-3 py-2 text-right text-xs font-semibold text-[#232323]/60 dark:text-white/60">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFolderCases.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-border bg-card hover:bg-[#FFFAE6] dark:hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => openEditTestCase(item)}
                      >
                        <td className="px-2 py-2 align-top">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleSelectOneTestCase(item.id);
                            }}
                            className="inline-flex items-center justify-center"
                          >
                            {selectedTestCaseIds.includes(String(item.id)) ? (
                              <CheckSquare className="h-4 w-4 text-[#FFAA00]" />
                            ) : (
                              <Square className="h-4 w-4 text-[#232323]/40 dark:text-white/40" />
                            )}
                          </button>
                        </td>
                        <td className="px-3 py-2 overflow-hidden cursor-pointer">
                          <button
                            type="button"
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.setData("text/test-case-id", String(item.id));
                            }}
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditTestCase(item);
                            }}
                            className="w-full text-left min-w-0 cursor-pointer"
                          >
                            <p className="font-medium text-[#232323] dark:text-white truncate">{item.title || item.name}</p>
                            <p className="text-xs text-[#232323]/50 dark:text-white/50 truncate">{item.description || "No description"}</p>
                          </button>
                        </td>
                        <td className="px-3 py-2 align-top text-xs text-[#232323]/70 dark:text-white/70">
                          {PRIORITY_LABELS[Number(item.priority ?? 1)] || "Medium"}
                        </td>
                        <td className="px-3 py-2 align-top text-xs text-[#232323]/70 dark:text-white/70">
                          {item.testCaseType || "Functional"}
                        </td>
                        <td className="px-3 py-2 align-top text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openEditTestCase(item);
                              }}
                              className="h-7 w-7 rounded-md border border-border inline-flex items-center justify-center cursor-pointer"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleCloneTestCase(item);
                              }}
                              className="h-7 w-7 rounded-md border border-border inline-flex items-center justify-center cursor-pointer"
                              title="Clone"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setDeletingTestCase(item);
                              }}
                              className="h-7 w-7 rounded-md border border-red-400/50 text-red-500 inline-flex items-center justify-center cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderVariables = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#232323] dark:text-white">{t("tc.projectVariables")}</p>
        <button
          type="button"
          onClick={() => setIsVariableModalOpen(true)}
          className="h-8 px-3 rounded-md bg-[#FFAA00] text-[#232323] text-xs font-semibold cursor-pointer"
        >
          {t("tc.addVariable")}
        </button>
      </div>
      <div className="rounded-md border border-border bg-card divide-y divide-border">
        {variables.length === 0 ? (
          <p className="p-3 text-sm text-[#232323]/60 dark:text-white/60">{t("tc.noVariables")}</p>
        ) : (
          variables.map((item) => (
            <div key={item.id} className="p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#232323] dark:text-white truncate">{item.name}</p>
                <p className="text-xs text-[#232323]/60 dark:text-white/60 truncate">{item.value}</p>
                {item.description ? (
                  <p className="text-xs text-[#232323]/45 dark:text-white/45 truncate">{item.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => handleDeleteVariable(item.id)}
                className="h-7 w-7 rounded-md border border-red-400/50 text-red-500 inline-flex items-center justify-center cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderSharedSteps = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#232323] dark:text-white">{t("tc.tabs.sharedSteps")}</p>
        <button
          type="button"
          onClick={() => setIsSharedStepModalOpen(true)}
          className="h-8 px-3 rounded-md bg-[#FFAA00] text-[#232323] text-xs font-semibold cursor-pointer"
        >
          {t("tc.addSharedStep")}
        </button>
      </div>
      <div className="rounded-md border border-border bg-card divide-y divide-border">
        {sharedSteps.length === 0 ? (
          <p className="p-3 text-sm text-[#232323]/60 dark:text-white/60">{t("tc.noSharedSteps")}</p>
        ) : (
          sharedSteps.map((step) => (
            <div key={step.id} className="p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#232323] dark:text-white">{step.name}</p>
                <p className="text-xs text-[#232323]/60 dark:text-white/60 mt-1">{step.action}</p>
                <p className="text-xs text-[#232323]/60 dark:text-white/60">Expected: {step.expectedResult}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteSharedStep(step.id)}
                className="h-7 w-7 rounded-md border border-red-400/50 text-red-500 inline-flex items-center justify-center cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderDocumentation = () => (
    <div className="p-3 flex-1 min-h-0 flex flex-col space-y-3 overflow-hidden">
      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-card/95 shadow-[0_8px_30px_rgba(0,0,0,0.08)] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#232323] dark:text-white">{t("tc.projectDocumentation")}</p>
          <p className="text-xs text-[#232323]/60 dark:text-white/60">{t("tc.projectDocDesc")}</p>
        </div>
        <div className="inline-flex items-center gap-2">
          <span className={`text-[11px] ${documentationDirty ? "text-[#FFAA00]" : "text-[#232323]/55 dark:text-white/55"}`}>
            {documentationDirty ? "Unsaved changes" : "Saved"}
          </span>
          <button
            type="button"
            onClick={() => applyDocumentationTemplate("replace")}
            disabled={saving || docUploadBusy}
            className="h-9 px-3 rounded-md border border-border text-xs font-semibold text-[#232323] dark:text-white disabled:opacity-60 cursor-pointer"
          >
            Reset Template
          </button>
          <button
            type="button"
            onClick={handleSaveDocumentation}
            disabled={saving || docUploadBusy}
            className="h-9 px-4 rounded-md bg-[#FFAA00] text-[#232323] text-xs font-semibold disabled:opacity-60 cursor-pointer"
          >
            Save Documentation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
        <div className="xl:col-span-9 space-y-3 overflow-auto pr-1">
          <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-card p-4 space-y-3 shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
            <p className="text-sm font-semibold text-[#232323] dark:text-white">1. Project Overview</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={documentationForm.projectName} onChange={(event) => handleDocumentationFieldChange("projectName", event.target.value)} placeholder="Project name" className="h-9 rounded-md border border-border bg-background px-3 text-sm" />
              <input value={documentationForm.primaryDomain} onChange={(event) => handleDocumentationFieldChange("primaryDomain", event.target.value)} placeholder="Primary domain / module" className="h-9 rounded-md border border-border bg-background px-3 text-sm" />
              <input value={documentationForm.productOwner} onChange={(event) => handleDocumentationFieldChange("productOwner", event.target.value)} placeholder="Product owner" className="h-9 rounded-md border border-border bg-background px-3 text-sm" />
              <input value={documentationForm.qaOwner} onChange={(event) => handleDocumentationFieldChange("qaOwner", event.target.value)} placeholder="QA owner" className="h-9 rounded-md border border-border bg-background px-3 text-sm" />
            </div>
          </section>

          <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-card p-4 space-y-3 shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
            <p className="text-sm font-semibold text-[#232323] dark:text-white">2. Business Scope</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <textarea value={documentationForm.coreBusinessGoals} onChange={(event) => handleDocumentationFieldChange("coreBusinessGoals", event.target.value)} rows={3} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Core business goals" />
              <textarea value={documentationForm.inScopeFeatures} onChange={(event) => handleDocumentationFieldChange("inScopeFeatures", event.target.value)} rows={3} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="In-scope features" />
              <textarea value={documentationForm.outOfScopeFeatures} onChange={(event) => handleDocumentationFieldChange("outOfScopeFeatures", event.target.value)} rows={3} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Out-of-scope features" />
            </div>
          </section>

          {/*<section className="rounded-2xl border border-black/10 dark:border-white/10 bg-card p-4 space-y-3 shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
            <p className="text-sm font-semibold text-[#232323] dark:text-white">3. Architecture & Integrations</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <textarea value={documentationForm.frontendStack} onChange={(event) => handleDocumentationFieldChange("frontendStack", event.target.value)} rows={2} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Frontend stack" />
              <textarea value={documentationForm.backendStack} onChange={(event) => handleDocumentationFieldChange("backendStack", event.target.value)} rows={2} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Backend stack" />
              <textarea value={documentationForm.database} onChange={(event) => handleDocumentationFieldChange("database", event.target.value)} rows={2} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Database details" />
              <textarea value={documentationForm.externalApis} onChange={(event) => handleDocumentationFieldChange("externalApis", event.target.value)} rows={2} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="External APIs / services" />
            </div>
          </section>*/}

          {/*<section className="rounded-2xl border border-black/10 dark:border-white/10 bg-card p-4 space-y-3 shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
            <p className="text-sm font-semibold text-[#232323] dark:text-white">4. Component Localization Map</p>
            <textarea value={documentationForm.componentsMap} onChange={(event) => handleDocumentationFieldChange("componentsMap", event.target.value)} rows={8} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="For each component: location, route, entry point, roles, validations, success/error criteria" />
          </section>*/}
        </div>

        <aside className="xl:col-span-3 rounded-2xl border border-black/10 dark:border-white/10 bg-card p-4 space-y-3 h-full overflow-auto shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
          <p className="text-sm font-semibold text-[#232323] dark:text-white">Upload Reference Files</p>
          <p className="text-xs text-[#232323]/60 dark:text-white/60">
            Import text-based files to enrich AI context with concrete business and technical data.
          </p>
          <label
            htmlFor="documentation-files-input"
            className="h-9 px-3 rounded-md border border-border inline-flex items-center gap-2 text-xs font-semibold text-[#232323] dark:text-white cursor-pointer hover:bg-[#232323]/5 dark:hover:bg-white/10"
          >
            <Upload className="h-3.5 w-3.5" />
            {docUploadBusy ? "Reading files..." : "Upload Files"}
          </label>
          <input
            id="documentation-files-input"
            type="file"
            multiple
            accept=".txt,.md,.markdown,.json,.csv,.yaml,.yml,.xml,.html,.htm,.log"
            onChange={appendUploadedFilesToDocumentation}
            disabled={docUploadBusy || saving}
            className="hidden"
          />
          <div className="rounded-xl border border-black/10 dark:border-white/10 bg-background/70 px-3 py-2">
            <p className="text-[11px] font-semibold text-[#232323]/70 dark:text-white/70 mb-2">Files List</p>
            {!uploadedFileNames.length ? (
              <p className="text-xs text-[#232323]/50 dark:text-white/50">No files uploaded yet.</p>
            ) : (
              <ul className="space-y-1.5 max-h-[16rem] overflow-auto pr-1">
                {uploadedFileNames.map((name, index) => (
                  <li
                    key={`${name}-${index}`}
                    className="rounded-lg border border-black/10 dark:border-white/10 bg-card/80 px-2.5 py-1.5 text-xs text-[#232323]/85 dark:text-white/85"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="text-[11px] text-[#232323]/55 dark:text-white/55 leading-relaxed">
            Supported: TXT, MD, JSON, CSV, YAML, XML, HTML, LOG.
          </p>
        </aside>
      </div>
    </div>
  );

  const renderConfiguration = () => (
    <div className="p-4 md:p-5 space-y-5">
      <div className="rounded-xl border border-black/10 dark:border-white/10 bg-card/80 p-4 space-y-4">
        <div>
          <p className="text-sm font-semibold text-[#232323] dark:text-white">{t("tc.projectSettings")}</p>
          <p className="text-xs text-[#232323]/60 dark:text-white/60 mt-1">{t("tc.projectSettingsDesc")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#232323]/60 dark:text-white/60">{t("tc.projectName")}</span>
            <input
              value={settingsForm.name}
              onChange={(event) => setSettingsForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Project name"
              className="h-9 rounded-md border border-border bg-background px-3 text-sm w-full"
            />
          </label>
        </div>

        <label className="space-y-1 block">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#232323]/60 dark:text-white/60">{t("common.description")}</span>
          <input
            value={settingsForm.description}
            onChange={(event) => setSettingsForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Short project description"
            className="h-9 rounded-md border border-border bg-background px-3 text-sm w-full"
          />
        </label>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="h-9 px-4 rounded-md bg-[#FFAA00] text-[#232323] text-xs font-semibold disabled:opacity-60 cursor-pointer"
          >
            {t("tc.saveSettings")}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-black/10 dark:border-white/10 bg-card/80 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-[#232323] dark:text-white">{t("tc.environments")}</p>
            <p className="text-xs text-[#232323]/60 dark:text-white/60 mt-1">{t("tc.environmentsDesc")}</p>
          </div>
          <button
            type="button"
            onClick={openCreateEnvironmentModal}
            className="h-8 px-3 rounded-md border border-border text-xs font-semibold text-[#232323] dark:text-white inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("tc.addEnvironment")}
          </button>
        </div>

        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {!(settings?.environments || []).length ? (
            <div className="p-4 text-center">
              <p className="text-sm text-[#232323]/60 dark:text-white/60">{t("tc.noEnvironments")}</p>
            </div>
          ) : (
            settings.environments.map((env) => (
              <div key={env.id} className="p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#232323] dark:text-white truncate">{env.name}</p>
                  <p className="text-xs text-[#232323]/60 dark:text-white/60 mt-0.5 truncate">{env.baseUrl}</p>
                </div>
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditEnvironmentModal(env)}
                    className="h-7 w-7 rounded-md border border-border text-[#232323]/70 dark:text-white/70 inline-flex items-center justify-center cursor-pointer"
                    title="Edit environment"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEnvironment(env.id)}
                    className="h-7 w-7 rounded-md border border-red-400/50 text-red-500 inline-flex items-center justify-center cursor-pointer"
                    title="Delete environment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="bg-card/95 overflow-hidden transition-all duration-200 flex-1 min-h-0 flex flex-col [&_input]:rounded-lg [&_input]:border-black/15 dark:[&_input]:border-white/15 [&_input]:bg-background/80 [&_input]:shadow-[0_1px_2px_rgba(0,0,0,0.04)] [&_input]:transition-all [&_input]:duration-200 [&_input:focus]:ring-2 [&_input:focus]:ring-[#FFAA00]/35 [&_input:focus]:border-[#FFAA00]/55 [&_select]:rounded-lg [&_select]:border-black/15 dark:[&_select]:border-white/15 [&_select]:bg-background/80 [&_select]:shadow-[0_1px_2px_rgba(0,0,0,0.04)] [&_select]:transition-all [&_select:focus]:ring-2 [&_select:focus]:ring-[#FFAA00]/35 [&_select:focus]:border-[#FFAA00]/55 [&_textarea]:rounded-lg [&_textarea]:border-black/15 dark:[&_textarea]:border-white/15 [&_textarea]:bg-background/80 [&_textarea]:shadow-[0_1px_2px_rgba(0,0,0,0.04)] [&_textarea]:transition-all [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-[#FFAA00]/35 [&_textarea:focus]:border-[#FFAA00]/55 [&_table]:border-separate [&_table]:border-spacing-0 [&_thead]:bg-card dark:[&_thead]:bg-card [&_th]:border-black/10 dark:[&_th]:border-white/10 [&_td]:border-black/5 dark:[&_td]:border-white/10 [&_.rounded-md.border]:border-black/15 dark:[&_.rounded-md.border]:border-white/15 [&_.rounded-md.border]:shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="border-b border-black/10 dark:border-white/10 px-4 py-3 flex items-center gap-3 bg-gradient-to-r from-card via-card to-card/90">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/${orgSlug}/execution/tests`)}
            className="h-8 w-8 rounded-md border border-border inline-flex items-center justify-center text-[#232323]/70 dark:text-white/70 hover:bg-[#232323]/5 dark:hover:bg-white/10 cursor-pointer "
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-[#232323] dark:text-white truncate inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#FFAA00]" />
              {loading ? t("tc.loadingProject") : project?.name || t("tc.project")}
            </p>
          </div>
        </div>

        <div className="border-b border-black/10 dark:border-white/10 px-4 h-9 flex items-center gap-6 text-xs text-[#232323]/60 dark:text-white/60 bg-card/70">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`h-full inline-flex items-center gap-1 cursor-pointer ${
                activeTab === tab.key
                  ? "border-b-2 border-[#FFAA00] text-[#FFAA00]"
                  : "hover:text-[#232323] dark:hover:text-white"
              }`}
            >
              {tab.key === "repository" ? <BookOpenText className="h-3.5 w-3.5" /> : null}
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mx-4 mt-3 rounded-lg border border-red-300/50 bg-red-50 dark:bg-red-950/20 px-4 py-3 inline-flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{toDisplayErrorMessage(error, "An error occurred")}</span>
          </div>
        ) : null}

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {activeTab === "repository" && renderRepository()}
          {activeTab === "variables" && <div className="flex-1 min-h-0 overflow-auto">{renderVariables()}</div>}
          {activeTab === "shared-steps" && <div className="flex-1 min-h-0 overflow-auto">{renderSharedSteps()}</div>}
          {activeTab === "documentation" && renderDocumentation()}
          {activeTab === "configuration" && <div className="flex-1 min-h-0 overflow-auto">{renderConfiguration()}</div>}
        </div>
      </div>

      <Popup
        open={isGenerateModalOpen}
        title={t("tc.aiAssistant")}
        onClose={closeGenerateModal}
        maxWidth="max-w-[min(96vw,1400px)]"
        headerActions={
          <div className="inline-flex items-center gap-2">
            {isAiGenerating ? (
              <button
                type="button"
                onClick={cancelGenerateTests}
                className="h-8 px-3 rounded-lg border border-red-400/40 bg-red-500/10 text-red-600 dark:text-red-300 text-xs font-semibold hover:bg-red-500/20 transition-colors cursor-pointer"
              >
                Cancel Generation
              </button>
            ) : null}
          </div>
        }
      >
        <div className="h-[72dvh] min-h-[620px] grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-4 rounded-xl border border-black/8 dark:border-white/8 bg-card flex flex-col min-h-0 overflow-hidden">
            <div className="p-3 border-b border-black/6 dark:border-white/6 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-[#232323]/60 dark:text-white/60 uppercase tracking-wider inline-flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
              </p>
              <div className="inline-flex items-center gap-1">
                {aiConversations.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAiConversations([]);
                      setSelectedAiConversationId("");
                      setAiError("");
                      setAiDraftPrompt("");
                    }}
                    className="h-7 px-2 rounded-md text-[11px] font-medium text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Clear all conversations"
                  >
                    Clear All
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={createNewGenerationDraft}
                  className="h-7 px-2.5 rounded-lg bg-[#FFAA00] text-xs font-semibold text-[#232323] dark:text-black hover:bg-[#FFAA00] transition-colors cursor-pointer"
                >
                  + New
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto p-2 space-y-1.5">
              {!aiConversations.length ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <MessageSquare className="h-8 w-8 text-[#232323]/15 dark:text-white/15 mb-2" />
                  <p className="text-xs text-[#232323]/50 dark:text-white/50">No conversations yet.</p>
                  <p className="text-[11px] text-[#232323]/35 dark:text-white/35 mt-1">Click "+ New" to start.</p>
                </div>
              ) : (
                aiConversations
                  .slice()
                  .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
                  .map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`group relative w-full text-left rounded-lg border px-3 py-2.5 transition-all cursor-pointer ${
                        selectedAiConversationId === conversation.id
                          ? "border-[#FFAA00]/50 bg-[#FFAA00]/8 shadow-sm"
                          : "border-transparent hover:border-black/8 dark:hover:border-white/8 hover:bg-black/3 dark:hover:bg-white/3"
                      }`}
                      onClick={() => {
                        setSelectedAiConversationId(conversation.id);
                        setAiError("");
                      }}
                    >
                      <p className="text-sm font-medium text-[#232323] dark:text-white truncate pr-6">{conversation.title || "New Generation"}</p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className={`text-[11px] font-medium capitalize px-1.5 py-0.5 rounded ${
                          conversation.phase === "done" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                          conversation.phase === "generating" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                          "text-[#232323]/45 dark:text-white/45"
                        }`}>{conversation.phase || "idle"}</span>
                        <span className="text-[10px] text-[#232323]/40 dark:text-white/40">{formatAiTime(conversation.updatedAt)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAiConversations((prev) => prev.filter((c) => c.id !== conversation.id));
                          if (selectedAiConversationId === conversation.id) {
                            setSelectedAiConversationId("");
                          }
                        }}
                        className="absolute top-2 right-2 h-6 w-6 rounded-md inline-flex items-center justify-center text-[#232323]/30 dark:text-white/30 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Delete conversation"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>

          <div className="lg:col-span-8 rounded-xl border border-black/8 dark:border-white/8 bg-card flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-auto p-4 space-y-3">
              {!selectedAiConversation ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#FFAA00]/20 to-[#ff8c00]/10 inline-flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-[#FFAA00]" />
                  </div>
                  <p className="text-xl font-semibold text-[#232323] dark:text-white">Functional Test Case Generator</p>
                  <p className="mt-2 text-sm text-[#232323]/50 dark:text-white/50 max-w-lg leading-relaxed">
                    Describe what you want to test and your Agent will generate comprehensive test cases for you. Start a new generation or select one from the left.
                  </p>
                </div>
              ) : (
                <>
                  {(selectedAiConversation.messages || []).map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "ml-auto bg-[#FFAA00]/12 border border-[#FFAA00]/20"
                          : "mr-auto bg-black/3 dark:bg-white/5 border border-black/5 dark:border-white/8"
                      }`}
                    >
                      <p className={`text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${
                        message.role === "user" ? "text-[#FFAA00]" : "text-[#232323]/45 dark:text-white/45"
                      }`}>
                        {message.role === "user" ? "You" : "Functional Agent"}
                      </p>
                      <p className="text-sm text-[#232323] dark:text-white whitespace-pre-wrap leading-relaxed">{typeof message.content === "string" ? message.content : JSON.stringify(message.content)}</p>
                    </div>
                  ))}

                  {selectedAiConversation.phase === "generating" ? (() => {
                    const steps = Array.isArray(selectedAiConversation.steps) ? selectedAiConversation.steps : [];
                    const totalSteps = steps.length;
                    const doneSteps = steps.filter(s => s.status === "done").length;
                    const pct = totalSteps > 0 ? Math.min(95, Math.round((doneSteps / Math.max(totalSteps, 6)) * 100)) : 5;
                    const activeStep = steps.filter(s => s.status === "active").pop();
                    return (
                      <div className="rounded-2xl border border-blue-500/15 bg-gradient-to-br from-blue-500/5 to-purple-500/5 p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="inline-flex items-center gap-2.5">
                            <div className="relative">
                              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            </div>
                            <span className="text-sm font-semibold text-[#232323] dark:text-white">Generating test cases</span>
                          </div>
                          <span className="text-sm font-bold tabular-nums text-blue-600 dark:text-blue-400">{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#232323]/5 dark:bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite] transition-[width] duration-700 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {activeStep ? (
                          <div className="flex items-center gap-2 text-xs text-[#232323]/60 dark:text-white/60">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            {activeStep.label}
                          </div>
                        ) : null}
                        {totalSteps > 0 ? (
                          <div className="space-y-1.5 max-h-[140px] overflow-auto">
                            {steps.map((step) => (
                              <div key={step.id} className="flex items-center gap-2 text-xs">
                                {step.status === "done" ? (
                                  <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                                ) : step.status === "active" ? (
                                  <Loader2 className="h-3 w-3 text-blue-500 animate-spin shrink-0" />
                                ) : step.status === "error" ? (
                                  <XCircle className="h-3 w-3 text-red-500 shrink-0" />
                                ) : (
                                  <span className="h-3 w-3 rounded-full border border-[#232323]/15 dark:border-white/15 shrink-0" />
                                )}
                                <span className={step.status === "done" ? "text-[#232323]/50 dark:text-white/50" : step.status === "active" ? "text-[#232323] dark:text-white font-medium" : "text-[#232323]/35 dark:text-white/35"}>
                                  {step.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })() : null}

                  {selectedAiConversation.error ? (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3">
                      <div className="shrink-0 mt-0.5 h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-red-700 dark:text-red-300">Generation failed</p>
                        <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">{typeof selectedAiConversation.error === "string" ? selectedAiConversation.error : JSON.stringify(selectedAiConversation.error)}</p>
                      </div>
                    </div>
                  ) : null}

                  {Array.isArray(selectedAiConversation.generatedTests) && selectedAiConversation.generatedTests.length ? (
                    <div className="space-y-2">
                      <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3.5 text-sm text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Generated {selectedAiConversation.generatedTests.length} test case{selectedAiConversation.generatedTests.length !== 1 ? "s" : ""} successfully
                      </div>
                      <div className="max-h-[220px] overflow-auto rounded-xl border border-black/8 dark:border-white/8 divide-y divide-black/5 dark:divide-white/5">
                        {selectedAiConversation.generatedTests.map((testItem, index) => (
                          <div key={`${testItem.title || "test"}-${index}`} className="p-3">
                            <p className="text-sm font-semibold text-[#232323] dark:text-white inline-flex items-center gap-2">
                              <FileText className="h-3.5 w-3.5 text-[#232323]/55 dark:text-white/55" />
                              {testItem.title || `Test ${index + 1}`}
                            </p>
                            {testItem.description ? <p className="text-xs text-[#232323]/60 dark:text-white/60 mt-1">{testItem.description}</p> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <div className="border-t border-black/6 dark:border-white/6 p-3">
              {aiError ? (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2.5 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  <span className="text-xs text-red-600 dark:text-red-400">{typeof aiError === "string" ? aiError : JSON.stringify(aiError)}</span>
                </div>
              ) : null}
              <div className="relative">
                <textarea
                  value={aiDraftPrompt}
                  onChange={(event) => setAiDraftPrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey && !isAiGenerating && aiDraftPrompt.trim()) {
                      event.preventDefault();
                      submitGenerateTests();
                    }
                  }}
                  placeholder="What do you want to Generate?"
                  rows={2}
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-background/80 pl-4 pr-12 py-3 text-sm resize-none focus:ring-2 focus:ring-[#FFAA00]/30 focus:border-[#FFAA00]/50 transition-all"
                />
                <button
                  type="button"
                  onClick={submitGenerateTests}
                  disabled={isAiGenerating || !aiDraftPrompt.trim()}
                  className={`absolute right-2.5 bottom-6 h-8 w-8 rounded-lg inline-flex items-center justify-center transition-all ${
  aiDraftPrompt.trim() && !isAiGenerating
    ? "bg-[#FFAA00] hover:bg-[#e5a22e] text-[#232323] shadow-sm cursor-pointer"
    : "bg-black/5 dark:bg-white/5 text-[#232323]/25 dark:text-white/25 cursor-not-allowed"
}`}
                  title="Send"
                >
                  {isAiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Popup>

      <QuotaRequiredPopup
        open={quotaPopup.open}
        onClose={() => setQuotaPopup({ open: false, title: "", message: "" })}
        title={quotaPopup.title || "Quota Required"}
        message={quotaPopup.message || "This operation requires available quota for your organization."}
      />

      <Popup
        open={isFolderModalOpen}
        title={folderModalMode === "create" ? t("tc.createFolder") : t("tc.editFolder")}
        onClose={() => {
          setFolderModalError("");
          setIsFolderModalOpen(false);
        }}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          {folderModalError ? (
            <div className="rounded-md border border-red-300/50 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">
              {folderModalError}
            </div>
          ) : null}
          <div>
            <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-1">Folder Name</label>
            <input
              value={folderForm.name}
              onChange={(event) => {
                if (folderModalError) setFolderModalError("");
                setFolderForm((prev) => ({ ...prev, name: event.target.value }));
              }}
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
              placeholder="Folder name"
            />
          </div>
          <div>
            <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-1">Parent Folder</label>
            <select
              value={folderForm.parentId || ""}
              onChange={(event) => setFolderForm((prev) => ({ ...prev, parentId: event.target.value }))}
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="">Root</option>
              {Array.from(folderMap.values()).map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name || folder.path || folder.id}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={submitFolderModal}
            disabled={saving}
            className="w-full h-9 rounded-md bg-[#FFAA00] text-[#232323] text-xs font-semibold disabled:opacity-60 cursor-pointer"
          >
            {saving ? t("common.saving") : folderModalMode === "create" ? t("tc.createFolder") : t("tc.saveChanges")}
          </button>
        </div>
      </Popup>

      <Popup
        open={!!folderToDelete}
        title={t("tc.deleteFolder")}
        onClose={() => setFolderToDelete(null)}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#232323]/70 dark:text-white/70">
            Delete folder "{folderToDelete?.name || "Folder"}" and all child folders/test cases?
          </p>
          <button
            type="button"
            onClick={confirmDeleteFolder}
            disabled={saving}
            className="w-full h-9 rounded-md bg-red-500 text-white text-xs font-semibold disabled:opacity-60 cursor-pointer"
          >
            {saving ? t("common.deleting") : t("tc.deleteFolder")}
          </button>
        </div>
      </Popup>

      {/* Bulk Delete Confirmation — only opens after user clicks "Delete Selected" in the bottom bar */}
      <Popup
        open={bulkFolderDeleteConfirm && selectedFolderIds.length > 0}
        title={`Delete ${selectedFolderIds.length} Folder(s)`}
        onClose={() => setBulkFolderDeleteConfirm(false)}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#232323]/70 dark:text-white/70">
            Delete {selectedFolderIds.length} selected folder(s) and all their child folders/test cases? This action cannot be undone.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { confirmBulkDeleteFolders(); setBulkFolderDeleteConfirm(false); }}
              disabled={bulkDeleting}
              className="flex-1 h-9 rounded-md bg-red-500 text-white text-xs font-semibold disabled:opacity-60 cursor-pointer"
            >
              {bulkDeleting ? "Deleting..." : `Delete ${selectedFolderIds.length} Folder(s)`}
            </button>
            <button
              type="button"
              onClick={() => setBulkFolderDeleteConfirm(false)}
              className="h-9 px-4 rounded-md border border-border text-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </Popup>

      {/* Import Tests Modal */}
      <Popup
        open={isImportModalOpen}
        title={t("tc.importTestCases")}
        onClose={() => { setIsImportModalOpen(false); setImportFile(null); setImportMessage(null); }}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#232323]/70 dark:text-white/70">
            Upload a file to import test cases. Supports <strong>CSV</strong>, <strong>JSON</strong>, and <strong>XML</strong> formats (including Squash TM exports).
          </p>

          <div className="rounded-xl border-2 border-dashed border-border p-6 text-center">
            <Upload className="h-8 w-8 text-[#232323]/25 dark:text-white/25 mx-auto" />
            <p className="mt-2 text-sm text-[#232323]/60 dark:text-white/60">
              {importFile ? importFile.name : "Drop a file here or click to browse"}
            </p>
            <input
              type="file"
              accept=".csv,.json,.xml,.xlsx"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="mt-2 text-xs"
            />
          </div>

          {selectedFolder ? (
            <p className="text-xs text-[#232323]/50 dark:text-white/50">
              Importing into folder: <strong>{selectedFolder.name}</strong>
            </p>
          ) : (
            <p className="text-xs text-[#232323]/50 dark:text-white/50">
              Tests will be imported into auto-created folders based on file structure.
            </p>
          )}

          {importMessage ? (
            <div className={`rounded-lg p-3 text-sm ${
              importMessage.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
            }`}>
              {importMessage.text}
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleImportTests}
              disabled={importing || !importFile}
              className="flex-1 h-9 rounded-md bg-[#FFAA00] text-[#232323] text-xs font-semibold disabled:opacity-60 cursor-pointer"
            >
              {importing ? "Importing..." : "Import Tests"}
            </button>
            <button
              type="button"
              onClick={() => { setIsImportModalOpen(false); setImportFile(null); setImportMessage(null); }}
              className="h-9 px-4 rounded-md border border-border text-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-border p-3 space-y-2">
            <p className="text-xs font-semibold text-[#232323]/70 dark:text-white/70">Supported Formats</p>
            <ul className="text-xs text-[#232323]/55 dark:text-white/55 space-y-1">
              <li><strong>CSV:</strong> Headers: title, description, steps, expected, folder, priority, tags</li>
              <li><strong>JSON:</strong> Array of test cases or {"{"} folders: [{"{"} name, testCases: [...] {"}"}] {"}"}</li>
              <li><strong>XML:</strong> Squash TM export format (test-suite/test-case elements)</li>
            </ul>
          </div>
        </div>
      </Popup>

      <Popup
        open={moveDialog.isOpen}
        title={`Move ${moveDialog.itemType === "folder" ? "Folder" : "Test Case"}?`}
        onClose={() =>
          setMoveDialog({
            isOpen: false,
            itemType: "",
            itemId: "",
            targetFolderId: null,
            itemName: "",
            targetName: "",
          })
        }
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#232323]/70 dark:text-white/70">
            {moveDialog.targetFolderId === null
              ? `This will move "${moveDialog.itemName}" to the root level.`
              : `This will move "${moveDialog.itemName}" into the folder "${moveDialog.targetName}".`}
          </p>
          <button
            type="button"
            onClick={confirmMoveItem}
            disabled={saving}
            className="w-full h-9 rounded-md bg-[#FFAA00] text-[#232323] text-xs font-semibold disabled:opacity-60 cursor-pointer"
          >
            {saving ? "Moving..." : "Confirm Move"}
          </button>
        </div>
      </Popup>

      <Popup
        open={isCreateTestCaseModalOpen}
        title={t("tc.createTestCase")}
        onClose={() => setIsCreateTestCaseModalOpen(false)}
        maxWidth="max-w-5xl"
        headerActions={
          <button
            type="button"
            onClick={submitCreateTestCase}
            disabled={saving}
            className="h-9 px-4 rounded-lg bg-[#FFAA00] hover:bg-[#e5a22e] text-[#232323] text-sm font-semibold disabled:opacity-60 shadow-sm transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            {saving ? t("common.creating") : t("common.create")}
          </button>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center rounded-md border border-border bg-background p-1">
              <button
                type="button"
                onClick={() => setCreateMode("advanced")}
                className={`h-7 px-3 rounded text-xs font-semibold transition ${
                  createMode === "advanced" ? "bg-[#FFAA00]/20 text-[#232323] dark:text-white" : "text-[#232323]/60 dark:text-white/60 cursor-pointer"
                }`}
              >
                Advanced Mode
              </button>
              <button
                type="button"
                onClick={() => setCreateMode("simple")}
                className={`h-7 px-3 rounded text-xs font-semibold transition ${
                  createMode === "simple" ? "bg-[#FFAA00]/20 text-[#232323] dark:text-white" : "text-[#232323]/60 dark:text-white/60 cursor-pointer"
                }`}
              >
                Simple Mode
              </button>
            </div>
            <div className="text-xs text-[#232323]/50 dark:text-white/50">
              Use `$variable_name` in steps, or insert from Variables picker.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-1">Title</label>
                <input
                  value={testCaseForm.title}
                  onChange={(event) => setTestCaseForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Test case title"
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-1">Description</label>
                <textarea
                  value={testCaseForm.description}
                  onChange={(event) => setTestCaseForm((prev) => ({ ...prev, description: event.target.value }))}
                  rows={createMode === "advanced" ? 4 : 3}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-[#232323]/60 dark:text-white/60">Steps</label>
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSharedStepPickerMode("create");
                        setIsCreateSharedStepsPickerOpen(true);
                      }}
                      className="h-7 px-2.5 rounded-lg border border-black/10 dark:border-white/10 text-xs font-medium text-[#232323]/70 dark:text-white/70 hover:border-[#FFAA00]/40 hover:bg-[#FFAA00]/5 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ListChecks className="h-3 w-3" />
                      Shared Step
                    </button>
                    <button type="button" onClick={addStep} className="h-7 px-2.5 rounded-lg bg-[#FFAA00]/12 hover:bg-[#FFAA00]/20 text-xs font-medium text-[#232323] dark:text-white transition-colors inline-flex items-center gap-1 cursor-pointer">
                      <Plus className="h-3 w-3" />
                      Add Step
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {testCaseForm.steps.map((step, index) => (
                    <div key={step.id || `step-${index}`}>
                      <div
                        className={`rounded-xl border border-black/10 dark:border-white/10 shadow-sm p-3 bg-background/95 transition-all duration-300 ${
                          newlyInsertedStepId && newlyInsertedStepId === step.id ? "ring-1 ring-[#FFAA00] scale-[1.01]" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-[#232323]/70 dark:text-white/70 inline-flex items-center gap-1.5">
                            <span className="h-5 w-5 rounded-md bg-[#FFAA00]/15 text-[#FFAA00] inline-flex items-center justify-center text-[10px] font-bold">{index + 1}</span>
                            Step {index + 1}
                            {step.isSharedStep ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/15 text-blue-600 dark:text-blue-300">
                                Shared: {step.sharedStepName}
                              </span>
                            ) : null}
                          </p>
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveStep(index, -1)}
                              disabled={index === 0}
                              className="h-6 w-6 rounded-md inline-flex items-center justify-center text-[#232323]/50 dark:text-white/50 hover:bg-[#FFAA00]/10 hover:text-[#FFAA00] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#232323]/50 dark:disabled:hover:text-white/50 transition-colors cursor-pointer"
                              title="Move step up"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveStep(index, 1)}
                              disabled={index === testCaseForm.steps.length - 1}
                              className="h-6 w-6 rounded-md inline-flex items-center justify-center text-[#232323]/50 dark:text-white/50 hover:bg-[#FFAA00]/10 hover:text-[#FFAA00] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#232323]/50 dark:disabled:hover:text-white/50 transition-colors cursor-pointer"
                              title="Move step down"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openVariablePicker("create", step.id, "action")}
                              className="h-6 px-2 rounded-md border border-black/8 dark:border-white/8 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/8 transition-colors cursor-pointer"
                            >
                              {"$"} Var
                            </button>
                            {testCaseForm.steps.length > 1 ? (
                              <button type="button" onClick={() => removeStep(index)} className="h-6 w-6 rounded-md inline-flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer" title="Remove step">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            ) : null}
                          </div>
                        </div>

                        <textarea
                          value={step.action}
                          onChange={(event) => {
                            updateStep(index, "action", event.target.value);
                            handleVariableAutocompleteInput("create", step.id, "action", event.target.value, event.target.selectionStart);
                          }}
                          onClick={(event) =>
                            handleVariableAutocompleteInput("create", step.id, "action", event.target.value, event.target.selectionStart)
                          }
                          onKeyUp={(event) =>
                            handleVariableAutocompleteInput("create", step.id, "action", event.currentTarget.value, event.currentTarget.selectionStart)
                          }
                          onBlur={() => window.setTimeout(() => closeVariableAutocomplete(), 120)}
                          data-var-target={`create-${step.id}-action`}
                          rows={createMode === "advanced" ? 2 : 1}
                          placeholder="Action"
                          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm mb-2"
                        />
                        {variableAutocomplete.open && variableAutocomplete.mode === "create" && String(variableAutocomplete.stepKey) === String(step.id) && variableAutocomplete.field === "action" ? (
                          <div className="mb-2 rounded-md border border-blue-500/20 bg-background/95 shadow-sm max-h-40 overflow-auto">
                            {filteredVariableSuggestions.length ? (
                              filteredVariableSuggestions.slice(0, 8).map((item) => (
                                <button
                                  key={`create-action-var-${step.id}-${item.id || item.name}`}
                                  type="button"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => applyVariableAutocomplete(item.name)}
                                  className="w-full text-left px-3 py-2 text-xs hover:bg-blue-500/10 cursor-pointer"
                                >
                                  <span className="text-blue-600 dark:text-blue-300 font-semibold">${item.name}</span>
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-xs text-[#232323]/60 dark:text-white/60">No matching variable</div>
                            )}
                          </div>
                        ) : null}
                        <VariableValuePreview value={step.action} />
                        <textarea
                          value={step.expectedResult}
                          onChange={(event) => {
                            updateStep(index, "expectedResult", event.target.value);
                            handleVariableAutocompleteInput("create", step.id, "expectedResult", event.target.value, event.target.selectionStart);
                          }}
                          onClick={(event) =>
                            handleVariableAutocompleteInput("create", step.id, "expectedResult", event.target.value, event.target.selectionStart)
                          }
                          onKeyUp={(event) =>
                            handleVariableAutocompleteInput("create", step.id, "expectedResult", event.currentTarget.value, event.currentTarget.selectionStart)
                          }
                          onBlur={() => window.setTimeout(() => closeVariableAutocomplete(), 120)}
                          data-var-target={`create-${step.id}-expectedResult`}
                          rows={createMode === "advanced" ? 2 : 1}
                          placeholder="Expected result"
                          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                        />
                        {variableAutocomplete.open && variableAutocomplete.mode === "create" && String(variableAutocomplete.stepKey) === String(step.id) && variableAutocomplete.field === "expectedResult" ? (
                          <div className="mt-2 rounded-md border border-blue-500/20 bg-background/95 shadow-sm max-h-40 overflow-auto">
                            {filteredVariableSuggestions.length ? (
                              filteredVariableSuggestions.slice(0, 8).map((item) => (
                                <button
                                  key={`create-expected-var-${step.id}-${item.id || item.name}`}
                                  type="button"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => applyVariableAutocomplete(item.name)}
                                  className="w-full text-left px-3 py-2 text-xs hover:bg-blue-500/10 cursor-pointer"
                                >
                                  <span className="text-blue-600 dark:text-blue-300 font-semibold">${item.name}</span>
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-xs text-[#232323]/60 dark:text-white/60">No matching variable</div>
                            )}
                          </div>
                        ) : null}
                        <VariableValuePreview value={step.expectedResult} />
                      </div>

                      {index < testCaseForm.steps.length - 1 ? (
                        <div className="flex justify-center py-1">
                          <button
                            type="button"
                            onClick={() => insertStepAfter(index)}
                            className="h-6 px-2 rounded-full text-[11px] border border-dashed border-border text-[#232323]/60 dark:text-white/60 hover:border-[#FFAA00] hover:text-[#FFAA00] transition-all cursor-pointer"
                          >
                            + Insert Step Between
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {createMode === "advanced" ? (
              <div className="space-y-4 lg:sticky lg:top-0 self-start">
                <div>
                  <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-1">{t("tc.priority")}</label>
                  <select
                    value={testCaseForm.priority}
                    onChange={(event) => setTestCaseForm((prev) => ({ ...prev, priority: event.target.value }))}
                    className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-1">{t("tc.type")}</label>
                  <select
                    value={testCaseForm.testCaseType}
                    onChange={(event) => setTestCaseForm((prev) => ({ ...prev, testCaseType: event.target.value }))}
                    className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                  >
                    <option>Functional</option>
                    <option>Regression</option>
                    <option>Smoke</option>
                    <option>Integration</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-1">{t("tc.automation")}</label>
                  <select
                    value={testCaseForm.automationStatus}
                    onChange={(event) => setTestCaseForm((prev) => ({ ...prev, automationStatus: event.target.value }))}
                    className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                  >
                    <option>Not Automated</option>
                    <option>Automated</option>
                    <option>In Progress</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-1">{t("tc.tags")}</label>
                  <input
                    value={testCaseForm.tagsInput}
                    onChange={(event) => setTestCaseForm((prev) => ({ ...prev, tagsInput: event.target.value }))}
                    onKeyDown={(event) => {
                      if (event.key === " ") {
                        event.preventDefault();
                        addCreateTagFromInput();
                      }
                    }}
                    placeholder="login, checkout"
                    className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                  />
                  {Array.isArray(testCaseForm.tagsKeywords) && testCaseForm.tagsKeywords.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {testCaseForm.tagsKeywords.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-black/10 dark:border-white/15 px-2 py-0.5 text-xs text-[#232323]/80 dark:text-white/80 bg-background/80">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeCreateTag(tag)}
                            className="inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                            aria-label={`Remove ${tag}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

        </div>
      </Popup>

      <Popup
        open={isCreateSharedStepsPickerOpen}
        title={t("tc.addSharedStep")}
        onClose={() => setIsCreateSharedStepsPickerOpen(false)}
        maxWidth="max-w-2xl"
        zIndex="z-[60]"
      >
        <div className="space-y-3">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#232323]/35 dark:text-white/35" />
            <input
              value={createSharedStepsSearch}
              onChange={(event) => setCreateSharedStepsSearch(event.target.value)}
              placeholder={t("tc.searchSharedSteps")}
              className="w-full h-9 rounded-lg border border-black/10 dark:border-white/10 bg-background pl-9 pr-3 text-sm"
            />
          </div>
          {(() => {
            const filtered = (sharedSteps || []).filter((item) => {
              const term = createSharedStepsSearch.trim().toLowerCase();
              if (!term) return true;
              return (
                (item.name || "").toLowerCase().includes(term) ||
                (item.action || "").toLowerCase().includes(term) ||
                (item.expectedResult || "").toLowerCase().includes(term)
              );
            });
            if (!filtered.length) {
              return (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <ListChecks className="h-10 w-10 text-[#232323]/15 dark:text-white/15 mb-3" />
                  <p className="text-sm font-medium text-[#232323]/50 dark:text-white/50">
                    {(sharedSteps || []).length === 0 ? "No shared steps yet" : "No matching shared steps"}
                  </p>
                  <p className="text-xs text-[#232323]/35 dark:text-white/35 mt-1">
                    {(sharedSteps || []).length === 0
                      ? "Create shared steps in the Shared Steps tab first, then add them to test cases here."
                      : "Try a different search term."}
                  </p>
                </div>
              );
            }
            return (
              <div className="max-h-[360px] overflow-auto rounded-lg border border-black/8 dark:border-white/8 divide-y divide-black/5 dark:divide-white/5">
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      sharedStepPickerMode === "edit" ? addSharedStepToEditForm(item) : addSharedStepToCreateForm(item)
                    }
                    className="w-full text-left p-3 hover:bg-[#FFAA00]/5 transition-colors group cursor-pointer"
                  >
                    <p className="text-sm font-medium text-[#232323] dark:text-white group-hover:text-[#FFAA00] transition-colors">{item.name}</p>
                    <p className="text-xs text-[#232323]/55 dark:text-white/55 mt-1 truncate">Action: {item.action}</p>
                    <p className="text-xs text-[#232323]/55 dark:text-white/55 truncate">Expected: {item.expectedResult}</p>
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
      </Popup>

      <Popup
        open={isVariablePickerOpen}
        title={t("tc.insertVariable")}
        onClose={() => setIsVariablePickerOpen(false)}
        maxWidth="max-w-lg"
        zIndex="z-[60]"
      >
        <div className="space-y-3">
          <input
            value={variableSearch}
            onChange={(event) => setVariableSearch(event.target.value)}
            placeholder="Search variables"
            className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
          />
          <div className="max-h-[300px] overflow-auto rounded-md border border-border divide-y divide-border">
            {(variables || [])
              .filter((item) => {
                const term = variableSearch.trim().toLowerCase();
                if (!term) return true;
                return (
                  (item.name || "").toLowerCase().includes(term) ||
                  (item.value || "").toLowerCase().includes(term)
                );
              })
              .map((item) => (
                <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#232323] dark:text-white">${item.name}</p>
                    <p className="text-xs text-[#232323]/60 dark:text-white/60 truncate">{item.value}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => insertVariableIntoStep(item.name)}
                    className="h-7 px-2.5 rounded-md bg-[#FFAA00]/15 text-xs font-semibold "
                  >
                    Insert
                  </button>
                </div>
              ))}
          </div>
        </div>
      </Popup>

      <Popup
        open={!!editingTestCase}
        title={t("tc.editTestCase")}
        onClose={() => setEditingTestCase(null)}
        maxWidth="max-w-5xl"
        headerLeading={
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => navigateEditingTestCase(-1)}
              disabled={activeEditingIndex <= 0}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border text-[#232323]/70 dark:text-white/70 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Previous test case"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigateEditingTestCase(1)}
              disabled={activeEditingIndex < 0 || activeEditingIndex >= filteredFolderCases.length - 1}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border text-[#232323]/70 dark:text-white/70 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Next test case"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        }
        headerActions={
          <button
            type="button"
            onClick={submitEditTestCase}
            disabled={saving}
            className="h-9 px-4 rounded-lg bg-[#FFAA00] hover:bg-[#e5a22e] text-[#232323] text-sm font-semibold disabled:opacity-60 shadow-sm transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-1">Title</label>
              <input
                value={editingTestCase?.title || ""}
                onChange={(event) => setEditingTestCase((prev) => ({ ...(prev || {}), title: event.target.value }))}
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-1">Description</label>
              <textarea
                value={editingTestCase?.description || ""}
                onChange={(event) => setEditingTestCase((prev) => ({ ...(prev || {}), description: event.target.value }))}
                rows={4}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-[#232323]/60 dark:text-white/60">Steps</label>
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSharedStepPickerMode("edit");
                      setIsCreateSharedStepsPickerOpen(true);
                    }}
                    className="h-7 px-2.5 rounded-lg border border-black/10 dark:border-white/10 text-xs font-medium text-[#232323]/70 dark:text-white/70 hover:border-[#FFAA00]/40 hover:bg-[#FFAA00]/5 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ListChecks className="h-3 w-3" />
                    Shared Step
                  </button>
                  <button
                    type="button"
                    className="h-7 px-2.5 rounded-lg bg-[#FFAA00]/12 hover:bg-[#FFAA00]/20 text-xs font-medium text-[#232323] dark:text-white transition-colors inline-flex items-center gap-1 cursor-pointer"
                    onClick={() =>
                      setEditingTestCase((prev) => ({
                        ...(prev || {}),
                        steps: [...(prev?.steps || []), { action: "", expectedResult: "" }],
                      }))
                    }
                  >
                    <Plus className="h-3 w-3" />
                    Add Step
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {(editingTestCase?.steps || []).map((step, index) => (
                  <div key={`edit-step-${index}`}>
                    <div className="rounded-xl border border-black/10 dark:border-white/10 shadow-sm p-3 bg-background/95">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-[#232323]/70 dark:text-white/70 inline-flex items-center gap-1.5">
                          <span className="h-5 w-5 rounded-md bg-[#FFAA00]/15 text-[#FFAA00] inline-flex items-center justify-center text-[10px] font-bold">{index + 1}</span>
                          Step {index + 1}
                        </p>
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingTestCase((prev) => {
                                const steps = [...(prev?.steps || [])];
                                if (index === 0) return prev;
                                [steps[index - 1], steps[index]] = [steps[index], steps[index - 1]];
                                return { ...(prev || {}), steps };
                              })
                            }
                            disabled={index === 0}
                            className="h-6 w-6 rounded-md inline-flex items-center justify-center text-[#232323]/50 dark:text-white/50 hover:bg-[#FFAA00]/10 hover:text-[#FFAA00] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#232323]/50 dark:disabled:hover:text-white/50 transition-colors cursor-pointer"
                            title="Move step up"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingTestCase((prev) => {
                                const steps = [...(prev?.steps || [])];
                                if (index >= steps.length - 1) return prev;
                                [steps[index], steps[index + 1]] = [steps[index + 1], steps[index]];
                                return { ...(prev || {}), steps };
                              })
                            }
                            disabled={index >= (editingTestCase?.steps || []).length - 1}
                            className="h-6 w-6 rounded-md inline-flex items-center justify-center text-[#232323]/50 dark:text-white/50 hover:bg-[#FFAA00]/10 hover:text-[#FFAA00] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#232323]/50 dark:disabled:hover:text-white/50 transition-colors cursor-pointer"
                            title="Move step down"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openVariablePicker("edit", index, "action")}
                            className="h-6 px-2 rounded-md border border-black/8 dark:border-white/8 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/8 transition-colors cursor-pointer"
                          >
                            {"$"} Var
                          </button>
                          {(editingTestCase?.steps || []).length > 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setEditingTestCase((prev) => ({
                                  ...(prev || {}),
                                  steps: (prev?.steps || []).filter((_, stepIndex) => stepIndex !== index),
                                }))
                              }
                              className="h-6 w-6 rounded-md inline-flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Remove step"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <textarea
                        value={step.action || ""}
                        onChange={(event) =>
                          setEditingTestCase((prev) => ({
                            ...(prev || {}),
                            steps: (prev?.steps || []).map((item, stepIndex) =>
                              stepIndex === index ? { ...item, action: event.target.value } : item,
                            ),
                          }))
                        }
                        onClick={(event) =>
                          handleVariableAutocompleteInput("edit", index, "action", event.target.value, event.target.selectionStart)
                        }
                        onKeyUp={(event) =>
                          handleVariableAutocompleteInput("edit", index, "action", event.currentTarget.value, event.currentTarget.selectionStart)
                        }
                        onBlur={() => window.setTimeout(() => closeVariableAutocomplete(), 120)}
                        data-var-target={`edit-${index}-action`}
                        rows={2}
                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm mb-2"
                      />
                      {variableAutocomplete.open && variableAutocomplete.mode === "edit" && String(variableAutocomplete.stepKey) === String(index) && variableAutocomplete.field === "action" ? (
                        <div className="mb-2 rounded-md border border-blue-500/20 bg-background/95 shadow-sm max-h-40 overflow-auto">
                          {filteredVariableSuggestions.length ? (
                            filteredVariableSuggestions.slice(0, 8).map((item) => (
                              <button
                                key={`edit-action-var-${index}-${item.id || item.name}`}
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => applyVariableAutocomplete(item.name)}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-blue-500/10 cursor-pointer"
                              >
                                <span className="text-blue-600 dark:text-blue-300 font-semibold">${item.name}</span>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-xs text-[#232323]/60 dark:text-white/60">No matching variable</div>
                          )}
                        </div>
                      ) : null}
                      <VariableValuePreview value={step.action} />
                      <textarea
                        value={step.expectedResult || ""}
                        onChange={(event) =>
                          setEditingTestCase((prev) => ({
                            ...(prev || {}),
                            steps: (prev?.steps || []).map((item, stepIndex) =>
                              stepIndex === index ? { ...item, expectedResult: event.target.value } : item,
                            ),
                          }))
                        }
                        onClick={(event) =>
                          handleVariableAutocompleteInput("edit", index, "expectedResult", event.target.value, event.target.selectionStart)
                        }
                        onKeyUp={(event) =>
                          handleVariableAutocompleteInput("edit", index, "expectedResult", event.currentTarget.value, event.currentTarget.selectionStart)
                        }
                        onBlur={() => window.setTimeout(() => closeVariableAutocomplete(), 120)}
                        data-var-target={`edit-${index}-expectedResult`}
                        rows={2}
                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                      />
                      {variableAutocomplete.open && variableAutocomplete.mode === "edit" && String(variableAutocomplete.stepKey) === String(index) && variableAutocomplete.field === "expectedResult" ? (
                        <div className="mt-2 rounded-md border border-blue-500/20 bg-background/95 shadow-sm max-h-40 overflow-auto">
                          {filteredVariableSuggestions.length ? (
                            filteredVariableSuggestions.slice(0, 8).map((item) => (
                              <button
                                key={`edit-expected-var-${index}-${item.id || item.name}`}
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => applyVariableAutocomplete(item.name)}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-blue-500/10 cursor-pointer"
                              >
                                <span className="text-blue-600 dark:text-blue-300 font-semibold">${item.name}</span>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-xs text-[#232323]/60 dark:text-white/60">No matching variable</div>
                          )}
                        </div>
                      ) : null}
                      <VariableValuePreview value={step.expectedResult} />
                    </div>

                    {index < (editingTestCase?.steps || []).length - 1 ? (
                      <div className="flex justify-center py-1">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingTestCase((prev) => {
                              const currentSteps = prev?.steps || [];
                              const nextSteps = [...currentSteps];
                              nextSteps.splice(index + 1, 0, { action: "", expectedResult: "" });
                              return { ...(prev || {}), steps: nextSteps };
                            })
                          }
                          className="h-6 px-2 rounded-full text-[11px] border border-dashed border-border text-[#232323]/60 dark:text-white/60 hover:border-[#FFAA00] hover:text-[#FFAA00] transition-all cursor-pointer"
                        >
                          + Insert Step Between
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-0 self-start">
            <div>
              <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-1">Status</label>
              <select
                value={editingTestCase?.status || "Active"}
                onChange={(event) => setEditingTestCase((prev) => ({ ...(prev || {}), status: event.target.value }))}
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option>Active</option>
                <option>Draft</option>
                <option>InReview</option>
                <option>Outdated</option>
                <option>Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-1">Priority</label>
              <select
                value={String(editingTestCase?.priority ?? 1)}
                onChange={(event) =>
                  setEditingTestCase((prev) => ({ ...(prev || {}), priority: Number(event.target.value) }))
                }
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm "
              >
                <option value="0">Low</option>
                <option value="1">Medium</option>
                <option value="2">High</option>
                <option value="3">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-1">Type</label>
              <input
                value={editingTestCase?.testCaseType || ""}
                onChange={(event) =>
                  setEditingTestCase((prev) => ({ ...(prev || {}), testCaseType: event.target.value }))
                }
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-1">Automation</label>
              <input
                value={editingTestCase?.automationStatus || ""}
                onChange={(event) =>
                  setEditingTestCase((prev) => ({ ...(prev || {}), automationStatus: event.target.value }))
                }
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-1">Tags</label>
              <input
                value={editingTestCase?.tagsInput || ""}
                onChange={(event) => setEditingTestCase((prev) => ({ ...(prev || {}), tagsInput: event.target.value }))}
                onKeyDown={(event) => {
                  if (event.key === " ") {
                    event.preventDefault();
                    addEditTagFromInput();
                  }
                }}
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
              />
              {Array.isArray(editingTestCase?.tagsKeywords) && editingTestCase.tagsKeywords.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {editingTestCase.tagsKeywords.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-black/10 dark:border-white/15 px-2 py-0.5 text-xs text-[#232323]/80 dark:text-white/80 bg-background/80">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeEditTag(tag)}
                        className="inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                        aria-label={`Remove ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Popup>

      <Popup open={!!deletingTestCase} title={t("tc.deleteTestCase")} onClose={() => setDeletingTestCase(null)} maxWidth="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-[#232323]/70 dark:text-white/70">
            Delete "{deletingTestCase?.title || deletingTestCase?.name || "this test case"}"?
          </p>
          <button
            type="button"
            onClick={confirmDeleteTestCase}
            disabled={saving}
            className="w-full h-9 rounded-md bg-red-500 text-white text-xs font-semibold disabled:opacity-60 cursor-pointer"
          >
            {saving ? "Deleting..." : "Delete"}
          </button>
        </div>
      </Popup>

      <Popup open={bulkDeleteOpen} title="Delete Selected Test Cases" onClose={() => setBulkDeleteOpen(false)} maxWidth="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-[#232323]/70 dark:text-white/70">
            Delete {selectedTestCaseIds.length} selected test case{selectedTestCaseIds.length !== 1 ? "s" : ""}?
          </p>
          <button
            type="button"
            onClick={confirmBulkDelete}
            disabled={saving}
            className="w-full h-9 rounded-md bg-red-500 text-white text-xs font-semibold disabled:opacity-60 cursor-pointer"
          >
            {saving ? t("common.deleting") : t("tc.deleteSelected")}
          </button>
        </div>
      </Popup>

      <Popup open={isVariableModalOpen} title={t("tc.addVariable")} onClose={() => setIsVariableModalOpen(false)} maxWidth="max-w-lg">
        <div className="space-y-3">
          <input
            value={variableForm.name}
            onChange={(event) => setVariableForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Name"
            className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
          />
          <input
            value={variableForm.value}
            onChange={(event) => setVariableForm((prev) => ({ ...prev, value: event.target.value }))}
            placeholder="Value"
            className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
          />
          <input
            value={variableForm.description}
            onChange={(event) => setVariableForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Description"
            className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
          />
          <button
            type="button"
            onClick={handleCreateVariable}
            disabled={saving}
            className="w-full h-9 rounded-md bg-[#FFAA00] text-[#232323] text-xs font-semibold disabled:opacity-60 cursor-pointer"
          >
            Add Variable
          </button>
        </div>
      </Popup>

      <Popup open={isSharedStepModalOpen} title="Add Shared Step" onClose={() => setIsSharedStepModalOpen(false)} maxWidth="max-w-2xl">
        <div className="space-y-3">
          <input
            value={sharedStepForm.name}
            onChange={(event) => setSharedStepForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Name"
            className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
          />
          <textarea
            value={sharedStepForm.action}
            onChange={(event) => setSharedStepForm((prev) => ({ ...prev, action: event.target.value }))}
            rows={3}
            placeholder="Action"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <textarea
            value={sharedStepForm.expectedResult}
            onChange={(event) => setSharedStepForm((prev) => ({ ...prev, expectedResult: event.target.value }))}
            rows={3}
            placeholder="Expected result"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={sharedStepForm.description}
            onChange={(event) => setSharedStepForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Description"
            className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
          />
          <button
            type="button"
            onClick={handleCreateSharedStep}
            disabled={saving}
            className="w-full h-9 rounded-md bg-[#FFAA00] text-[#232323] text-xs font-semibold disabled:opacity-60 cursor-pointer"
          >
            Add Shared Step
          </button>
        </div>
      </Popup>

      <Popup
        open={isEnvironmentModalOpen}
        title={environmentModalMode === "edit" ? "Edit Environment" : t("tc.addEnvironment")}
        onClose={closeEnvironmentModal}
        maxWidth="max-w-lg"
      >
        <div className="space-y-3">
          <input
            value={envForm.name}
            onChange={(event) => {
              if (envModalError) setEnvModalError("");
              setEnvForm((prev) => ({ ...prev, name: event.target.value }));
            }}
            placeholder="Environment name (Staging, Production...)"
            className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
          />
          <input
            value={envForm.baseUrl}
            onChange={(event) => {
              if (envModalError) setEnvModalError("");
              setEnvForm((prev) => ({ ...prev, baseUrl: event.target.value }));
            }}
            placeholder="Base URL"
            className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
          />
          {!envForm.baseUrl.trim() && envForm.name.trim() ? (
            <p className="text-xs text-amber-500">Base URL is required for AI to generate accurate test cases.</p>
          ) : null}
          {envModalError ? (
            <div className="rounded-md border border-red-300/50 bg-red-50 dark:bg-red-950/20 px-3 py-2 text-xs text-red-700 dark:text-red-300 inline-flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{envModalError}</span>
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleSaveEnvironment}
            disabled={saving}
            className="w-full h-9 rounded-md bg-[#FFAA00] text-[#232323] text-xs font-semibold disabled:opacity-60 cursor-pointer"
          >
            {environmentModalMode === "edit" ? "Save Environment" : "Add Environment"}
          </button>
        </div>
      </Popup>
    </DashboardLayout>
  );
}



