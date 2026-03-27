//------------------------------------------------------------------------------------------------------------------------------------------------------------

export function isQuotaDeniedError(error) {
  const status = Number(error?.status || error?.payload?.statusCode || 0);
  const code = String(error?.code || error?.payload?.code || "").toLowerCase();
  const message = String(error?.message || error?.payload?.message || "").toLowerCase();

  if (status === 429 || status === 402) return true;
  if (code.includes("quota") || code.includes("credit")) return true;
  if (message.includes("quota") || message.includes("credit") || message.includes("limit exceeded")) return true;

  return false;
}


//------------------------------------------------------------------------------------------------------------------------------------------------------------

export function getFeatureQuotaSnapshot(payload, feature) {
  const usageRows = Array.isArray(payload?.usage) ? payload.usage : [];
  const row = usageRows.find((item) => item?.feature === feature) || null;
  const couponRemainingUsd = Number(payload?.couponBalance?.totalRemainingUsd || 0);

  if (!row) {
    return { used: 0, limit: 0, remaining: 0, isUnlimited: false, isUnknown: true, hasCouponCredits: couponRemainingUsd > 0, couponRemainingUsd };
  }

  const used = Number(row?.used || 0);
  const limit = Number(row?.limit ?? 0);
  const remaining = Number(row?.remaining ?? (limit >= 0 ? Math.max(0, limit - used) : -1));

  return {
    used,
    limit,
    remaining,
    isUnlimited: limit < 0,
    isUnknown: false,
    hasCouponCredits: couponRemainingUsd > 0,
    couponRemainingUsd,
  };
}
