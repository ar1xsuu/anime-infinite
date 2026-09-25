import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Placeholder card/pack art ships as local SVG; Supabase Storage image
    // uploads are typically PNG/JPG/WEBP and are served from your project's
    // own storage domain, which Next needs to be told is allowed to optimize.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
