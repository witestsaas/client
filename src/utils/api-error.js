export function toDisplayErrorMessage(input, fallback = "Something went wrong. Please try again.") {
  const raw = typeof input === "string"
    ? input
    : (input && typeof input === "object" && typeof input.message === "string" ? input.message : "");

  const message = String(raw || "").trim();
  if (!message) return fallback;

  const lowered = message.toLowerCase();

  if (lowered.includes("failed to fetch") || lowered.includes("networkerror") || lowered.includes("network request failed")) {
    return "Network connection issue. Please check your internet connection and try again.";
  }

  if (lowered.includes("502") || lowered.includes("bad gateway")) {
    return "Service is temporarily unavailable. Please retry in a few moments.";
  }

  if (lowered.startsWith("request failed")) {
    return "The request could not be completed. Please try again.";
  }

  return message;
}

export function createResponseError(response, payload, fallback) {
  const normalized = toDisplayErrorMessage(
    payload?.message || payload?.error,
    fallback || `Request failed (${response.status})`,
  );
  const error = new Error(normalized);
  error.status = response.status;
  error.code = payload?.code;
  error.payload = payload;
  return error;
}