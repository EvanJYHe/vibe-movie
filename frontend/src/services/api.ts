const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "";
const apiBaseUrl = configuredBaseUrl.replace(/\/$/, "");

export function apiUrl(path: string) {
  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
