const DEFAULT_PRODUCTION_API = "https://api.itc.ci";

export const getApiBaseUrl = () => {
  const configuredBaseUrl = process.env.REACT_APP_API_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `${protocol}//${hostname}:5000`;
    }
  }

  return DEFAULT_PRODUCTION_API;
};

export const buildApiUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
};
