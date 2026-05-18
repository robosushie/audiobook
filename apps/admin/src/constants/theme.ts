/** Design tokens — mirror of `styles/globals.css` for use in JS (charts, etc.). */

export const theme = {
  colors: {
    background: "#faf8f5",
    primary: "#18181b",
    primaryForeground: "#fafafa",
    mutedForeground: "#71717a",
    border: "#e8e4df",
    chart: "#404040",
    chartMuted: "#f0ebe6",
  },
  layout: {
    sidebarWidth: "16rem",
  },
  radius: {
    lg: "0.5rem",
    xl: "0.75rem",
  },
} as const;
