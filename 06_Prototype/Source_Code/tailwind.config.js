/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cd: {
          green: "#1E7B34",      // primary action (observed bright green buttons, toned for contrast)
          leaf: "#2FA84F",
          deep: "#1F4D2B",       // headings
          mint: "#EEF6EA",       // page backgrounds
          cream: "#FBF8EF",
          line: "#DDE8D9",
          vip: "#F4D35E",
          vipdeep: "#7A5A00",
          sky: "#E3F1FB",        // Instant mode
          ink: "#1D2A22",
          muted: "#5E6E63",
          danger: "#C2410C",
        },
        graine: { 600: "#3F3DBC", 500: "#5552E0", 100: "#ECEBFD" },
      },
      fontFamily: { sans: ["'Plus Jakarta Sans'", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"] },
      boxShadow: { card: "0 1px 2px rgba(20,40,25,.06), 0 4px 14px rgba(20,40,25,.06)", sheet: "0 -8px 30px rgba(20,40,25,.18)" },
      keyframes: {
        rise: { "0%": { transform: "translateY(12px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        pulseRing: { "0%": { transform: "scale(.9)", opacity: ".7" }, "100%": { transform: "scale(1.5)", opacity: "0" } },
        bar: { "0%,100%": { transform: "scaleY(.35)" }, "50%": { transform: "scaleY(1)" } },
      },
      animation: { rise: "rise .22s ease-out", pulseRing: "pulseRing 1.4s ease-out infinite", bar: "bar .9s ease-in-out infinite" },
    },
  },
  plugins: [],
};
