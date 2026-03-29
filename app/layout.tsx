import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import BodyWrapper from "./components/BodyWrapper/BodyWrapper";
import ThemeInit from "./components/ThemeInit";
import { AuthProvider } from "./context/AuthProvider";
import { TierProvider } from "./context/TierProvider";
import { ToastProvider } from "./context/ToastProvider";
import { UserProvider } from "./context/UserProvider";
import { baseFont } from "./localFonts";

export const metadata = {
  title: "Nukleio",
  description: "All in one solution for portfolio website management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={baseFont.className}>
      <head>
        <link rel="icon" href="/icons/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" crossOrigin="use-credentials" />
        <link rel="preload" href="/fonts/baseFont.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/titleFont.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/headerFont.woff2" as="font" type="font/woff2" crossOrigin="" />
        <meta name="theme-color" content="#FFFFFF"></meta>
      </head>
      <body>
        <ThemeInit />
        <AuthProvider>
          <UserProvider>
            <ToastProvider>
              <TierProvider>
                <BodyWrapper>
                  {children}
                  <SpeedInsights />
                  <Analytics />
                </BodyWrapper>
              </TierProvider>
            </ToastProvider>
          </UserProvider>
        </AuthProvider>
      </body>
    </html >
  );
}
