/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        "./app/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}",
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                // RommZ brand colors — match web
                primary: {
                    50: '#eef8f4',
                    100: '#d5ede3',
                    200: '#ade0c8',
                    300: '#7ccda8',
                    400: '#4ab585',
                    500: '#2a9d6a',  // Main brand green
                    600: '#1f7d54',
                    700: '#1a6545',
                    800: '#175138',
                    900: '#14432f',
                },
                background: '#f8fafc',
                surface: '#ffffff',
                'text-primary': '#0f172a',
                'text-secondary': '#64748b',
            },
            fontFamily: {
                sans: ['Inter'],
            },
        },
    },
    plugins: [],
};
