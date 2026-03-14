/** @type {import('tailwindcss').Config} */

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
            },
            colors: {
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                card: 'var(--card)',
                'card-foreground': 'var(--card-foreground)',
                primary: {
                    DEFAULT: 'var(--primary)',
                    foreground: 'var(--primary-foreground)',
                },
                secondary: {
                    DEFAULT: 'var(--secondary)',
                    foreground: 'var(--secondary-foreground)',
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    foreground: 'var(--accent-foreground)',
                },
                emerald: 'var(--emerald)',
                amber: 'var(--amber)',
                border: 'var(--border)',
                ring: 'var(--ring)',
            },
            borderRadius: {
                '2rem': '2rem',
                '2.5rem': '2.5rem',
                '3rem': '3rem',
            },
            backdropBlur: {
                'glass': '12px',
            },
            boxShadow: {
                'glass': '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
                'glass-hover': '0 25px 50px -12px rgba(79, 70, 229, 0.15)',
                'indigo': '0 10px 25px -5px rgba(79, 70, 229, 0.3)',
                'indigo-lg': '0 15px 30px -5px rgba(79, 70, 229, 0.4)',
            },
        },
    },
    plugins: [],
}
