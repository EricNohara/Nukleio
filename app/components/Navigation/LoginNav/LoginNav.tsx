import { headerFont } from "@/app/localFonts";

import styles from "./LoginNav.module.css";
import landingStyles from "../LandingNav/LandingNav.module.css";

export default function LoginNav() {
    return (
        <nav className={styles.loginNav}>
            <ul className={`${landingStyles.landingLinks} ${headerFont.className}`}>
                <li className={headerFont.className}><a href="/documentation/product">Product</a></li>
                <li className={headerFont.className}><a href="/documentation/doc">Docs</a></li>
                <li className={headerFont.className}><a href="/documentation/pricing">Pricing</a></li>
                <li className={headerFont.className}><a href="/documentation/contact">Contact</a></li>
            </ul>
        </nav>
    );
}