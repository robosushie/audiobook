/** Design tokens — mirror of `styles/globals.css` for use in JS (charts, etc.). */

export const theme = {
  colors: {
    primary: "#171717",
    primaryForeground: "#fafafa",
    mutedForeground: "#737373",
    border: "#e5e5e5",
    chart: "#404040",
    chartMuted: "#f5f5f5",
  },
  layout: {
    sidebarWidth: "16rem",
  },
  radius: {
    lg: "0.5rem",
    xl: "0.75rem",
  },
} as const;
