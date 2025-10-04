# Taskie Frontend

A modern task management application built with React, TypeScript, and Vite.

## Features

- **Task Management**: Create, update, and organize tasks with priorities and deadlines
- **Google OAuth**: Secure authentication with Google Identity Services
- **Real-time Updates**: Live synchronization with backend API
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Type Safety**: Full TypeScript support with strict type checking

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Cloud Console account (for OAuth)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd taskie-fe
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   # Create .env.local file
   cp .env.example .env.local
   
   # Edit .env.local with your configuration
   VITE_GOOGLE_CLIENT_ID=your-google-client-id
   VITE_GOOGLE_ALLOW_MOCK=true  # For development only
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

### Google OAuth Setup

1. **Create Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API and Google Identity Services

2. **Create OAuth 2.0 Client ID:**
   - Navigate to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Authorized JavaScript origins: `http://localhost:5173`
   - Copy the Client ID to your `.env.local` file

3. **Mock Mode for Development:**
   - Set `VITE_GOOGLE_ALLOW_MOCK=true` in development
   - Alt+click "Continue with Google" to use mock authentication
   - Remove or set to `false` in production

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

`js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
`

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

`js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
`

