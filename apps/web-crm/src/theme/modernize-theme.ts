"use client";

import { createTheme, type Theme } from "@mui/material/styles";

const sharedTypography = {
  fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', Helvetica, Arial, sans-serif",
  h1: { fontWeight: 600, fontSize: "2.25rem", lineHeight: 1.2 },
  h2: { fontWeight: 600, fontSize: "1.875rem", lineHeight: 1.25 },
  h3: { fontWeight: 600, fontSize: "1.5rem", lineHeight: 1.3 },
  h4: { fontWeight: 600, fontSize: "1.3125rem", lineHeight: 1.35 },
  h5: { fontWeight: 600, fontSize: "1.125rem", lineHeight: 1.4 },
  h6: { fontWeight: 600, fontSize: "1rem", lineHeight: 1.4 },
  button: { textTransform: "none" as const, fontWeight: 500 },
  body1: { fontSize: "0.875rem", lineHeight: 1.5 },
  body2: { fontSize: "0.8125rem", lineHeight: 1.45 },
};

const sharedComponents: Theme["components"] = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        scrollbarWidth: "thin",
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow:
          "rgb(145 158 171 / 20%) 0px 0px 2px 0px, rgb(145 158 171 / 12%) 0px 12px 24px -4px",
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        minHeight: 44,
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRight: "none",
      },
    },
  },
};

/** Paleta inspirada en [Modernize Next.js Free](https://github.com/adminmart/Modernize-Nextjs-Free) */
export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#5D87FF", light: "#ECF2FF", dark: "#4570EA", contrastText: "#fff" },
    secondary: { main: "#49BEFF", light: "#E8F7FF", dark: "#23afdb", contrastText: "#fff" },
    success: { main: "#13DEB9", light: "#E6FFFA", dark: "#02b3a9" },
    info: { main: "#539BFF", light: "#EBF3FE", dark: "#1682d4" },
    error: { main: "#FA896B", light: "#FDEDE8", dark: "#f3704d" },
    warning: { main: "#FFAE1F", light: "#FEF5E5", dark: "#ae8e59" },
    background: { default: "#F2F6FA", paper: "#ffffff" },
    text: { primary: "#2A3547", secondary: "#5A6A85" },
    divider: "#e5eaef",
    grey: {
      100: "#F2F6FA",
      200: "#EAEFF4",
      300: "#DFE5EF",
      400: "#7C8FAC",
      500: "#5A6A85",
      600: "#2A3547",
    },
    action: {
      hover: "rgba(93, 135, 255, 0.08)",
      selected: "rgba(93, 135, 255, 0.12)",
    },
  },
  typography: sharedTypography,
  shape: { borderRadius: 8 },
  components: sharedComponents,
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#5D87FF", light: "#253662", dark: "#4570EA", contrastText: "#fff" },
    secondary: { main: "#49BEFF", light: "#1C455D", dark: "#23afdb", contrastText: "#fff" },
    success: { main: "#13DEB9", dark: "#02b3a9" },
    info: { main: "#539BFF" },
    error: { main: "#FA896B" },
    warning: { main: "#FFAE1F" },
    background: { default: "#171C23", paper: "#2A3547" },
    text: { primary: "#EAEFF4", secondary: "#7C8FAC" },
    divider: "rgba(255,255,255,0.08)",
    grey: {
      100: "#2A3547",
      200: "#333F55",
      300: "#465670",
      400: "#7C8FAC",
      500: "#DFE5EF",
      600: "#EAEFF4",
    },
    action: {
      hover: "rgba(93, 135, 255, 0.12)",
      selected: "rgba(93, 135, 255, 0.2)",
    },
  },
  typography: sharedTypography,
  shape: { borderRadius: 8 },
  components: sharedComponents,
});
