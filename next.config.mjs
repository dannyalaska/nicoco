/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Service worker must be served from the root scope with no-cache
        // so updates propagate reliably.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Content-Type", value: "application/manifest+json" }],
      },
    ];
  },
};

export default nextConfig;
