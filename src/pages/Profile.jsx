import React from "react";
import DashboardLayout from "../components/DashboardLayout";

export default function Profile() {
  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      <p className="text-gray-600">User profile details and settings will appear here.</p>
    </DashboardLayout>
  );
}
