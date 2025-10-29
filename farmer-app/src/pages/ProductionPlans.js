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
  MenuItem,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { Add, Edit, CalendarToday, Agriculture, PhotoCamera, Timeline as TimelineIcon } from '@mui/icons-material';
import { api } from '../services/auth';

function ProductionPlans() {
  const [plans, setPlans] = useState([]);
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    farm_id: '',
    crop_id: '',
    variety: '',
    hectares: '',
    field_identifier: '',
    expected_planting_date: '',
    expected_harvest_window_start: '',
    expected_harvest_window_end: '',
    expected_yield_kg: '',
    target_price_per_kg: '',
    irrigation: 'RAINFED',
    input_supplier: '',
    organic_certified: false,
  });

  const [updateData, setUpdateData] = useState({
    status: '',
    actual_planting_date: '',
    harvest_start: '',
    harvest_end: '',
    actual_yield_kg: '',
    notes: '',
  });

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansRes, farmsRes, cropsRes] = await Promise.all([
        api.get('/farmers/production-plans'),
        api.get('/farmers/farms'),
        api.get('/crops'),
      ]);
      setPlans(plansRes.data || []);
      setFarms(farmsRes.data || []);
      setCrops(cropsRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load production plans');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    setError('');
  };

  const handleUpdateChange = (e) => {
    setUpdateData({ ...updateData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.farm_id || !formData.crop_id) {
      setError('Please select a farm and crop');
      return;
    }

    try {
      const submitData = {
        ...formData,
        farm_id: parseInt(formData.farm_id),
        crop_id: parseInt(formData.crop_id),
        hectares: parseFloat(formData.hectares),
        target_price_per_kg: parseFloat(formData.target_price_per_kg),
        expected_yield_kg: formData.expected_yield_kg ? parseFloat(formData.expected_yield_kg) : null,
        expected_planting_date: formData.expected_planting_date || null,
        expected_harvest_window_start: formData.expected_harvest_window_start || null,
        expected_harvest_window_end: formData.expected_harvest_window_end || null,
      };

      if (editingPlan) {
        // TODO: Implement update endpoint
        setSuccess('Plan update coming soon');
      } else {
        await api.post('/farmers/production-plans', submitData);
        setSuccess('Production plan created successfully!');
        setShowForm(false);
        resetForm();
        loadData();
      }
    } catch (error) {
      setError(error?.response?.data?.detail || 'Failed to create production plan');
    }
  };

  const handleStatusUpdate = async () => {
    try {
      setError('');
      const submitData = {
        ...updateData,
        actual_planting_date: updateData.actual_planting_date || null,
        harvest_start: updateData.harvest_start || null,
        harvest_end: updateData.harvest_end || null,
        actual_yield_kg: updateData.actual_yield_kg ? parseFloat(updateData.actual_yield_kg) : null,
        status: updateData.status || null,
      };

      await api.put(`/farmers/production-plans/${selectedPlan.plan_id}`, submitData);
      setSuccess('Production plan updated successfully!');
      setShowUpdateDialog(false);
      setUpdateData({
        status: '',
        actual_planting_date: '',
        harvest_start: '',
        harvest_end: '',
        actual_yield_kg: '',
        notes: '',
      });
      loadData();
    } catch (error) {
      setError(error?.response?.data?.detail || 'Failed to update production plan');
    }
  };

  const handlePhotoUpload = async (planId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('plan_id', planId);
      
      await api.post('/farmers/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Photo uploaded successfully!');
      loadData();
    } catch (error) {
      setError('Failed to upload photo');
    }
  };

  const resetForm = () => {
    setFormData({
      farm_id: '',
      crop_id: '',
      variety: '',
      hectares: '',
      field_identifier: '',
      expected_planting_date: '',
      expected_harvest_window_start: '',
      expected_harvest_window_end: '',
      expected_yield_kg: '',
      target_price_per_kg: '',
      irrigation: 'RAINFED',
      input_supplier: '',
      organic_certified: false,
    });
    setEditingPlan(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      PLANNED: 'info',
      PLANTED: 'primary',
      GROWING: 'warning',
      FLOWERING: 'warning',
      FRUIT_SET: 'success',
      HARVEST_READY: 'success',
      HARVESTING: 'success',
      COMPLETED: 'default',
      CANCELLED: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusSteps = () => {
    return [
      'PLANNED',
      'PLANTED',
      'GROWING',
      'FLOWERING',
      'FRUIT_SET',
      'HARVEST_READY',
      'HARVESTING',
      'COMPLETED',
    ];
  };

  const getCurrentStepIndex = (status) => {
    const steps = getStatusSteps();
    return steps.indexOf(status) >= 0 ? steps.indexOf(status) : 0;
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Production Plans
        </Typography>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (farms.length === 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Production Plans
        </Typography>
        <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No farms registered
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please register a farm first before creating production plans
          </Typography>
          <Button variant="contained" href="/farms">
            Go to Farms
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Production Plans
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          Create Production Plan
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
            {editingPlan ? 'Edit Production Plan' : 'Create New Production Plan'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Farm"
                  name="farm_id"
                  value={formData.farm_id}
                  onChange={handleChange}
                  required
                >
                  {farms.map((farm) => (
                    <MenuItem key={farm.farm_id} value={farm.farm_id}>
                      {farm.name} - {farm.district}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Crop"
                  name="crop_id"
                  value={formData.crop_id}
                  onChange={handleChange}
                  required
                >
                  {crops.map((crop) => (
                    <MenuItem key={crop.crop_id} value={crop.crop_id}>
                      {crop.name} ({crop.variety})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Variety (Optional)"
                  name="variety"
                  value={formData.variety}
                  onChange={handleChange}
                  placeholder="e.g., Red Delicious, Golden"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Field Identifier"
                  name="field_identifier"
                  value={formData.field_identifier}
                  onChange={handleChange}
                  placeholder="e.g., Field A, Plot 1"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Hectares"
                  name="hectares"
                  type="number"
                  value={formData.hectares}
                  onChange={handleChange}
                  required
                  inputProps={{ step: 'any', min: 0 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Expected Yield (kg)"
                  name="expected_yield_kg"
                  type="number"
                  value={formData.expected_yield_kg}
                  onChange={handleChange}
                  inputProps={{ step: 'any', min: 0 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Target Price (USD/kg)"
                  name="target_price_per_kg"
                  type="number"
                  value={formData.target_price_per_kg}
                  onChange={handleChange}
                  required
                  inputProps={{ step: 'any', min: 0 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  select
                  label="Irrigation Type"
                  name="irrigation"
                  value={formData.irrigation}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="RAINFED">Rainfed</MenuItem>
                  <MenuItem value="IRRIGATED">Irrigated</MenuItem>
                  <MenuItem value="DRIP">Drip</MenuItem>
                  <MenuItem value="SPRINKLER">Sprinkler</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Expected Planting Date"
                  name="expected_planting_date"
                  type="date"
                  value={formData.expected_planting_date}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Expected Harvest Start"
                  name="expected_harvest_window_start"
                  type="date"
                  value={formData.expected_harvest_window_start}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Expected Harvest End"
                  name="expected_harvest_window_end"
                  type="date"
                  value={formData.expected_harvest_window_end}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Input Supplier"
                  name="input_supplier"
                  value={formData.input_supplier}
                  onChange={handleChange}
                  placeholder="e.g., Seed Company Name"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <input
                    type="checkbox"
                    name="organic_certified"
                    checked={formData.organic_certified}
                    onChange={handleChange}
                    id="organic"
                  />
                  <label htmlFor="organic" style={{ marginLeft: 8 }}>
                    Organic Certified
                  </label>
                </Box>
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button type="submit" variant="contained">
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </Button>
              <Button variant="outlined" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancel
              </Button>
            </Box>
          </form>
        </Paper>
      )}

      {/* Status Update Dialog */}
      <Dialog open={showUpdateDialog} onClose={() => setShowUpdateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Production Plan Status</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={updateData.status}
                  name="status"
                  onChange={handleUpdateChange}
                  label="Status"
                >
                  <MenuItem value="PLANNED">Planned</MenuItem>
                  <MenuItem value="PLANTED">Planted</MenuItem>
                  <MenuItem value="GROWING">Growing</MenuItem>
                  <MenuItem value="FLOWERING">Flowering</MenuItem>
                  <MenuItem value="FRUIT_SET">Fruit Set</MenuItem>
                  <MenuItem value="HARVEST_READY">Harvest Ready</MenuItem>
                  <MenuItem value="HARVESTING">Harvesting</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Actual Planting Date"
                name="actual_planting_date"
                type="date"
                value={updateData.actual_planting_date}
                onChange={handleUpdateChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Harvest Start"
                name="harvest_start"
                type="date"
                value={updateData.harvest_start}
                onChange={handleUpdateChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Harvest End"
                name="harvest_end"
                type="date"
                value={updateData.harvest_end}
                onChange={handleUpdateChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Actual Yield (kg)"
                name="actual_yield_kg"
                type="number"
                value={updateData.actual_yield_kg}
                onChange={handleUpdateChange}
                inputProps={{ step: 'any', min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                multiline
                rows={3}
                value={updateData.notes}
                onChange={handleUpdateChange}
                placeholder="Add progress notes, observations, etc."
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCamera />}
                fullWidth
              >
                Upload Photo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files[0] && selectedPlan) {
                      handlePhotoUpload(selectedPlan.plan_id, e.target.files[0]);
                    }
                  }}
                />
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUpdateDialog(false)}>Cancel</Button>
          <Button onClick={handleStatusUpdate} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {plans.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No production plans yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create your first production plan to start tracking your crops
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setShowForm(true)}>
            Create Production Plan
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {plans.map((plan) => {
            const farm = farms.find(f => f.farm_id === plan.farm_id);
            const crop = crops.find(c => c.crop_id === plan.crop_id);
            const currentStep = getCurrentStepIndex(plan.status);
            
            return (
              <Grid item xs={12} md={6} key={plan.plan_id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {crop?.name || 'Unknown Crop'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {farm?.name || 'Unknown Farm'}
                        </Typography>
                        {plan.variety && (
                          <Typography variant="body2" color="text.secondary">
                            Variety: {plan.variety}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label={plan.status}
                        color={getStatusColor(plan.status)}
                        size="small"
                      />
                    </Box>

                    {/* Progress Stepper */}
                    <Box sx={{ mb: 2 }}>
                      <Stepper activeStep={currentStep} orientation="horizontal" sx={{ '& .MuiStepLabel-root': { fontSize: '0.7rem' } }}>
                        {getStatusSteps().slice(0, 4).map((step) => (
                          <Step key={step}>
                            <StepLabel>{step}</StepLabel>
                          </Step>
                        ))}
                      </Stepper>
                    </Box>

                    <Grid container spacing={1} sx={{ mt: 1 }}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Hectares
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {plan.hectares} ha
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Target Price
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          ${plan.target_price_per_kg}/kg
                        </Typography>
                      </Grid>
                      {plan.expected_yield_kg && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Expected Yield
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {plan.expected_yield_kg.toLocaleString()} kg
                          </Typography>
                        </Grid>
                      )}
                      {plan.actual_yield_kg && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Actual Yield
                          </Typography>
                          <Typography variant="body1" fontWeight="bold" color="success.main">
                            {plan.actual_yield_kg.toLocaleString()} kg
                          </Typography>
                        </Grid>
                      )}
                      {plan.field_identifier && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Field
                          </Typography>
                          <Typography variant="body1">
                            {plan.field_identifier}
                          </Typography>
                        </Grid>
                      )}
                      {plan.actual_planting_date && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Planted
                          </Typography>
                          <Typography variant="body1">
                            {new Date(plan.actual_planting_date).toLocaleDateString()}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>

                    {plan.organic_certified && (
                      <Chip label="Organic" color="success" size="small" sx={{ mt: 1 }} />
                    )}

                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<TimelineIcon />}
                        onClick={() => {
                          setSelectedPlan(plan);
                          setUpdateData({
                            status: plan.status,
                            actual_planting_date: plan.actual_planting_date || '',
                            harvest_start: plan.harvest_start || '',
                            harvest_end: plan.harvest_end || '',
                            actual_yield_kg: plan.actual_yield_kg?.toString() || '',
                            notes: '',
                          });
                          setShowUpdateDialog(true);
                        }}
                      >
                        Update Status
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PhotoCamera />}
                        component="label"
                      >
                        Upload Photo
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              handlePhotoUpload(plan.plan_id, e.target.files[0]);
                            }
                          }}
                        />
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}

export default ProductionPlans;
