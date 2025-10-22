import { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { headerFont } from "@/app/localFonts";

import styles from "./ButtonListPopup.module.css";

type IButtonWithRoute = {
    icon: LucideIcon;
    name: string;
    route: string;
    action?: never;
};

type IButtonWithAction = {
    icon: LucideIcon;
    name: string;
    action: (() => void | null) | (() => Promise<void | null>);
    route?: never;
};

export type IButtonProp = IButtonWithRoute | IButtonWithAction;

export interface IButtonListPopupProps {
    buttons: IButtonProp[];
}

export default function ButtonListPopup({ buttons }: IButtonListPopupProps) {
    const router = useRouter();

    const handleClick = (button: IButtonProp) => {
        if ("route" in button) router.push(button.route as string);
        else if ("action" in button) button.action?.();
    }

    return (
        <div className={styles.container}>
            {buttons.map((button, i) => (
                < button
                    key={i}
                    className={styles.button}
                    onClick={() => handleClick(button)}
                >
                    <button.icon strokeWidth={1} />
                    <p className={`${styles.buttonName} ${headerFont.className}`}>{button.name}</p>
                </button>
            ))}
        </div >
    );
}