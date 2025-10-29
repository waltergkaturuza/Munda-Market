import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import { Person, Edit, Save, Cancel, Lock, WhatsApp } from '@mui/icons-material';
import WhatsAppUpload from '../components/WhatsAppUpload';
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
      const { data } = await api.put('/auth/me', formData);
      setUser(data);
      setEditing(false);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      if (refreshUser) await refreshUser();
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to update profile');
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
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Profile
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={3}>
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
                    name="email"
                    value={editing ? formData.email : (user?.email || '')}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={editing ? formData.name : (user?.name || '')}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!editing}
                  />
                </Grid>
              </Grid>

              {editing && (
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button variant="contained" startIcon={<Save />} onClick={handleSave}>
                    Save
                  </Button>
                  <Button variant="outlined" startIcon={<Cancel />} onClick={() => { setEditing(false); setFormData({ name: user?.name || '', email: user?.email || '' }); }}>
                    Cancel
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Change Password
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type="password"
                    value={passwordData.old_password}
                    onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 2 }}>
                <Button variant="contained" startIcon={<Lock />} onClick={handlePasswordChange}>
                  Change Password
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                </Typography>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Verification Status
                </Typography>
                <Chip
                  label={user?.is_verified ? 'Verified' : 'Pending'}
                  color={user?.is_verified ? 'success' : 'warning'}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <WhatsAppUpload />
        </Grid>
      </Grid>
    </Box>
  );
}

export default Profile;
