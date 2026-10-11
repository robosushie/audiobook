/** Design tokens — mirror of `styles/globals.css` for use in JS (charts, etc.). */

export const theme = {
  colors: {
    background: "#e5e7eb",
    primary: "#000000",
    primaryForeground: "#ffffff",
    mutedForeground: "#666666",
    border: "#e5e7eb",
    chart: "#1871da",
    highlight: "#d6e4f7",
    chartMuted: "#f7f7f7",
    pulse: "#1ec072",
  },
  layout: {
    sidebarWidth: "16rem",
  },
  radius: {
    lg: "6px",
    xl: "6px",
  },
} as const;
