import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { apiFetch } from "../services/http";

/**
 * Sends a presence heartbeat every 10 seconds so the backend knows
 * the user is online. Tracks mouse / keyboard / click / scroll to
 * distinguish "active" from "idle" (120 s inactivity → idle).
 *
 * Mount once in DashboardLayout so it runs on every authenticated page.
 */
export function usePresenceHeartbeat(orgSlug: string | undefined) {
  const location = useLocation();

  useEffect(() => {
    if (!orgSlug) return;

    let lastActivityAt = Date.now();
    const idleTimeoutMs = 120_000;

    const markActive = () => {
      lastActivityAt = Date.now();
    };

    const sendHeartbeat = async () => {
      const isActive = Date.now() - lastActivityAt < idleTimeoutMs;
      try {
        await apiFetch("/presence/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPage: location?.pathname || window.location.pathname,
            isActive,
          }),
        });
      } catch {
        // heartbeat is best-effort
      }
    };

    sendHeartbeat();
    const heartbeatIntervalId = window.setInterval(sendHeartbeat, 10_000);

    window.addEventListener("mousemove", markActive, { passive: true });
    window.addEventListener("keydown", markActive, { passive: true });
    window.addEventListener("click", markActive, { passive: true });
    window.addEventListener("scroll", markActive, { passive: true });

    return () => {
      window.clearInterval(heartbeatIntervalId);
      window.removeEventListener("mousemove", markActive);
      window.removeEventListener("keydown", markActive);
      window.removeEventListener("click", markActive);
      window.removeEventListener("scroll", markActive);
    };
  }, [orgSlug, location?.pathname]);
}
