"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useToast } from "@/app/context/ToastProvider";

export type Tier = "free" | "developer" | "premium";

export type SubscriptionStatus = {
    tier: Tier;
    status: string | null;
    priceId: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean | null;
    updatedAt: string | null;
};

type TierContextValue = {
    tier: Tier;
    subscription: SubscriptionStatus | null;
    loading: boolean;
    refresh: () => Promise<void>;
};

const TierContext = createContext<TierContextValue | null>(null);

export function TierProvider({ children }: { children: React.ReactNode }) {
    const toast = useToast();

    const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const tier = subscription?.tier ?? "free";

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/internal/user/subscription", { method: "GET" });
            const data = (await res.json()) as SubscriptionStatus & { error?: string; message?: string };

            if (!res.ok) {
                // If unauthorized, treat as free
                if (res.status === 401) {
                    setSubscription(null);
                    return;
                }
                throw new Error(data.error || data.message || "Failed to load subscription.");
            }

            setSubscription(data ?? null);
        } catch (e) {
            const err = e as Error;
            toast.error("Error", err.message ?? "Failed to load subscription.");
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const value = useMemo<TierContextValue>(
        () => ({
            tier,
            subscription,
            loading,
            refresh,
        }),
        [tier, subscription, loading, refresh]
    );

    return <TierContext.Provider value={value}>{children}</TierContext.Provider>;
}

export function useTier() {
    const ctx = useContext(TierContext);
    if (!ctx) throw new Error("useTier must be used within a TierProvider");
    return ctx;
}

// Optional helper for comparisons
const ORDER: Record<Tier, number> = { free: 0, developer: 1, premium: 2 };

export function hasTier(userTier: Tier, required: Tier) {
    return ORDER[userTier] >= ORDER[required];
}