/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Custom design tokens để giảm CSS size
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-bottom': 'slideInBottom 0.3s ease-out',
        'dropdown-in': 'dropdownIn 0.2s ease-out',
        'dropdown-out': 'dropdownOut 0.15s ease-in',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInBottom: {
          '0%': { transform: 'translate(-50%, 20px)', opacity: '0' },
          '100%': { transform: 'translate(-50%, 0)', opacity: '1' },
        },
        dropdownIn: {
          '0%': { 
            opacity: '0', 
            transform: 'scale(0.95) translateY(-10px)',
            visibility: 'hidden'
          },
          '100%': { 
            opacity: '1', 
            transform: 'scale(1) translateY(0)',
            visibility: 'visible'
          },
        },
        dropdownOut: {
          '0%': { 
            opacity: '1', 
            transform: 'scale(1) translateY(0)',
            visibility: 'visible'
          },
          '100%': { 
            opacity: '0', 
            transform: 'scale(0.95) translateY(-10px)',
            visibility: 'hidden'
          },
        },
      },
    },
  },
  plugins: [],
  // Purge unused CSS
  safelist: [
    // Giữ lại các class được sử dụng động
    'bg-blue-50',
    'bg-amber-50', 
    'bg-green-50',
    'text-blue-600',
    'text-amber-600',
    'text-green-600',
    'border-blue-200',
    'border-amber-200',
    'border-green-200',
  ],
  // Tối ưu hóa CSS
  corePlugins: {
    // Tắt các plugin không cần thiết
    preflight: true,
    container: false, // Không dùng container
    accessibility: true,
    pointerEvents: true,
    visibility: true,
    position: true,
    inset: true,
    isolation: false,
    zIndex: true,
    order: true,
    gridColumn: true,
    gridColumnStart: true,
    gridColumnEnd: true,
    gridRow: true,
    gridRowStart: true,
    gridRowEnd: true,
    float: false, // Không dùng float
    clear: false, // Không dùng clear
    objectFit: true,
    objectPosition: true,
    overflow: true,
    overscrollBehavior: false,
    position: true,
    inset: true,
    visibility: true,
    zIndex: true,
  },
}
