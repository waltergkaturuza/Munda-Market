# Munda Market - Admin Console

Advanced admin console for managing the Munda Market digital marketplace platform.

## Features

- 🎯 **Dashboard** - Real-time KPIs and analytics
- ✅ **KYC Management** - Review and approve farmer/buyer verification
- 👨‍🌾 **Farmer Management** - Manage farmer accounts and production plans
- 🏪 **Buyer Management** - Oversee buyer accounts and purchase history
- 📦 **Order Pipeline** - Track orders through fulfillment stages
- 📊 **Inventory** - View available crops and harvest schedules
- 💰 **Pricing Rules** - Configure markup and pricing strategies
- 💳 **Payments** - Monitor buyer payments and transactions
- 💸 **Payouts** - Process farmer payouts
- 📱 **Messaging** - Send WhatsApp/SMS notifications
- 📝 **Audit Logs** - System activity tracking
- 🌓 **Dark Mode** - Light/dark theme support
- 🌍 **Localization** - Multi-language support (i18next)
- 🔐 **Role-Based Access** - Admin, Ops, Finance roles

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Material-UI (MUI)** - Component library
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **React Hook Form + Zod** - Form handling and validation
- **Axios** - HTTP client
- **i18next** - Internationalization
- **React Router v6** - Routing

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:8000`

### Installation

```bash
cd admin-console
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:3001`

### Build

```bash
npm run build
npm run preview
```

## Project Structure

```
admin-console/
├── src/
│   ├── api/              # API client and endpoints
│   ├── assets/           # Static assets
│   ├── components/       # Reusable components
│   ├── config/           # Configuration files
│   ├── features/         # Feature-specific modules
│   ├── hooks/            # Custom React hooks
│   ├── layouts/          # Layout components
│   ├── lib/              # Utilities and helpers
│   ├── pages/            # Page components
│   ├── routes/           # Route configuration
│   ├── store/            # State management
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── public/
│   └── locales/          # Translation files
└── ...config files
```

## Environment Variables

Copy `env.example` to `.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

## Authentication

Default admin credentials:
- Phone: `+263771234567`
- Password: `admin123`

## Development Workflow

1. Run backend API (`http://localhost:8000`)
2. Start admin console dev server (`npm run dev`)
3. Login with admin credentials
4. Navigate through modules

## Code Style

- ESLint + Prettier configured
- Run `npm run lint` to check
- Run `npm run format` to auto-format

## License

Proprietary - All rights reserved

