import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';
export default {
      content: ["./index.html", "./login.html", "./src/**/*.js"],
      plugins: [forms, containerQueries],
      darkMode: "class",
      theme: {
        extend: {
          colors: {
            "primary": "#2547f4",
            "primary-dark": "#1a33b0",
            "accent-green": "#0bda65",
            "accent-red": "#fa6538",
            "background-light": "#f5f6f8",
            "background-dark": "#0f172a",
          },
          fontFamily: {
            "display": ["Manrope", "sans-serif"]
          },
          boxShadow: {
            'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            'glow-primary': '0 0 20px -5px rgba(37, 71, 244, 0.5)',
            'glow-green': '0 0 20px -5px rgba(11, 218, 101, 0.4)',
            'glow-red': '0 0 20px -5px rgba(250, 101, 56, 0.4)',
          }
        },
      },
    };
