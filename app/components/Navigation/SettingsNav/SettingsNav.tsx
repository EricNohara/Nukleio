import styles from "./SettingsNav.module.css";
import { headerFont } from "@/app/localFonts";
import { useRouter } from "next/navigation";

interface ISettingsLink {
    name: string;
    route: string;
}

interface ISettingsNavProps {
    activeSetting: string;
}

const settingsLinks: ISettingsLink[] = [
    { name: "App Settings", route: "/user/settings/app" },
    { name: "User Settings", route: "/user/settings/user" },
    { name: "Password", route: "/user/settings/password" },
    { name: "Billing", route: "/user/settings/billing" }
]

export default function SettingsNav({ activeSetting }: ISettingsNavProps) {
    const router = useRouter();

    return (
        <nav className={styles.settingsNav}>
            <ul className={styles.settingsNavList}>
                {
                    settingsLinks.map((link, index) =>
                        <li
                            key={index}
                            className={`${styles.navItem} ${headerFont.className} ${activeSetting === link.name ? styles.activeItem : ""}`}
                            onClick={() => router.push(link.route)}
                        >
                            {link.name}
                        </li>
                    )
                }
            </ul>
        </nav>
    );
}