import type { Config } from 'tailwindcss'

/** oklch CSS variables with opacity modifier support (e.g. ring/50, bg-primary/80) */
const oklchVar = (variable: string) =>
    `color-mix(in oklch, ${variable} calc(<alpha-value> * 100%), transparent)`

const config: Config = {
    darkMode: ["class"],
    content: [
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                border: oklchVar('var(--border)'),
                input: oklchVar('var(--input)'),
                ring: oklchVar('var(--ring)'),
                background: oklchVar('var(--background)'),
                foreground: oklchVar('var(--foreground)'),
                primary: {
                    DEFAULT: oklchVar('var(--primary)'),
                    foreground: oklchVar('var(--primary-foreground)'),
                },
                secondary: {
                    DEFAULT: oklchVar('var(--secondary)'),
                    foreground: oklchVar('var(--secondary-foreground)'),
                },
                destructive: {
                    DEFAULT: oklchVar('var(--destructive)'),
                    foreground: oklchVar('var(--destructive-foreground)'),
                },
                muted: {
                    DEFAULT: oklchVar('var(--muted)'),
                    foreground: oklchVar('var(--muted-foreground)'),
                },
                accent: {
                    DEFAULT: oklchVar('var(--accent)'),
                    foreground: oklchVar('var(--accent-foreground)'),
                },
                popover: {
                    DEFAULT: oklchVar('var(--popover)'),
                    foreground: oklchVar('var(--popover-foreground)'),
                },
                card: {
                    DEFAULT: oklchVar('var(--card)'),
                    foreground: oklchVar('var(--card-foreground)'),
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
        },
    },
    plugins: [],
}

export default config
