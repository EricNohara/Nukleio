import { headerFont } from "@/app/localFonts";

import styles from "./PageContentHeader.module.css";
import { AsyncButtonWrapper } from "../AsyncButtonWrapper/AsyncButtonWrapper";
import LoadableButtonContent from "../AsyncButtonWrapper/LoadableButtonContent/LoadableButtonContent";
import { ButtonOne, ButtonFour } from "../Buttons/Buttons";

export interface IButton {
    name: string;
    onClick?: () => void;
    isAsync?: boolean;
    type?: "button" | "submit";
    form?: string;          // form id to submit (works even outside form)
    disabled?: boolean;
    isLoading?: boolean;
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
                {buttonFour && (
                    (buttonFour.isAsync ?? false) ? (
                        <AsyncButtonWrapper
                            button={
                                <ButtonFour
                                    type={buttonFour.type ?? "button"}
                                    form={buttonFour.form}
                                    disabled={buttonFour.disabled}
                                >
                                    {
                                        buttonFour.isLoading ?
                                            <LoadableButtonContent isLoading={buttonFour.isLoading} buttonLabel={buttonFour.name} />
                                            : buttonFour.name
                                    }
                                </ButtonFour>
                            }
                            onClick={buttonFour.onClick ?? (() => { })}
                        />
                    ) : (
                        <ButtonFour
                            type={buttonFour.type ?? "button"}
                            form={buttonFour.form}
                            disabled={buttonFour.disabled}
                            onClick={buttonFour.onClick}
                        >
                            {buttonFour.name}
                        </ButtonFour>
                    )
                )}
                {buttonOne && (
                    (buttonOne.isAsync ?? false) ? (
                        <AsyncButtonWrapper
                            button={
                                <ButtonOne
                                    type={buttonOne.type ?? "button"}
                                    form={buttonOne.form}
                                    disabled={buttonOne.disabled}
                                >
                                    {
                                        buttonOne.isLoading ?
                                            <LoadableButtonContent isLoading={buttonOne.isLoading} buttonLabel={buttonOne.name} />
                                            : buttonOne.name
                                    }
                                </ButtonOne>
                            }
                            onClick={buttonOne.onClick ?? (() => { })}
                        />
                    ) : (
                        <ButtonOne
                            type={buttonOne.type ?? "button"}
                            form={buttonOne.form}
                            disabled={buttonOne.disabled}
                            onClick={buttonOne.onClick}
                        >
                            {buttonOne.name}
                        </ButtonOne>
                    )
                )}
            </div>
        </div>
    );
}