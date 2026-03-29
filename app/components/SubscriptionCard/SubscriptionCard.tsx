import { BadgeCheck, LucideIcon, CircleCheck } from "lucide-react";

import { titleFont, headerFont } from "@/app/localFonts";

import styles from "./SubscriptionCard.module.css";
import LoadableButtonContent from "../AsyncButtonWrapper/LoadableButtonContent/LoadableButtonContent";
import { ButtonOne } from "../Buttons/Buttons";


type Tier = "free" | "developer" | "premium";
type Interval = "monthly" | "yearly";

interface ISubscriptionCardProps {
    tier: Tier;
    title: string;
    titleIcon: LucideIcon;
    subtitle: string;
    price: string;
    billingInterval: Interval;
    benefits: string[];
    onCheckout: (tier: Exclude<Tier, "free">, interval: Interval) => Promise<void>;
    isLoading: boolean;
    disabled: boolean;
    active: boolean;
    onPortal?: () => Promise<void>;
    currentTier: Tier;
}

export default function SubscriptionCard(
    { tier, title, titleIcon, subtitle, price, billingInterval, benefits, onCheckout, isLoading, disabled, active, onPortal, currentTier }: ISubscriptionCardProps) {
    const TitleIcon = titleIcon;

    const handleClick = async () => {
        // Free plan: no checkout
        if (tier === "free") {
            if (currentTier !== "free") {
                await onPortal?.();
            }
            return;
        }
        // paid tiers have normal checkout
        await onCheckout(tier, billingInterval);
    };

    const buttonLabel =
        tier === "free"
            ? active
                ? "Current plan"
                : "Free plan"
            : active
                ? "Current plan"
                : "Choose this plan";

    const buttonDisabled =
        disabled ||
        isLoading ||
        (tier === "free" && currentTier === "free") || // free + already free => disabled
        (tier !== "free" && active);

    return (
        <div className={`${styles.card} ${active && styles.activeCard}`}>
            <div className={styles.header}>
                <h1 className={headerFont.className}>
                    <TitleIcon />
                    {title}
                </h1>
                <h3 className={headerFont.className}>{subtitle}</h3>
            </div>

            <div className={styles.pricing}>
                <b className={titleFont.className}>$ {price} USD</b>
                <p className={titleFont.className}>{billingInterval}</p>
            </div>

            <ul className={styles.benefitsList}>
                {
                    benefits.map((b, i) =>
                        <li key={i} className={styles.benefit}>
                            <BadgeCheck size={20} color="var(--btn-1)" />
                            <p>{b}</p>
                        </li>
                    )
                }
            </ul>

            <div className={styles.divider} />

            <a className={styles.moreInfo} href="/documentation/pricing">More information</a>

            <ButtonOne onClick={handleClick} disabled={buttonDisabled}>
                <LoadableButtonContent isLoading={isLoading} buttonLabel={buttonLabel} />
            </ButtonOne>

            {/* active icon */}
            {
                active && <CircleCheck className={styles.activeIcon} />
            }
        </div>
    )
}