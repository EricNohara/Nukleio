"use client";

import { Braces, Crown, Landmark } from "lucide-react";
import React, { useEffect, useState } from "react";

import { ButtonFour, ButtonOne } from "@/app/components/Buttons/Buttons";
import SubscriptionCard from "@/app/components/SubscriptionCard/SubscriptionCard";
import { useToast } from "@/app/context/ToastProvider";
import { headerFont } from "@/app/localFonts";

import styles from "./BillingPage.module.css";

type Tier = "free" | "developer" | "premium";
type Interval = "monthly" | "yearly";

type SubscriptionStatus = {
    tier: Tier; // from your subscription route
    status: string | null;
    priceId: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean | null;
    updatedAt: string | null;
};

const PRICE_IDS = {
    premium: {
        monthly: process.env.NEXT_PUBLIC_PREMIUM_MONTHLY_PRICE_ID!,
        yearly: process.env.NEXT_PUBLIC_PREMIUM_YEARLY_PRICE_ID!,
    },
    developer: {
        monthly: process.env.NEXT_PUBLIC_DEVELOPER_MONTHLY_PRICE_ID!,
        yearly: process.env.NEXT_PUBLIC_DEVELOPER_YEARLY_PRICE_ID!,
    },
} as const;

function assertPriceEnvs(): boolean {
    return Boolean(
        PRICE_IDS.premium.monthly &&
        PRICE_IDS.premium.yearly &&
        PRICE_IDS.developer.monthly &&
        PRICE_IDS.developer.yearly
    );
}

function deriveIntervalFromPriceId(priceId: string | null): Interval | null {
    if (!priceId) return null;
    if (priceId === PRICE_IDS.developer.monthly) return "monthly";
    if (priceId === PRICE_IDS.developer.yearly) return "yearly";
    if (priceId === PRICE_IDS.premium.monthly) return "monthly";
    if (priceId === PRICE_IDS.premium.yearly) return "yearly";
    return null;
}

// eslint-disable-next-line
async function postJson<T>(url: string, body?: any): Promise<T> {
    const res = await fetch(url, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        // eslint-disable-next-line
        const msg = (data as any)?.error || (data as any)?.message || `Request failed: ${res.status}`;
        throw new Error(msg);
    }
    return data as T;
}

export default function BillingPage() {
    const toast = useToast();

    const [sub, setSub] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<null | "checkout" | "portal">(null);
    const [selectedInterval, setSelectedInterval] = useState<Interval>("monthly");

    useEffect(() => {
        const loadSubscription = async () => {
            setLoading(true);
            try {
                if (!assertPriceEnvs()) {
                    throw new Error(
                        "Missing NEXT_PUBLIC_* price IDs in .env.local (restart dev server after editing)."
                    );
                }

                const res = await fetch("/api/internal/user/subscription", { method: "GET" });
                const data = (await res.json()) as SubscriptionStatus & {
                    error?: string;
                    message?: string;
                };

                if (!res.ok) {
                    throw new Error(data.error || data.message || "Failed to load subscription.");
                }

                setSub(data ?? null);

                const inferred = deriveIntervalFromPriceId(data?.priceId ?? null);
                if (inferred) setSelectedInterval(inferred);
            } catch (e) {
                const err = e as Error;
                toast.error("Error", err.message ?? "Failed to load subscription.");
            } finally {
                setLoading(false);
            }
        };

        loadSubscription();
    }, [toast]);

    const startCheckout = async (tier: Exclude<Tier, "free">, interval: Interval) => {
        setActionLoading("checkout");
        try {
            const priceId = PRICE_IDS[tier][interval];

            const { url } = await postJson<{ url: string }>("/api/internal/stripe/checkout", {
                priceId,
            });

            window.location.assign(url);
        } catch (e) {
            const err = e as Error;
            toast.error("Error", err.message ?? "Failed to start checkout.");
            setActionLoading(null);
        }
    };

    const openPortal = async () => {
        setActionLoading("portal");
        try {
            const { url } = await postJson<{ url: string }>("/api/internal/stripe/portal");
            window.location.assign(url);
        } catch (e) {
            const err = e as Error;
            toast.error("Error", err.message ?? "Failed to open billing portal.");
            setActionLoading(null);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.formHeader}>
                <div className={styles.headerText}>
                    <h1 className={`${headerFont.className} ${styles.formTitle}`}>
                        Subscription
                    </h1>
                </div>

                <div className={styles.buttons}>
                    <ButtonOne
                        onClick={openPortal}
                        disabled={actionLoading !== null}
                    >
                        Manage billing
                    </ButtonOne>

                    {
                        selectedInterval === "monthly" ?
                            <ButtonOne
                                onClick={() => setSelectedInterval("monthly")}
                                disabled={actionLoading !== null}
                            >
                                Monthly
                            </ButtonOne> :
                            <ButtonFour
                                onClick={() => setSelectedInterval("monthly")}
                                disabled={actionLoading !== null}
                            >
                                Monthly
                            </ButtonFour>
                    }
                    {
                        selectedInterval === "yearly" ?
                            <ButtonOne
                                onClick={() => setSelectedInterval("yearly")}
                                disabled={actionLoading !== null}
                            >
                                Yearly
                            </ButtonOne> :
                            <ButtonFour
                                onClick={() => setSelectedInterval("yearly")}
                                disabled={actionLoading !== null}
                            >
                                Yearly
                            </ButtonFour>
                    }
                </div>
            </div>

            {/* Plans */}
            <div className={styles.plans}>
                <SubscriptionCard
                    tier="free"
                    title="Free plan"
                    titleIcon={Landmark}
                    subtitle="Default plan for small portfolios"
                    price="0"
                    billingInterval={selectedInterval}
                    benefits={["1 free API key", "Weekly performance stats", "1 free AI generation"]}
                    onCheckout={startCheckout}
                    isLoading={loading}
                    disabled={loading}
                    active={sub?.tier === "free"}
                    onPortal={openPortal}
                    currentTier={sub?.tier ?? "free"}
                />

                <SubscriptionCard
                    tier="developer"
                    title="Developer plan"
                    titleIcon={Braces}
                    subtitle="Best for software developers"
                    price={selectedInterval === "monthly" ? "0.99" : "10.99"}
                    billingInterval={selectedInterval}
                    benefits={["5 API keys", "Weekly performance emails", "Template marketplace access"]}
                    onCheckout={startCheckout}
                    isLoading={loading}
                    disabled={loading}
                    active={sub?.tier === "developer"}
                    onPortal={openPortal}
                    currentTier={sub?.tier ?? "developer"}
                />

                <SubscriptionCard
                    tier="premium"
                    title="Premium plan"
                    titleIcon={Crown}
                    subtitle="Best for active job seekers"
                    price={selectedInterval === "monthly" ? "4.99" : "54.99"}
                    billingInterval={selectedInterval}
                    benefits={["Unlimited API keys", "Template marketplace access", "Unlimited AI usage"]}
                    onCheckout={startCheckout}
                    isLoading={loading}
                    disabled={loading}
                    active={sub?.tier === "premium"}
                    onPortal={openPortal}
                    currentTier={sub?.tier ?? "premium"}
                />
            </div>
        </div>
    );
}