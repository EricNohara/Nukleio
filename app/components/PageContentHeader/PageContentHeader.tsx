import { headerFont } from "@/app/localFonts";

import styles from "./PageContentHeader.module.css";
import { AsyncButtonWrapper } from "../AsyncButtonWrapper/AsyncButtonWrapper";
import { ButtonOne, ButtonFour } from "../Buttons/Buttons";

export interface IButton {
    name: string;
    onClick: () => void;
    isAsync?: boolean;
}

export interface IPageContentHeaderProps {
    title: string;
    buttonOne?: IButton;
    buttonFour?: IButton | null;
}

export default function PageContentHeader({ title, buttonOne, buttonFour }: IPageContentHeaderProps) {
    return (
        <div className={styles.container}>
            <h1 className={`${styles.title} ${headerFont.className}`}>{title}</h1>
            <div className={styles.buttons}>
                {buttonFour &&
                    ((buttonFour.isAsync ?? false) ?
                        <AsyncButtonWrapper
                            button={<ButtonFour >{buttonFour.name}</ButtonFour>}
                            onClick={buttonFour.onClick}
                        /> :
                        <ButtonFour onClick={buttonFour.onClick}>{buttonFour.name}</ButtonFour>)
                }
                {buttonOne &&
                    ((buttonOne.isAsync ?? false) ?
                        <AsyncButtonWrapper
                            button={<ButtonOne>{buttonOne.name}</ButtonOne>}
                            onClick={buttonOne.onClick}
                        /> :
                        <ButtonOne onClick={buttonOne.onClick}>{buttonOne.name}</ButtonOne>)
                }
            </div>
        </div>
    );
}