/** @type {import('tailwindcss').Config} */
/**
 * Tailwind CSS v4 Configuration
 * 
 * Note: This configuration is compatible with Tailwind CSS v4.
 * Theme customizations are defined here for maintainability.
 */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                    950: '#082f49',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            zIndex: {
                chat: '10',
                'chat-input': '20',
                'chat-header': '25',
                'navigation-orb': '60',
                modal: '70',
            },
            animation: {
                'spin-slow': 'spin 3s linear infinite',
            },
        },
    },
    plugins: [],
}
