import { AppWindow, DollarSign, KeySquare, LucideIcon, User } from "lucide-react";
import { useRouter } from "next/navigation";

import { headerFont } from "@/app/localFonts";

import styles from "./SettingsNav.module.css";

interface ISettingsLink {
    name: string;
    route: string;
    icon: LucideIcon;
}

interface ISettingsNavProps {
    activeSetting: string;
}

const settingsLinks: ISettingsLink[] = [
    { name: "App", route: "/user/settings/app", icon: AppWindow },
    { name: "User", route: "/user/settings/user", icon: User },
    { name: "Password", route: "/user/settings/password", icon: KeySquare },
    { name: "Billing", route: "/user/settings/billing", icon: DollarSign }
];

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
                            <link.icon />
                            {link.name}
                        </li>
                    )
                }
            </ul>
        </nav>
    );
}