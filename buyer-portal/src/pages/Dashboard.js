import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  ShoppingCart,
  TrendingUp,
  LocalShipping,
  Agriculture,
  Schedule,
  CheckCircle,
} from '@mui/icons-material';
import { useAuth } from '../services/auth';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { bannersApi } from '../services/banners';
import { inventoryApi } from '../services/inventory';
import { buyersApi } from '../services/buyers';
import { api } from '../services/auth';
import Banner from '../components/Banner';
import InventoryAlerts from '../components/InventoryAlerts';

function StatCard({ title, value, icon, color = 'primary' }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ py: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: '50%',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function getStatusColor(status) {
  switch (status) {
    case 'delivered':
      return 'success';
    case 'in_transit':
      return 'info';
    case 'processing':
      return 'warning';
    default:
      return 'default';
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'delivered':
      return <CheckCircle />;
    case 'in_transit':
      return <LocalShipping />;
    case 'processing':
      return <Schedule />;
    default:
      return null;
  }
}

function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch dashboard stats (buyer-specific)
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['buyer-dashboard-stats'],
    queryFn: buyersApi.getDashboardStats,
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch recent orders (buyer-specific)
  const { data: recentOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['buyer-recent-orders'],
    queryFn: () => buyersApi.getRecentOrders(5),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch available crops (public - same for all buyers)
  const { data: availableCrops = [], isLoading: cropsLoading } = useQuery({
    queryKey: ['available-crops'],
    queryFn: async () => {
      const response = await api.get('/crops/', { params: { limit: 3 } });
      return response.data;
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const { data: banners = [] } = useQuery({
    queryKey: ['dashboard-banners', 'buyer'],
    queryFn: bannersApi.getActiveBanners,
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['inventory-alerts'],
    queryFn: () => inventoryApi.getAlerts({ status_filter: 'active' }),
    refetchInterval: 30000, // Refresh every 30 seconds
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

  const handleAcknowledge = (alertId) => {
    acknowledgeMutation.mutate(alertId);
  };

  const handleDismiss = (alertId) => {
    dismissMutation.mutate(alertId);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Welcome back, {user?.name}! Here's what's happening with your orders.
      </Typography>

      {/* Banners */}
      {banners.map((banner) => (
        <Banner key={banner.banner_id} banner={banner} />
      ))}

      {/* Inventory Alerts */}
      <InventoryAlerts
        alerts={alerts}
        onAcknowledge={handleAcknowledge}
        onDismiss={handleDismiss}
      />

      {/* Stats Cards */}
      {statsLoading ? (
        <LinearProgress sx={{ mb: 3 }} />
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Orders"
              value={stats?.total_orders || 0}
              icon={<ShoppingCart sx={{ color: 'primary.main' }} />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Orders"
              value={stats?.active_orders || 0}
              icon={<LocalShipping sx={{ color: 'warning.main' }} />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Monthly Spent"
              value={`$${(stats?.monthly_spent || 0).toFixed(2)}`}
              icon={<TrendingUp sx={{ color: 'success.main' }} />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Available Crops"
              value={stats?.available_crops_count || 0}
              icon={<Agriculture sx={{ color: 'info.main' }} />}
              color="info"
            />
          </Grid>
        </Grid>
      )}

      {/* Recent Orders and Available Crops */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Orders</Typography>
                <Button size="small" href="/orders">
                  View All
                </Button>
              </Box>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Crop</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ordersLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <LinearProgress />
                        </TableCell>
                      </TableRow>
                    ) : recentOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No recent orders
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentOrders.map((order) => (
                        <TableRow key={order.order_id}>
                          <TableCell>{order.order_number}</TableCell>
                          <TableCell>{order.crop_names.join(', ') || 'N/A'}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              icon={getStatusIcon(order.status)}
                              label={order.status.replace('_', ' ')}
                              color={getStatusColor(order.status)}
                            />
                          </TableCell>
                          <TableCell align="right">${order.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Fresh Crops Available</Typography>
                <Button size="small" href="/crops">
                  Browse All
                </Button>
              </Box>
              
              {cropsLoading ? (
                <LinearProgress />
              ) : availableCrops.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No crops available
                </Typography>
              ) : (
                availableCrops.map((crop) => (
                  <Box key={crop.crop_id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2">{crop.name}</Typography>
                      {crop.category && (
                        <Chip size="small" label={crop.category} />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {crop.description || 'Fresh produce available'}
                    </Typography>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
