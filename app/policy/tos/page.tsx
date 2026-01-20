// app/terms/page.tsx
import LogoLink from "@/app/components/TitleLogo/LogoLink/LogoLink";

import styles from "./TermsPage.module.css";

export const metadata = {
    title: "Terms of Service | Nukleio",
    description: "Terms of Service for Nukleio.",
};

function formatDate(d: Date) {
    return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "America/New_York",
    });
}

export default function TermsOfServicePage() {
    const lastUpdated = formatDate(new Date());

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Terms of Service</h1>
                    <p className={styles.updated}>Last updated: {lastUpdated}</p>
                </div>
                <LogoLink />
            </header>

            <section className={styles.section}>
                <h2 className={styles.h2}>Acceptance of These Terms</h2>
                <p className={styles.p}>
                    By accessing or using Nukleio, you agree to these Terms of Service. If
                    you do not agree, do not use the service.
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.h2}>Using the Service</h2>
                <ul className={styles.ul}>
                    <li>You must use Nukleio in compliance with applicable laws.</li>
                    <li>You are responsible for activity on your account and keeping access secure.</li>
                    <li>
                        You agree not to misuse the service (e.g., attempting unauthorized access,
                        disrupting operations, or abusing others).
                    </li>
                </ul>
            </section>

            <section className={styles.section}>
                <h2 className={styles.h2}>Accounts and Content</h2>
                <p className={styles.p}>
                    You may provide content to Nukleio. You retain ownership of your content,
                    and you grant Nukleio permission to store and process it only as needed to
                    provide the service.
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.h2}>Service Availability</h2>
                <p className={styles.p}>
                    Nukleio is provided “as is” and “as available” without warranties of any kind.
                    We may modify, suspend, or discontinue any part of the service at any time.
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.h2}>Termination</h2>
                <p className={styles.p}>
                    We may suspend or terminate access to Nukleio if we reasonably believe there is
                    misuse, security risk, or violation of these terms.
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.h2}>Limitation of Liability</h2>
                <p className={styles.p}>
                    To the maximum extent permitted by law, Nukleio will not be liable for any
                    indirect, incidental, special, consequential, or punitive damages, or any loss
                    of profits or data.
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.h2}>Changes to These Terms</h2>
                <p className={styles.p}>
                    We may update these Terms from time to time. Continued use of Nukleio after
                    changes means you accept the updated Terms.
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.h2}>Contact</h2>
                <p className={styles.p}>
                    Questions about these Terms?{" "}
                    <a className={styles.link} href="mailto:nukleio.official@gmail.com">
                        nukleio.official@gmail.com
                    </a>
                </p>
            </section>
        </main>
    );
}
