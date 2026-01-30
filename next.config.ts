import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const SUPABASE_URL = "https://jfsetifsqcpkwdtcrhdt.supabase.co";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase storage
      {
        protocol: "https",
        hostname: "jfsetifsqcpkwdtcrhdt.supabase.co",
        pathname: "/**",
      },

      // Google avatars
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },

      // GitHub avatars
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },

      // GitLab avatars
      {
        protocol: "https",
        hostname: "assets.gitlab-static.net",
        pathname: "/**",
      },

      // Microsoft avatars
      {
        protocol: "https",
        hostname: "graph.microsoft.com",
        pathname: "/**",
      },

      // LinkedIn avatars
      {
        protocol: "https",
        hostname: "media.licdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media-exp1.licdn.com",
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
              connect-src 
                'self'
                https://vercel.analytics.edge.com
                https://api.vercel.com
                https://m2uyqee3yri2agbs2vqroykaw40lcmud.lambda-url.us-east-2.on.aws
                ${SUPABASE_URL}
                https://graph.microsoft.com
                https://accounts.google.com
                https://oauth2.googleapis.com
                https://api.github.com
                https://www.linkedin.com
                https://api.linkedin.com
                https://gitlab.com;
              font-src 'self' https://fonts.gstatic.com;
              frame-src
                'self'
                https://vercel.live
                https://jfsetifsqcpkwdtcrhdt.supabase.co
                https://accounts.google.com
                https://login.microsoftonline.com
                https://github.com
                https://www.linkedin.com
                https://gitlab.com;
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
