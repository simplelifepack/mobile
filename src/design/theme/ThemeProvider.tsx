import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { ThemeProvider as StyledThemeProvider } from 'styled-components/native';
import { darkTheme } from './dark';
import { lightTheme } from './light';
import type { AppTheme, ThemeMode } from './types';
type ThemeContextValue = {
  mode: ThemeMode;
  theme: AppTheme;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};
const ThemeModeContext = createContext<ThemeContextValue | null>(null);
export function AppThemeProvider({ children }: React.PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');
  const resolvedMode = mode === 'system' ? (systemScheme ?? 'light') : mode;
  const theme = resolvedMode === 'dark' ? darkTheme : lightTheme;
  const toggleTheme = useCallback(
    () => setMode(current => (current === 'dark' ? 'light' : 'dark')),
    [],
  );
  const value = useMemo(
    () => ({ mode, theme, setMode, toggleTheme }),
    [mode, theme, toggleTheme],
  );
  return (
    <ThemeModeContext.Provider value={value}>
      <StyledThemeProvider theme={theme}>{children}</StyledThemeProvider>
    </ThemeModeContext.Provider>
  );
}
export function useAppTheme() {
  const value = useContext(ThemeModeContext);
  if (!value)
    throw new Error('useAppTheme must be used inside AppThemeProvider');
  return value;
}
