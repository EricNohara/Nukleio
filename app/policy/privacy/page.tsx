import LogoLink from "@/app/components/TitleLogo/LogoLink/LogoLink";

import styles from "./PrivacyPage.module.css";

export const metadata = {
    title: "Privacy Policy | Nukleio",
    description: "Privacy Policy for Nukleio.",
};

function formatDate(d: Date) {
    return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "America/New_York",
    });
}

export default function PrivacyPolicyPage() {
    const lastUpdated = formatDate(new Date());

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Privacy Policy</h1>
                    <p className={styles.updated}>Last updated: {lastUpdated}</p>
                </div>
                <LogoLink />
            </header>

            <section className={styles.section}>
                <h2 className={styles.h2}>Summary</h2>
                <p className={styles.p}>
                    Nukleio collects basic account information when you sign in (for example
                    via Google OAuth) such as your name, email address, and profile image.
                    This information is used to create and manage your account and to
                    provide the service.
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.h2}>Information We Collect</h2>
                <ul className={styles.ul}>
                    <li>
                        <strong>Account info:</strong> name, email, and profile image (as
                        provided by your sign-in provider).
                    </li>
                    <li>
                        <strong>Usage info:</strong> basic logs needed to operate, secure, and
                        improve the service (e.g., timestamps, actions, and error logs).
                    </li>
                    <li>
                        <strong>Content you provide:</strong> any information you submit
                        inside Nukleio (for example profile details or documents you choose
                        to upload).
                    </li>
                </ul>
            </section>

            <section className={styles.section}>
                <h2 className={styles.h2}>How We Use Information</h2>
                <ul className={styles.ul}>
                    <li>Provide and maintain the service (authentication, account access).</li>
                    <li>Security, fraud prevention, and abuse monitoring.</li>
                    <li>Improve performance and user experience.</li>
                    <li>Communicate with you about important account or service updates.</li>
                </ul>
            </section>

            <section className={styles.section}>
                <h2 className={styles.h2}>Sharing</h2>
                <p className={styles.p}>
                    We do not sell your personal information. We may share information only
                    as needed to operate the service, such as with infrastructure providers
                    (hosting, database, storage) or when required by law.
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.h2}>Data Retention</h2>
                <p className={styles.p}>
                    We retain your information for as long as your account is active or as
                    needed to provide the service. You may request deletion at any time.
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.h2}>Your Choices</h2>
                <ul className={styles.ul}>
                    <li>You can stop using the service at any time.</li>
                    <li>
                        You may request access to or deletion of your account data by
                        contacting us.
                    </li>
                </ul>
            </section>

            <section className={styles.section}>
                <h2 className={styles.h2}>Contact</h2>
                <p className={styles.p}>
                    If you have questions or requests regarding this Privacy Policy, contact{" "}
                    <a className={styles.link} href="mailto:nukleio.official@gmail.com">
                        nukleio.official@gmail.com
                    </a>
                </p>
            </section>
        </main>
    );
}
