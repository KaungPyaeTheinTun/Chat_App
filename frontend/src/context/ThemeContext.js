import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { themes } from "../styles/colors";

const ThemeContext = createContext(null);
const THEME_STORAGE_KEY = "chatapp.themeMode";

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState("light");

  useEffect(() => {
    const loadTheme = async () => {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode === "dark" || savedMode === "light") {
        setMode(savedMode);
      }
    };

    loadTheme();
  }, []);

  const setThemeMode = useCallback(async (nextMode) => {
    const normalizedMode = nextMode === "dark" ? "dark" : "light";
    setMode(normalizedMode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, normalizedMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode(mode === "dark" ? "light" : "dark");
  }, [mode, setThemeMode]);

  const value = useMemo(
    () => ({
      mode,
      isDark: mode === "dark",
      theme: themes[mode],
      colors: themes[mode].colors,
      setThemeMode,
      toggleTheme,
    }),
    [mode, setThemeMode, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }

  return context;
};
