# RegalAmor - Fullstack Project

A modern fullstack application built with Vite, React, AntD, Tailwind CSS, Axios, TypeScript, Prisma, and MySQL.

## Tech Stack

### Frontend
- **Vite**: Next-generation frontend tooling
- **React**: UI library
- **TypeScript**: Type safety
- **Ant Design**: UI component library
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client

### Backend
- **Express**: Web framework for Node.js
- **Prisma**: Next-generation ORM
- **MySQL**: Database
- **TypeScript**: Type safety

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MySQL server

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd regalamor
```

2. Install dependencies
```bash
npm install
```

3. Set up the database
   - Create a MySQL database named `regalamor`
   - Update the `.env` file with your MySQL credentials

4. Generate Prisma client and run migrations
```bash
npm run prisma:generate
npm run prisma:migrate
```

## Usage

### Development

Run the frontend development server:
```bash
npm run dev
```

Run the backend server:
```bash
npm run server
```

Run both frontend and backend concurrently:
```bash
npm run dev:all
```

### Production Build

Build the frontend:
```bash
npm run build
```

Build the backend:
```bash
npm run build:server
```

Build both:
```bash
npm run build:all
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
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
```
