import { useEffect, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { fetchOrganization } from "../services/organizations";
import { useAuth } from "./AuthProvider.jsx";

const ROLE_PERMISSIONS = {
  Owner: ["dashboard", "execution", "analysis", "platform", "profile", "settings"],
  Admin: ["dashboard", "execution", "analysis", "platform", "profile", "settings"],
  Tester: ["dashboard", "execution", "platform", "profile"],
  Viewer: ["dashboard", "platform", "profile"],
};

export function RequireOrgAccess({ section = "dashboard", children }) {
  const { orgSlug } = useParams();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!isAuthenticated || !orgSlug || orgSlug === "no-org") {
        if (!cancelled) setChecking(false);
        return;
      }
      try {
        const org = await fetchOrganization(orgSlug);
        if (!cancelled) setRole(org.currentUserRole || "Viewer");
      } catch {
        if (!cancelled) setRole(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    setChecking(true);
    run();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, orgSlug]);

  if (isLoading || checking) {
    return <div className="p-6">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (!orgSlug || orgSlug === "no-org") {
    return <Navigate to="/dashboard/no-org" replace />;
  }

  if (!role) {
    return <Navigate to="/dashboard/no-org" replace />;
  }

  const allowed = ROLE_PERMISSIONS[role] || [];
  if (!allowed.includes(section)) {
    return <Navigate to={`/dashboard/${orgSlug}`} replace state={{ from: location }} />;
  }

  return children;
}

