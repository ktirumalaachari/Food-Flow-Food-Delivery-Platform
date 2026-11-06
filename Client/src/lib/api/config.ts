/**
 * Dynamic Server Base URL Resolver:
 * Automatically uses window.location.hostname when accessed from another PC/phone on the same Wi-Fi/LAN,
 * ensuring seamless API and Socket connectivity across local network devices.
 */
export function getServerBaseUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_SERVER_BASE_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    process.env.NEXT_PUBLIC_SERVER_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.SERVER_BASE_URL ||
    process.env.SERVER_URL;

  // In production with an explicit environment variable set, ALWAYS honor it!
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
  }

  // If in browser and accessed via local network LAN IP (e.g., 192.168.X.X), point to that same host on port 5000
  if (
    typeof window !== "undefined" &&
    window.location &&
    window.location.hostname
  ) {
    const host = window.location.hostname;
    const isLocalLan =
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      host.startsWith("172.") ||
      host.endsWith(".local");

    if (isLocalLan) {
      const protocol = window.location.protocol || "http:";
      return `${protocol}//${host}:5000`;
    }

    if (host !== "localhost" && host !== "127.0.0.1") {
      if (!envUrl) {
        console.warn(
          "[FoodFlow] Warning: NEXT_PUBLIC_SERVER_BASE_URL is not set on Vercel. Please set it to your Render backend URL."
        );
      }
    }
  }

  return (envUrl || "http://localhost:5000")
    .replace(/\/api\/?$/, "")
    .replace(/\/$/, "");
}

export function getApiBaseUrl(): string {
  return `${getServerBaseUrl()}/api`;
}
