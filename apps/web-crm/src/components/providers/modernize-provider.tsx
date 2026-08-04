"use client";

import { CssBaseline, ThemeProvider } from "@mui/material";
import { ThemeModeProvider, useThemeMode } from "@/src/context/theme-mode-context";
import { darkTheme, lightTheme } from "@/src/theme/modernize-theme";

function MuiThemeBridge({ children }: { children: React.ReactNode }) {
  const { mode } = useThemeMode();
  const theme = mode === "dark" ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  );
}

export function ModernizeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeModeProvider>
      <MuiThemeBridge>{children}</MuiThemeBridge>
    </ThemeModeProvider>
  );
}
