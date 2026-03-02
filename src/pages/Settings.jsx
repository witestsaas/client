import React, { useMemo, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CheckCircle,
  Database,
  ExternalLink,
  GitBranch,
  Key,
  Link as LinkIcon,
  Plug,
  Settings as SettingsIcon,
  Shield,
  Users,
  Workflow,
} from "lucide-react";

const TABS = [
  { key: "integrations", label: "Integrations", icon: Plug },
  { key: "api-keys", label: "API Keys", icon: Key },
  { key: "team", label: "Team", icon: Users },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Security", icon: Shield },
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
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#F6F6F6] dark:bg-[#1e1e1e] shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.28)]">
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
  const [activeTab, setActiveTab] = useState("integrations");
  const [selectedIntegrationId, setSelectedIntegrationId] = useState("");

  const selectedIntegration = useMemo(
    () => INTEGRATIONS.find((item) => item.id === selectedIntegrationId) || null,
    [selectedIntegrationId],
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
                  className={`w-full rounded-xl border px-4 py-3 text-left transition-all duration-150 ${
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
              <button type="button" className="w-full h-10 rounded-lg bg-[#FFAA00] text-[#232323] text-sm font-semibold">Save Configuration</button>
            </div>
          </SettingsSectionCard>
        ) : (
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#F6F6F6] dark:bg-[#1e1e1e] shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.28)] p-8 text-center">
            <Plug className="w-11 h-11 text-[#232323]/30 dark:text-white/30 mx-auto mb-4" />
            <p className="font-semibold text-[#232323] dark:text-white">Select an Integration</p>
            <p className="text-sm text-[#232323]/60 dark:text-white/60 mt-2">Choose a platform from the list to configure its integration settings</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderApiKeys = () => (
    <SettingsSectionCard title="API Keys" description="Manage workspace API credentials">
      <div className="space-y-4">
        <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] p-4">
          <p className="font-medium text-[#232323] dark:text-white">Primary API Key</p>
          <p className="text-sm text-[#232323]/60 dark:text-white/60 mt-1">Create and rotate keys used by automation and external integrations.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" className="h-9 px-3 rounded-lg bg-[#FFAA00] text-[#232323] text-sm font-semibold">Generate New Key</button>
            <button type="button" className="h-9 px-3 rounded-lg border border-black/10 dark:border-white/10 text-sm">View Existing Keys</button>
          </div>
        </div>
      </div>
    </SettingsSectionCard>
  );

  const renderTeam = () => (
    <SettingsSectionCard title="Team Preferences" description="Configure shared workspace behavior for your organization">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] p-4">
          <p className="font-medium text-[#232323] dark:text-white">Default Member Role</p>
          <select className="mt-3 w-full h-10 rounded-lg border border-black/15 dark:border-white/15 bg-background/80 px-3 text-sm">
            <option>Viewer</option>
            <option>Tester</option>
            <option>Admin</option>
          </select>
        </div>
        <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] p-4">
          <p className="font-medium text-[#232323] dark:text-white">Invite Policy</p>
          <select className="mt-3 w-full h-10 rounded-lg border border-black/15 dark:border-white/15 bg-background/80 px-3 text-sm">
            <option>Owners only</option>
            <option>Owners and Admins</option>
          </select>
        </div>
      </div>
    </SettingsSectionCard>
  );

  const renderNotifications = () => (
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
  );

  const renderSecurity = () => (
    <SettingsSectionCard title="Security" description="Harden organization access and authentication rules">
      <div className="space-y-3">
        <label className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-sm text-[#232323] dark:text-white">Require email verification for invites</span>
          <input type="checkbox" defaultChecked className="h-4 w-4" />
        </label>
        <label className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-sm text-[#232323] dark:text-white">Allow API key usage outside organization IP range</span>
          <input type="checkbox" className="h-4 w-4" />
        </label>
      </div>
    </SettingsSectionCard>
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-2 md:px-3 py-3 md:py-5 space-y-5">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/${orgSlug}`)}
            className="h-10 w-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] inline-flex items-center justify-center"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4 text-[#232323]/75 dark:text-white/75" />
          </button>
          <div>
            <h2 className="text-[2rem] leading-tight font-bold text-[#232323] dark:text-white inline-flex items-center gap-2.5">
              <span className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 inline-flex items-center justify-center">
                <SettingsIcon className="h-5 w-5" />
              </span>
              Settings
            </h2>
            <p className="text-[#232323]/60 dark:text-white/60 mt-1">Configure integrations, manage team settings, and customize your workspace</p>
          </div>
        </div>

        <div className="rounded-xl border border-black/10 dark:border-white/10 bg-[#F6F6F6] dark:bg-[#1e1e1e] p-1 grid grid-cols-5 gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`h-9 rounded-lg text-sm inline-flex items-center justify-center gap-1.5 transition-all ${
                  active
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-[#232323]/75 dark:text-white/75 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === "integrations" ? renderIntegrations() : null}
        {activeTab === "api-keys" ? renderApiKeys() : null}
        {activeTab === "team" ? renderTeam() : null}
        {activeTab === "notifications" ? renderNotifications() : null}
        {activeTab === "security" ? renderSecurity() : null}
      </div>
    </DashboardLayout>
  );
}
