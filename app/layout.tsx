import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import BodyWrapper from "./components/BodyWrapper/BodyWrapper";
import { AuthProvider } from "./context/AuthProvider";
import LocalizationProviderWrapper from "./context/LocalizationProviderWrapper";
import { UserProvider } from "./context/UserProvider";

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
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" crossOrigin="use-credentials" />
        <meta name="theme-color" content="#FFFFFF"></meta>
      </head>
      <body>
        <AuthProvider>
          <UserProvider>
            <LocalizationProviderWrapper>
              <BodyWrapper>
                {children}
                <SpeedInsights />
                <Analytics />
              </BodyWrapper>
            </LocalizationProviderWrapper>
          </UserProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
