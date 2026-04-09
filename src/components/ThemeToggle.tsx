import { useId } from "react";
import { useTheme, type ThemePreference } from "../lib/theme";

const THEME_LABELS: Record<ThemePreference, string> = {
  system: "Automático",
  light: "Claro",
  dark: "Oscuro",
};

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const id = useId();
  const { preference, resolvedTheme, setPreference } = useTheme();

  return (
    <div className={`theme-toggle ${compact ? "compact" : ""}`}>
      <label className="theme-toggle-label" htmlFor={id}>
        Tema
      </label>
      <select
        id={id}
        className="theme-select"
        value={preference}
        onChange={(event) => setPreference(event.target.value as ThemePreference)}
        aria-label={`Tema actual: ${THEME_LABELS[preference]}`}
        title={
          preference === "system"
            ? `Tema automático (${resolvedTheme === "dark" ? "oscuro" : "claro"})`
            : `Tema ${THEME_LABELS[preference].toLowerCase()}`
        }
      >
        <option value="system">Automático</option>
        <option value="light">Claro</option>
        <option value="dark">Oscuro</option>
      </select>
    </div>
  );
}
