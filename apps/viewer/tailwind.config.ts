import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', 'monospace'],
      },
      colors: {
        surface: {
          0: '#0a0a0a',
          1: '#111111',
          2: '#1a1a1a',
          3: '#222222',
          4: '#2a2a2a',
        },
        border: {
          DEFAULT: '#262626',
          hover: '#333333',
          subtle: '#1e1e1e',
        },
        text: {
          primary: '#ededed',
          secondary: '#a1a1a1',
          tertiary: '#666666',
        },
        accent: {
          blue: '#0070f3',
          purple: '#7928ca',
          pink: '#eb367f',
        },
        status: {
          success: '#00c853',
          blocked: '#ff4444',
          failed: '#ff9800',
        },
      },
      letterSpacing: {
        tighter: '-0.04em',
        display: '-0.05em',
      },
      boxShadow: {
        ring: '0px 0px 0px 1px rgba(255, 255, 255, 0.06)',
        'ring-hover': '0px 0px 0px 1px rgba(255, 255, 255, 0.12)',
        card: '0px 0px 0px 1px rgba(255,255,255,0.06), 0px 2px 4px rgba(0,0,0,0.3), 0px 8px 16px -4px rgba(0,0,0,0.4)',
        glow: '0 0 20px rgba(255, 68, 68, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out both',
        'slide-up': 'slideUp 0.4s ease-out both',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(255, 68, 68, 0.1)' },
          '50%': { boxShadow: '0 0 20px rgba(255, 68, 68, 0.25)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
