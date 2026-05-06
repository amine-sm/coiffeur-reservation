/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          "50": "#FFF9E6",
          "100": "#FFF3C4",
          "200": "#F7EF8A",
          "300": "#ECD66B",
          "400": "#D6AD60",
          "500": "#D4AF37",
          "600": "#B68D40",
          "700": "#8F6B2E",
          "800": "#5D4323",
          "900": "#3D2B1F",
        },
        salon: {
          teal: "#1B4F59",
          tealLight: "#E8F3F5",
          orange: "#FE5737",
          cream: "#FFF8F2",
          beige: "#F7EFE6",
          brown: "#3D2B1F",
        },
      },
      boxShadow: {
        soft: "0 20px 60px rgba(27, 79, 89, 0.12)",
        card: "0 18px 45px rgba(15, 23, 42, 0.08)",
        orange: "0 18px 45px rgba(254, 87, 55, 0.18)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.06)", opacity: "0.85" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        fadeUp: "fadeUp 0.8s ease-out both",
        pulseSoft: "pulseSoft 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};