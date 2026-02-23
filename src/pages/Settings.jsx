import React from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Bell, Lock, Shield, Sliders } from "lucide-react";

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold text-[#232323] dark:text-white">Settings</h2>
          <p className="text-[#232323]/70 dark:text-white/70">Configure integrations, notifications, and security.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "Integrations", desc: "Connect external tools", icon: Sliders },
            { title: "Notifications", desc: "Choose alert preferences", icon: Bell },
            { title: "Security", desc: "Manage access controls", icon: Shield },
            { title: "Authentication", desc: "Update identity settings", icon: Lock },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-card p-4 hover:border-[#FFAA00]/60 transition-all">
              <item.icon className="h-5 w-5 text-[#FFAA00] mb-2" />
              <h3 className="font-semibold text-[#232323] dark:text-white">{item.title}</h3>
              <p className="text-sm text-[#232323]/60 dark:text-white/60">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
