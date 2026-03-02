import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Camera, User as UserIcon } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { Input } from "../components/Input.tsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import { apiFetch } from "../services/http.js";

export default function Profile() {
  const { orgSlug } = useParams();
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    setFirstName(user?.firstName || "");
    setLastName(user?.lastName || "");
    setAvatarUrl(user?.avatarUrl || "");
  }, [user?.firstName, user?.lastName, user?.avatarUrl]);

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
      setMessage('Profile updated successfully');
    } catch {
      setMessage('Failed to update profile');
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
        const absolute = payload.url.startsWith('http')
          ? payload.url
          : `${new URL(import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1').origin}${payload.url}`;
        setAvatarUrl(absolute);
      }

      await refreshProfile();
      setMessage('Avatar updated successfully');
    } catch (error) {
      setMessage(error?.message || 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-2 md:px-3 py-3 md:py-5 space-y-5">
        <div className="flex items-center gap-4">
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
                <UserIcon className="h-5 w-5" />
              </span>
              Profile
            </h2>
            <p className="text-[#232323]/60 dark:text-white/60 mt-1">Update your basic information and profile photo</p>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#F6F6F6] dark:bg-[#1e1e1e] shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.28)] p-5 md:p-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="relative h-16 w-16 rounded-full border border-gray-200 dark:border-gray-700 bg-muted/40 overflow-hidden group disabled:opacity-70"
                aria-label="Upload profile photo"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile avatar" className="h-full w-full object-cover" />
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
                <p className="text-sm font-medium text-[#232323] dark:text-white">Profile photo</p>
                <p className="text-xs text-[#232323]/60 dark:text-white/60">
                  Click the avatar to upload a new photo
                </p>
              </div>
            </div>

            <div>
              <Input label="First name" value={firstName} onChange={setFirstName} />
              <Input label="Last name" value={lastName} onChange={setLastName} />
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-black/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => navigate(`/dashboard/${orgSlug}`)}
                disabled={isSaving}
                className="h-9 px-4 rounded-md border border-black/10 dark:border-white/10 text-[#232323] dark:text-white text-sm font-medium disabled:opacity-70"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="h-9 px-4 rounded-md bg-[#232323] hover:bg-[#111827] dark:bg-white dark:text-[#232323] dark:hover:bg-white/90 text-white text-sm font-semibold disabled:opacity-70"
              >
                {isSaving ? "Saving..." : "Save profile"}
              </button>
            </div>

            {message ? <p className="text-sm text-[#232323]/70 dark:text-white/70">{message}</p> : null}
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
