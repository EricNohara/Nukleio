import { ReactNode, ButtonHTMLAttributes } from "react"

import styles from "./Buttons.module.css"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    href?: string;
}

export function ButtonOne({ children, className, ...props }: ButtonProps) {
    return <button className={`${styles.one} ${className || ""}`} {...props}>{children}</button>
}

export function ButtonTwo({ children, className, ...props }: ButtonProps) {
    return <button className={`${styles.two} ${className || ""}`} {...props}>{children}</button>
}

export function ButtonThree({ children, className, ...props }: ButtonProps) {
    return <button className={`${styles.three} ${className || ""}`} {...props}>{children}</button>
}

export function ButtonFour({ children, className, ...props }: ButtonProps) {
    return <button className={`${styles.four} ${className || ""}`} {...props}>{children}</button>
}

export function EditButton({ children, className, ...props }: ButtonProps) {
    return <button className={`${styles.edit} ${className || ""}`} {...props}>{children}</button>
}

export function DeleteButton({ children, className, ...props }: ButtonProps) {
    return <button className={`${styles.delete} ${className || ""}`} {...props}>{children}</button>
}

export function ExitButton({ children, className, ...props }: ButtonProps) {
    return <button className={`${styles.exit} ${className || ""}`} {...props}>{children}</button>
}

export function ExternalLinkButton({ children, className, ...props }: ButtonProps) {
    return <button className={`${styles.external} ${className || ""}`} {...props}>{children}</button>
}