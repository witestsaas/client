import React from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../auth/AuthProvider.jsx";

export default function Profile() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-2xl">
        <div>
          <h2 className="text-3xl font-bold text-[#232323] dark:text-white">Profile</h2>
          <p className="text-[#232323]/70 dark:text-white/70">Update your basic information and profile photo.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#232323]/60 dark:text-white/60 mb-1">First Name</p>
              <p className="font-semibold text-[#232323] dark:text-white">{user?.firstName || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-[#232323]/60 dark:text-white/60 mb-1">Last Name</p>
              <p className="font-semibold text-[#232323] dark:text-white">{user?.lastName || "-"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-[#232323]/60 dark:text-white/60 mb-1">Email</p>
              <p className="font-semibold text-[#232323] dark:text-white">{user?.email || "-"}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
