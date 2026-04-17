import { useEffect, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { fetchOrganization, fetchUserOrganizations } from "../services/organizations";
import { useAuth } from "./AuthProvider.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ROLE_PERMISSIONS = {
  Owner: ["dashboard", "execution", "analysis", "platform", "profile", "settings"],
  Admin: ["dashboard", "execution", "analysis", "platform", "profile", "settings"],
  Tester: ["dashboard", "execution", "platform", "profile"],
  Viewer: ["dashboard", "platform", "profile"],
};

export function RequireOrgAccess({ section = "dashboard", children }) {
  const { orgSlug } = useParams();
  const location = useLocation();
  const { isAuthenticated, isLoading, refreshProfile } = useAuth();
  const [role, setRole] = useState(null);
  const [fallbackOrgSlug, setFallbackOrgSlug] = useState(null);
  const [checking, setChecking] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionRecovered, setSessionRecovered] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      let authenticated = isAuthenticated;

      if (!authenticated) {
        try {
          const profile = await refreshProfile();
          authenticated = Boolean(profile?.userId);
          if (!cancelled) {
            setSessionRecovered(authenticated);
          }
        } catch {
          authenticated = false;
          if (!cancelled) {
            setSessionRecovered(false);
          }
        }
      } else if (!cancelled) {
        setSessionRecovered(true);
      }

      if (!cancelled) {
        setSessionChecked(true);
      }

      if (!authenticated || !orgSlug || orgSlug === "no-org") {
        if (!cancelled) {
          setFallbackOrgSlug(null);
        }
        if (!cancelled) setChecking(false);
        return;
      }

      let resolvedRole = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const org = await fetchOrganization(orgSlug);
          resolvedRole = org.currentUserRole || "Viewer";
          break;
        } catch {
          await sleep(250);
        }
      }

      let resolvedFallbackOrgSlug = null;
      if (!resolvedRole) {
        try {
          const data = await fetchUserOrganizations();
          const organizations = Array.isArray(data?.organizations) ? data.organizations : [];
          const firstOrg = organizations[0]?.id;
          if (firstOrg && firstOrg !== orgSlug) {
            resolvedFallbackOrgSlug = firstOrg;
          }
        } catch {
          resolvedFallbackOrgSlug = null;
        }
      }

      if (!cancelled) {
        setRole(resolvedRole);
        setFallbackOrgSlug(resolvedFallbackOrgSlug);
        setChecking(false);
      }
    }

    setChecking(true);
    setSessionChecked(false);
    setSessionRecovered(false);
    run();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, orgSlug, refreshProfile]);

  if (isLoading || checking || !sessionChecked) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated && !sessionRecovered) {
    return <Navigate to="/signin" replace />;
  }

  if (!orgSlug || orgSlug === "no-org") {
    return <Navigate to="/dashboard/no-org" replace />;
  }

  if (!role) {
    if (fallbackOrgSlug) {
      return <Navigate to={`/dashboard/${fallbackOrgSlug}`} replace state={{ from: location }} />;
    }
    return <Navigate to="/dashboard/no-org" replace />;
  }

  const allowed = ROLE_PERMISSIONS[role] || [];
  if (!allowed.includes(section)) {
    return <Navigate to={`/dashboard/${orgSlug}`} replace state={{ from: location }} />;
  }

  return children;
}

