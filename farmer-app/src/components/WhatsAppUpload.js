import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
} from '@mui/material';
import { PhotoCamera, WhatsApp, CloudUpload } from '@mui/icons-material';
import { api } from '../services/auth';

function WhatsAppUpload() {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleWhatsAppUpload = async (file, planId) => {
    if (!whatsappNumber) {
      setError('Please set your WhatsApp number in settings first');
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      // For MVP, we'll use the regular upload endpoint
      // In production, this would integrate with WhatsApp Business API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('plan_id', planId);
      formData.append('whatsapp_number', whatsappNumber);
      
      await api.post('/farmers/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setSuccess('Photo uploaded via WhatsApp!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to upload via WhatsApp');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        WhatsApp Photo Upload
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Send photos directly from WhatsApp to update production progress
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            label="WhatsApp Number"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="+263771234567"
            helperText="Number registered with Munda Market"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<WhatsApp />}
              disabled={!whatsappNumber}
              onClick={() => {
                // In production, this would open WhatsApp with pre-filled message
                window.open(`https://wa.me/263771234567?text=Hi%20Munda%20Market`, '_blank');
              }}
            >
              Test WhatsApp
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          How to use:
        </Typography>
        <Typography variant="body2" component="div">
          1. Save your WhatsApp number above
          <br />
          2. Send photos to +26377 444 355 with format: "PLAN#123 [photo]"
          <br />
          3. Photos will automatically be linked to your production plan
        </Typography>
      </Box>
    </Paper>
  );
}

export default WhatsAppUpload;

