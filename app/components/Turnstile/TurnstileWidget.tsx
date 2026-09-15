"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

type TurnstileWidgetProps = {
  onTokenChange: (token: string | null) => void;
  resetSignal: number;
  messageClassName?: string;
};

export default function TurnstileWidget({
  onTokenChange,
  resetSignal,
  messageClassName,
}: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const previousResetSignalRef = useRef(resetSignal);
  const [error, setError] = useState<string | null>(null);

  const renderWidget = useCallback(() => {
    if (!siteKey || !containerRef.current || !window.turnstile || widgetIdRef.current) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token) => {
        setError(null);
        onTokenChange(token);
      },
      "expired-callback": () => {
        onTokenChange(null);
        setError("The CAPTCHA expired. Please complete it again.");
      },
      "error-callback": () => {
        onTokenChange(null);
        setError("The CAPTCHA could not be verified. Please try again.");
      },
    });
  }, [onTokenChange, siteKey]);

  useEffect(() => {
    renderWidget();
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

  useEffect(() => {
    if (previousResetSignalRef.current === resetSignal) return;
    previousResetSignalRef.current = resetSignal;
    onTokenChange(null);
    setError(null);
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [onTokenChange, resetSignal]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={renderWidget}
      />
      <div ref={containerRef} />
      {!siteKey && (
        <p className={messageClassName}>
          Verification is temporarily unavailable. Please try again later.
        </p>
      )}
      {error && <p className={messageClassName}>{error}</p>}
    </>
  );
}
