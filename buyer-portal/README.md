# Munda Market - Buyer Portal

React web application for buyers to discover and purchase fresh produce from verified farmers.

## Features

- **Authentication**: Secure login with JWT tokens
- **Dashboard**: Overview of orders, spending, and available crops
- **Crop Discovery**: Browse and search available produce
- **Order Management**: Place and track orders
- **Profile Management**: Account settings and preferences

## Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn
- Munda Market backend running on `localhost:8000`

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm start
   ```

3. **Access the application**:
   - Open http://localhost:3000
   - Use demo credentials: +263771234567 / admin123

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build production bundle
- `npm test` - Run test suite
- `npm run eject` - Eject from Create React App

## Project Structure

```
buyer-portal/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── Header.js   # Top navigation bar
│   │   └── Sidebar.js  # Side navigation menu
│   ├── pages/          # Route components
│   │   ├── LoginPage.js    # Authentication
│   │   ├── Dashboard.js    # Main dashboard
│   │   ├── CropDiscovery.js # Browse crops
│   │   ├── Orders.js       # Order management
│   │   └── Profile.js      # User profile
│   ├── services/       # API and business logic
│   │   └── auth.js     # Authentication service
│   ├── utils/          # Helper functions
│   ├── App.js          # Main app component
│   └── index.js        # App entry point
├── public/             # Static assets
└── package.json        # Dependencies and scripts
```

## Key Technologies

- **React 18**: UI framework
- **Material-UI (MUI)**: Component library and design system
- **React Router**: Client-side routing
- **React Query**: Server state management
- **Axios**: HTTP client for API calls
- **React Hook Form**: Form management

## Authentication

The app uses JWT token-based authentication:
- Login with phone number or email
- Token stored in localStorage
- Automatic token refresh
- Protected routes require authentication

## API Integration

All API calls go through the authentication service:
- Base URL: `/api/v1` (proxied to backend)
- Automatic token attachment
- Error handling for auth failures
- Request/response interceptors

## Responsive Design

The app is fully responsive:
- **Mobile**: Collapsible sidebar, touch-friendly
- **Tablet**: Adaptive layout
- **Desktop**: Full sidebar navigation

## Development

### Adding New Pages

1. Create component in `src/pages/`
2. Add route to `App.js`
3. Add navigation item to `Sidebar.js`

### API Integration

Use the `useAuth` hook to access the configured axios instance:

```javascript
import { useAuth } from '../services/auth';

function MyComponent() {
  const { api } = useAuth();
  
  const fetchData = async () => {
    const response = await api.get('/crops');
    return response.data;
  };
}
```

### Styling

- Use Material-UI components and sx prop
- Follow the established theme
- Maintain consistent spacing and colors

## Environment Variables

Create `.env` file in root:

```env
REACT_APP_API_URL=http://localhost:8000
```

## Building for Production

```bash
# Build optimized production bundle
npm run build

# Serve static files (example with serve)
npm install -g serve
serve -s build
```

## Testing

```bash
# Run tests in watch mode
npm test

# Run tests with coverage
npm test -- --coverage
```

## Deployment

The built application is a static site that can be deployed to:
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any static hosting service

Make sure to configure the backend API URL for production.

## Next Steps

1. **Complete Crop Discovery**: Product search, filtering, and details
2. **Order Flow**: Shopping cart, checkout, and payment integration
3. **Real-time Updates**: WebSocket integration for order tracking
4. **Advanced Features**: Favorites, order history, analytics
5. **Testing**: Unit and integration tests
6. **Performance**: Code splitting and optimization

## Troubleshooting

### Common Issues

1. **API Connection**: Ensure backend is running on port 8000
2. **CORS Errors**: Check backend CORS configuration
3. **Login Issues**: Verify demo credentials and backend auth endpoints
4. **Build Errors**: Clear node_modules and reinstall dependencies

### Getting Help

- Check browser console for errors
- Verify backend API is accessible at `/api/v1/health`
- Test authentication endpoints manually
- Check network tab for API request/response details
