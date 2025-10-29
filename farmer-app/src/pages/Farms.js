import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Alert,
  Card,
  CardContent,
  IconButton,
  Chip,
} from '@mui/material';
import { Add, Edit, Delete, LocationOn } from '@mui/icons-material';
import { api } from '../services/auth';

function Farms() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    geohash: '',
    latitude: '',
    longitude: '',
    ward: '',
    district: '',
    province: '',
    address_line1: '',
    address_line2: '',
    postal_code: '',
    total_hectares: '',
    farm_type: '',
    irrigation_available: '',
    association_name: '',
    association_membership_id: '',
  });

  React.useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/farmers/farms');
      setFarms(response.data || []);
    } catch (error) {
      console.error('Failed to load farms:', error);
      setError('Failed to load farms');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const submitData = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        total_hectares: formData.total_hectares ? parseFloat(formData.total_hectares) : null,
        geohash: formData.geohash || `lat${formData.latitude}lon${formData.longitude}`,
      };

      if (editingFarm) {
        // TODO: Implement update endpoint
        setSuccess('Farm update coming soon');
      } else {
        await api.post('/farmers/farms', submitData);
        setSuccess('Farm registered successfully!');
        setShowForm(false);
        resetForm();
        loadFarms();
      }
    } catch (error) {
      setError(error?.response?.data?.detail || 'Failed to register farm');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      geohash: '',
      latitude: '',
      longitude: '',
      ward: '',
      district: '',
      province: '',
      address_line1: '',
      address_line2: '',
      postal_code: '',
      total_hectares: '',
      farm_type: '',
      irrigation_available: '',
      association_name: '',
      association_membership_id: '',
    });
    setEditingFarm(null);
  };

  const handleEdit = (farm) => {
    setEditingFarm(farm);
    setFormData({
      name: farm.name || '',
      geohash: farm.geohash || '',
      latitude: farm.latitude?.toString() || '',
      longitude: farm.longitude?.toString() || '',
      ward: farm.ward || '',
      district: farm.district || '',
      province: farm.province || '',
      address_line1: farm.address_line1 || '',
      address_line2: farm.address_line2 || '',
      postal_code: farm.postal_code || '',
      total_hectares: farm.total_hectares?.toString() || '',
      farm_type: farm.farm_type || '',
      irrigation_available: farm.irrigation_available || '',
      association_name: farm.association_name || '',
      association_membership_id: farm.association_membership_id || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (farmId) => {
    if (!window.confirm('Are you sure you want to delete this farm?')) return;
    
    try {
      // TODO: Implement delete endpoint
      setError('Delete functionality coming soon');
    } catch (error) {
      setError('Failed to delete farm');
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          My Farms
        </Typography>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          My Farms
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          Register New Farm
        </Button>
      </Box>

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

      {showForm && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {editingFarm ? 'Edit Farm' : 'Register New Farm'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Farm Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Farm Type"
                  name="farm_type"
                  value={formData.farm_type}
                  onChange={handleChange}
                  placeholder="e.g., Arable, Livestock, Mixed"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Latitude"
                  name="latitude"
                  type="number"
                  value={formData.latitude}
                  onChange={handleChange}
                  required
                  inputProps={{ step: 'any' }}
                  helperText="e.g., -17.8252"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Longitude"
                  name="longitude"
                  type="number"
                  value={formData.longitude}
                  onChange={handleChange}
                  required
                  inputProps={{ step: 'any' }}
                  helperText="e.g., 31.0335"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Province"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="District"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Ward"
                  name="ward"
                  value={formData.ward}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address Line 1"
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address Line 2"
                  name="address_line2"
                  value={formData.address_line2}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Total Hectares"
                  name="total_hectares"
                  type="number"
                  value={formData.total_hectares}
                  onChange={handleChange}
                  inputProps={{ step: 'any', min: 0 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Irrigation Available"
                  name="irrigation_available"
                  value={formData.irrigation_available}
                  onChange={handleChange}
                  placeholder="e.g., Yes, No, Drip, Sprinkler"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Association Name"
                  name="association_name"
                  value={formData.association_name}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Association Membership ID"
                  name="association_membership_id"
                  value={formData.association_membership_id}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button type="submit" variant="contained">
                {editingFarm ? 'Update Farm' : 'Register Farm'}
              </Button>
              <Button variant="outlined" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancel
              </Button>
            </Box>
          </form>
        </Paper>
      )}

      {farms.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No farms registered yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Register your first farm to start creating production plans
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setShowForm(true)}>
            Register Your First Farm
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {farms.map((farm) => (
            <Grid item xs={12} md={6} key={farm.farm_id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {farm.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {farm.district}, {farm.province}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => handleEdit(farm)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(farm.farm_id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {farm.farm_type && (
                      <Chip label={farm.farm_type} size="small" variant="outlined" />
                    )}
                    {farm.total_hectares && (
                      <Chip label={`${farm.total_hectares} ha`} size="small" variant="outlined" />
                    )}
                    {farm.irrigation_available && (
                      <Chip label={`Irrigation: ${farm.irrigation_available}`} size="small" variant="outlined" />
                    )}
                    <Chip
                      label={farm.verification_status || 'PENDING'}
                      size="small"
                      color={farm.verification_status === 'VERIFIED' ? 'success' : 'default'}
                    />
                  </Box>
                  {farm.address_line1 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {farm.address_line1}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

export default Farms;
