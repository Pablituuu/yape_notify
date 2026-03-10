import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme as useDeviceColorScheme } from "react-native";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceTheme = useDeviceColorScheme();
  const [theme, setThemeState] = useState<Theme>(
    deviceTheme === "dark" ? "dark" : "light",
  );

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === "dark",
        toggleTheme,
        setTheme: setThemeState,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useAppTheme must be used within a ThemeProvider");
  }
  return context;
}
