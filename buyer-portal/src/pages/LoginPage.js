import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { Agriculture } from '@mui/icons-material';
import { useAuth } from '../services/auth';

function LoginPage() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.username, formData.password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleDemoLogin = () => {
    setFormData({
      username: '+263771234567',
      password: 'admin123',
    });
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 3,
        }}
      >
        <Paper
          elevation={6}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {/* Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Agriculture
              sx={{ fontSize: 40, color: 'primary.main', mr: 1 }}
            />
            <Typography component="h1" variant="h4" color="primary">
              Munda Market
            </Typography>
          </Box>

          <Typography component="h2" variant="h6" sx={{ mb: 3 }}>
            Buyer Portal
          </Typography>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Demo Credentials Info */}
          <Alert severity="info" sx={{ width: '100%', mb: 3 }}>
            <Typography variant="body2">
              <strong>Demo Login:</strong><br />
              Phone: +263771234567<br />
              Password: admin123
              <br />
              <Link
                component="button"
                variant="body2"
                onClick={handleDemoLogin}
                sx={{ textDecoration: 'underline', cursor: 'pointer' }}
              >
                Click here to fill demo credentials
              </Link>
            </Typography>
          </Alert>

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Phone Number or Email"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
              placeholder="+263771234567"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Fresh produce marketplace for Zimbabwe
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Need an account? Contact your sales representative
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default LoginPage;
