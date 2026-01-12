import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                critical: "var(--critical)",
                concerning: "var(--concerning)",
                attention: "var(--attention)",
                controlled: "var(--controlled)",
                healthy: "var(--healthy)",
                saving: "var(--saving)",
                excellent: "var(--excellent)",
            },
            backgroundImage: {
                'gradient-primary': 'var(--gradient-primary)',
                'gradient-success': 'var(--gradient-success)',
                'gradient-danger': 'var(--gradient-danger)',
                'gradient-warning': 'var(--gradient-warning)',
            },
        },
    },
    plugins: [],
};

export default config;
