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
  Switch,
  FormControlLabel,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Inventory,
  Add,
  FilterList,
  Refresh,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { inventoryApi } from '../services/inventory';
import { api } from '../services/auth';
import StockLevelCard from '../components/StockLevelCard';
import InventoryAlerts from '../components/InventoryAlerts';
import StockHistoryChart from '../components/StockHistoryChart';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function StockHistoryChartWrapper({ stockLevel, enabled }) {
  const { data: historyData = [] } = useQuery({
    queryKey: ['stock-history', stockLevel.crop_id],
    queryFn: () => inventoryApi.getStockHistory(stockLevel.crop_id, 30),
    enabled: enabled,
  });

  return (
    <Grid item xs={12}>
      <StockHistoryChart
        cropId={stockLevel.crop_id}
        cropName={stockLevel.crop_name}
        historyData={historyData}
      />
    </Grid>
  );
}

export default function InventoryMonitoring() {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [preferenceDialogOpen, setPreferenceDialogOpen] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [crops, setCrops] = useState([]);

  const [preferenceForm, setPreferenceForm] = useState({
    crop_id: '',
    min_stock_threshold_kg: '',
    reorder_quantity_kg: '',
    enable_low_stock_alerts: true,
    enable_harvest_alerts: true,
    is_favorite: false,
  });

  // Fetch crops for dropdown
  React.useEffect(() => {
    api.get('/crops/').then((response) => {
      setCrops(response.data || []);
    });
  }, []);

  const { data: stockLevels = [], isLoading: stockLoading } = useQuery({
    queryKey: ['stock-levels'],
    queryFn: () => inventoryApi.getStockLevels(),
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['inventory-alerts'],
    queryFn: () => inventoryApi.getAlerts(),
    refetchInterval: 30000,
  });

  const { data: preferences = [] } = useQuery({
    queryKey: ['inventory-preferences'],
    queryFn: () => inventoryApi.listPreferences(),
  });

  const createPreferenceMutation = useMutation({
    mutationFn: inventoryApi.createPreference,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-preferences'] });
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      setPreferenceDialogOpen(false);
      setPreferenceForm({
        crop_id: '',
        min_stock_threshold_kg: '',
        reorder_quantity_kg: '',
        enable_low_stock_alerts: true,
        enable_harvest_alerts: true,
        is_favorite: false,
      });
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: inventoryApi.acknowledgeAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: inventoryApi.dismissAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
    },
  });

  const handleCreatePreference = () => {
    createPreferenceMutation.mutate({
      crop_id: parseInt(preferenceForm.crop_id),
      min_stock_threshold_kg: parseFloat(preferenceForm.min_stock_threshold_kg),
      reorder_quantity_kg: preferenceForm.reorder_quantity_kg
        ? parseFloat(preferenceForm.reorder_quantity_kg)
        : null,
      enable_low_stock_alerts: preferenceForm.enable_low_stock_alerts,
      enable_harvest_alerts: preferenceForm.enable_harvest_alerts,
      is_favorite: preferenceForm.is_favorite,
    });
  };

  const handleReorder = (stockLevel) => {
    // Navigate to crop discovery page filtered by this crop
    window.location.href = `/crops?crop=${stockLevel.crop_id}`;
  };

  const filteredStockLevels =
    tabValue === 1
      ? stockLevels.filter((s) => s.alert_level !== 'ok')
      : stockLevels;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Inventory Monitoring
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setPreferenceDialogOpen(true)}
        >
          Add Product to Monitor
        </Button>
      </Box>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="All Products" icon={<Inventory />} iconPosition="start" />
        <Tab label="Alerts" icon={<FilterList />} iconPosition="start" />
        <Tab label="Trends" icon={<Refresh />} iconPosition="start" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        {stockLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : filteredStockLevels.length === 0 ? (
          <Alert severity="info">
            No products being monitored. Click "Add Product to Monitor" to get started.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {filteredStockLevels.map((stockLevel) => (
              <Grid item xs={12} sm={6} md={4} key={stockLevel.crop_id}>
                <StockLevelCard
                  stockLevel={stockLevel}
                  onReorder={handleReorder}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <InventoryAlerts
          alerts={alerts}
          onAcknowledge={(id) => acknowledgeMutation.mutate(id)}
          onDismiss={(id) => dismissMutation.mutate(id)}
        />
        {alerts.filter((a) => a.status === 'active').length === 0 && (
          <Alert severity="success">No active alerts. All stock levels are healthy!</Alert>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {stockLevels.length === 0 ? (
          <Alert severity="info">
            No products being monitored. Add products to see historical trends.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {stockLevels.map((stockLevel) => (
              <StockHistoryChartWrapper
                key={stockLevel.crop_id}
                stockLevel={stockLevel}
                enabled={tabValue === 2}
              />
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Create Preference Dialog */}
      <Dialog open={preferenceDialogOpen} onClose={() => setPreferenceDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Product to Monitor</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <FormControl fullWidth>
              <InputLabel>Product</InputLabel>
              <Select
                value={preferenceForm.crop_id}
                onChange={(e) => setPreferenceForm({ ...preferenceForm, crop_id: e.target.value })}
                label="Product"
              >
                {crops.map((crop) => (
                  <MenuItem key={crop.crop_id} value={crop.crop_id}>
                    {crop.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Minimum Stock Threshold (kg)"
              type="number"
              value={preferenceForm.min_stock_threshold_kg}
              onChange={(e) =>
                setPreferenceForm({ ...preferenceForm, min_stock_threshold_kg: e.target.value })
              }
              fullWidth
              required
              helperText="Alert when stock falls below this amount"
            />
            <TextField
              label="Suggested Reorder Quantity (kg)"
              type="number"
              value={preferenceForm.reorder_quantity_kg}
              onChange={(e) =>
                setPreferenceForm({ ...preferenceForm, reorder_quantity_kg: e.target.value })
              }
              fullWidth
              helperText="Recommended quantity to order when stock is low"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferenceForm.enable_low_stock_alerts}
                  onChange={(e) =>
                    setPreferenceForm({ ...preferenceForm, enable_low_stock_alerts: e.target.checked })
                  }
                />
              }
              label="Enable Low Stock Alerts"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferenceForm.enable_harvest_alerts}
                  onChange={(e) =>
                    setPreferenceForm({ ...preferenceForm, enable_harvest_alerts: e.target.checked })
                  }
                />
              }
              label="Enable Harvest Window Alerts"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferenceForm.is_favorite}
                  onChange={(e) =>
                    setPreferenceForm({ ...preferenceForm, is_favorite: e.target.checked })
                  }
                />
              }
              label="Mark as Favorite"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreferenceDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreatePreference}
            variant="contained"
            disabled={!preferenceForm.crop_id || !preferenceForm.min_stock_threshold_kg}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

