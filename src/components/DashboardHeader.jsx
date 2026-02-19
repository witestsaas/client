import React from "react";
import { BellIcon, SunIcon, MoonIcon } from "@heroicons/react/24/outline";

export default function DashboardHeader() {
  // Placeholder for theme and notifications
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
      <div className="font-bold text-lg text-blue-900 tracking-tight">Dashboard</div>
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full hover:bg-blue-50 text-blue-600">
          <BellIcon className="w-6 h-6" />
        </button>
        <button className="p-2 rounded-full hover:bg-blue-50 text-blue-600">
          <SunIcon className="w-6 h-6" />
        </button>
        <button className="p-2 rounded-full hover:bg-blue-50 text-blue-600">
          <MoonIcon className="w-6 h-6" />
        </button>
        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-900">JD</div>
      </div>
    </header>
  );
}
