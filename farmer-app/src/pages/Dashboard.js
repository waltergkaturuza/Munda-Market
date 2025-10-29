import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
} from '@mui/material';
import {
  Agriculture,
  Inventory,
  Receipt,
  TrendingUp,
} from '@mui/icons-material';
import { useAuth } from '../services/auth';
import { api } from '../services/auth';

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = React.useState({
    farms: 0,
    productionPlans: 0,
    activeLots: 0,
    orders: 0,
    revenue: 0,
  });

  React.useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Fetch farms
      const farmsRes = await api.get('/farmers/farms');
      const farmsCount = farmsRes.data?.length || 0;

      // Fetch production plans
      const plansRes = await api.get('/farmers/production-plans');
      const plansCount = plansRes.data?.length || 0;

      // Fetch lots
      const lotsRes = await api.get('/farmers/lots');
      const activeLotsCount = lotsRes.data?.filter(lot => lot.current_status === 'AVAILABLE').length || 0;

      // Fetch orders (using orders endpoint)
      const ordersRes = await api.get('/orders');
      const ordersCount = ordersRes.data?.length || 0;

      setStats({
        farms: farmsCount,
        productionPlans: plansCount,
        activeLots: activeLotsCount,
        orders: ordersCount,
        revenue: 0, // TODO: Calculate from orders
      });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  };

  const statCards = [
    {
      title: 'Farms',
      value: stats.farms,
      icon: <Agriculture sx={{ fontSize: 40 }} />,
      color: '#4caf50',
    },
    {
      title: 'Production Plans',
      value: stats.productionPlans,
      icon: <Agriculture sx={{ fontSize: 40 }} />,
      color: '#2196f3',
    },
    {
      title: 'Active Lots',
      value: stats.activeLots,
      icon: <Inventory sx={{ fontSize: 40 }} />,
      color: '#ff9800',
    },
    {
      title: 'Orders',
      value: stats.orders,
      icon: <Receipt sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Welcome back, {user?.name || 'Farmer'}!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your farms, production plans, and orders from here.
      </Typography>

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: card.color }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No recent activity
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Register a new farm, create a production plan, or add a lot
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;

