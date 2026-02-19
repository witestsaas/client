import React from "react";
import { useParams } from "react-router-dom";
import { UserCircleIcon } from "@heroicons/react/24/solid";

export default function UserContextBar() {
  // In a real app, user/org info would come from context or API
  const { orgSlug } = useParams();
  const user = {
    name: "Jane Doe",
    email: "jane.doe@example.com",
    org: orgSlug || "demo-org",
  };
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border-b border-blue-100">
      <UserCircleIcon className="w-8 h-8 text-blue-400" />
      <div>
        <div className="font-semibold text-blue-900">{user.name}</div>
        <div className="text-xs text-blue-700">{user.email}</div>
        <div className="text-xs text-blue-500">Org: {user.org}</div>
      </div>
    </div>
  );
}
