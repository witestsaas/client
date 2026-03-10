import React from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Activity, Bot, Shield } from "lucide-react";

//------------------------------------------------------------------------------------------------------------------------------------------------------------

export default function Analysis() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold text-[#232323] dark:text-white">Analysis</h2>
        </div>
        
      </div>
    </DashboardLayout>
  );
}
