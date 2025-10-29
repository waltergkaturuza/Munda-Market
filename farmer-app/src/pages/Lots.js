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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add, Inventory, Search, FilterList, Clear } from '@mui/icons-material';
import { api } from '../services/auth';

function Lots() {
  const [lots, setLots] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');

  const [formData, setFormData] = useState({
    plan_id: '',
    grade: 'A',
    available_kg: '',
    min_order_kg: '1.0',
    max_order_kg: '',
    size_range: '',
    color_description: '',
    brix_reading: '',
    harvest_date: '',
  });

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lotsRes, plansRes] = await Promise.all([
        api.get('/farmers/lots'),
        api.get('/farmers/production-plans'),
      ]);
      setLots(lotsRes.data || []);
      setPlans(plansRes.data || []);
    } catch (error) {
      console.error('Failed to load lots:', error);
      setError('Failed to load lots');
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

    if (!formData.plan_id) {
      setError('Please select a production plan');
      return;
    }

    try {
      const submitData = {
        ...formData,
        plan_id: parseInt(formData.plan_id),
        available_kg: parseFloat(formData.available_kg),
        min_order_kg: parseFloat(formData.min_order_kg),
        max_order_kg: formData.max_order_kg ? parseFloat(formData.max_order_kg) : null,
        brix_reading: formData.brix_reading ? parseFloat(formData.brix_reading) : null,
        harvest_date: formData.harvest_date || null,
      };

      await api.post('/farmers/lots', submitData);
      setSuccess('Lot created successfully!');
      setShowForm(false);
      resetForm();
      loadData();
    } catch (error) {
      setError(error?.response?.data?.detail || 'Failed to create lot');
    }
  };

  const resetForm = () => {
    setFormData({
      plan_id: '',
      grade: 'A',
      available_kg: '',
      min_order_kg: '1.0',
      max_order_kg: '',
      size_range: '',
      color_description: '',
      brix_reading: '',
      harvest_date: '',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      AVAILABLE: 'success',
      RESERVED: 'warning',
      SOLD: 'default',
      SHIPPED: 'info',
      HARVESTED: 'info',
      DELIVERED: 'success',
      EXPIRED: 'error',
    };
    return colors[status] || 'default';
  };

  const getGradeColor = (grade) => {
    const colors = {
      A: 'success',
      B: 'warning',
      C: 'error',
    };
    return colors[grade] || 'default';
  };

  // Filter lots
  const filteredLots = lots.filter(lot => {
    const matchesSearch = !searchTerm || 
      lot.lot_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.plan_id.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'ALL' || lot.current_status === statusFilter;
    const matchesGrade = gradeFilter === 'ALL' || lot.grade === gradeFilter;
    const matchesPlan = planFilter === 'ALL' || lot.plan_id.toString() === planFilter;

    return matchesSearch && matchesStatus && matchesGrade && matchesPlan;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setGradeFilter('ALL');
    setPlanFilter('ALL');
  };

  const hasActiveFilters = statusFilter !== 'ALL' || gradeFilter !== 'ALL' || planFilter !== 'ALL' || searchTerm;

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Lots
        </Typography>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const availablePlans = plans.filter(p => p.status === 'HARVEST_READY' || p.status === 'HARVESTING' || p.status === 'COMPLETED');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Lots
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          disabled={availablePlans.length === 0}
        >
          Create Lot
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

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by lot number or plan ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="AVAILABLE">Available</MenuItem>
                <MenuItem value="RESERVED">Reserved</MenuItem>
                <MenuItem value="SOLD">Sold</MenuItem>
                <MenuItem value="SHIPPED">Shipped</MenuItem>
                <MenuItem value="DELIVERED">Delivered</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Grade</InputLabel>
              <Select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                label="Grade"
              >
                <MenuItem value="ALL">All Grades</MenuItem>
                <MenuItem value="A">Grade A</MenuItem>
                <MenuItem value="B">Grade B</MenuItem>
                <MenuItem value="C">Grade C</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Plan</InputLabel>
              <Select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                label="Plan"
              >
                <MenuItem value="ALL">All Plans</MenuItem>
                {plans.map((plan) => (
                  <MenuItem key={plan.plan_id} value={plan.plan_id.toString()}>
                    Plan #{plan.plan_id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            {hasActiveFilters && (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Clear />}
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      {showForm && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Create New Lot
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Production Plan"
                  name="plan_id"
                  value={formData.plan_id}
                  onChange={handleChange}
                  required
                  helperText="Select a plan that is ready for harvest"
                >
                  {availablePlans.map((plan) => (
                    <MenuItem key={plan.plan_id} value={plan.plan_id}>
                      Plan #{plan.plan_id} - {plan.hectares}ha
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="A">Grade A (Premium)</MenuItem>
                  <MenuItem value="B">Grade B (Standard)</MenuItem>
                  <MenuItem value="C">Grade C (Commercial)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Available Quantity (kg)"
                  name="available_kg"
                  type="number"
                  value={formData.available_kg}
                  onChange={handleChange}
                  required
                  inputProps={{ step: 'any', min: 0 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Minimum Order (kg)"
                  name="min_order_kg"
                  type="number"
                  value={formData.min_order_kg}
                  onChange={handleChange}
                  required
                  inputProps={{ step: 'any', min: 0 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Maximum Order (kg)"
                  name="max_order_kg"
                  type="number"
                  value={formData.max_order_kg}
                  onChange={handleChange}
                  inputProps={{ step: 'any', min: 0 }}
                  helperText="Leave empty for no limit"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Size Range"
                  name="size_range"
                  value={formData.size_range}
                  onChange={handleChange}
                  placeholder="e.g., Medium, Large, Extra Large"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Color Description"
                  name="color_description"
                  value={formData.color_description}
                  onChange={handleChange}
                  placeholder="e.g., Bright red, Golden yellow"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Brix Reading"
                  name="brix_reading"
                  type="number"
                  value={formData.brix_reading}
                  onChange={handleChange}
                  inputProps={{ step: 'any', min: 0 }}
                  helperText="Sugar content measurement"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Harvest Date"
                  name="harvest_date"
                  type="date"
                  value={formData.harvest_date}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button type="submit" variant="contained">
                Create Lot
              </Button>
              <Button variant="outlined" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancel
              </Button>
            </Box>
          </form>
        </Paper>
      )}

      {lots.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Inventory sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No lots created yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create lots from your production plans to make them available for sale
          </Typography>
          {availablePlans.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No production plans ready for harvest. Create a production plan first.
            </Typography>
          ) : (
            <Button variant="contained" startIcon={<Add />} onClick={() => setShowForm(true)}>
              Create Your First Lot
            </Button>
          )}
        </Paper>
      ) : filteredLots.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <FilterList sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No lots match your filters
          </Typography>
          <Button variant="outlined" onClick={clearFilters} sx={{ mt: 2 }}>
            Clear Filters
          </Button>
        </Paper>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing {filteredLots.length} of {lots.length} lots
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Lot Number</TableCell>
                  <TableCell>Production Plan</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell align="right">Available (kg)</TableCell>
                  <TableCell align="right">Reserved (kg)</TableCell>
                  <TableCell align="right">Sold (kg)</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Harvest Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLots.map((lot) => (
                  <TableRow key={lot.lot_id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {lot.lot_number}
                      </Typography>
                    </TableCell>
                    <TableCell>Plan #{lot.plan_id}</TableCell>
                    <TableCell>
                      <Chip
                        label={`Grade ${lot.grade}`}
                        color={getGradeColor(lot.grade)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">{lot.available_kg.toLocaleString()}</TableCell>
                    <TableCell align="right">{lot.reserved_kg.toLocaleString()}</TableCell>
                    <TableCell align="right">{lot.sold_kg.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={lot.current_status}
                        color={getStatusColor(lot.current_status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {lot.harvest_date
                        ? new Date(lot.harvest_date).toLocaleDateString()
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}

export default Lots;
