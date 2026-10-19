import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { ink: "#0a0b10", panel: "#11131b", accent: "#a78bfa", mint: "#78f0ce" }, boxShadow: { glow: "0 0 35px rgba(167,139,250,.16)" } } },
  plugins: []
};
export default config;