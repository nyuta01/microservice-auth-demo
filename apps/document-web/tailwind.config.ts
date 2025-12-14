import type { Config } from "tailwindcss";
import preset from "@repo/ui/tailwind.preset";

const config: Config = {
  presets: [preset as Config],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
    "../../packages/web-lib/src/**/*.{js,ts,jsx,tsx}",
  ],
};

export default config;
