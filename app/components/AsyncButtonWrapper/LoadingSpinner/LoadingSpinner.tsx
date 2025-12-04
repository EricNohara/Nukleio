import styles from "./LoadingSpinner.module.css";

export default function LoadingSpinner() {
    return <div className={styles.spinner} />;
}

export function PrimaryLoadingSpinner() {
    return <div className={styles.primarySpinner} />;
}