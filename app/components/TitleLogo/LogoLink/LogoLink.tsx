import Image from "next/image";
import Link from "next/link";

export default function LogoLink() {
    return (
        <Link href="/">
            <Image
                src="/images/navbar-logo.png"
                width={50}
                height={50}
                alt="Nukleio Logo"
            />
        </Link>
    );
}