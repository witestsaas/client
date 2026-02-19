import React from "react";
import DashboardLayout from "../components/DashboardLayout";

export default function Execution() {
  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold mb-4">Execution</h2>
      <p className="text-gray-600">Test execution and results will be displayed here.</p>
    </DashboardLayout>
  );
}
