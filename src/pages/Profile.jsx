import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Camera, User as UserIcon } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { Input } from "../components/Input.tsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import { apiFetch } from "../services/http.js";
import { useLanguage } from "../utils/language-context";

export default function Profile() {
  const { orgSlug } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [mfaStatus, setMfaStatus] = useState(null);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaActionLoading, setMfaActionLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [mfaInfo, setMfaInfo] = useState('');
  const [setupData, setSetupData] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [regenCode, setRegenCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setFirstName(user?.firstName || "");
    setLastName(user?.lastName || "");
    setAvatarUrl(user?.avatarUrl || "");
  }, [user?.firstName, user?.lastName, user?.avatarUrl]);

  useEffect(() => {
    let cancelled = false;

    async function loadMfaStatus() {
      if (!user?.userId) return;
      setMfaLoading(true);
      setMfaError('');
      try {
        const response = await apiFetch('/auth/mfa/status', {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('Failed to load MFA status');
        }

        const payload = await response.json().catch(() => ({}));
        if (!cancelled) {
          setMfaStatus(payload);
        }
      } catch (error) {
        if (!cancelled) {
          setMfaError(error?.message || 'Failed to load MFA status');
        }
      } finally {
        if (!cancelled) {
          setMfaLoading(false);
        }
      }
    }

    loadMfaStatus();
    return () => {
      cancelled = true;
    };
  }, [user?.userId]);

  function getInitials() {
    const fullName = `${firstName || ""} ${lastName || ""}`.trim();
    if (!fullName) return "U";
    return fullName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .slice(0, 2)
      .join("");
  }

  async function handleSave(e) {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const response = await apiFetch('/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      await refreshProfile();
      setMessage(t("profile.updatedSuccess"));
    } catch {
      setMessage(t("profile.updatedFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAvatarUpload(file) {
    if (!file) return;

    setIsUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiFetch('/auth/me/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to upload avatar';
        try {
          const errorBody = await response.json();
          errorMessage = errorBody?.message || errorMessage;
        } catch {
          // no-op
        }
        throw new Error(errorMessage);
      }

      const payload = await response.json();
      if (payload?.url) {
        // Use relative path — nginx proxies /uploads/ to the middleware
        const url = payload.url.startsWith('http') ? payload.url : payload.url;
        setAvatarUrl(`${url}?v=${Date.now()}`);
      }

      await refreshProfile();
      setMessage(t("profile.avatarUpdated"));
    } catch (error) {
      setMessage(error?.message || t("profile.avatarUploadFailed"));
    } finally {
      setIsUploading(false);
      // Reset file input so re-selecting the same file triggers onChange
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function refreshMfaStatus() {
    const response = await apiFetch('/auth/mfa/status', {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error('Failed to refresh MFA status');
    }
    const payload = await response.json().catch(() => ({}));
    setMfaStatus(payload);
  }

  async function startMfaSetup() {
    setMfaActionLoading(true);
    setMfaError('');
    setMfaInfo('');
    setRecoveryCodes([]);
    try {
      const response = await apiFetch('/auth/mfa/setup', {
        method: 'POST',
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message || 'Failed to start MFA setup');
      }
      const payload = await response.json().catch(() => ({}));
      setSetupData(payload);
      setMfaInfo(t("profile.mfa.scanHint"));
    } catch (error) {
      setMfaError(error?.message || t("profile.mfa.startFailed"));
    } finally {
      setMfaActionLoading(false);
    }
  }

  async function enableMfa() {
    setMfaActionLoading(true);
    setMfaError('');
    setMfaInfo('');
    try {
      const response = await apiFetch('/auth/mfa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: mfaCode }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to enable MFA');
      }

      setRecoveryCodes(Array.isArray(payload?.recoveryCodes) ? payload.recoveryCodes : []);
      setSetupData(null);
      setMfaCode('');
      await refreshMfaStatus();
      await refreshProfile();
      setMfaInfo(t("profile.mfa.enabledSuccess"));
    } catch (error) {
      setMfaError(error?.message || t("profile.mfa.enableFailed"));
    } finally {
      setMfaActionLoading(false);
    }
  }

  async function disableMfa() {
    setMfaActionLoading(true);
    setMfaError('');
    setMfaInfo('');
    try {
      const response = await apiFetch('/auth/mfa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: disableCode }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to disable MFA');
      }

      setDisableCode('');
      setRecoveryCodes([]);
      setSetupData(null);
      await refreshMfaStatus();
      await refreshProfile();
      setMfaInfo(t("profile.mfa.disabledSuccess"));
    } catch (error) {
      setMfaError(error?.message || t("profile.mfa.disableFailed"));
    } finally {
      setMfaActionLoading(false);
    }
  }

  async function regenerateRecoveryCodes() {
    setMfaActionLoading(true);
    setMfaError('');
    setMfaInfo('');
    try {
      const response = await apiFetch('/auth/mfa/recovery-codes/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: regenCode }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to regenerate recovery codes');
      }

      setRecoveryCodes(Array.isArray(payload?.recoveryCodes) ? payload.recoveryCodes : []);
      setRegenCode('');
      await refreshMfaStatus();
      setMfaInfo(t("profile.mfa.recoveryRegenerated"));
    } catch (error) {
      setMfaError(error?.message || t("profile.mfa.regenerateFailed"));
    } finally {
      setMfaActionLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Header */}
        <div className="shrink-0 px-4 md:px-6 py-3 md:py-4 border-b border-black/10 dark:border-white/10 bg-card/95">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/dashboard/${orgSlug}`)}
              className="h-9 w-9 rounded-lg border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] inline-flex items-center justify-center cursor-pointer hover:bg-white/90 dark:hover:bg-white/[0.05] transition-colors "
              title={t("common.back")}
            >
              <ArrowLeft className="w-4 h-4 text-[#232323]/75 dark:text-white/75" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-[#232323] dark:text-white inline-flex items-center gap-2">
                <span className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 inline-flex items-center justify-center">
                  <UserIcon className="h-4 w-4" />
                </span>
                {t("profile.title")}
              </h2>
              <p className="text-[#232323]/60 dark:text-white/60 text-sm mt-0.5">{t("profile.subtitle")}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-4 md:px-6 py-4 space-y-5">

        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#F6F6F6] dark:bg-[#13112a] shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.28)] p-5 md:p-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="relative h-16 w-16 rounded-full border border-gray-200 dark:border-gray-700 bg-muted/40 overflow-hidden group disabled:opacity-70 cursor-pointer"
                aria-label={t("profile.uploadPhoto")}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={t("profile.photo")} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                    {getInitials()}
                  </div>
                )}
                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                <span className="absolute bottom-0 right-0 m-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-700 shadow group-hover:bg-slate-100">
                  <Camera className="h-3.5 w-3.5" />
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
                className="hidden"
              />
              <div>
                <p className="text-sm font-medium text-[#232323] dark:text-white">{t("profile.photo")}</p>
                <p className="text-xs text-[#232323]/60 dark:text-white/60">
                  {t("profile.photoHint")}
                </p>
              </div>
            </div>

            <div>
              <Input label={t("profile.firstName")} value={firstName} onChange={setFirstName} />
              <Input label={t("profile.lastName")} value={lastName} onChange={setLastName} />
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-black/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => navigate(`/dashboard/${orgSlug}`)}
                disabled={isSaving}
                className="h-9 px-4 rounded-md border border-black/10 dark:border-white/10 text-[#232323] dark:text-white text-sm font-medium disabled:opacity-70 cursor-pointer"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="h-9 px-4 rounded-md bg-[#232323] hover:bg-[#111827] dark:bg-white dark:text-[#232323] dark:hover:bg-white/90 text-white text-sm font-semibold disabled:opacity-70 cursor-pointer"
              >
                {isSaving ? t("common.saving") : t("profile.saveProfile")}
              </button>
            </div>

            {message ? <p className="text-sm text-[#232323]/70 dark:text-white/70">{message}</p> : null}
          </form>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#F6F6F6] dark:bg-[#13112a] shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.28)] p-5 md:p-6 space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-[#232323] dark:text-white">{t("profile.mfa.title")}</h3>
            <p className="text-sm text-[#232323]/60 dark:text-white/60 mt-1">
              {t("profile.mfa.subtitle")}
            </p>
          </div>

          {mfaLoading ? (
            <p className="text-sm text-[#232323]/70 dark:text-white/70">{t("profile.mfa.loading")}</p>
          ) : (
            <p className="text-sm text-[#232323]/70 dark:text-white/70">
              {t("common.status")}: <span className="font-semibold">{mfaStatus?.enabled ? t("profile.mfa.enabled") : t("profile.mfa.disabled")}</span>
              {mfaStatus?.enabled ? ` · ${t("profile.mfa.recoveryLeft")}: ${mfaStatus?.recoveryCodesRemaining ?? 0}` : ''}
            </p>
          )}

          {!mfaStatus?.enabled ? (
            <div className="space-y-4">
              {!setupData ? (
                <button
                  type="button"
                  onClick={startMfaSetup}
                  disabled={mfaActionLoading}
                  className="h-9 px-4 rounded-md bg-[#232323] hover:bg-[#111827] dark:bg-white dark:text-[#232323] dark:hover:bg-white/90 text-white text-sm font-semibold disabled:opacity-70 cursor-pointer"
                >
                  {mfaActionLoading ? t("profile.mfa.preparing") : t("profile.mfa.start")}
                </button>
              ) : (
                <div className="space-y-3 border border-black/10 dark:border-white/10 rounded-xl p-4">
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    {setupData?.qrCodeDataUrl ? (
                      <img src={setupData.qrCodeDataUrl} alt="MFA QR code" className="h-40 w-40 rounded-md border border-black/10 dark:border-white/10 bg-white" />
                    ) : null}
                    <div className="text-sm text-[#232323]/80 dark:text-white/80 space-y-2">
                      <p className="font-medium">{t("profile.mfa.manualKey")}</p>
                      <p className="break-all font-mono text-xs bg-black/5 dark:bg-white/10 rounded px-2 py-1">
                        {setupData?.manualEntryKey || t("common.unavailable")}
                      </p>
                      <p className="text-xs">{t("profile.mfa.expiresIn")} {setupData?.expiresInSec || 600}s</p>
                    </div>
                  </div>

                  <Input
                    label={t("profile.mfa.authCode")}
                    value={mfaCode}
                    onChange={setMfaCode}
                  />

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={enableMfa}
                      disabled={mfaActionLoading}
                      className="h-9 px-4 rounded-md bg-[#232323] hover:bg-[#111827] dark:bg-white dark:text-[#232323] dark:hover:bg-white/90 text-white text-sm font-semibold disabled:opacity-70 cursor-pointer"
                    >
                      {mfaActionLoading ? t("profile.mfa.enabling") : t("profile.mfa.enable")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSetupData(null);
                        setMfaCode('');
                        setMfaInfo('');
                        setMfaError('');
                      }}
                      disabled={mfaActionLoading}
                      className="h-9 px-4 rounded-md border border-black/10 dark:border-white/10 text-[#232323] dark:text-white text-sm font-medium disabled:opacity-70 cursor-pointer"
                    >
                      {t("common.cancel")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-black/10 dark:border-white/10 rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-[#232323] dark:text-white">{t("profile.mfa.disable")}</p>
                <Input
                  label={t("profile.mfa.currentCode")}
                  value={disableCode}
                  onChange={setDisableCode}
                />
                <button
                  type="button"
                  onClick={disableMfa}
                  disabled={mfaActionLoading}
                  className="h-9 px-4 rounded-md border border-red-300 text-red-600 dark:border-red-400/40 dark:text-red-400 text-sm font-semibold disabled:opacity-70 cursor-pointer"
                >
                  {mfaActionLoading ? t("profile.mfa.disabling") : t("profile.mfa.disable")}
                </button>
              </div>

              <div className="border border-black/10 dark:border-white/10 rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-[#232323] dark:text-white">{t("profile.mfa.regenerate")}</p>
                <Input
                  label={t("profile.mfa.currentCode")}
                  value={regenCode}
                  onChange={setRegenCode}
                />
                <button
                  type="button"
                  onClick={regenerateRecoveryCodes}
                  disabled={mfaActionLoading}
                  className="h-9 px-4 rounded-md border border-black/10 dark:border-white/10 text-[#232323] dark:text-white text-sm font-semibold disabled:opacity-70 cursor-pointer"
                >
                  {mfaActionLoading ? t("profile.mfa.regenerating") : t("profile.mfa.regenerateCodes")}
                </button>
              </div>
            </div>
          )}

          {recoveryCodes.length > 0 ? (
            <div className="border border-amber-300/60 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-400/30 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
                {t("profile.mfa.saveRecoveryNow")}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {recoveryCodes.map((item) => (
                  <div key={item} className="font-mono text-xs bg-white/80 dark:bg-black/20 rounded px-2 py-1 break-all text-[#232323] dark:text-white">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {mfaInfo ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{mfaInfo}</p> : null}
          {mfaError ? <p className="text-sm text-red-600">{mfaError}</p> : null}
        </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
