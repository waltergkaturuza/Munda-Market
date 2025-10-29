import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './services/auth';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Farms from './pages/Farms';
import ProductionPlans from './pages/ProductionPlans';
import Lots from './pages/Lots';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { Box, Container } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32', // Green for agriculture
    },
    secondary: {
      main: '#f57c00', // Orange accent
    },
  },
});

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</Box>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Main app layout
function AppLayout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <Container 
          maxWidth="xl" 
          disableGutters
          sx={{ 
            mt: 3, 
            mb: 3, 
            flex: 1, 
            pl: '18px', // ~5mm gap from sidebar
            pr: { xs: 2, md: 3 },
          }}
        >
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/farms" element={<Farms />} />
            <Route path="/production-plans" element={<ProductionPlans />} />
            <Route path="/lots" element={<Lots />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
