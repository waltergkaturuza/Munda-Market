import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import CartDrawer from './components/CartDrawer';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import CropDiscovery from './pages/CropDiscovery';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Invoices from './pages/Invoices';
import Analytics from './pages/Analytics';
import Checkout from './pages/Checkout';
import { AuthProvider, useAuth } from './services/auth';
import { CartProvider } from './services/cart';

function AppContent() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        Loading...
      </Box>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} onCartClick={() => setSidebarOpen(false) || setCartOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 8, // Account for header height
          // No extra margin-left; permanent Drawer already consumes layout space
          bgcolor: 'grey.50',
          minHeight: '100vh',
        }}
      >
        <Container
          maxWidth={false}
          disableGutters
          sx={{
            py: 3,
            pl: '18px', // ~5mm gap from sidebar
            pr: { xs: 2, md: 3 },
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/crops" element={<CropDiscovery />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
