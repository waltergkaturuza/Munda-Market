import { Grid, Paper, Typography, Box, Card, CardContent, CircularProgress } from '@mui/material';
import {
  People,
  ShoppingCart,
  AttachMoney,
  TrendingUp,
  VerifiedUser,
  Inventory,
  Warning,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboard';
import { bannersApi } from '@/api/banners';
import Banner from '@/components/Banner';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: color,
              borderRadius: 2,
              p: 1.5,
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

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: banners = [] } = useQuery({
    queryKey: ['dashboard-banners', 'admin'],
    queryFn: () => bannersApi.getActiveBanners('admin'),
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Overview of marketplace operations
      </Typography>

      {/* Banners */}
      {banners.map((banner) => (
        <Banner key={banner.banner_id} banner={banner} />
      ))}

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Farmers"
            value={stats?.total_farmers || 0}
            subtitle={`${stats?.active_farmers || 0} active`}
            icon={<People sx={{ color: 'white' }} />}
            color="primary.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Buyers"
            value={stats?.total_buyers || 0}
            subtitle={`${stats?.active_buyers || 0} active`}
            icon={<People sx={{ color: 'white' }} />}
            color="secondary.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Orders"
            value={stats?.total_orders || 0}
            subtitle={`${stats?.orders_pending || 0} pending`}
            icon={<ShoppingCart sx={{ color: 'white' }} />}
            color="info.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Revenue"
            value={`$${(stats?.total_revenue_usd || 0).toLocaleString()}`}
            subtitle={`$${(stats?.revenue_this_month_usd || 0).toLocaleString()} this month`}
            icon={<AttachMoney sx={{ color: 'white' }} />}
            color="success.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Pending Payouts"
            value={`$${(stats?.pending_payouts_usd || 0).toLocaleString()}`}
            subtitle="Awaiting processing"
            icon={<TrendingUp sx={{ color: 'white' }} />}
            color="warning.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Pending KYC"
            value={stats?.pending_kyc_count || 0}
            subtitle="Awaiting verification"
            icon={<VerifiedUser sx={{ color: 'white' }} />}
            color="error.main"
          />
        </Grid>

        {/* Charts Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Orders Pipeline
            </Typography>
            <Box display="flex" flexDirection="column" gap={2} mt={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Pending
                </Typography>
                <Typography variant="h6">{stats?.orders_pending || 0}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  In Transit
                </Typography>
                <Typography variant="h6">{stats?.orders_in_transit || 0}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Delivered Today
                </Typography>
                <Typography variant="h6">{stats?.orders_delivered_today || 0}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box display="flex" flexDirection="column" gap={1} mt={2}>
              <Typography variant="body2">• Review pending KYC submissions</Typography>
              <Typography variant="body2">• Process pending payouts</Typography>
              <Typography variant="body2">• Update pricing rules</Typography>
              <Typography variant="body2">• Send farmer notifications</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={2}>
              Activity feed coming soon...
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

