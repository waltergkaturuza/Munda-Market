import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Inventory,
  Add,
  FilterList,
  TrendingUp,
  Warning,
  CheckCircle,
  Error,
  Refresh,
  ShoppingCart,
  Delete,
  Edit,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { buyerInventoryApi } from '../services/buyerInventory';
import { inventoryApi } from '../services/inventory';
import { api } from '../services/auth';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function StockStatusChip({ status }) {
  const colors = {
    safe: 'success',
    low: 'warning',
    critical: 'error',
    reorder: 'error',
  };
  return <Chip label={status.toUpperCase()} color={colors[status] || 'default'} size="small" />;
}

function ExpiryStatusChip({ status, days }) {
  const colors = {
    fresh: 'success',
    approaching: 'warning',
    expired: 'error',
  };
  const labels = {
    fresh: `Fresh (${days}d)`,
    approaching: `Expiring Soon (${days}d)`,
    expired: 'Expired',
  };
  return (
    <Chip
      label={labels[status] || status}
      color={colors[status] || 'default'}
      size="small"
      icon={status === 'expired' ? <Error /> : status === 'approaching' ? <Warning /> : <CheckCircle />}
    />
  );
}

export default function InventoryMonitoring() {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [crops, setCrops] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  const [movementForm, setMovementForm] = useState({
    crop_id: '',
    movement_type: 'consumption',
    quantity_kg: '',
    unit_cost_usd: '',
    notes: '',
  });

  // Fetch crops
  React.useEffect(() => {
    api.get('/crops/').then((response) => {
      setCrops(response.data || []);
    });
  }, []);

  // Dashboard Metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['inventory-dashboard-metrics'],
    queryFn: buyerInventoryApi.getDashboardMetrics,
    refetchInterval: 60000,
  });

  // Stock Items
  const { data: stockItems = [], isLoading: stockLoading } = useQuery({
    queryKey: ['stock-items', statusFilter],
    queryFn: () => buyerInventoryApi.getStockItems(false, statusFilter || null),
    refetchInterval: 60000,
  });

  // Sales Intensity Analysis
  const { data: salesIntensity = [] } = useQuery({
    queryKey: ['sales-intensity'],
    queryFn: () => buyerInventoryApi.getSalesIntensityAnalysis(30),
    refetchInterval: 300000, // 5 minutes
  });

  // Reorder Suggestions
  const { data: reorderSuggestions = [] } = useQuery({
    queryKey: ['reorder-suggestions'],
    queryFn: buyerInventoryApi.getReorderSuggestions,
    refetchInterval: 300000,
  });

  // Stock Movements History
  const { data: movements = [] } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: () => buyerInventoryApi.getStockMovements(null, null, 30),
    refetchInterval: 60000,
  });

  const createMovementMutation = useMutation({
    mutationFn: buyerInventoryApi.createStockMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      setMovementDialogOpen(false);
      setMovementForm({
        crop_id: '',
        movement_type: 'consumption',
        quantity_kg: '',
        unit_cost_usd: '',
        notes: '',
      });
    },
  });

  const handleCreateMovement = () => {
    createMovementMutation.mutate({
      crop_id: parseInt(movementForm.crop_id),
      movement_type: movementForm.movement_type,
      quantity_kg: parseFloat(movementForm.quantity_kg),
      unit_cost_usd: movementForm.unit_cost_usd ? parseFloat(movementForm.unit_cost_usd) : null,
      notes: movementForm.notes || null,
    });
  };

  const handleReorder = (stockItem) => {
    window.location.href = `/crops?crop=${stockItem.crop_id}`;
  };

  const filteredStockItems = stockItems;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Inventory Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setMovementDialogOpen(true)}
        >
          Record Stock Movement
        </Button>
      </Box>

      {/* Dashboard Metrics */}
      {metricsLoading ? (
        <LinearProgress sx={{ mb: 3 }} />
      ) : metrics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Stock Value
                </Typography>
                <Typography variant="h4">${(metrics.total_stock_value || 0).toFixed(2)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Items
                </Typography>
                <Typography variant="h4">{metrics.total_items || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Low Stock Items
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {metrics.items_low_stock || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Expiring Soon
                </Typography>
                <Typography variant="h4" color="error.main">
                  {metrics.items_expiring_soon || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="Stock Dashboard" icon={<Inventory />} iconPosition="start" />
        <Tab label="Reorder Suggestions" icon={<ShoppingCart />} iconPosition="start" />
        <Tab label="Sales Intensity" icon={<TrendingUp />} iconPosition="start" />
        <Tab label="Movements History" icon={<Refresh />} iconPosition="start" />
      </Tabs>

      {/* Stock Dashboard Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box mb={2} display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Filter by Status"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="safe">Safe</MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="reorder">Reorder</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {stockLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : filteredStockItems.length === 0 ? (
          <Alert severity="info">
            No stock items found. Stock will be automatically added when orders are delivered.
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Current Stock (kg)</TableCell>
                  <TableCell align="right">Reorder Point (kg)</TableCell>
                  <TableCell align="right">Days of Cover</TableCell>
                  <TableCell>Stock Status</TableCell>
                  <TableCell>Expiry Status</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStockItems.map((item) => (
                  <TableRow key={item.stock_id}>
                    <TableCell>
                      <Typography variant="subtitle2">{item.crop_name}</Typography>
                      {item.sales_intensity_code && (
                        <Chip label={item.sales_intensity_code} size="small" sx={{ mt: 0.5 }} />
                      )}
                    </TableCell>
                    <TableCell align="right">{item.current_quantity_kg.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      {item.reorder_point_kg ? item.reorder_point_kg.toFixed(2) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {item.days_of_stock_cover
                        ? `${item.days_of_stock_cover.toFixed(1)} days`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <StockStatusChip status={item.stock_status} />
                    </TableCell>
                    <TableCell>
                      {item.expiry_status && (
                        <ExpiryStatusChip status={item.expiry_status} days={item.days_until_expiry} />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {item.total_value_usd ? `$${item.total_value_usd.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Reorder">
                        <IconButton size="small" onClick={() => handleReorder(item)}>
                          <ShoppingCart />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Reorder Suggestions Tab */}
      <TabPanel value={tabValue} index={1}>
        {reorderSuggestions.length === 0 ? (
          <Alert severity="success">No reorder suggestions. All stock levels are healthy!</Alert>
        ) : (
          <Grid container spacing={3}>
            {reorderSuggestions.map((suggestion) => (
              <Grid item xs={12} md={6} key={suggestion.crop_id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography variant="h6">{suggestion.crop_name}</Typography>
                      <Chip
                        label={suggestion.urgency.toUpperCase()}
                        color={suggestion.urgency === 'critical' ? 'error' : 'warning'}
                        size="small"
                      />
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Current Stock
                        </Typography>
                        <Typography variant="h6">{suggestion.current_stock_kg.toFixed(2)} kg</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Reorder Point
                        </Typography>
                        <Typography variant="h6">{suggestion.reorder_point_kg.toFixed(2)} kg</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Days Until Stockout
                        </Typography>
                        <Typography variant="h6" color="error.main">
                          {suggestion.days_until_stockout
                            ? `${suggestion.days_until_stockout.toFixed(1)} days`
                            : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Suggested Reorder
                        </Typography>
                        <Typography variant="h6" color="primary.main">
                          {suggestion.suggested_reorder_kg.toFixed(2)} kg
                        </Typography>
                      </Grid>
                    </Grid>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<ShoppingCart />}
                      onClick={() => window.location.href = `/crops?crop=${suggestion.crop_id}`}
                      sx={{ mt: 2 }}
                    >
                      Order Now
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Sales Intensity Tab */}
      <TabPanel value={tabValue} index={2}>
        {salesIntensity.length === 0 ? (
          <Alert severity="info">No sales intensity data available yet.</Alert>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Sales Intensity Analysis
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align="right">Turnover</TableCell>
                          <TableCell align="right">Days of Inventory</TableCell>
                          <TableCell align="right">Daily Consumption</TableCell>
                          <TableCell align="right">Days to Sellout</TableCell>
                          <TableCell>Intensity Code</TableCell>
                          <TableCell>Recommendation</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {salesIntensity.map((item) => (
                          <TableRow key={item.crop_id}>
                            <TableCell>{item.crop_name}</TableCell>
                            <TableCell align="right">{item.inventory_turnover.toFixed(2)}</TableCell>
                            <TableCell align="right">
                              {item.days_of_inventory ? item.days_of_inventory.toFixed(1) : '-'}
                            </TableCell>
                            <TableCell align="right">
                              {item.average_daily_consumption_kg.toFixed(2)} kg
                            </TableCell>
                            <TableCell align="right">
                              {item.days_to_sellout ? `${item.days_to_sellout.toFixed(1)} days` : '-'}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={item.sales_intensity_code}
                                color={
                                  item.sales_intensity_code === 'A'
                                    ? 'success'
                                    : item.sales_intensity_code === 'B'
                                    ? 'info'
                                    : item.sales_intensity_code === 'C'
                                    ? 'warning'
                                    : 'error'
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{item.recommendation}</Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Movements History Tab */}
      <TabPanel value={tabValue} index={3}>
        {movements.length === 0 ? (
          <Alert severity="info">No stock movements recorded yet.</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Quantity (kg)</TableCell>
                  <TableCell align="right">Unit Cost</TableCell>
                  <TableCell align="right">Total Cost</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.movement_id}>
                    <TableCell>
                      {new Date(movement.movement_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{movement.crop_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={movement.movement_type}
                        size="small"
                        color={
                          movement.movement_type === 'purchase'
                            ? 'success'
                            : movement.movement_type === 'consumption'
                            ? 'info'
                            : 'error'
                        }
                      />
                    </TableCell>
                    <TableCell align="right">{Math.abs(movement.quantity_kg).toFixed(2)}</TableCell>
                    <TableCell align="right">
                      {movement.unit_cost_usd ? `$${movement.unit_cost_usd.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {movement.total_cost_usd ? `$${movement.total_cost_usd.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>{movement.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Record Movement Dialog */}
      <Dialog
        open={movementDialogOpen}
        onClose={() => setMovementDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Record Stock Movement</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <FormControl fullWidth>
              <InputLabel>Product</InputLabel>
              <Select
                value={movementForm.crop_id}
                onChange={(e) => setMovementForm({ ...movementForm, crop_id: e.target.value })}
                label="Product"
              >
                {crops.map((crop) => (
                  <MenuItem key={crop.crop_id} value={crop.crop_id}>
                    {crop.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Movement Type</InputLabel>
              <Select
                value={movementForm.movement_type}
                onChange={(e) => setMovementForm({ ...movementForm, movement_type: e.target.value })}
                label="Movement Type"
              >
                <MenuItem value="purchase">Purchase (Stock In)</MenuItem>
                <MenuItem value="consumption">Consumption (Stock Out)</MenuItem>
                <MenuItem value="waste">Waste (Expired/Damaged)</MenuItem>
                <MenuItem value="adjustment">Adjustment</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Quantity (kg)"
              type="number"
              value={movementForm.quantity_kg}
              onChange={(e) => setMovementForm({ ...movementForm, quantity_kg: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Unit Cost (USD) - Optional"
              type="number"
              value={movementForm.unit_cost_usd}
              onChange={(e) => setMovementForm({ ...movementForm, unit_cost_usd: e.target.value })}
              fullWidth
            />
            <TextField
              label="Notes - Optional"
              multiline
              rows={3}
              value={movementForm.notes}
              onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMovementDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateMovement}
            variant="contained"
            disabled={
              !movementForm.crop_id ||
              !movementForm.quantity_kg ||
              createMovementMutation.isPending
            }
          >
            {createMovementMutation.isPending ? 'Recording...' : 'Record Movement'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
