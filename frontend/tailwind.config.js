/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',   // Very light blue for backgrounds
          100: '#e0e9ff',  // Light blue for subtle backgrounds
          200: '#c7d8ff',  // Lighter blue for hover states
          300: '#a4c1ff',  // Light blue for borders
          400: '#7ea3ff',  // Medium-light blue
          500: '#6c89c1',  // Our medium blue - secondary actions
          600: '#5a73a8',  // Darker medium blue for hover
          700: '#4a5f8f',  // Dark blue
          800: '#3a4d76',  // Darker blue
          900: '#1c3f76',  // Our deep navy - primary actions
        },
        secondary: {
          50: '#f8fafc',   // Light gray backgrounds
          100: '#f1f5f9',  // Card backgrounds
          200: '#e2e8f0',  // Borders
          300: '#cbd5e1',  // Subtle text
          400: '#94a3b8',  // Muted text
          500: '#64748b',  // Regular text
          600: '#475569',  // Dark text
          700: '#334155',  // Darker text
          800: '#1e293b',  // Very dark text
          900: '#0f172a',  // Darkest text
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        }
      }
    },
  },
  plugins: [],
}