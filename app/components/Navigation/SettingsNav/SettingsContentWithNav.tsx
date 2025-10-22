import SettingsNav from "./SettingsNav";
import styles from "./SettingsNav.module.css";

interface ISettingsContentWithNavProps {
    children: React.ReactNode;
    activeSetting: string;
}

export default function SettingsContentWithNav({ children, activeSetting }: ISettingsContentWithNavProps) {
    return (
        <div className={styles.settingsContentWithNav}>
            <SettingsNav activeSetting={activeSetting} />
            {children}
        </div>
    );
}
