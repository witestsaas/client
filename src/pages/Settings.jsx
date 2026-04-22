import React, { useMemo, useState, useEffect, useCallback } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CheckCircle,
  Copy,
  Database,
  ExternalLink,
  Gift,
  GitBranch,
  Key,
  Link as LinkIcon,
  Pencil,
  Plug,
  Plus,
  Settings as SettingsIcon,
  Shield,
  Ticket,
  Trash2,
  Users,
  Webhook,
  Workflow,
  Coins,
  Eye,
  EyeOff,
  Rocket,
  Sparkles,
} from "lucide-react";
import { redeemOrgCoupon, fetchOrgCouponBalance } from "../services/organizations";
import { fetchApiKeys, createApiKey, revokeApiKey } from "../services/apiKeys";
import { listWebhooks, createWebhook, updateWebhook, deleteWebhook, testWebhook } from "../services/platform";
import { useLanguage } from "../utils/language-context";

const TABS = [
  { key: "credits", labelKey: "settings.tab.credits", icon: Ticket },
  { key: "integrations", labelKey: "settings.tab.integrations", icon: Plug },
  { key: "api-keys", labelKey: "settings.tab.apiKeys", icon: Key },
  { key: "team", labelKey: "settings.tab.team", icon: Users },
  //{ key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", labelKey: "settings.tab.security", icon: Shield },
];

const INTEGRATIONS = [
  {
    id: "jira",
    name: "JIRA",
    description: "Sync test results and create issues automatically",
    icon: Database,
    status: "disconnected",
  },
  {
    id: "jenkins",
    name: "Jenkins",
    description: "Trigger test runs from CI/CD pipelines",
    icon: GitBranch,
    status: "disconnected",
  },
  {
    id: "github-actions",
    name: "GitHub Actions",
    description: "Integration with GitHub Actions workflows",
    icon: Workflow,
    status: "disconnected",
  },
  {
    id: "gitlab-ci",
    name: "GitLab CI",
    description: "Connect with GitLab CI/CD pipelines",
    icon: GitBranch,
    status: "disconnected",
  },
];

function statusBadgeClass(status) {
  if (status === "connected") {
    return "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-700/40";
  }
  if (status === "pending") {
    return "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-700/40";
  }
  return "text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-300 dark:bg-slate-900/40 dark:border-slate-700/40";
}

function statusIcon(status) {
  if (status === "connected") return <CheckCircle className="w-3.5 h-3.5" />;
  return <AlertCircle className="w-3.5 h-3.5" />;
}

function SettingsSectionCard({ title, description, children }) {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#F6F6F6] dark:bg-[#13112a] shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.28)]">
      <div className="px-5 py-4 border-b border-black/10 dark:border-white/10">
        <p className="font-semibold text-[#232323] dark:text-white">{title}</p>
        {description ? <p className="text-sm text-[#232323]/60 dark:text-white/60 mt-1">{description}</p> : null}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { orgSlug } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(TABS.some(t => t.key === tabFromUrl) ? tabFromUrl : "credits");
  const [selectedIntegrationId, setSelectedIntegrationId] = useState("");

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [redeemingCoupon, setRedeemingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState(null);
  const [couponBalance, setCouponBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // API Keys state
  const [apiKeys, setApiKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [isCreateKeyOpen, setIsCreateKeyOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiry, setNewKeyExpiry] = useState("never");
  const [creatingKey, setCreatingKey] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [revokeConfirmId, setRevokeConfirmId] = useState(null);
  const [revokingKey, setRevokingKey] = useState(false);

  // Webhooks state
  const [webhooks, setWebhooks] = useState([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [webhookForm, setWebhookForm] = useState({ name: "", url: "", secret: "", events: [], enabled: true });
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [editWebhookId, setEditWebhookId] = useState(null);
  const [deleteWebhookConfirm, setDeleteWebhookConfirm] = useState(null);
  const [webhookError, setWebhookError] = useState("");
  const [testingWebhookId, setTestingWebhookId] = useState(null);
  const [testWebhookResult, setTestWebhookResult] = useState(null);

  const WEBHOOK_EVENTS = [
    "run.started", "run.completed", "run.failed", "run.cancelled",
    "test.passed", "test.failed",
    "schedule.triggered",
    "api_test.passed", "api_test.failed",
  ];

  const selectedIntegration = useMemo(
    () => INTEGRATIONS.find((item) => item.id === selectedIntegrationId) || null,
    [selectedIntegrationId],
  );

  async function loadCouponBalance() {
    if (!orgSlug) return;
    setLoadingBalance(true);
    try {
      const data = await fetchOrgCouponBalance(orgSlug);
      setCouponBalance(data);
    } catch {
      setCouponBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  }

  async function handleRedeemCoupon() {
    const code = couponCode.trim();
    if (!code) return;
    setRedeemingCoupon(true);
    setCouponMessage(null);
    try {
      const result = await redeemOrgCoupon(orgSlug, code);
      setCouponMessage({ type: "success", text: `Coupon redeemed! ${Number(result.amountUsd || 0).toFixed(2)} credits added.` });
      setCouponCode("");
      loadCouponBalance();
    } catch (e) {
      setCouponMessage({ type: "error", text: e?.message || "Failed to redeem coupon" });
    } finally {
      setRedeemingCoupon(false);
    }
  }

  React.useEffect(() => {
    if (activeTab === "credits" && orgSlug) {
      loadCouponBalance();
    }
  }, [activeTab, orgSlug]);

  const loadApiKeys = useCallback(async () => {
    if (!orgSlug) return;
    setLoadingKeys(true);
    try {
      const data = await fetchApiKeys(orgSlug);
      setApiKeys(Array.isArray(data) ? data : []);
    } catch {
      setApiKeys([]);
    } finally {
      setLoadingKeys(false);
    }
  }, [orgSlug]);

  useEffect(() => {
    if (activeTab === "api-keys" && orgSlug) {
      loadApiKeys();
    }
  }, [activeTab, orgSlug, loadApiKeys]);

  const handleCreateApiKey = async () => {
    const name = newKeyName.trim();
    if (!name) { setKeyError("Name is required"); return; }
    setCreatingKey(true);
    setKeyError("");
    try {
      const expiresInDays = newKeyExpiry === "30" ? 30 : newKeyExpiry === "90" ? 90 : newKeyExpiry === "365" ? 365 : null;
      const result = await createApiKey(orgSlug, { name, expiresInDays });
      setNewlyCreatedKey(result);
      setNewKeyName("");
      setNewKeyExpiry("never");
      setIsCreateKeyOpen(false);
      await loadApiKeys();
    } catch (e) {
      setKeyError(e?.message || "Failed to create API key");
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (keyId) => {
    setRevokingKey(true);
    try {
      await revokeApiKey(orgSlug, keyId);
      setRevokeConfirmId(null);
      await loadApiKeys();
    } catch (e) {
      setKeyError(e?.message || "Failed to revoke key");
    } finally {
      setRevokingKey(false);
    }
  };

  const copyKeyToClipboard = (key) => {
    navigator.clipboard.writeText(key).then(() => {
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    });
  };

  const renderCredits = () => (
    <div className="space-y-6">
      <SettingsSectionCard
        title="Coupon Balance"
        description="Your organization's remaining AI Agent credit balance from redeemed coupons"
      >
        {loadingBalance ? (
          <div className="flex items-center justify-center py-4"><svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none"><circle className="opacity-20" cx="12" cy="12" r="10" stroke="#FFAA00" strokeWidth="3" /><path className="opacity-80" d="M12 2a10 10 0 0 1 10 10" stroke="#FFAA00" strokeWidth="3" strokeLinecap="round" /></svg></div>
        ) : couponBalance ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5"><Coins className="h-5 w-5" />{Number(couponBalance?.totalRemainingUsd || 0).toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">Total Credits</p>
              <p className="text-xl font-bold mt-1 flex items-center gap-1.5"><Coins className="h-5 w-5" />{Number(couponBalance?.totalAmountUsd || 0).toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">Used</p>
              <p className="text-xl font-bold text-foreground/70 mt-1 flex items-center gap-1.5"><Coins className="h-5 w-5" />{Number(couponBalance?.totalUsedUsd || 0).toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">Active Coupons</p>
              <p className="text-xl font-bold mt-1">{couponBalance?.activeCoupons || 0}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No coupon credits found. Redeem a coupon below to get started.</p>
        )}
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Redeem Coupon"
        description="Enter a coupon code provided by your admin to add AI Agent credits to this organization"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            maxLength={19}
            className="flex-1 h-10 rounded-lg border border-border px-4 bg-background text-sm font-mono tracking-wider uppercase"
          />
          <button
            type="button"
            onClick={handleRedeemCoupon}
            disabled={redeemingCoupon || !couponCode.trim()}
            className="h-10 px-5 rounded-lg bg-[#FFAA00] hover:bg-[#FFAA00]/90 text-[#232323] text-sm font-semibold disabled:opacity-60 inline-flex items-center gap-2 cursor-pointer"
          >
            <Gift className="h-4 w-4" />
            {redeemingCoupon ? "Redeeming..." : "Redeem"}
          </button>
        </div>
        {couponMessage ? (
          <div className={`mt-3 rounded-lg p-3 text-sm ${couponMessage.type === "success" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"}`}>
            {couponMessage.text}
          </div>
        ) : null}
      </SettingsSectionCard>
    </div>
  );

  const renderIntegrations = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2">
        <SettingsSectionCard
          title="Platform Integrations"
          description="Connect your testing platform with popular tools and services"
        >
          <div className="space-y-3">
            {INTEGRATIONS.map((integration) => {
              const Icon = integration.icon;
              const isSelected = selectedIntegrationId === integration.id;

              return (
                <button
                  key={integration.id}
                  type="button"
                  onClick={() => setSelectedIntegrationId(integration.id)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "border-blue-300 bg-blue-50/70 dark:bg-blue-900/20 dark:border-blue-600"
                      : "border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] hover:border-black/20 dark:hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="h-9 w-9 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] inline-flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4.5 w-4.5 text-[#232323]/75 dark:text-white/75" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-[#232323] dark:text-white truncate">{integration.name}</span>
                        <span className="block text-sm text-[#232323]/60 dark:text-white/60 truncate">{integration.description}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] border rounded-full ${statusBadgeClass(integration.status)}`}>
                        {statusIcon(integration.status)}
                        {integration.status}
                      </span>
                      <ExternalLink className="h-4 w-4 text-[#232323]/35 dark:text-white/35" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </SettingsSectionCard>
      </div>

      <div>
        {selectedIntegration ? (
          <SettingsSectionCard
            title={`Configure ${selectedIntegration.name}`}
            description="Integration settings"
          >
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-1">Endpoint URL</label>
                <input className="w-full h-10 rounded-lg border border-black/15 dark:border-white/15 bg-background/80 px-3 text-sm" placeholder="https://api.example.com" />
              </div>
              <div>
                <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-1">Access Token</label>
                <input className="w-full h-10 rounded-lg border border-black/15 dark:border-white/15 bg-background/80 px-3 text-sm" placeholder="••••••••••••" type="password" />
              </div>
              <button type="button" className="w-full h-10 rounded-lg bg-[#FFAA00] text-[#232323] text-sm font-semibold cursor-pointer">Save Configuration</button>
            </div>
          </SettingsSectionCard>
        ) : (
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#F6F6F6] dark:bg-[#13112a] shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.28)] p-8 text-center">
            <Plug className="w-11 h-11 text-[#232323]/30 dark:text-white/30 mx-auto mb-4" />
            <p className="font-semibold text-[#232323] dark:text-white">Select an Integration</p>
            <p className="text-sm text-[#232323]/60 dark:text-white/60 mt-2">Choose a platform from the list to configure its integration settings</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderApiKeys = () => (
    <div className="space-y-5">
      {/* Newly created key banner – show once */}
      {newlyCreatedKey?.rawKey ? (
        <div className="rounded-2xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 p-5">
          <p className="font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle className="h-4.5 w-4.5" />
            API Key Created — Copy it now!
          </p>
          <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
            This is the only time you can see the full key. Store it securely.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-black/30 px-3 py-2 text-sm font-mono break-all select-all">
              {newlyCreatedKey.rawKey}
            </code>
            <button
              type="button"
              onClick={() => copyKeyToClipboard(newlyCreatedKey.rawKey)}
              className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
              {keyCopied ? "Copied!" : "Copy"}
            </button>
            <button
              type="button"
              onClick={() => setNewlyCreatedKey(null)}
              className="h-9 px-3 rounded-lg border border-emerald-300 dark:border-emerald-700 text-sm text-emerald-800 dark:text-emerald-200 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <SettingsSectionCard
        title="API Keys"
        description="Create and manage API keys for external integrations and automation"
      >
        <div className="space-y-4">
          {/* Create new key */}
          {isCreateKeyOpen ? (
            <div className="rounded-xl border border-[#FFAA00]/40 bg-[#FFAA00]/5 dark:bg-[#FFAA00]/10 p-4 space-y-3">
              <p className="font-medium text-sm text-[#232323] dark:text-white">Create New API Key</p>
              <div>
                <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-1">Key Name</label>
                <input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. CI/CD Pipeline, External Dashboard"
                  maxLength={64}
                  className="w-full h-10 rounded-lg border border-border px-3 bg-background text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-1">Expiration</label>
                <select
                  value={newKeyExpiry}
                  onChange={(e) => setNewKeyExpiry(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border px-3 bg-background text-sm"
                >
                  <option value="never">Never expires</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="365">1 year</option>
                </select>
              </div>
              {keyError ? <p className="text-sm text-red-600 dark:text-red-400">{keyError}</p> : null}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateApiKey}
                  disabled={creatingKey}
                  className="h-9 px-4 rounded-lg bg-[#FFAA00] hover:bg-[#FFAA00]/90 text-[#232323] text-sm font-semibold disabled:opacity-60 cursor-pointer"
                >
                  {creatingKey ? "Creating..." : "Generate Key"}
                </button>
                <button
                  type="button"
                  onClick={() => { setIsCreateKeyOpen(false); setKeyError(""); }}
                  className="h-9 px-4 rounded-lg border border-border text-sm cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreateKeyOpen(true)}
              className="h-9 px-4 rounded-lg bg-[#FFAA00] hover:bg-[#FFAA00]/90 text-[#232323] text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Create New API Key
            </button>
          )}

          {/* Keys list */}
          {loadingKeys ? (
            <p className="text-sm text-[#232323]/50 dark:text-white/50">Loading keys...</p>
          ) : apiKeys.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <Key className="h-8 w-8 text-[#232323]/20 dark:text-white/20 mx-auto" />
              <p className="mt-3 font-medium text-[#232323]/50 dark:text-white/50">No API keys yet</p>
              <p className="text-sm text-[#232323]/40 dark:text-white/40 mt-1">Create your first key to start using the Qalion API</p>
            </div>
          ) : (
            <div className="space-y-2">
              {apiKeys.map((key) => {
                const isRevoked = !!key.revokedAt;
                const isExpired = key.expiresAt && new Date(key.expiresAt) < new Date();
                return (
                  <div
                    key={key.id}
                    className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-4 ${
                      isRevoked || isExpired
                        ? "border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/10 opacity-60"
                        : "border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.03]"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[#232323] dark:text-white flex items-center gap-2">
                        {key.name}
                        {isRevoked ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">Revoked</span>
                        ) : isExpired ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">Expired</span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Active</span>
                        )}
                      </p>
                      <p className="text-xs text-[#232323]/50 dark:text-white/50 mt-1 font-mono">
                        {key.prefix}••••••••••••
                      </p>
                      <p className="text-xs text-[#232323]/40 dark:text-white/40 mt-0.5">
                        Created {new Date(key.createdAt).toLocaleDateString()}
                        {key.expiresAt ? ` · Expires ${new Date(key.expiresAt).toLocaleDateString()}` : " · Never expires"}
                        {key.lastUsedAt ? ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}` : ""}
                      </p>
                    </div>
                    {!isRevoked ? (
                      revokeConfirmId === key.id ? (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRevokeKey(key.id)}
                            disabled={revokingKey}
                            className="h-8 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-60 cursor-pointer"
                          >
                            {revokingKey ? "..." : "Confirm"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setRevokeConfirmId(null)}
                            className="h-8 px-3 rounded-lg border border-border text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRevokeConfirmId(key.id)}
                          className="h-8 px-3 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-medium inline-flex items-center gap-1 flex-shrink-0 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                          Revoke
                        </button>
                      )
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard title="API Usage Guide" description="Complete guide to using your Qalion API key for automation and integrations">
        <div className="space-y-5">

          {/* Authentication */}
          <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] p-4 space-y-3">
            <p className="font-medium text-sm text-[#232323] dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#FFAA00]" /> Authentication
            </p>
            <p className="text-sm text-[#232323]/80 dark:text-white/80">
              Include your API key in the <code className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-xs font-mono">x-api-key</code> header, or as a <code className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-xs font-mono">Bearer</code> token:
            </p>
            <pre className="rounded-lg bg-slate-900 dark:bg-black/60 text-slate-100 p-4 text-xs font-mono overflow-x-auto whitespace-pre">
{`# Option 1: x-api-key header (recommended)
curl -H "x-api-key: qal_your_key_here" \\
     ${window.location.origin}/api/v1/organizations/${orgSlug}/tests/projects

# Option 2: Authorization Bearer header
curl -H "Authorization: Bearer qal_your_key_here" \\
     ${window.location.origin}/api/v1/organizations/${orgSlug}/tests/projects`}
            </pre>
          </div>

          {/* Base URL */}
          <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] p-4 space-y-2">
            <p className="font-medium text-sm text-[#232323] dark:text-white flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-[#FFAA00]" /> Base URL
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 text-xs font-mono text-[#232323] dark:text-white">
                {window.location.origin}/api/v1
              </code>
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/api/v1`); }}
                className="h-8 w-8 rounded-lg border border-black/10 dark:border-white/10 flex items-center justify-center "
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-[#232323]/50 dark:text-white/50">
              All endpoints are relative to this base. Your organization slug is <code className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono">{orgSlug}</code>.
            </p>
          </div>

          {/* Available Endpoints */}
          <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] p-4 space-y-3">
            <p className="font-medium text-sm text-[#232323] dark:text-white flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-[#FFAA00]" /> Available Endpoints
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left border-b border-black/10 dark:border-white/10">
                    <th className="py-2 pr-3 font-medium text-[#232323]/60 dark:text-white/60">Method</th>
                    <th className="py-2 pr-3 font-medium text-[#232323]/60 dark:text-white/60">Endpoint</th>
                    <th className="py-2 font-medium text-[#232323]/60 dark:text-white/60">Description</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-[#232323]/80 dark:text-white/80">
                  <tr className="border-b border-black/5 dark:border-white/5">
                    <td className="py-2 pr-3"><span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold">GET</span></td>
                    <td className="py-2 pr-3">/organizations/{'{orgSlug}'}/tests/projects</td>
                    <td className="py-2 font-sans">List all test projects</td>
                  </tr>
                  <tr className="border-b border-black/5 dark:border-white/5">
                    <td className="py-2 pr-3"><span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold">POST</span></td>
                    <td className="py-2 pr-3">/organizations/{'{orgSlug}'}/tests/projects</td>
                    <td className="py-2 font-sans">Create a new test project</td>
                  </tr>
                  <tr className="border-b border-black/5 dark:border-white/5">
                    <td className="py-2 pr-3"><span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold">GET</span></td>
                    <td className="py-2 pr-3">/organizations/{'{orgSlug}'}/tests/projects/{'{projectId}'}/folders</td>
                    <td className="py-2 font-sans">Get folder tree for a project</td>
                  </tr>
                  <tr className="border-b border-black/5 dark:border-white/5">
                    <td className="py-2 pr-3"><span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold">GET</span></td>
                    <td className="py-2 pr-3">/organizations/{'{orgSlug}'}/tests/projects/{'{projectId}'}/test-cases</td>
                    <td className="py-2 font-sans">List test cases (optional ?folderId=)</td>
                  </tr>
                  <tr className="border-b border-black/5 dark:border-white/5">
                    <td className="py-2 pr-3"><span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold">POST</span></td>
                    <td className="py-2 pr-3">/organizations/{'{orgSlug}'}/tests/projects/{'{projectId}'}/test-cases</td>
                    <td className="py-2 font-sans">Create a test case</td>
                  </tr>
                  <tr className="border-b border-black/5 dark:border-white/5">
                    <td className="py-2 pr-3"><span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold">POST</span></td>
                    <td className="py-2 pr-3">/organizations/{'{orgSlug}'}/tests/projects/{'{projectId}'}/import-tests</td>
                    <td className="py-2 font-sans">Import tests from file (CSV/JSON/XML)</td>
                  </tr>
                  <tr className="border-b border-black/5 dark:border-white/5">
                    <td className="py-2 pr-3"><span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold">POST</span></td>
                    <td className="py-2 pr-3">/organizations/{'{orgSlug}'}/tests/projects/{'{sourceProjectId}'}/clone</td>
                    <td className="py-2 font-sans">Clone a project (deep copy)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3"><span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold">POST</span></td>
                    <td className="py-2 pr-3">/test-execution/trigger-batch</td>
                    <td className="py-2 font-sans">Trigger batch test execution</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Code Examples */}
          <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] p-4 space-y-4">
            <p className="font-medium text-sm text-[#232323] dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-[#FFAA00]" /> Code Examples
            </p>

            {/* List Projects */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-[#232323]/60 dark:text-white/60 uppercase tracking-wider">List Projects</p>
              <pre className="rounded-lg bg-slate-900 dark:bg-black/60 text-slate-100 p-4 text-xs font-mono overflow-x-auto whitespace-pre">
{`curl -s -H "x-api-key: qal_your_key_here" \\
     ${window.location.origin}/api/v1/organizations/${orgSlug}/tests/projects | jq .`}
              </pre>
            </div>

            {/* Create Test Case */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-[#232323]/60 dark:text-white/60 uppercase tracking-wider">Create a Test Case</p>
              <pre className="rounded-lg bg-slate-900 dark:bg-black/60 text-slate-100 p-4 text-xs font-mono overflow-x-auto whitespace-pre">
{`curl -X POST \\
  -H "x-api-key: qal_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Verify login with valid credentials",
    "folderId": "FOLDER_ID",
    "priority": 4,
    "steps": [
      { "action": "Navigate to /login", "expected": "Login page is displayed" },
      { "action": "Enter valid email and password", "expected": "Fields are filled" },
      { "action": "Click Sign In button", "expected": "User is redirected to dashboard" }
    ]
  }' \\
  ${window.location.origin}/api/v1/organizations/${orgSlug}/tests/projects/PROJECT_ID/test-cases`}
              </pre>
            </div>

            {/* Import Tests from File */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-[#232323]/60 dark:text-white/60 uppercase tracking-wider">Import Tests from File (CSV/JSON/XML)</p>
              <pre className="rounded-lg bg-slate-900 dark:bg-black/60 text-slate-100 p-4 text-xs font-mono overflow-x-auto whitespace-pre">
{`curl -X POST \\
  -H "x-api-key: qal_your_key_here" \\
  -F "file=@tests-export.csv" \\
  ${window.location.origin}/api/v1/organizations/${orgSlug}/tests/projects/PROJECT_ID/import-tests`}
              </pre>
            </div>

            {/* JavaScript / Node.js */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-[#232323]/60 dark:text-white/60 uppercase tracking-wider">JavaScript / Node.js</p>
              <pre className="rounded-lg bg-slate-900 dark:bg-black/60 text-slate-100 p-4 text-xs font-mono overflow-x-auto whitespace-pre">
{`const API_KEY = "qal_your_key_here";
const BASE = "${window.location.origin}/api/v1";
const ORG = "${orgSlug}";

// List all projects
const res = await fetch(\`\${BASE}/organizations/\${ORG}/tests/projects\`, {
  headers: { "x-api-key": API_KEY },
});
const projects = await res.json();
console.log(projects);

// Create a test project
const newProject = await fetch(\`\${BASE}/organizations/\${ORG}/tests/projects\`, {
  method: "POST",
  headers: {
    "x-api-key": API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ name: "Release v2.1 Tests", description: "Regression suite" }),
});`}
              </pre>
            </div>

            {/* Python */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-[#232323]/60 dark:text-white/60 uppercase tracking-wider">Python</p>
              <pre className="rounded-lg bg-slate-900 dark:bg-black/60 text-slate-100 p-4 text-xs font-mono overflow-x-auto whitespace-pre">
{`import requests

API_KEY = "qal_your_key_here"
BASE = "${window.location.origin}/api/v1"
ORG = "${orgSlug}"

headers = {"x-api-key": API_KEY}

# List projects
projects = requests.get(f"{BASE}/organizations/{ORG}/tests/projects", headers=headers).json()

# Import tests from a Squash XML export
with open("squash-export.xml", "rb") as f:
    resp = requests.post(
        f"{BASE}/organizations/{ORG}/tests/projects/{projects[0]['id']}/import-tests",
        headers={"x-api-key": API_KEY},
        files={"file": ("export.xml", f, "application/xml")},
    )
    print(resp.json())`}
              </pre>
            </div>

            {/* CI/CD Pipeline */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-[#232323]/60 dark:text-white/60 uppercase tracking-wider">GitHub Actions Example</p>
              <pre className="rounded-lg bg-slate-900 dark:bg-black/60 text-slate-100 p-4 text-xs font-mono overflow-x-auto whitespace-pre">
{`# .github/workflows/qalion-tests.yml
name: Run Qalion Tests
on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Qalion Test Execution
        run: |
          curl -X POST \\
            -H "x-api-key: \${{ secrets.QALION_API_KEY }}" \\
            -H "Content-Type: application/json" \\
            -d '{
              "testRunId": "run-\${{ github.sha }}",
              "orgSlug": "${orgSlug}",
              "testCases": [
                { "testCaseId": "TEST_CASE_ID", "browser": "chromium" }
              ]
            }' \\
            ${window.location.origin}/api/v1/test-execution/trigger-batch`}
              </pre>
            </div>
          </div>

          {/* Security Best Practices */}
          <div className="rounded-xl border border-amber-200 dark:border-amber-700/40 bg-amber-50/60 dark:bg-amber-900/10 p-4 space-y-2">
            <p className="font-medium text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Security Best Practices
            </p>
            <ul className="text-xs text-amber-900/80 dark:text-amber-200/80 space-y-1.5 list-disc list-inside">
              <li>Never commit API keys in source code — use environment variables or secrets managers</li>
              <li>Rotate keys periodically — create a new key then revoke the old one</li>
              <li>Use expiring keys (30 / 90 days) for CI pipelines</li>
              <li>Each key is scoped to this organization ({orgSlug}) — it cannot access other orgs</li>
              <li>Revoked or expired keys are rejected immediately</li>
              <li>The raw key is shown <strong>only once</strong> at creation — store it securely</li>
            </ul>
          </div>

        </div>
      </SettingsSectionCard>
    </div>
  );

  // ─── Webhooks ────────────────────────────────────────────────────────
  const loadWebhooks = useCallback(async () => {
    if (!orgSlug) return;
    setLoadingWebhooks(true);
    try {
      const data = await listWebhooks(orgSlug);
      setWebhooks(Array.isArray(data) ? data : []);
    } catch { setWebhooks([]); }
    finally { setLoadingWebhooks(false); }
  }, [orgSlug]);

  useEffect(() => {
    if (activeTab === "webhooks" && orgSlug) loadWebhooks();
  }, [activeTab, orgSlug, loadWebhooks]);

  const resetWebhookForm = () => {
    setWebhookForm({ name: "", url: "", secret: "", events: [], enabled: true });
    setShowWebhookForm(false);
    setEditWebhookId(null);
    setWebhookError("");
  };

  const handleSaveWebhook = async () => {
    if (!webhookForm.name.trim() || !webhookForm.url.trim()) { setWebhookError("Name and URL are required"); return; }
    setSavingWebhook(true);
    setWebhookError("");
    try {
      if (editWebhookId) {
        await updateWebhook(orgSlug, editWebhookId, webhookForm);
      } else {
        await createWebhook(orgSlug, webhookForm);
      }
      resetWebhookForm();
      await loadWebhooks();
    } catch (e) {
      setWebhookError(e?.message || "Failed to save webhook");
    } finally { setSavingWebhook(false); }
  };

  const handleDeleteWebhook = async (id) => {
    try {
      await deleteWebhook(orgSlug, id);
      setDeleteWebhookConfirm(null);
      await loadWebhooks();
    } catch (e) { setWebhookError(e?.message || "Failed to delete"); }
  };

  const handleTestWebhook = async (id) => {
    setTestingWebhookId(id);
    setTestWebhookResult(null);
    try {
      const r = await testWebhook(orgSlug, id);
      setTestWebhookResult({ id, success: r.success !== false, status: r.statusCode });
    } catch (e) {
      setTestWebhookResult({ id, success: false, error: e?.message });
    } finally { setTestingWebhookId(null); }
  };

  const toggleWebhookEvent = (event) => {
    setWebhookForm((p) => ({
      ...p,
      events: p.events.includes(event) ? p.events.filter((e) => e !== event) : [...p.events, event],
    }));
  };

  const renderWebhooks = () => (
    <div className="space-y-5">
      <SettingsSectionCard title="Webhooks" description="Send real-time HTTP notifications to external systems when events occur">
        <div className="space-y-4">
          {!showWebhookForm ? (
            <button type="button" onClick={() => { resetWebhookForm(); setShowWebhookForm(true); }} className="h-9 px-4 rounded-lg bg-[#FFAA00] hover:bg-[#FFAA00]/90 text-[#232323] text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer">
              <Plus className="h-3.5 w-3.5" /> New Webhook
            </button>
          ) : (
            <div className="rounded-xl border border-[#FFAA00]/40 bg-[#FFAA00]/5 dark:bg-[#FFAA00]/10 p-4 space-y-3">
              <p className="font-medium text-sm text-[#232323] dark:text-white">{editWebhookId ? "Edit Webhook" : "New Webhook"}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-1">Name</label>
                  <input value={webhookForm.name} onChange={(e) => setWebhookForm((p) => ({ ...p, name: e.target.value }))} placeholder="CI/CD Notifications" className="w-full h-10 rounded-lg border border-border px-3 bg-background text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-1">Payload URL</label>
                  <input value={webhookForm.url} onChange={(e) => setWebhookForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://example.com/webhook" className="w-full h-10 rounded-lg border border-border px-3 bg-background text-sm font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-1">Secret (HMAC signing key)</label>
                <input value={webhookForm.secret} onChange={(e) => setWebhookForm((p) => ({ ...p, secret: e.target.value }))} placeholder="Optional — used to sign payloads" className="w-full h-10 rounded-lg border border-border px-3 bg-background text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs text-[#232323]/60 dark:text-white/60 mb-2">Events</label>
                <div className="flex flex-wrap gap-2">
                  {WEBHOOK_EVENTS.map((ev) => (
                    <button key={ev} type="button" onClick={() => toggleWebhookEvent(ev)} className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      webhookForm.events.includes(ev)
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                        : "border-black/10 dark:border-white/10 text-[#232323]/60 dark:text-white/60"
                    }`}>{ev}</button>
                  ))}
                </div>
              </div>
              {webhookError && <p className="text-sm text-red-600 dark:text-red-400">{webhookError}</p>}
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleSaveWebhook} disabled={savingWebhook} className="h-9 px-4 rounded-lg bg-[#FFAA00] hover:bg-[#FFAA00]/90 text-[#232323] text-sm font-semibold disabled:opacity-60 cursor-pointer">{savingWebhook ? "Saving..." : editWebhookId ? "Update" : "Create"}</button>
                <button type="button" onClick={resetWebhookForm} className="h-9 px-4 rounded-lg border border-border text-sm cursor-pointer">Cancel</button>
              </div>
            </div>
          )}

          {/* Webhook list */}
          {loadingWebhooks ? (
            <p className="text-sm text-[#232323]/50 dark:text-white/50">Loading webhooks...</p>
          ) : webhooks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <Webhook className="h-8 w-8 text-[#232323]/20 dark:text-white/20 mx-auto" />
              <p className="mt-3 font-medium text-[#232323]/50 dark:text-white/50">No webhooks configured</p>
              <p className="text-sm text-[#232323]/40 dark:text-white/40 mt-1">Create a webhook to receive real-time notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {webhooks.map((wh) => (
                <div key={wh.id} className={`rounded-xl border px-4 py-3 ${wh.enabled ? "border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.03]" : "border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.01] opacity-60"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-[#232323] dark:text-white flex items-center gap-2">
                        {wh.name}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${wh.enabled ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" : "bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"}`}>{wh.enabled ? "Active" : "Disabled"}</span>
                      </p>
                      <p className="text-xs text-[#232323]/50 dark:text-white/50 mt-0.5 font-mono truncate">{wh.url}</p>
                      <p className="text-xs text-[#232323]/40 dark:text-white/40 mt-0.5">{(wh.events || []).join(", ") || "No events selected"}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button type="button" onClick={() => handleTestWebhook(wh.id)} disabled={testingWebhookId === wh.id} className="h-8 px-2.5 rounded-lg border border-black/10 dark:border-white/10 text-xs font-medium inline-flex items-center gap-1 disabled:opacity-60 cursor-pointer">
                        {testingWebhookId === wh.id ? "..." : "Test"}
                      </button>
                      <button type="button" onClick={() => { setEditWebhookId(wh.id); setWebhookForm({ name: wh.name, url: wh.url, secret: wh.secret || "", events: wh.events || [], enabled: wh.enabled }); setShowWebhookForm(true); }} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer">
                        <Pencil className="h-3 w-3" />
                      </button>
                      {deleteWebhookConfirm === wh.id ? (
                        <>
                          <button type="button" onClick={() => handleDeleteWebhook(wh.id)} className="h-7 px-2 rounded-lg bg-red-500 text-white text-xs font-semibold cursor-pointer">Confirm</button>
                          <button type="button" onClick={() => setDeleteWebhookConfirm(null)} className="h-7 px-2 rounded-lg border border-border text-xs cursor-pointer">Cancel</button>
                        </>
                      ) : (
                        <button type="button" onClick={() => setDeleteWebhookConfirm(wh.id)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 cursor-pointer">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  {testWebhookResult?.id === wh.id && (
                    <div className={`mt-2 text-xs rounded-lg px-3 py-1.5 ${testWebhookResult.success ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"}`}>
                      {testWebhookResult.success ? `Ping sent — status ${testWebhookResult.status}` : `Failed: ${testWebhookResult.error || "Unknown error"}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SettingsSectionCard>
    </div>
  );

  const renderTeam = () => (
    <SettingsSectionCard title={t("settings.team.title")} description={t("settings.team.subtitle")}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] p-4">
          <p className="font-medium text-[#232323] dark:text-white">{t("settings.team.defaultRole")}</p>
          <select className="mt-3 w-full h-10 rounded-lg border border-black/15 dark:border-white/15 bg-background/80 px-3 text-sm">
            <option>{t("settings.team.role.viewer")}</option>
            <option>{t("settings.team.role.tester")}</option>
            <option>{t("settings.team.role.admin")}</option>
          </select>
        </div>
        <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] p-4">
          <p className="font-medium text-[#232323] dark:text-white">{t("settings.team.invitePolicy")}</p>
          <select className="mt-3 w-full h-10 rounded-lg border border-black/15 dark:border-white/15 bg-background/80 px-3 text-sm">
            <option>{t("settings.team.policy.ownersOnly")}</option>
            <option>{t("settings.team.policy.ownersAdmins")}</option>
          </select>
        </div>
      </div>
    </SettingsSectionCard>
  );

  {/*const renderNotifications = () => (
    <SettingsSectionCard title="Notifications" description="Choose how your team receives alerts">
      <div className="space-y-3">
        {[
          "Execution completed",
          "Execution failed",
          "New member joined",
          "Weekly summary",
        ].map((item) => (
          <label key={item} className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-sm text-[#232323] dark:text-white">{item}</span>
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </label>
        ))}
      </div>
    </SettingsSectionCard>
  );*/}
  const renderSecurity = () => (
    <div className="flex-1">
    <SettingsSectionCard title={t("settings.security.title")} description={t("settings.security.subtitle")}>
      <div className="space-y-3">
        <label className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-sm text-[#232323] dark:text-white">{t("settings.security.requireEmailVerification")}</span>
          <input type="checkbox" defaultChecked className="h-4 w-4" />
        </label>
        {/*<label className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] px-4 py-3 flex items-center justify-between gap-3">*/}
          {/*<span className="text-sm text-[#232323] dark:text-white">Allow API key usage outside organization IP range</span>
          {/*<input type="checkbox" className="h-4 w-4" />*/}
        {/*</label>*/}
        <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] px-4 py-3">
          <p className="text-sm font-medium text-[#232323] dark:text-white">Multi-factor authentication (MFA)</p>
          <p className="text-xs text-[#232323]/60 dark:text-white/60 mt-1">
            {t("settings.security.mfaConfiguredInProfile")}
          </p>
          <button
            type="button"
            onClick={() => navigate(`/dashboard/${orgSlug}/profile`)}
            className="mt-3 h-9 px-3 rounded-lg border border-black/10 dark:border-white/10 text-sm font-medium text-[#232323] dark:text-white inline-flex items-center gap-1.5 cursor-pointer"
          >
            <LinkIcon className="w-4 h-4" />
            {t("settings.security.goToProfileMfa")}
          </button>
        </div>
      </div>
    </SettingsSectionCard>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Header */}
        <div className="shrink-0 px-4 md:px-6 py-3 md:py-4 border-b border-black/10 dark:border-white/10 bg-card/95">
          <div className="flex items-start gap-3 max-w-6xl">
            <button
              type="button"
              onClick={() => navigate(`/dashboard/${orgSlug}`)}
              className="h-9 w-9 rounded-lg border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] inline-flex items-center justify-center cursor-pointer"
              title={t("common.back")}
            >
              <ArrowLeft className="w-4 h-4 text-[#232323]/75 dark:text-white/75" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-[#232323] dark:text-white inline-flex items-center gap-2">
                <span className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 inline-flex items-center justify-center">
                  <SettingsIcon className="h-4 w-4" />
                </span>
                {t("settings.title")}
              </h2>
              <p className="text-[#232323]/60 dark:text-white/60 text-sm mt-0.5">{t("settings.subtitle")}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 px-4 md:px-6 py-2 border-b border-black/10 dark:border-white/10 bg-card/70">
          <div className="rounded-lg border border-black/10 dark:border-white/10 bg-[#F6F6F6] dark:bg-[#13112a] p-1 grid grid-cols-5 gap-1 max-w-3xl">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`h-9 rounded-lg text-sm inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  active
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-[#232323]/75 dark:text-white/75 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{t(tab.labelKey)}</span>
              </button>
            );
          })}
        </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-4 md:px-6 py-4 space-y-5">
        {activeTab === "credits" ? renderCredits() : null}
        {activeTab === "integrations" ? (
          <div className="flex items-center justify-center flex-1 min-h-[50vh]">
            <div className="relative w-full max-w-lg text-center px-6">
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="h-48 w-48 rounded-full bg-[#FFAA00]/10 animate-pulse" style={{ animationDuration: "2s" }} />
              </div>
              <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-gradient-to-br from-[#FFAA00]/20 to-[#FFAA00]/5 border border-[#FFAA00]/20 flex items-center justify-center shadow-lg shadow-[#FFAA00]/10">
                <Plug className="h-10 w-10 text-[#FFAA00]" />
              </div>
              <h2 className="text-2xl font-bold text-[#232323] dark:text-white mb-2">{t("settings.integrations.title")}</h2>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FFAA00]/30 bg-[#FFAA00]/10 text-[#FFAA00] text-sm font-semibold mb-5">
                <Rocket className="h-4 w-4" /> {t("settings.comingSoon")} <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              </div>
              <p className="text-[#232323]/60 dark:text-white/60 text-base leading-relaxed max-w-md mx-auto">{t("settings.integrations.desc")}</p>
            </div>
          </div>
        ) : null}
        {activeTab === "api-keys" ? (
          <div className="flex items-center justify-center flex-1 min-h-[50vh]">
            <div className="relative w-full max-w-lg text-center px-6">
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="h-48 w-48 rounded-full bg-[#FFAA00]/10 animate-pulse" style={{ animationDuration: "2s" }} />
              </div>
              <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-gradient-to-br from-[#FFAA00]/20 to-[#FFAA00]/5 border border-[#FFAA00]/20 flex items-center justify-center shadow-lg shadow-[#FFAA00]/10">
                <Key className="h-10 w-10 text-[#FFAA00]" />
              </div>
              <h2 className="text-2xl font-bold text-[#232323] dark:text-white mb-2">{t("settings.apiKeys.title")}</h2>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FFAA00]/30 bg-[#FFAA00]/10 text-[#FFAA00] text-sm font-semibold mb-5">
                <Rocket className="h-4 w-4" /> {t("settings.comingSoon")} <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              </div>
              <p className="text-[#232323]/60 dark:text-white/60 text-base leading-relaxed max-w-md mx-auto">{t("settings.apiKeys.desc")}</p>
            </div>
          </div>
        ) : null}
        {activeTab === "webhooks" ? (
          <div className="flex items-center justify-center flex-1 min-h-[50vh]">
            <div className="relative w-full max-w-lg text-center px-6">
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="h-48 w-48 rounded-full bg-[#FFAA00]/10 animate-pulse" style={{ animationDuration: "2s" }} />
              </div>
              <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-gradient-to-br from-[#FFAA00]/20 to-[#FFAA00]/5 border border-[#FFAA00]/20 flex items-center justify-center shadow-lg shadow-[#FFAA00]/10">
                <Webhook className="h-10 w-10 text-[#FFAA00]" />
              </div>
              <h2 className="text-2xl font-bold text-[#232323] dark:text-white mb-2">{t("settings.webhooks.title")}</h2>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FFAA00]/30 bg-[#FFAA00]/10 text-[#FFAA00] text-sm font-semibold mb-5">
                <Rocket className="h-4 w-4" /> {t("settings.comingSoon")} <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              </div>
              <p className="text-[#232323]/60 dark:text-white/60 text-base leading-relaxed max-w-md mx-auto">{t("settings.webhooks.desc")}</p>
            </div>
          </div>
        ) : null}
        {activeTab === "team" ? renderTeam() : null}
        {/*{activeTab === "notifications" ? renderNotifications() : null}*/}
        {activeTab === "security" ? renderSecurity() : null}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
