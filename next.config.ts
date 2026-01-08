import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const SUPABASE_URL = "https://jfsetifsqcpkwdtcrhdt.supabase.co";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jfsetifsqcpkwdtcrhdt.supabase.co",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)", // apply to all routes
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' ${
                isDev ? "'unsafe-eval'" : ""
              } https://vercel.analytics.edge.com https://cdn.vercel-insights.com https://vercel.live https://va.vercel-scripts.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              img-src 'self' data: https:;
              connect-src 'self' https://vercel.analytics.edge.com https://api.vercel.com https://m2uyqee3yri2agbs2vqroykaw40lcmud.lambda-url.us-east-2.on.aws ${SUPABASE_URL};
              font-src 'self' https://fonts.gstatic.com;
              frame-src https://vercel.live https://jfsetifsqcpkwdtcrhdt.supabase.co;
              object-src 'none';
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'self';
            `
              .replace(/\s{2,}/g, " ")
              .trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
