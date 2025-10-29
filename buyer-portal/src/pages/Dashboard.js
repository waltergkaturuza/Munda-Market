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

// Mock data - in real app this would come from API
const dashboardData = {
  stats: {
    totalOrders: 24,
    activeOrders: 3,
    monthlySpent: 2450.00,
    availableCrops: 15,
  },
  recentOrders: [
    {
      id: 'ORD-001',
      crop: 'Tomatoes',
      quantity: '50kg',
      status: 'delivered',
      date: '2024-10-25',
      amount: 60.00,
    },
    {
      id: 'ORD-002',
      crop: 'Onions',
      quantity: '25kg',
      status: 'in_transit',
      date: '2024-10-27',
      amount: 20.00,
    },
    {
      id: 'ORD-003',
      crop: 'Cabbage',
      quantity: '30kg',
      status: 'processing',
      date: '2024-10-28',
      amount: 18.00,
    },
  ],
  availableCrops: [
    {
      name: 'Fresh Tomatoes',
      grade: 'A',
      price: 1.20,
      available: '500kg',
      harvest: '2024-11-02',
    },
    {
      name: 'Red Onions',
      grade: 'B',
      price: 0.80,
      available: '200kg',
      harvest: '2024-11-05',
    },
    {
      name: 'Green Cabbage',
      grade: 'A',
      price: 0.60,
      available: '300kg',
      harvest: '2024-11-01',
    },
  ],
};

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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Welcome back, {user?.name}! Here's what's happening with your orders.
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Orders"
            value={dashboardData.stats.totalOrders}
            icon={<ShoppingCart sx={{ color: 'primary.main' }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Orders"
            value={dashboardData.stats.activeOrders}
            icon={<LocalShipping sx={{ color: 'warning.main' }} />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Spent"
            value={`$${dashboardData.stats.monthlySpent.toFixed(2)}`}
            icon={<TrendingUp sx={{ color: 'success.main' }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Available Crops"
            value={dashboardData.stats.availableCrops}
            icon={<Agriculture sx={{ color: 'info.main' }} />}
            color="info"
          />
        </Grid>
      </Grid>

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
                    {dashboardData.recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.id}</TableCell>
                        <TableCell>{order.crop}</TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            icon={getStatusIcon(order.status)}
                            label={order.status.replace('_', ' ')}
                            color={getStatusColor(order.status)}
                          />
                        </TableCell>
                        <TableCell align="right">${order.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
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
              
              {dashboardData.availableCrops.map((crop, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2">{crop.name}</Typography>
                    <Chip size="small" label={`Grade ${crop.grade}`} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    ${crop.price}/kg • {crop.available} available
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Harvest: {new Date(crop.harvest).toLocaleDateString()}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
