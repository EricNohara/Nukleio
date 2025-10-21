import Image from "next/image";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app/context/AuthProvider";
import { titleFont } from "@/app/localFonts";

import styles from "./TitleLogo.module.css";

export default function TitleLogo() {
    const router = useRouter();
    const { isLoggedIn } = useAuth();

    const handleClick = () => {
        if (!isLoggedIn) router.push("/")
        else router.push("/user")
    }

    return (
        <div className={`${styles.container} ${titleFont.className}`} onClick={handleClick}>
            <Image src="/images/navbar-logo.png" width={50} height={50} alt="Nukleio Logo" />
            <h1>Nukleio</h1>
        </div >
    );
}