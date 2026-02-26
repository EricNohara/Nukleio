export type Theme = "light" | "dark";

export const THEME_KEY = "theme";

export function applyTheme(theme: Theme) {
  const root = document.documentElement; // <html>
  root.classList.toggle("dark-theme", theme === "dark");
}

export function setStoredTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export function getStoredTheme(): Theme | null {
  const v = localStorage.getItem(THEME_KEY);
  return v === "dark" || v === "light" ? v : null;
}
