import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from '@mui/material';
import {
  Inventory,
  AttachMoney,
  Agriculture,
  Receipt,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart as ReBarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../services/auth';

function Analytics() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalLots: 0,
    avgYield: 0,
    revenueByMonth: [],
    revenueByCrop: [],
    orderStatusDistribution: [],
    yieldTrend: [],
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  React.useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch all data
      const [ordersRes, lotsRes, plansRes] = await Promise.all([
        api.get('/orders'),
        api.get('/farmers/lots'),
        api.get('/farmers/production-plans'),
      ]);

      const orders = ordersRes.data || [];
      const lots = lotsRes.data || [];
      const plans = plansRes.data || [];

      // Calculate stats
      const totalRevenue = orders
        .filter(o => o.status === 'DELIVERED')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      const totalOrders = orders.length;
      const totalLots = lots.length;

      const completedPlans = plans.filter(p => p.actual_yield_kg);
      const avgYield = completedPlans.length > 0
        ? completedPlans.reduce((sum, p) => sum + p.actual_yield_kg, 0) / completedPlans.length
        : 0;

      // Revenue by month
      const revenueByMonth = orders
        .filter(o => o.status === 'DELIVERED')
        .reduce((acc, order) => {
          const month = order.created_at ? new Date(order.created_at).toLocaleString('default', { month: 'short' }) : 'Unknown';
          if (!acc[month]) acc[month] = 0;
          acc[month] += order.total_amount || 0;
          return acc;
        }, {});

      const revenueByMonthArray = Object.entries(revenueByMonth).map(([month, revenue]) => ({
        month,
        revenue: parseFloat(revenue.toFixed(2)),
      }));

      // Order status distribution
      const statusDistribution = orders.reduce((acc, order) => {
        const status = order.status || 'UNKNOWN';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const orderStatusDistribution = Object.entries(statusDistribution).map(([status, count]) => ({
        name: status,
        value: count,
      }));

      // Yield trend (from production plans)
      const yieldTrend = plans
        .filter(p => p.actual_yield_kg)
        .map(p => ({
          plan: `Plan #${p.plan_id}`,
          yield: p.actual_yield_kg,
          date: p.harvest_end || p.created_at,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      setStats({
        totalRevenue,
        totalOrders,
        totalLots,
        avgYield,
        revenueByMonth: revenueByMonthArray,
        revenueByCrop: [], // TODO: Add crop breakdown
        orderStatusDistribution,
        yieldTrend: yieldTrend.slice(-10), // Last 10 plans
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#2e7d32', '#f57c00', '#2196f3', '#9c27b0', '#f44336'];

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Analytics
        </Typography>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Start Date"
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            label="End Date"
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <AttachMoney sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Orders
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalOrders}
                  </Typography>
                </Box>
                <Receipt sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Lots
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalLots}
                  </Typography>
                </Box>
                <Inventory sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Avg Yield (kg)
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.avgYield.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </Typography>
                </Box>
                <Agriculture sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Revenue by Month
            </Typography>
            {stats.revenueByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#2e7d32" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No revenue data available
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Order Status Distribution
            </Typography>
            {stats.orderStatusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.orderStatusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.orderStatusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No order data available
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Yield Trend
            </Typography>
            {stats.yieldTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ReBarChart data={stats.yieldTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="plan" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="yield" fill="#2e7d32" />
                </ReBarChart>
              </ResponsiveContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No yield data available. Update production plans with actual yields to see trends.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Analytics;

