import React from "react";
import DashboardLayout from "../components/DashboardLayout";

export default function Settings() {
  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      <p className="text-gray-600">Application and user settings will be managed here.</p>
    </DashboardLayout>
  );
}
