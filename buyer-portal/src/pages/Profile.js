import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Divider,
  Chip,
  Alert,
  IconButton,
} from '@mui/material';
import { Person, Edit, Save, Cancel, Lock, LocationOn, Add } from '@mui/icons-material';
import { useAuth } from '../services/auth';
import { api } from '../services/auth';

function Profile() {
  const { user: authUser, logout, refreshUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [addresses, setAddresses] = useState([
    { id: 1, name: 'Home', address: '1 Titania Way', district: 'Chegutu', province: 'Mashonaland West', isDefault: true },
  ]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
        setFormData({ name: data.name || '', email: data.email || '' });
        setLoading(false);
      } catch (e) {
        setError('Failed to load profile');
        setLoading(false);
      }
    };
    if (authUser) loadProfile();
  }, [authUser]);

  const handleSave = async () => {
    try {
      setError('');
      setSuccess('');
      
      // Check if we have a token
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You are not logged in. Please log in again.');
        return;
      }
      
      console.log('Updating profile with data:', formData);
      console.log('Token exists:', !!token, 'Length:', token.length);
      
      const { data } = await api.put('/auth/me', formData);
      setUser(data);
      setEditing(false);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      // Refresh auth context to update header
      if (refreshUser) {
        try {
          await refreshUser();
        } catch (e) {
          console.warn('Could not refresh user:', e);
        }
      }
    } catch (e) {
      console.error('Profile update error:', e);
      const errorMsg = e?.response?.data?.detail || 'Failed to update profile';
      
      // If it's a 401, suggest re-login and potentially clear token
      if (e?.response?.status === 401) {
        const fullError = errorMsg + '. Your session may have expired. Please log out and log back in.';
        setError(fullError);
        console.error('401 Error - Token may be invalid. Response:', e.response?.data);
      } else {
        setError(errorMsg);
      }
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      return;
    }
    if (passwordData.new_password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    try {
      setError('');
      await api.put('/auth/change-password', {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
      setSuccess('Password changed successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to change password');
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Profile</Typography>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h5">{user?.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{user?.role}</Typography>
                    <Chip label={user?.status} size="small" color={user?.status === 'ACTIVE' ? 'success' : 'default'} sx={{ mt: 0.5 }} />
                  </Box>
                </Box>
                {!editing && (
                  <Button startIcon={<Edit />} variant="outlined" onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={user?.phone || ''}
                    disabled
                    helperText="Phone number cannot be changed"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={editing ? formData.email : (user?.email || '')}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={editing ? formData.name : (user?.name || '')}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!editing}
                  />
                </Grid>
                {editing && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="contained" startIcon={<Save />} onClick={handleSave}>
                        Save Changes
                      </Button>
                      <Button variant="outlined" startIcon={<Cancel />} onClick={() => {
                        setEditing(false);
                        setFormData({ name: user?.name || '', email: user?.email || '' });
                      }}>
                        Cancel
                      </Button>
                    </Box>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Account Information
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2"><strong>Account Created:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</Typography>
                <Typography variant="body2"><strong>Last Login:</strong> {user?.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</Typography>
                <Typography variant="body2"><strong>Verification Status:</strong> {user?.is_verified ? 'Verified' : 'Pending'}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Account Stats */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Quick Stats</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">Total Orders</Typography>
                <Typography variant="h4">24</Typography>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">Total Spend</Typography>
                <Typography variant="h4">$2,450</Typography>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">Member Since</Typography>
                <Typography variant="body1">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Change Password */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Lock />
                <Typography variant="h6">Change Password</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Current Password"
                    value={passwordData.old_password}
                    onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="password"
                    label="New Password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    helperText="Must be at least 6 characters"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Confirm New Password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" onClick={handlePasswordChange} disabled={!passwordData.old_password || !passwordData.new_password}>
                    Change Password
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Delivery Addresses */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn />
                  <Typography variant="h6">Delivery Addresses</Typography>
                </Box>
                <Button size="small" startIcon={<Add />} variant="outlined">
                  Add Address
                </Button>
              </Box>
              {addresses.map((addr) => (
                <Box key={addr.id} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box>
                      <Typography variant="subtitle2">{addr.name} {addr.isDefault && <Chip label="Default" size="small" color="primary" sx={{ ml: 1 }} />}</Typography>
                      <Typography variant="body2" color="text.secondary">{addr.address}</Typography>
                      <Typography variant="body2" color="text.secondary">{addr.district}, {addr.province}</Typography>
                    </Box>
                    <IconButton size="small"><Edit fontSize="small" /></IconButton>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Profile;
