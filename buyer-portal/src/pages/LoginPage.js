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
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Agriculture, Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../services/auth';

function LoginPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (isLogin) {
      const result = await login(formData.username, formData.password);
      
      if (!result.success) {
        setError(result.error);
      }
    } else {
      // Registration mode
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      const result = await register({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        password: formData.password,
        role: 'BUYER',
      });

      if (result.success) {
        setSuccessMessage('Registration successful! Your account is pending approval. You will be notified once approved.');
        setIsLogin(true);
        setFormData({
          username: formData.phone,
          password: '',
          name: '',
          email: '',
          phone: '',
          confirmPassword: '',
        });
      } else {
        setError(result.error);
      }
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
            <Alert severity="error" sx={{ width: '100%', mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Success Alert */}
          {successMessage && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }} onClose={() => setSuccessMessage('')}>
              {successMessage}
            </Alert>
          )}

          {/* Demo Credentials Info - Only show during login */}
          {isLogin && (
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
          )}

          {/* Login/Register Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            {!isLogin && (
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="name"
                  label="Full Name"
                  name="name"
                  autoComplete="name"
                  autoFocus
                  value={formData.name}
                  onChange={handleChange}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="phone"
                  label="Phone Number"
                  name="phone"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+263771234567"
                  helperText="Must start with +263 or 0"
                />
                <TextField
                  margin="normal"
                  fullWidth
                  id="email"
                  label="Email (Optional)"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </>
            )}

            {isLogin && (
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
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={formData.password}
              onChange={handleChange}
              helperText={!isLogin ? 'Minimum 6 characters' : ''}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {!isLogin && (
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Register'
              )}
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccessMessage('');
                setFormData({
                  username: '',
                  password: '',
                  name: '',
                  email: '',
                  phone: '',
                  confirmPassword: '',
                });
              }}
            >
              {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign In'}
            </Button>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Fresh produce marketplace for Zimbabwe
            </Typography>
            {!isLogin && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Your account will be reviewed and approved by our team
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default LoginPage;
