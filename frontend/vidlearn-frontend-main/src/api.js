// Centralised API helper.
//
// - Sends cookies on every request (session + CSRF).
// - Automatically attaches the CSRF token (X-CSRFToken header) to state-changing
//   requests, fetching one from /csrf-token if the cookie isn't set yet.
//
// VITE_API_URL is empty in production (same-origin, relative URLs).

export const API = import.meta.env.VITE_API_URL || "";

function readCookie(name) {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : "";
}

async function ensureCsrfToken() {
  let token = readCookie("csrf_token");
  if (!token) {
    try {
      const res = await fetch(`${API}/csrf-token`, { credentials: "include" });
      const data = await res.json();
      token = data.csrf_token || readCookie("csrf_token");
    } catch {
      token = "";
    }
  }
  return token;
}

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

// Drop-in replacement for fetch(`${API}${path}`, options).
export async function apiFetch(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = { ...(options.headers || {}) };

  if (!SAFE_METHODS.includes(method)) {
    headers["X-CSRFToken"] = await ensureCsrfToken();
  }

  return fetch(`${API}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });
}
