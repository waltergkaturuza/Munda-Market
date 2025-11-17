import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
} from '@mui/material';
import {
  Inventory,
  TrendingUp,
  Warning,
  CheckCircle,
  Error,
  Refresh,
  Business,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { adminInventoryApi } from '@/api/adminInventory';
import { buyersApi } from '@/api/buyers';
import apiClient from '@/api/client';

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function StockStatusChip({ status }: { status: string }) {
  const colors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
    safe: 'success',
    low: 'warning',
    critical: 'error',
    reorder: 'error',
  };
  return <Chip label={status.toUpperCase()} color={colors[status] || 'default'} size="small" />;
}

function ExpiryStatusChip({ status, days }: { status: string; days?: number }) {
  const colors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
    fresh: 'success',
    approaching: 'warning',
    expired: 'error',
  };
  const labels: Record<string, string> = {
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

export default function InventoryPage() {
  const [tabValue, setTabValue] = useState(0);
  const [buyerFilter, setBuyerFilter] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cropFilter, setCropFilter] = useState<number | ''>('');
  const [buyers, setBuyers] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);

  // Fetch buyers and crops for filters
  React.useEffect(() => {
    buyersApi.getAll().then((data) => setBuyers(data));
    apiClient.get('/crops/').then((response: any) => setCrops(response.data || []));
  }, []);

  // Dashboard Metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['admin-inventory-metrics'],
    queryFn: adminInventoryApi.getMetrics,
    refetchInterval: 60000,
  });

  // Buyer Summaries
  const { data: buyerSummaries = [] } = useQuery({
    queryKey: ['admin-buyer-summaries'],
    queryFn: adminInventoryApi.getBuyerSummaries,
    refetchInterval: 60000,
  });

  // Stock Items
  const { data: stockItems = [], isLoading: stockLoading } = useQuery({
    queryKey: ['admin-stock-items', buyerFilter, statusFilter, cropFilter],
    queryFn: () =>
      adminInventoryApi.getStockItems(
        buyerFilter ? Number(buyerFilter) : undefined,
        cropFilter ? Number(cropFilter) : undefined,
        statusFilter || undefined
      ),
    refetchInterval: 60000,
  });

  // Sales Intensity
  const { data: salesIntensity = [] } = useQuery({
    queryKey: ['admin-sales-intensity'],
    queryFn: () => adminInventoryApi.getSalesIntensity(30),
    refetchInterval: 300000,
  });

  // Stock Movements
  const { data: movements = [] } = useQuery({
    queryKey: ['admin-stock-movements', buyerFilter, cropFilter],
    queryFn: () =>
      adminInventoryApi.getMovements(
        buyerFilter ? Number(buyerFilter) : undefined,
        cropFilter ? Number(cropFilter) : undefined,
        undefined,
        30
      ),
    refetchInterval: 60000,
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Buyer Inventory Management
        </Typography>
      </Box>

      {/* Dashboard Metrics */}
      {metricsLoading ? (
        <LinearProgress sx={{ mb: 3 }} />
      ) : (
        metrics && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Buyers with Stock
                  </Typography>
                  <Typography variant="h4">{metrics.total_buyers_with_stock || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
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
        )
      )}

      <Tabs value={tabValue} onChange={(_e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="Buyer Summaries" icon={<Business />} iconPosition="start" />
        <Tab label="All Stock Items" icon={<Inventory />} iconPosition="start" />
        <Tab label="Sales Intensity" icon={<TrendingUp />} iconPosition="start" />
        <Tab label="Movements History" icon={<Refresh />} iconPosition="start" />
      </Tabs>

      {/* Buyer Summaries Tab */}
      <TabPanel value={tabValue} index={0}>
        {buyerSummaries.length === 0 ? (
          <Alert severity="info">No buyers with stock inventory found.</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Buyer</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell align="right">Total Items</TableCell>
                  <TableCell align="right">Total Value</TableCell>
                  <TableCell align="right">Total Quantity (kg)</TableCell>
                  <TableCell align="right">Low Stock</TableCell>
                  <TableCell align="right">Expiring Soon</TableCell>
                  <TableCell align="right">Expired</TableCell>
                  <TableCell>Last Movement</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {buyerSummaries.map((summary) => (
                  <TableRow key={summary.buyer_id}>
                    <TableCell>
                      <Typography variant="subtitle2">{summary.buyer_name}</Typography>
                    </TableCell>
                    <TableCell>{summary.buyer_company || '-'}</TableCell>
                    <TableCell align="right">{summary.total_items}</TableCell>
                    <TableCell align="right">${summary.total_stock_value.toFixed(2)}</TableCell>
                    <TableCell align="right">{summary.total_quantity_kg.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      {summary.items_low_stock > 0 ? (
                        <Chip label={summary.items_low_stock} color="warning" size="small" />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {summary.items_expiring_soon > 0 ? (
                        <Chip label={summary.items_expiring_soon} color="error" size="small" />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {summary.items_expired > 0 ? (
                        <Chip label={summary.items_expired} color="error" size="small" />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {summary.last_movement_date
                        ? new Date(summary.last_movement_date).toLocaleDateString()
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* All Stock Items Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box mb={2} display="flex" gap={2} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Buyer</InputLabel>
            <Select
              value={buyerFilter}
              onChange={(e) => setBuyerFilter(e.target.value as number | '')}
              label="Filter by Buyer"
            >
              <MenuItem value="">All Buyers</MenuItem>
              {buyers.map((buyer) => (
                <MenuItem key={buyer.user_id} value={buyer.user_id}>
                  {buyer.name} {buyer.company_name ? `(${buyer.company_name})` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Crop</InputLabel>
            <Select
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value as number | '')}
              label="Filter by Crop"
            >
              <MenuItem value="">All Crops</MenuItem>
              {crops.map((crop) => (
                <MenuItem key={crop.crop_id} value={crop.crop_id}>
                  {crop.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Filter by Status"
            >
              <MenuItem value="">All Status</MenuItem>
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
        ) : stockItems.length === 0 ? (
          <Alert severity="info">No stock items found matching the filters.</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Buyer</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Current Stock (kg)</TableCell>
                  <TableCell align="right">Reorder Point (kg)</TableCell>
                  <TableCell align="right">Days of Cover</TableCell>
                  <TableCell>Stock Status</TableCell>
                  <TableCell>Expiry Status</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell>Intensity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stockItems.map((item) => (
                  <TableRow key={item.stock_id}>
                    <TableCell>
                      <Typography variant="subtitle2">{item.buyer_name}</Typography>
                      {item.buyer_company && (
                        <Typography variant="caption" color="text.secondary">
                          {item.buyer_company}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{item.crop_name}</TableCell>
                    <TableCell align="right">{item.current_quantity_kg.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      {item.reorder_point_kg ? item.reorder_point_kg.toFixed(2) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {item.days_of_stock_cover ? `${item.days_of_stock_cover.toFixed(1)} days` : '-'}
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
                      {item.sales_intensity_code && (
                        <Chip
                          label={item.sales_intensity_code}
                          size="small"
                          color={
                            item.sales_intensity_code === 'A'
                              ? 'success'
                              : item.sales_intensity_code === 'B'
                              ? 'info'
                              : item.sales_intensity_code === 'C'
                              ? 'warning'
                              : 'error'
                          }
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Sales Intensity Tab */}
      <TabPanel value={tabValue} index={2}>
        {salesIntensity.length === 0 ? (
          <Alert severity="info">No sales intensity data available yet.</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Buyers</TableCell>
                  <TableCell align="right">Total Consumption (kg)</TableCell>
                  <TableCell align="right">Daily Consumption (kg)</TableCell>
                  <TableCell align="right">Total Stock (kg)</TableCell>
                  <TableCell align="right">Total Value</TableCell>
                  <TableCell align="right">Avg Turnover</TableCell>
                  <TableCell align="right">Days to Sellout</TableCell>
                  <TableCell>Intensity Code</TableCell>
                  <TableCell>Recommendation</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salesIntensity.map((item) => (
                  <TableRow key={item.crop_id}>
                    <TableCell>
                      <Typography variant="subtitle2">{item.crop_name}</Typography>
                    </TableCell>
                    <TableCell align="right">{item.total_buyers}</TableCell>
                    <TableCell align="right">{item.total_consumption_kg.toFixed(2)}</TableCell>
                    <TableCell align="right">{item.average_daily_consumption_kg.toFixed(2)}</TableCell>
                    <TableCell align="right">{item.total_stock_kg.toFixed(2)}</TableCell>
                    <TableCell align="right">${item.total_value_usd.toFixed(2)}</TableCell>
                    <TableCell align="right">{item.average_inventory_turnover.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      {item.days_to_sellout ? `${item.days_to_sellout.toFixed(1)} days` : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.sales_intensity_code}
                        size="small"
                        color={
                          item.sales_intensity_code === 'A'
                            ? 'success'
                            : item.sales_intensity_code === 'B'
                            ? 'info'
                            : item.sales_intensity_code === 'C'
                            ? 'warning'
                            : 'error'
                        }
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
        )}
      </TabPanel>

      {/* Movements History Tab */}
      <TabPanel value={tabValue} index={3}>
        <Box mb={2} display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Buyer</InputLabel>
            <Select
              value={buyerFilter}
              onChange={(e) => setBuyerFilter(e.target.value as number | '')}
              label="Filter by Buyer"
            >
              <MenuItem value="">All Buyers</MenuItem>
              {buyers.map((buyer) => (
                <MenuItem key={buyer.user_id} value={buyer.user_id}>
                  {buyer.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Crop</InputLabel>
            <Select
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value as number | '')}
              label="Filter by Crop"
            >
              <MenuItem value="">All Crops</MenuItem>
              {crops.map((crop) => (
                <MenuItem key={crop.crop_id} value={crop.crop_id}>
                  {crop.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {movements.length === 0 ? (
          <Alert severity="info">No stock movements found.</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Buyer</TableCell>
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
                    <TableCell>{new Date(movement.movement_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">{movement.buyer_name}</Typography>
                      {movement.buyer_company && (
                        <Typography variant="caption" color="text.secondary">
                          {movement.buyer_company}
                        </Typography>
                      )}
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
    </Box>
  );
}
